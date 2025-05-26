import PurchaseModel from "../models/purchaseModel.js";
import Product from "../models/productModel.js";
import Company from "../models/companyModel.js";
import AppError from "../utils/apiError.js";
import {
  BatchInventoryModel,
  InventoryTransactionModel,
} from "../models/batchInventoryModel.js";
import mongoose from "mongoose";
import { CompanyCreditTransactionModel } from "../models/companyAccountModel.js";
import notificationService from "./notificationService.js";

class PurchaseService {
  modifyPaymentType(payment_type = {}) {
    if (!payment_type.type) return payment_type;

    if (payment_type.type === "cash" && payment_type.cash) {
      const { type } = payment_type.cash;
      return {
        type: payment_type.type,
        cash: {
          type: type,
          ...(type === "by_hand" ? { by_hand: payment_type.cash.by_hand } : {}),
          ...(type === "online" ? { online: payment_type.cash.online } : {}),
        },
      };
    } else if (payment_type.type === "credit" && payment_type.credit) {
      return {
        type: payment_type.type,
        credit: payment_type.credit,
      };
    } else if (payment_type.type === "split" && payment_type.split) {
      // Handle split payment type
      const { type } = payment_type.split;
      return {
        type: payment_type.type,
        split: {
          type: type,
          cash_amount: Number(payment_type.split.cash_amount),
          credit_amount: Number(payment_type.split.credit_amount),
          ...(type === "by_hand"
            ? { by_hand: payment_type.split.by_hand }
            : {}),
          ...(type === "online" ? { online: payment_type.split.online } : {}),
        },
      };
    }
    return payment_type;
  }

  generateBatchNumber(productCode = "123") {
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    const batchBase = `BATCH-${randomNumber}`;

    const getRandomFiveDigitNumber = () =>
      Math.floor(10000 + Math.random() * 90000);

    const purchaseNumber = `PN-${productCode}-${getRandomFiveDigitNumber()}`;

    return {
      fullBatchNumber: `${batchBase}-${productCode}`,
      originalBatchNumber: batchBase,
      purchaseNumber: purchaseNumber,
    };
  }

  async validateSupplierAccount({
    supplierId,
    grandTotal,
    purchased_type,
    session,
    userId,
    storeId,
    payment_type,
    request,
    purchaseId = null,
    date = new Date(),
  }) {
    if (!supplierId) return null;

    const supplier = await Company.findById(supplierId);
    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    // Initialize base transaction data
    const baseTransactionData = {
      company_id: supplierId,
      purchase_id: purchaseId,
      store_id: storeId,
      added_by: userId,
      date: date,
      transaction_type: purchased_type === "returned" ? "return" : "purchase",
    };

    // Case 1: Split payment - handle part cash, part credit
    if (payment_type.type === "split") {
      if (supplier.account_details.account.type !== "credit") {
        throw new AppError(
          "Supplier does not have a credit account for split payment",
          400
        );
      }

      const cashAmount = Number(payment_type.split.cash_amount);
      const creditAmount = Number(payment_type.split.credit_amount);

      // Validate the total matches grand total
      if (Math.abs(cashAmount + creditAmount - Number(grandTotal)) > 0.01) {
        throw new AppError(
          "Split payment amounts do not add up to grand total",
          400
        );
      }

      const creditLimit = supplier.account_details.account.amount || 0;
      const currentUsedAmount =
        supplier.account_details.account.usedAmount || 0;
      const currentBalance = supplier.account_details.account.balance || 0;

      // Calculate net balance (business's current position with supplier)
      const netBalance = currentBalance - currentUsedAmount;

      let newUsedAmount = currentUsedAmount;
      let newBalance = currentBalance;
      let useFromBalance = 0;

      if (purchased_type === "returned") {
        // For returns: add credit portion to balance
        newBalance = currentBalance + creditAmount;
      } else {
        // For purchases: first use available balance for credit portion
        if (currentBalance > 0) {
          useFromBalance = Math.min(currentBalance, creditAmount);
          newBalance = currentBalance - useFromBalance;

          // If credit amount exceeds available balance
          if (creditAmount > useFromBalance) {
            const remainingAmount = creditAmount - useFromBalance;

            // Check if this would exceed credit limit
            if (currentUsedAmount + remainingAmount > creditLimit) {
              throw new AppError(
                `Your business would exceed credit limit from ${supplier.name}. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${remainingAmount}`,
                400
              );
            }
            newUsedAmount = currentUsedAmount + remainingAmount;
          }
        } else {
          // No balance available, all credit portion goes to credit
          if (currentUsedAmount + creditAmount > creditLimit) {
            throw new AppError(
              `Your business would exceed credit limit from ${supplier.name}. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${creditAmount}`,
              400
            );
          }
          newUsedAmount = currentUsedAmount + creditAmount;
        }
      }

      // Calculate new net balance after transaction
      const newNetBalance = newBalance - newUsedAmount;

      // Update supplier account
      await Company.findByIdAndUpdate(
        supplierId,
        {
          $set: {
            "account_details.account.usedAmount": newUsedAmount,
            "account_details.account.balance": newBalance,
          },
        },
        { session }
      );

      // Create transaction record for split payment
      const splitTransaction = new CompanyCreditTransactionModel({
        ...baseTransactionData,
        payment_type: "split",
        previous_balance: netBalance,
        amount: purchased_type === "returned" ? grandTotal : -grandTotal, // Total transaction amount
        cash_amount: cashAmount,
        credit_amount: creditAmount,
        remaining_balance: newNetBalance,
        note:
          purchased_type === "returned"
            ? `Return of goods worth ${grandTotal}. Split payment: ${cashAmount} cash, ${creditAmount} credit.`
            : useFromBalance > 0
            ? `Purchase of ${grandTotal}. Split payment: ${cashAmount} cash, ${creditAmount} credit. Used ${useFromBalance} from balance and ${
                creditAmount - useFromBalance
              } as credit.`
            : `Split payment purchase of ${grandTotal}. ${cashAmount} cash, ${creditAmount} credit.`,
      });

      await splitTransaction.save({ session });

      // Send notification
      const notificationMsg =
        purchased_type === "returned"
          ? `Returned goods worth ${grandTotal} to ${
              supplier.name
            } with split payment. New balance: ${
              newNetBalance > 0 ? "+" + newNetBalance : newNetBalance
            }.`
          : `Purchased goods from ${
              supplier.name
            } for ${grandTotal} with split payment (${cashAmount} cash, ${creditAmount} credit). ${
              useFromBalance > 0 ? `Used ${useFromBalance} from balance.` : ""
            } New balance: ${
              newNetBalance > 0 ? "+" + newNetBalance : newNetBalance
            }.`;

      await notificationService.sendNotification(
        {
          title: "Split Payment Purchase",
          message: notificationMsg,
          type: "PURCHASE",
        },
        request.user._id
      );

      return {
        previous_balance: netBalance,
        deducted_amount: useFromBalance > 0 ? useFromBalance : 0,
        credit_used:
          creditAmount - useFromBalance > 0 && purchased_type !== "returned"
            ? creditAmount - useFromBalance
            : 0,
        remaining_balance: newNetBalance,
        credit_limit: creditLimit,
        account_type: "credit",
        transaction_id: splitTransaction._id,
        balance_used: useFromBalance,
        cash_amount: cashAmount,
        credit_amount: creditAmount,
      };
    }

    // Case 2: Payment is on credit - handle supplier credit
    else if (payment_type.type === "credit") {
      if (supplier.account_details.account.type !== "credit") {
        throw new AppError("Supplier does not have a credit account", 400);
      }

      const creditLimit = supplier.account_details.account.amount || 0;
      const currentUsedAmount =
        supplier.account_details.account.usedAmount || 0;
      const currentBalance = supplier.account_details.account.balance || 0;

      // Calculate net balance (positive means business has credit with supplier)
      const netBalance = currentBalance - currentUsedAmount;

      let newUsedAmount = currentUsedAmount;
      let newBalance = currentBalance;
      let transactionAmount = 0;
      let useFromBalance = 0;

      if (purchased_type === "returned") {
        // For returns: add to balance (business is returning goods to supplier)
        newBalance = currentBalance + grandTotal;
        transactionAmount = grandTotal; // Positive for returns
      } else {
        // For purchases: handle balance and credit usage
        if (currentBalance > 0) {
          // If business has balance with supplier, use it first
          useFromBalance = Math.min(currentBalance, grandTotal);
          newBalance = currentBalance - useFromBalance;

          // If purchase amount exceeds available balance
          if (grandTotal > useFromBalance) {
            const remainingAmount = grandTotal - useFromBalance;

            // Check if remaining amount would exceed credit limit
            if (currentUsedAmount + remainingAmount > creditLimit) {
              throw new AppError(
                `Your business would exceed credit limit from ${supplier.name}. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${remainingAmount}`,
                400
              );
            }

            newUsedAmount = currentUsedAmount + remainingAmount;
            transactionAmount = -grandTotal; // Negative for purchase
          } else {
            // Purchase fully covered by balance
            transactionAmount = -grandTotal;
          }
        } else {
          // No balance available, all goes to credit
          newUsedAmount = currentUsedAmount + grandTotal;

          // Check credit limit
          if (newUsedAmount > creditLimit) {
            throw new AppError(
              `Your business would exceed credit limit from ${supplier.name}. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${grandTotal}`,
              400
            );
          }

          transactionAmount = -grandTotal; // Negative for purchase
        }
      }

      // Calculate new net balance
      const newNetBalance = newBalance - newUsedAmount;

      // Update supplier account
      await Company.findByIdAndUpdate(
        supplierId,
        {
          $set: {
            "account_details.account.usedAmount": newUsedAmount,
            "account_details.account.balance": newBalance,
          },
        },
        { session }
      );

      // Create transaction record
      const creditTransaction = new CompanyCreditTransactionModel({
        ...baseTransactionData,
        payment_type: "credit",
        previous_balance: netBalance, // Current net balance
        amount: transactionAmount,
        remaining_balance: newNetBalance, // New net balance
        note:
          useFromBalance > 0
            ? `Purchase of ${grandTotal}. Used ${useFromBalance} from balance and ${
                grandTotal - useFromBalance
              } as credit.`
            : purchased_type === "returned"
            ? `Return of goods worth ${grandTotal}.`
            : `Credit purchase of ${grandTotal}.`,
      });

      await creditTransaction.save({ session });

      // Send notification
      const notificationMsg =
        purchased_type === "returned"
          ? `Returned goods worth ${grandTotal} to ${
              supplier.name
            }. New balance: ${
              newNetBalance > 0 ? "+" + newNetBalance : newNetBalance
            }.`
          : `Purchased goods from ${supplier.name} for ${grandTotal}. ${
              useFromBalance > 0 ? `Used ${useFromBalance} from balance.` : ""
            } New balance: ${
              newNetBalance > 0 ? "+" + newNetBalance : newNetBalance
            }.`;

      await notificationService.sendNotification(
        {
          title: "Credit Purchase",
          message: notificationMsg,
          type: "PURCHASE",
        },
        request.user._id
      );

      return {
        previous_balance: netBalance,
        deducted_amount: useFromBalance > 0 ? useFromBalance : 0,
        credit_used:
          useFromBalance < grandTotal && purchased_type !== "returned"
            ? grandTotal - useFromBalance
            : 0,
        remaining_balance: newNetBalance,
        credit_limit: creditLimit,
        account_type: "credit",
        transaction_id: creditTransaction._id,
        balance_used: useFromBalance,
      };
    }

    // Case 3: Payment is cash - just record transaction history
    else if (payment_type.type === "cash") {
      // Get current state
      const currentUsedAmount =
        supplier.account_details.account.type === "credit"
          ? supplier.account_details.account.usedAmount || 0
          : 0;
      const currentBalance =
        supplier.account_details.account.type === "credit"
          ? supplier.account_details.account.balance || 0
          : 0;
      const creditLimit =
        supplier.account_details.account.type === "credit"
          ? supplier.account_details.account.amount || 0
          : 0;

      // Calculate net balance
      const netBalance = currentBalance - currentUsedAmount;

      // Record transaction without affecting account balances
      const cashTransaction = new CompanyCreditTransactionModel({
        ...baseTransactionData,
        payment_type: "cash",
        previous_balance: netBalance,
        amount: purchased_type === "returned" ? grandTotal : -grandTotal,
        remaining_balance: netBalance, // No change for cash transactions
        note:
          purchased_type === "returned"
            ? `Cash return of goods worth ${grandTotal}.`
            : `Cash purchase of ${grandTotal}.`,
      });

      await cashTransaction.save({ session });

      return {
        previous_balance: netBalance,
        deducted_amount: grandTotal,
        remaining_balance: netBalance,
        credit_limit: creditLimit,
        account_type: supplier.account_details.account.type,
        transaction_id: cashTransaction._id,
      };
    }

    // If payment type is neither credit, cash, nor split
    throw new AppError(`Invalid payment type: ${payment_type.type}`, 400);
  }

  // Add this helper method to your PurchaseService class

  async updateSupplierTransaction(
    existingPurchase,
    newGrandTotal,
    newPurchaseType,
    session,
    userId,
    storeId,
    newPaymentType,
    request,
    supplierId
  ) {
    // If no supplier or no existing transaction, nothing to update
    if (
      !supplierId ||
      !existingPurchase.supplier_account_details ||
      !existingPurchase.supplier_account_details.transaction_id
    ) {
      return null;
    }

    // Find the supplier
    const supplier = await Company.findById(supplierId);
    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    // Find the existing transaction
    const existingTransaction = await CompanyCreditTransactionModel.findById(
      existingPurchase.supplier_account_details.transaction_id
    );

    if (!existingTransaction) {
      // If transaction not found, create a new one using validateSupplierAccount
      return await this.validateSupplierAccount({
        supplierId,
        grandTotal: newGrandTotal,
        purchased_type: newPurchaseType,
        session,
        userId,
        storeId,
        payment_type: newPaymentType,
        request,
        purchaseId: existingPurchase._id,
        date: existingPurchase.date,
      });
    }

    // Get current values
    const oldGrandTotal = Number(existingPurchase.grand_total);
    const newGrandTotalNum = Number(newGrandTotal);
    const oldPurchaseType = existingPurchase.purchased_type;
    const oldPaymentType = existingPurchase.payment_type;

    // Get supplier account details
    const currentUsedAmount = supplier.account_details.account.usedAmount || 0;
    const currentBalance = supplier.account_details.account.balance || 0;
    const creditLimit = supplier.account_details.account.amount || 0;

    // Get previous transaction details
    const oldBalanceUsed =
      existingPurchase.supplier_account_details.balance_used || 0;
    const oldCreditUsed =
      existingPurchase.purchased_type === "purchased"
        ? Math.max(0, oldGrandTotal - oldBalanceUsed)
        : 0;

    // Calculate current net balance (balance - usedAmount)
    const netBalance = currentBalance - currentUsedAmount;

    // Track the changes we need to make
    let balanceChange = 0;
    let usedAmountChange = 0;
    let newBalanceUsed = 0;

    // 1. First, reverse the effect of the old transaction based on payment type
    if (oldPaymentType.type === "credit") {
      // Handle credit payment reversal
      if (oldPurchaseType === "returned") {
        balanceChange -= oldGrandTotal; // Reduce the balance that was added
      } else {
        balanceChange += oldBalanceUsed; // Restore any balance that was used
        usedAmountChange -= oldCreditUsed; // Reduce the used amount for credit
      }
    } else if (oldPaymentType.type === "split") {
      // Handle split payment reversal - only affect credit portion
      const oldCreditAmount =
        existingPurchase.supplier_account_details.credit_amount || 0;

      if (oldPurchaseType === "returned") {
        balanceChange -= oldCreditAmount; // Reduce balance by credit amount
      } else {
        balanceChange += oldBalanceUsed; // Restore used balance

        // If credit was used (credit amount exceeds what was covered by balance)
        if (oldCreditAmount > oldBalanceUsed) {
          usedAmountChange -= oldCreditAmount - oldBalanceUsed; // Reduce used amount
        }
      }
    }
    // For cash payments, no supplier account reversal needed

    // 2. Then, apply the effect of the new transaction based on payment type
    if (newPaymentType.type === "credit") {
      // Handle credit payment
      if (newPurchaseType === "returned") {
        // For returns, add to balance
        balanceChange += newGrandTotalNum;
      } else {
        // For purchases, use available balance first
        const availableBalance = currentBalance + balanceChange;
        newBalanceUsed = Math.min(availableBalance, newGrandTotalNum);

        if (newBalanceUsed > 0) {
          balanceChange -= newBalanceUsed;
        }

        // If purchase exceeds available balance
        if (newGrandTotalNum > newBalanceUsed) {
          const creditNeeded = newGrandTotalNum - newBalanceUsed;

          // Check credit limit after considering previous adjustments
          const newUsedAmount =
            currentUsedAmount + usedAmountChange + creditNeeded;
          if (newUsedAmount > creditLimit) {
            throw new AppError(
              `This purchase would exceed the credit limit. Limit: ${creditLimit}, Would be used: ${newUsedAmount}`,
              400
            );
          }

          usedAmountChange += creditNeeded;
        }
      }
    } else if (newPaymentType.type === "split") {
      // Handle split payment
      const cashAmount = Number(newPaymentType.split.cash_amount);
      const creditAmount = Number(newPaymentType.split.credit_amount);

      // Validate total matches grand total
      if (Math.abs(cashAmount + creditAmount - newGrandTotalNum) > 0.01) {
        throw new AppError(
          "Split payment amounts do not add up to grand total",
          400
        );
      }

      if (newPurchaseType === "returned") {
        // For returns, only add credit portion to balance
        balanceChange += creditAmount;
      } else {
        // For purchases, use available balance first for credit portion only
        const availableBalance = currentBalance + balanceChange;
        newBalanceUsed = Math.min(availableBalance, creditAmount);

        if (newBalanceUsed > 0) {
          balanceChange -= newBalanceUsed;
        }

        // If credit portion exceeds available balance
        if (creditAmount > newBalanceUsed) {
          const creditNeeded = creditAmount - newBalanceUsed;

          // Check credit limit after considering previous adjustments
          const newUsedAmount =
            currentUsedAmount + usedAmountChange + creditNeeded;
          if (newUsedAmount > creditLimit) {
            throw new AppError(
              `This purchase would exceed the credit limit. Limit: ${creditLimit}, Would be used: ${newUsedAmount}`,
              400
            );
          }

          usedAmountChange += creditNeeded;
        }
      }
    } else if (newPaymentType.type === "cash") {
      // Handle cash payment - no effect on credit or balance
      newBalanceUsed = 0;
    }

    // Calculate new values
    const newUsedAmount = Math.max(0, currentUsedAmount + usedAmountChange);
    const newBalance = Math.max(0, currentBalance + balanceChange);
    const newNetBalance = newBalance - newUsedAmount;

    // Update supplier account
    await Company.findByIdAndUpdate(
      supplierId,
      {
        $set: {
          "account_details.account.usedAmount": newUsedAmount,
          "account_details.account.balance": newBalance,
        },
      },
      { session }
    );

    // Create transaction note and update transaction record
    let transactionNote;
    let transactionUpdateData = {
      transaction_type: newPurchaseType === "returned" ? "return" : "purchase",
      previous_balance: netBalance,
      remaining_balance: newNetBalance,
    };

    if (newPaymentType.type === "credit") {
      // Credit payment
      const transactionAmount =
        newPurchaseType === "returned" ? newGrandTotalNum : -newGrandTotalNum;

      if (newPurchaseType === "returned") {
        transactionNote = `Updated return of goods worth ${newGrandTotalNum}.`;
      } else {
        transactionNote =
          newBalanceUsed > 0
            ? `Updated purchase of ${newGrandTotalNum}. Used ${newBalanceUsed} from balance and ${Math.max(
                0,
                newGrandTotalNum - newBalanceUsed
              )} from credit.`
            : `Updated credit purchase of ${newGrandTotalNum}.`;
      }

      // Update with credit payment specific fields
      transactionUpdateData = {
        ...transactionUpdateData,
        payment_type: "credit",
        amount: transactionAmount,
        note: transactionNote,
        // Clear split payment fields if they existed before
        $unset: { cash_amount: "", credit_amount: "" },
      };
    } else if (newPaymentType.type === "split") {
      // Split payment
      const cashAmount = Number(newPaymentType.split.cash_amount);
      const creditAmount = Number(newPaymentType.split.credit_amount);
      const transactionAmount =
        newPurchaseType === "returned" ? newGrandTotalNum : -newGrandTotalNum;

      if (newPurchaseType === "returned") {
        transactionNote = `Updated return of goods worth ${newGrandTotalNum}. Split payment: ${cashAmount} cash, ${creditAmount} credit.`;
      } else {
        transactionNote =
          newBalanceUsed > 0
            ? `Updated purchase of ${newGrandTotalNum}. Split payment: ${cashAmount} cash, ${creditAmount} credit. Used ${newBalanceUsed} from balance and ${Math.max(
                0,
                creditAmount - newBalanceUsed
              )} from credit.`
            : `Updated split payment purchase of ${newGrandTotalNum}. ${cashAmount} cash, ${creditAmount} credit.`;
      }

      // Update with split payment specific fields
      transactionUpdateData = {
        ...transactionUpdateData,
        payment_type: "split",
        amount: transactionAmount,
        cash_amount: cashAmount,
        credit_amount: creditAmount,
        note: transactionNote,
      };
    } else if (newPaymentType.type === "cash") {
      // Cash payment
      const transactionAmount =
        newPurchaseType === "returned" ? newGrandTotalNum : -newGrandTotalNum;

      transactionNote =
        newPurchaseType === "returned"
          ? `Updated cash return of goods worth ${newGrandTotalNum}.`
          : `Updated cash purchase of ${newGrandTotalNum}.`;

      // Update with cash payment specific fields
      transactionUpdateData = {
        ...transactionUpdateData,
        payment_type: "cash",
        amount: transactionAmount,
        note: transactionNote,
        // Clear split payment fields if they existed before
        $unset: { cash_amount: "", credit_amount: "" },
      };
    }

    // Update the transaction record
    await CompanyCreditTransactionModel.findByIdAndUpdate(
      existingPurchase.supplier_account_details.transaction_id,
      transactionUpdateData,
      { session }
    );

    // Return updated supplier account details
    let supplierAccountDetails = {
      previous_balance: netBalance,
      deducted_amount: Math.abs(newGrandTotalNum),
      remaining_balance: newNetBalance,
      credit_limit: creditLimit,
      account_type: supplier.account_details.account.type,
      transaction_id: existingPurchase.supplier_account_details.transaction_id,
      balance_used: newBalanceUsed,
    };

    // Add split payment details if applicable
    if (newPaymentType.type === "split") {
      const cashAmount = Number(newPaymentType.split.cash_amount);
      const creditAmount = Number(newPaymentType.split.credit_amount);

      supplierAccountDetails = {
        ...supplierAccountDetails,
        credit_used:
          newBalanceUsed < creditAmount ? creditAmount - newBalanceUsed : 0,
        cash_amount: cashAmount,
        credit_amount: creditAmount,
      };
    } else if (newPaymentType.type === "credit") {
      supplierAccountDetails.credit_used =
        newBalanceUsed < newGrandTotalNum
          ? newGrandTotalNum - newBalanceUsed
          : 0;
    }

    return supplierAccountDetails;
  }

  async updateInventory(purchase, session) {
    try {
      const isReturn = purchase.purchased_type === "returned";
      const productIds = new Set(); // Track product IDs for final sync

      for (const item of purchase.order_items) {
        productIds.add(item.product_id);

        if (isReturn) {
          // Handle returns (existing logic for returns)
          const existingBatches = await BatchInventoryModel.find({
            product_id: item.product_id,
            store_id: purchase.store_id,
            status: "active",
            current_quantity: { $gt: 0 },
          }).sort({ createdAt: 1 });

          let remainingQuantity = item.quantity;

          for (const batch of existingBatches) {
            if (remainingQuantity <= 0) break;

            const quantityToDeduct = Math.min(
              batch.current_quantity,
              remainingQuantity
            );
            remainingQuantity -= quantityToDeduct;

            // Update batch inventory
            await BatchInventoryModel.findByIdAndUpdate(
              batch._id,
              {
                $inc: { current_quantity: -quantityToDeduct },
                $set: {
                  status:
                    batch.current_quantity - quantityToDeduct <= 0
                      ? "depleted"
                      : "active",
                },
              },
              { session }
            );

            // Create inventory transaction for return
            await InventoryTransactionModel.create(
              [
                {
                  batch_inventory_id: batch._id,
                  transaction_type: "return",
                  quantity: -quantityToDeduct,
                  reference_id: purchase._id,
                  reference_model: "Purchase",
                  performed_by: purchase.added_by,
                },
              ],
              { session }
            );
          }

          if (remainingQuantity > 0) {
            throw new AppError(
              `Insufficient quantity available for return in existing batches for product ${item.product_id}`,
              400
            );
          }

          // We'll sync the product quantity at the end
        } else {
          // For regular purchases - create fresh batch inventory
          const batchInventory = await BatchInventoryModel.create(
            [
              {
                product_id: item.product_id,
                store_id: purchase.store_id,
                purchase_id: purchase._id,
                batch_number: item.batch_number,
                manufactured_date: item.manufactured_date,
                expiry_date: item.expiry_date,
                initial_quantity: item.quantity,
                current_quantity: item.quantity,
                purchase_price: item.purchase_price,
                status: "active",
              },
            ],
            { session }
          );

          // Create transaction record
          await InventoryTransactionModel.create(
            [
              {
                batch_inventory_id: batchInventory[0]._id,
                transaction_type: "purchase",
                quantity: item.quantity,
                reference_id: purchase._id,
                reference_model: "Purchase",
                performed_by: purchase.added_by,
              },
            ],
            { session }
          );

          // We'll sync the product quantity at the end
        }
      }

      // Final step: Sync all affected product quantities
      for (const productId of productIds) {
        await this.syncProductQuantity(productId, session);
      }
    } catch (error) {
      throw new AppError(`Inventory update failed: ${error.message}`, 500);
    }
  }

  async syncProductQuantity(productId, session) {
    try {
      // IMPORTANT: Pass the session to the find query
      // This ensures we see batches modified in the current transaction
      const batches = await BatchInventoryModel.find(
        {
          product_id: productId,
          status: { $ne: "depleted" },
        },
        null,
        { session } // Pass the session here
      );

      const totalBatchQuantity = batches.reduce(
        (sum, batch) => sum + batch.current_quantity,
        0
      );

      // Update product quantity to match batch total
      await Product.findByIdAndUpdate(
        productId,
        { $set: { quantity: totalBatchQuantity } },
        { session, new: true } // Return updated document for confirmation
      );

      return totalBatchQuantity;
    } catch (error) {
      throw new AppError(
        `Failed to sync product quantity: ${error.message}`,
        500
      );
    }
  }

  async fixProductQuantities(req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!req.user || !req.user.store_id) {
        throw new AppError("User store information is required", 400);
      }

      // Get only products from this manager's store
      const products = await Product.find({ store_id: req.user.store_id });

      if (products.length === 0) {
        return {
          message: "No products found in your store",
          status: "success",
          count: 0,
        };
      }

      let syncedCount = 0;
      for (const product of products) {
        await this.syncProductQuantity(product._id, session);
        syncedCount++;
      }

      await session.commitTransaction();
      return {
        message: "Product quantities synchronized successfully",
        status: "success",
        count: syncedCount,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        `Failed to fix product quantities: ${error.message}`,
        500
      );
    } finally {
      session.endSession();
    }
  }

  async createPurchase(request) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { order_items, payment_type, ...data } = request.body;

      if (
        !order_items ||
        !Array.isArray(order_items) ||
        order_items.length === 0
      ) {
        throw new AppError("Purchase order items are required", 400);
      }

      const productIds = order_items.map((item) => item.product);
      const products = await Product.find({
        _id: { $in: productIds },
        store_id: request.user.store_id,
      });

      if (products.length !== order_items.length) {
        throw new AppError(
          "Some products not found or don't belong to this store",
          404
        );
      }

      const productMap = products.reduce((map, product) => {
        map[product._id.toString()] = product;
        return map;
      }, {});

      const items = order_items.map((item) => {
        const product = productMap[item.product];
        const { fullBatchNumber } = this.generateBatchNumber(product.prod_code);

        return {
          product_id: item.product,
          batch_number: fullBatchNumber,
          quantity: item.quantity,
          purchase_price: item.purchase_price,
          manufactured_date: new Date(item.manufactured_date),
          expiry_date: new Date(item.expiry_date),
        };
      });

      const { purchaseNumber } = this.generateBatchNumber(data.date);

      // Get supplier account details if supplier exists
      const supplierAccountDetails = await this.validateSupplierAccount({
        session: session,
        request: request,
        supplierId: data.supplier,
        grandTotal: data.grand_total,
        purchased_type: data.purchased_type,
        userId: request.user._id,
        storeId: request.user.store_id,
        payment_type: payment_type,
        date: data.date || new Date(),
      });

      const purchaseData = {
        purchase_number: purchaseNumber,
        supplier: data.supplier,
        store_id: request.user.store_id,
        order_status: data.order_status,
        order_items: items,
        supplier_account_details: supplierAccountDetails,
        discount_value: data.discount_value || 0,
        shipping_charges: data.shipping_charges || 0,
        grand_total: data.grand_total,
        payment_type: this.modifyPaymentType(payment_type),
        note: data.note || "",
        added_by: request.user._id,
        purchased_type: data.purchased_type,
        date: data.date || new Date(),
      };

      const purchase = await PurchaseModel.create([purchaseData], { session });

      // Update the transaction record with the purchase_id
      if (supplierAccountDetails && supplierAccountDetails.transaction_id) {
        await CompanyCreditTransactionModel.findByIdAndUpdate(
          supplierAccountDetails.transaction_id,
          { purchase_id: purchase[0]._id },
          { session }
        );
      }

      // This method already includes syncing product quantities
      await this.updateInventory(purchase[0], session);

      await session.commitTransaction();
      return purchase[0];
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(`Purchase creation failed: ${error.message}`, 500);
    } finally {
      session.endSession();
    }
  }

  async findPurchase(filterQuery) {
    const purchase = await PurchaseModel.findById(filterQuery.id)
      .populate("supplier")
      .populate("store_id")
      .populate("added_by", "name image role");

    if (!purchase) {
      throw new AppError("Purchase not found", 404);
    }

    // Get batch details
    const batchDetails = await BatchInventoryModel.find({
      purchase_id: purchase._id,
    }).populate("product_id", "prod_name prod_code");

    return {
      ...purchase.toObject(),
      batches: batchDetails,
    };
  }

  async findAllPurchases(filterQuery, req) {
    // Build base query
    let query = {};

    // Basic filters
    if (filterQuery.purchased_type && filterQuery.purchased_type !== "all") {
      query.purchased_type = filterQuery.purchased_type;
    }

    // Add payment type filter
    if (filterQuery.payment_type) {
      query["payment_type.type"] = filterQuery.payment_type;
    }

    if (filterQuery.order_status) {
      query.order_status = filterQuery.order_status;
    }

    if (filterQuery.supplier) {
      query.supplier = new mongoose.Types.ObjectId(filterQuery.supplier);
    }

    if (
      filterQuery.date &&
      filterQuery.date.from_date &&
      filterQuery.date.to_date
    ) {
      query.date = {
        $gte: new Date(filterQuery.date.from_date),
        $lte: new Date(filterQuery.date.to_date),
      };
    }

    // Add store filter for non-super-admin users
    if (req.user.role !== "super_admin") {
      query.store_id = new mongoose.Types.ObjectId(req.user.store_id);
    }

    // Use populate instead of complex aggregation
    const purchases = await PurchaseModel.find(query)
      .populate({
        path: "store_id",
        select: "name address",
      })
      .populate({
        path: "added_by",
        select: "name email role image",
      })
      .populate({
        path: "supplier",
        select: "name contact_person phone email address image account_details",
      })
      .populate({
        path: "order_items.product_id",
        select:
          "prod_name prod_code sku images maximum_retail_price actual_retail_price unit_profile company category",
      })
      .sort({ createdAt: -1 });

    // Get batch information for each purchase
    const purchasesWithBatches = await Promise.all(
      purchases.map(async (purchase) => {
        const batches = await BatchInventoryModel.find({
          purchase_id: purchase._id,
        }).populate({
          path: "product_id",
          select:
            "prod_name prod_code sku images maximum_retail_price actual_retail_price",
        });

        // Calculate totals
        const total_items = purchase.order_items.length;
        const total_quantity = purchase.order_items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const total_purchase_value = purchase.order_items.reduce(
          (sum, item) => sum + item.quantity * item.purchase_price,
          0
        );

        return {
          _id: purchase._id,
          purchase_number: purchase.purchase_number,
          date: purchase.date,
          order_status: purchase.order_status,
          purchased_type: purchase.purchased_type,
          order_items: purchase.order_items,
          discount_value: purchase.discount_value,
          shipping_charges: purchase.shipping_charges,
          grand_total: purchase.grand_total,
          payment_type: purchase.payment_type,
          supplier_account_details: purchase.supplier_account_details,
          note: purchase.note,
          createdAt: purchase.createdAt,
          updatedAt: purchase.updatedAt,
          total_items,
          total_quantity,
          total_purchase_value,
          store_details: purchase.store_id,
          added_by: purchase.added_by,
          supplier: purchase.supplier,
          batches,
        };
      })
    );

    return purchasesWithBatches;
  }

  async updatePurchase(filterQuery, purchaseData, request) {
    // If only status update is provided, use existing simple update
    if (Object.keys(purchaseData).length === 1 && purchaseData.order_status) {
      return await PurchaseModel.findByIdAndUpdate(
        filterQuery.id,
        { order_status: purchaseData.order_status },
        { new: true }
      );
    }

    // For full purchase update, use transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find existing purchase
      const existingPurchase = await PurchaseModel.findById(filterQuery.id);
      if (!existingPurchase) {
        throw new AppError("Purchase not found", 404);
      }

      const { order_items, payment_type, ...data } = purchaseData;
      const isPurchaseTypeChanged =
        data.purchased_type &&
        data.purchased_type !== existingPurchase.purchased_type;

      // Validate order items
      if (
        order_items &&
        (!Array.isArray(order_items) || order_items.length === 0)
      ) {
        throw new AppError("Purchase order items are required", 400);
      }

      // Process products if order items are being updated
      let items = existingPurchase.order_items;
      let itemsChanged = false;

      if (order_items) {
        // For non-returned purchase, check if batches have been used
        if (existingPurchase.purchased_type !== "returned") {
          for (const item of existingPurchase.order_items) {
            const batches = await BatchInventoryModel.find({
              purchase_id: existingPurchase._id,
              product_id: item.product_id,
            });

            for (const batch of batches) {
              // If batch has been used (current quantity is less than initial quantity)
              if (batch.initial_quantity !== batch.current_quantity) {
                const quantityUsed =
                  batch.initial_quantity - batch.current_quantity;
                throw new AppError(
                  `Cannot update purchase because ${quantityUsed} units from batch ${batch.batch_number} have already been sold or used`,
                  400
                );
              }
            }
          }
        }

        // Process new order items
        const productIds = order_items.map((item) => item.product);
        const products = await Product.find({
          _id: { $in: productIds },
          store_id: request.user.store_id,
        });

        if (products.length !== order_items.length) {
          throw new AppError(
            "Some products not found or don't belong to this store",
            404
          );
        }

        const productMap = products.reduce((map, product) => {
          map[product._id.toString()] = product;
          return map;
        }, {});

        // Check if items have changed by comparing with existing items
        const existingItemsMap = existingPurchase.order_items.reduce(
          (map, item) => {
            map[item.product_id.toString()] = item;
            return map;
          },
          {}
        );

        // Map new items and check for changes
        items = order_items.map((item) => {
          const product = productMap[item.product];
          const existingItem = existingItemsMap[item.product];

          // Check if this item has changed or is new
          if (
            !existingItem ||
            existingItem.quantity !== item.quantity ||
            existingItem.purchase_price !== item.purchase_price
          ) {
            itemsChanged = true;
          }

          // Use existing batch number if possible, or generate a new one
          let batchNumber;
          if (existingItem) {
            batchNumber = existingItem.batch_number;
          } else {
            const { fullBatchNumber } = this.generateBatchNumber(
              product.prod_code
            );
            batchNumber = fullBatchNumber;
            itemsChanged = true; // New item added
          }

          return {
            product_id: item.product,
            batch_number: batchNumber,
            quantity: item.quantity,
            purchase_price: item.purchase_price,
            manufactured_date: new Date(item.manufactured_date),
            expiry_date: new Date(item.expiry_date),
          };
        });

        // Check for removed items
        const existingProductIds = new Set(
          existingPurchase.order_items.map((item) => item.product_id.toString())
        );
        const newProductIds = new Set(order_items.map((item) => item.product));

        // Check for any removed items
        if (existingPurchase.order_items.length !== items.length) {
          itemsChanged = true;
        } else {
          for (const id of existingProductIds) {
            if (!newProductIds.has(id)) {
              itemsChanged = true;
              break;
            }
          }
        }
      }

      // Handle supplier account and transaction updates
      let supplierAccountDetails = existingPurchase.supplier_account_details;
      const isSupplierChanged =
        data.supplier && data.supplier !== existingPurchase.supplier.toString();
      const isPaymentTypeChanged =
        payment_type &&
        payment_type.type !== existingPurchase.payment_type.type;
      const isAmountChanged =
        data.grand_total && data.grand_total !== existingPurchase.grand_total;

      // ******* EMERGENCY FIX *******
      // Skip the credit limit check entirely for decreasing amount case
      if (
        isAmountChanged &&
        !isSupplierChanged &&
        !isPaymentTypeChanged &&
        !isPurchaseTypeChanged &&
        existingPurchase.payment_type.type === "credit" &&
        existingPurchase.purchased_type === "purchased" &&
        Number(data.grand_total) < Number(existingPurchase.grand_total)
      ) {
        // Get supplier
        const supplier = await Company.findById(existingPurchase.supplier);
        if (!supplier) {
          throw new AppError("Supplier not found", 404);
        }

        // Get current supplier state
        const currentUsedAmount =
          supplier.account_details.account.usedAmount || 0;
        const currentBalance = supplier.account_details.account.balance || 0;
        const creditLimit = supplier.account_details.account.amount || 0;

        // Calculate the amount difference
        const oldGrandTotal = Number(existingPurchase.grand_total);
        const newGrandTotal = Number(data.grand_total);
        const decreaseAmount = oldGrandTotal - newGrandTotal;

        // DIRECT FIX: Completely reset the account balance and credit usage
        // Calculate new values that ensure we free up at least the amount needed
        const newUsedAmount = Math.max(0, currentUsedAmount - decreaseAmount);

        // Update supplier account
        await Company.findByIdAndUpdate(
          existingPurchase.supplier,
          {
            $set: {
              "account_details.account.usedAmount": newUsedAmount,
            },
          },
          { session }
        );

        // Update the transaction record
        await CompanyCreditTransactionModel.findByIdAndUpdate(
          existingPurchase.supplier_account_details.transaction_id,
          {
            amount: -newGrandTotal,
            note: `Purchase updated from ${oldGrandTotal} to ${newGrandTotal} (decreased by ${decreaseAmount}).`,
          },
          { session }
        );

        // Minimal supplier account details for the purchase record
        supplierAccountDetails = {
          previous_balance: supplierAccountDetails.previous_balance,
          deducted_amount: newGrandTotal,
          credit_used: newGrandTotal,
          remaining_balance: supplierAccountDetails.remaining_balance,
          credit_limit: creditLimit,
          account_type: "credit",
          transaction_id:
            existingPurchase.supplier_account_details.transaction_id,
          balance_used: 0,
        };
      }
      // For all other cases, use the more careful logic
      else if (
        isSupplierChanged ||
        isPaymentTypeChanged ||
        isAmountChanged ||
        isPurchaseTypeChanged
      ) {
        // If supplier changed, handle old and new supplier
        if (isSupplierChanged) {
          // 1. Reverse the transaction for the old supplier
          if (
            existingPurchase.supplier &&
            existingPurchase.supplier_account_details
          ) {
            const prevSupplier = await Company.findById(
              existingPurchase.supplier
            );

            if (
              prevSupplier &&
              existingPurchase.payment_type.type === "credit"
            ) {
              // Reverse the previous credit transaction by updating usedAmount/balance
              const usedAmountChange =
                existingPurchase.purchased_type === "returned"
                  ? 0 // For returns, we need to undo the balance increase
                  : -(
                      existingPurchase.supplier_account_details.credit_used || 0
                    );

              const balanceChange =
                existingPurchase.purchased_type === "returned"
                  ? -existingPurchase.grand_total // Undo the balance increase from return
                  : existingPurchase.supplier_account_details.balance_used || 0; // Restore used balance

              // Calculate new values ensuring they don't go negative
              const newUsedAmount = Math.max(
                0,
                (prevSupplier.account_details.account.usedAmount || 0) +
                  usedAmountChange
              );

              const newBalance = Math.max(
                0,
                (prevSupplier.account_details.account.balance || 0) +
                  balanceChange
              );

              await Company.findByIdAndUpdate(
                existingPurchase.supplier,
                {
                  $set: {
                    "account_details.account.usedAmount": newUsedAmount,
                    "account_details.account.balance": newBalance,
                  },
                },
                { session }
              );

              // Delete the previous credit transaction
              if (existingPurchase.supplier_account_details.transaction_id) {
                await CompanyCreditTransactionModel.findByIdAndDelete(
                  existingPurchase.supplier_account_details.transaction_id,
                  { session }
                );
              }
            }
          }

          // 2. Create a new transaction for the new supplier
          supplierAccountDetails = await this.validateSupplierAccount({
            supplierId: data.supplier,
            grandTotal: data.grand_total || existingPurchase.grand_total,
            purchased_type:
              data.purchased_type || existingPurchase.purchased_type,
            session,
            userId: request.user._id,
            storeId: request.user.store_id,
            payment_type: payment_type || existingPurchase.payment_type,
            request,
            purchaseId: existingPurchase._id,
            date: existingPurchase.date,
          });
        } else {
          // Same supplier but other details changed
          try {
            // First, try our careful approach
            supplierAccountDetails = await this.updateSupplierTransaction(
              existingPurchase,
              data.grand_total || existingPurchase.grand_total,
              data.purchased_type || existingPurchase.purchased_type,
              session,
              request.user._id,
              request.user.store_id,
              payment_type || existingPurchase.payment_type,
              request,
              existingPurchase.supplier
            );
          } catch (error) {
            // If the credit limit check failed, and we're actually decreasing the amount
            if (
              error.message.includes("exceed the credit limit") &&
              isAmountChanged &&
              Number(data.grand_total) < Number(existingPurchase.grand_total)
            ) {
              // Get supplier
              const supplier = await Company.findById(
                existingPurchase.supplier
              );

              // Get current values
              const currentUsedAmount =
                supplier.account_details.account.usedAmount || 0;
              const currentBalance =
                supplier.account_details.account.balance || 0;
              const creditLimit = supplier.account_details.account.amount || 0;

              // Calculate the decrease
              const oldGrandTotal = Number(existingPurchase.grand_total);
              const newGrandTotal = Number(data.grand_total);
              const decreaseAmount = oldGrandTotal - newGrandTotal;

              // Force reduce used amount
              const newUsedAmount = Math.max(
                0,
                currentUsedAmount - decreaseAmount
              );

              // Update supplier account
              await Company.findByIdAndUpdate(
                existingPurchase.supplier,
                {
                  $set: {
                    "account_details.account.usedAmount": newUsedAmount,
                  },
                },
                { session }
              );

              // Update transaction
              await CompanyCreditTransactionModel.findByIdAndUpdate(
                existingPurchase.supplier_account_details.transaction_id,
                {
                  amount: -newGrandTotal,
                  note: `Purchase updated from ${oldGrandTotal} to ${newGrandTotal} (decreased by ${decreaseAmount}).`,
                },
                { session }
              );

              // Set supplier account details
              supplierAccountDetails = {
                previous_balance: currentBalance - newUsedAmount,
                deducted_amount: newGrandTotal,
                credit_used: newGrandTotal,
                remaining_balance: currentBalance - newUsedAmount,
                credit_limit: creditLimit,
                account_type: "credit",
                transaction_id:
                  existingPurchase.supplier_account_details.transaction_id,
                balance_used: 0,
              };
            } else {
              // For any other error, or if we're not actually decreasing amount, rethrow
              throw error;
            }
          }
        }
      }

      // Prepare update data
      const updateData = {
        ...data,
        supplier: data.supplier
          ? new mongoose.Types.ObjectId(data.supplier)
          : existingPurchase.supplier,
        order_items: items,
        supplier_account_details: supplierAccountDetails,
        payment_type: payment_type
          ? this.modifyPaymentType(payment_type)
          : existingPurchase.payment_type,
      };

      // Only update inventory if there are order item changes or purchase type changes
      if (itemsChanged || isPurchaseTypeChanged) {
        // Undo previous inventory operations
        await this.reverseInventoryUpdates(existingPurchase, session);

        // Update purchase document with new data
        const updatedPurchase = await PurchaseModel.findByIdAndUpdate(
          filterQuery.id,
          updateData,
          { new: true, session }
        );

        // Apply new inventory updates
        await this.updateInventory(updatedPurchase, session);

        await session.commitTransaction();
        return updatedPurchase;
      } else {
        // Simple update without inventory changes
        const updatedPurchase = await PurchaseModel.findByIdAndUpdate(
          filterQuery.id,
          updateData,
          { new: true, session }
        );

        await session.commitTransaction();
        return updatedPurchase;
      }
    } catch (error) {
      await session.abortTransaction();
      console.error(`Purchase update failed: ${error.message}`, error.stack);
      throw new AppError(`Purchase update failed: ${error.message}`, 500);
    } finally {
      session.endSession();
    }
  }

  async deletePurchase(filterQuery, request) {
    try {
      const purchase = await PurchaseModel.findById(filterQuery.id);
      if (!purchase) {
        throw new AppError("Purchase not found", 404);
      }

      // Then delete the purchase record
      await PurchaseModel.findByIdAndDelete(purchase._id);

      return purchase;
    } catch (error) {
      throw new AppError(`Failed to delete purchase: ${error.message}`, 500);
    }
  }

  async reverseInventoryUpdates(purchase, session) {
    try {
      const isReturn = purchase.purchased_type === "returned";
      const productIds = new Set(); // Track product IDs for final sync

      for (const item of purchase.order_items) {
        productIds.add(item.product_id);

        if (isReturn) {
          // Find all inventory transactions for this returned purchase
          const transactions = await InventoryTransactionModel.find({
            reference_id: purchase._id,
            reference_model: "Purchase",
            transaction_type: "return",
          }).populate("batch_inventory_id");

          // Delete these transactions
          await InventoryTransactionModel.deleteMany(
            {
              reference_id: purchase._id,
              reference_model: "Purchase",
              transaction_type: "return",
            },
            { session }
          );

          // For each transaction, restore the batch quantities
          for (const transaction of transactions) {
            if (transaction.batch_inventory_id) {
              // Since return transactions store negative quantities, we subtract them to restore
              await BatchInventoryModel.findByIdAndUpdate(
                transaction.batch_inventory_id._id,
                {
                  $inc: { current_quantity: Math.abs(transaction.quantity) },
                  $set: { status: "active" },
                },
                { session }
              );
            }
          }
        } else {
          // For regular purchases - Delete batch inventories created for this purchase
          const batches = await BatchInventoryModel.find({
            purchase_id: purchase._id,
            product_id: item.product_id,
          });

          await BatchInventoryModel.deleteMany(
            { purchase_id: purchase._id, product_id: item.product_id },
            { session }
          );

          // Delete associated transactions
          await InventoryTransactionModel.deleteMany(
            {
              reference_id: purchase._id,
              reference_model: "Purchase",
              batch_inventory_id: { $in: batches.map((b) => b._id) },
            },
            { session }
          );
        }
      }

      // Final step: Sync all affected product quantities
      for (const productId of productIds) {
        await this.syncProductQuantity(productId, session);
      }
    } catch (error) {
      throw new AppError(
        `Reverse inventory update failed: ${error.message}`,
        500
      );
    }
  }

  async filteredPurchaseList(filterQuery) {
    const {
      search,
      purchase_number,
      supplier,
      date_range = "",
      order_status,
      sort = { createdAt: -1 },
    } = filterQuery;

    const query = {};

    if (search) {
      query.$or = [{ purchase_number: { $regex: search, $options: "i" } }];
    }

    if (purchase_number) {
      query.purchase_number = purchase_number;
    }

    if (supplier) {
      query.supplier = new mongoose.Types.ObjectId(supplier);
    }

    if (date_range && date_range.start && date_range.end) {
      query.date = {
        $gte: new Date(date_range.start),
        $lte: new Date(date_range.end),
      };
    }

    if (order_status) {
      query.order_status = order_status;
    }

    const purchases = await PurchaseModel.find(query)
      .sort(sort)
      .populate("supplier", "name contact_person")
      .populate("store_id", "name")
      .populate("added_by", "name");

    // Enhance with batch details
    const enhancedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        const batchDetails = await BatchInventoryModel.find({
          purchase_id: purchase._id,
        }).populate("product_id", "prod_name prod_code");

        return {
          ...purchase.toObject(),
          batches: batchDetails,
        };
      })
    );

    return enhancedPurchases;
  }
}

export default new PurchaseService();
