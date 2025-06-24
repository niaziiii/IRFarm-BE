import SaleModel from "../models/saleModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import AppError from "../utils/apiError.js";
import {
  BatchInventoryModel,
  InventoryTransactionModel,
} from "../models/batchInventoryModel.js";
import mongoose from "mongoose";
import { CustomerCreditTransactionModel } from "../models/customerModel.js";
import notificationService from "./notificationService.js";

class SaleService {
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

  generateBatchNumber(data) {
    const getRandomFiveDigitNumber = () =>
      Math.floor(10000 + Math.random() * 90000);

    const sellNumber = `SALE-${data}-${getRandomFiveDigitNumber()}`;
    return sellNumber;
  }

  async updateCustomerTransaction(
    existingSale,
    newGrandTotal,
    newSaleType,
    session,
    userId,
    storeId,
    newPaymentType,
    request,
    customerId
  ) {
    // If no customer or no existing transaction, nothing to update
    if (
      !customerId ||
      !existingSale.customer_account_details ||
      !existingSale.customer_account_details.transaction_id
    ) {
      return null;
    }

    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    // Find the existing transaction
    const existingTransaction = await CustomerCreditTransactionModel.findById(
      existingSale.customer_account_details.transaction_id
    );

    if (!existingTransaction) {
      // If transaction not found, create a new one using validateCustomerAccount
      return await this.validateCustomerAccount(
        customerId,
        newGrandTotal,
        newSaleType,
        session,
        userId,
        storeId,
        newPaymentType,
        request,
        existingSale._id,
        existingSale.date
      );
    }

    // Get current values
    const oldGrandTotal = Number(existingSale.grand_total);
    const newGrandTotalNum = Number(newGrandTotal);
    const oldSaleType = existingSale.sale_type;
    const oldPaymentType = existingSale.payment_type;

    const currentUsedAmount = customer.account.usedAmount || 0;
    const currentBalance = customer.account.balance || 0;
    const creditLimit = customer.account.amount || 0;

    // Calculate current net balance (balance - usedAmount)
    const netBalance = currentBalance - currentUsedAmount;

    // Track the changes we need to make
    let balanceChange = 0;
    let usedAmountChange = 0;

    // 1. First, reverse the effect of the old transaction based on payment type
    if (oldPaymentType.type === "credit") {
      // Handle credit reversal - existing code
      const balanceUsed =
        existingSale.customer_account_details.balance_used || 0;

      if (oldSaleType === "returned") {
        balanceChange -= oldGrandTotal; // Reduce the balance
      } else {
        balanceChange += balanceUsed; // Restore used balance

        if (oldGrandTotal > balanceUsed) {
          usedAmountChange -= oldGrandTotal - balanceUsed; // Reduce the used amount
        }
      }
    } else if (oldPaymentType.type === "split") {
      // Handle split payment reversal - only affect credit portion
      const oldCreditAmount =
        existingSale.customer_account_details.credit_amount || 0;
      const balanceUsed =
        existingSale.customer_account_details.balance_used || 0;

      if (oldSaleType === "returned") {
        balanceChange -= oldCreditAmount; // Reduce balance by credit amount
      } else {
        balanceChange += balanceUsed; // Restore used balance

        if (oldCreditAmount > balanceUsed) {
          usedAmountChange -= oldCreditAmount - balanceUsed; // Reduce used amount
        }
      }
    }
    // For cash payments, no customer account reversal needed

    // 2. Then, apply the effect of the new transaction
    if (newPaymentType.type === "credit") {
      // Handle credit payment - existing code
      let newBalanceUsed = 0;

      if (newSaleType === "returned") {
        balanceChange += newGrandTotalNum;
      } else {
        const availableBalance = currentBalance + balanceChange;

        if (availableBalance > 0) {
          newBalanceUsed = Math.min(availableBalance, newGrandTotalNum);
          balanceChange -= newBalanceUsed;

          if (newGrandTotalNum > newBalanceUsed) {
            const creditNeeded = newGrandTotalNum - newBalanceUsed;
            const newUsedAmount =
              currentUsedAmount + usedAmountChange + creditNeeded;

            if (newUsedAmount > creditLimit) {
              throw new AppError(
                `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Required: ${newUsedAmount}`,
                400
              );
            }

            usedAmountChange += creditNeeded;
          }
        } else {
          const newUsedAmount =
            currentUsedAmount + usedAmountChange + newGrandTotalNum;

          if (newUsedAmount > creditLimit) {
            throw new AppError(
              `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Required: ${newUsedAmount}`,
              400
            );
          }

          usedAmountChange += newGrandTotalNum;
        }
      }

      // Calculate new values
      const newUsedAmount = Math.max(0, currentUsedAmount + usedAmountChange);
      const newBalance = currentBalance + balanceChange;
      const newNetBalance = newBalance - newUsedAmount;

      // Update customer's account
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $set: {
            "account.usedAmount": newUsedAmount,
            "account.balance": newBalance,
          },
        },
        { session }
      );

      // Update the transaction record
      const transactionAmount =
        newSaleType === "returned" ? -newGrandTotalNum : newGrandTotalNum;
      const transactionNote = // Existing note logic
        await CustomerCreditTransactionModel.findByIdAndUpdate(
          existingSale.customer_account_details.transaction_id,
          {
            payment_type: newPaymentType.type,
            transaction_type: newSaleType === "returned" ? "return" : "sale",
            previous_balance: netBalance,
            amount: transactionAmount,
            remaining_balance: newNetBalance,
            note: transactionNote,
            // Clear split payment fields if they existed before
            $unset: { cash_amount: "", credit_amount: "" },
          },
          { session }
        );

      // Return updated customer account details
      return {
        previous_balance: newNetBalance,
        deducted_amount: Math.abs(newGrandTotalNum),
        credit_used:
          newBalanceUsed < newGrandTotalNum
            ? newGrandTotalNum - newBalanceUsed
            : 0,
        remaining_balance: newNetBalance,
        credit_limit: creditLimit,
        account_type: customer.account.type,
        transaction_id: existingSale.customer_account_details.transaction_id,
        balance_used: newBalanceUsed,
      };
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

      let newBalanceUsed = 0;

      if (newSaleType === "returned") {
        // For returns, increase balance by credit amount
        balanceChange += creditAmount;
      } else {
        // For sales, use available balance first for credit portion
        const availableBalance = currentBalance + balanceChange;

        if (availableBalance > 0) {
          newBalanceUsed = Math.min(availableBalance, creditAmount);
          balanceChange -= newBalanceUsed;

          if (creditAmount > newBalanceUsed) {
            const creditNeeded = creditAmount - newBalanceUsed;
            const newUsedAmount =
              currentUsedAmount + usedAmountChange + creditNeeded;

            if (newUsedAmount > creditLimit) {
              throw new AppError(
                `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Required: ${newUsedAmount}`,
                400
              );
            }

            usedAmountChange += creditNeeded;
          }
        } else {
          // No balance available, check if credit portion would exceed limit
          const newUsedAmount =
            currentUsedAmount + usedAmountChange + creditAmount;

          if (newUsedAmount > creditLimit) {
            throw new AppError(
              `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Required: ${newUsedAmount}`,
              400
            );
          }

          usedAmountChange += creditAmount;
        }
      }

      // Calculate new values
      const newUsedAmount = Math.max(0, currentUsedAmount + usedAmountChange);
      const newBalance = currentBalance + balanceChange;
      const newNetBalance = newBalance - newUsedAmount;

      // Update customer's account
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $set: {
            "account.usedAmount": newUsedAmount,
            "account.balance": newBalance,
          },
        },
        { session }
      );

      // Update the transaction record for split payment
      const transactionAmount =
        newSaleType === "returned" ? -newGrandTotalNum : newGrandTotalNum;
      const transactionNote =
        newSaleType === "returned"
          ? `Updated return of ${newGrandTotalNum}. Split payment: ${cashAmount} cash, ${creditAmount} credit.`
          : newBalanceUsed > 0
          ? `Updated sale of ${newGrandTotalNum}. Split payment: ${cashAmount} cash, ${creditAmount} credit. Used ${newBalanceUsed} from balance and ${
              creditAmount - newBalanceUsed
            } from credit.`
          : `Updated split payment sale of ${newGrandTotalNum}. ${cashAmount} cash, ${creditAmount} credit.`;

      await CustomerCreditTransactionModel.findByIdAndUpdate(
        existingSale.customer_account_details.transaction_id,
        {
          payment_type: "split",
          transaction_type: newSaleType === "returned" ? "return" : "sale",
          previous_balance: netBalance,
          amount: transactionAmount,
          cash_amount: cashAmount,
          credit_amount: creditAmount,
          remaining_balance: newNetBalance,
          note: transactionNote,
        },
        { session }
      );

      // Return updated customer account details with split payment info
      return {
        previous_balance: newNetBalance,
        deducted_amount: Math.abs(newGrandTotalNum),
        credit_used:
          newBalanceUsed < creditAmount ? creditAmount - newBalanceUsed : 0,
        remaining_balance: newNetBalance,
        credit_limit: creditLimit,
        account_type: customer.account.type,
        transaction_id: existingSale.customer_account_details.transaction_id,
        balance_used: newBalanceUsed,
        cash_amount: cashAmount,
        credit_amount: creditAmount,
      };
    } else if (newPaymentType.type === "cash") {
      // Handle cash payment - similar to existing code
      // Cash payments don't affect credit balances, just record transaction

      // Calculate new values - no changes to balances for cash
      const newNetBalance = netBalance;

      // Update the transaction record for cash
      const transactionAmount =
        newSaleType === "returned" ? -newGrandTotalNum : newGrandTotalNum;
      const transactionNote =
        newSaleType === "returned"
          ? `Updated cash return of ${newGrandTotalNum}.`
          : `Updated cash sale of ${newGrandTotalNum}.`;

      await CustomerCreditTransactionModel.findByIdAndUpdate(
        existingSale.customer_account_details.transaction_id,
        {
          payment_type: "cash",
          transaction_type: newSaleType === "returned" ? "return" : "sale",
          previous_balance: netBalance,
          amount: transactionAmount,
          remaining_balance: newNetBalance,
          note: transactionNote,
          // Clear split payment fields if they existed before
          $unset: { cash_amount: "", credit_amount: "" },
        },
        { session }
      );

      // Return updated customer account details
      return {
        previous_balance: netBalance,
        deducted_amount: Math.abs(newGrandTotalNum),
        remaining_balance: newNetBalance,
        credit_limit: creditLimit,
        account_type: customer.account.type,
        transaction_id: existingSale.customer_account_details.transaction_id,
      };
    }

    // If invalid payment type
    throw new AppError(`Invalid payment type: ${newPaymentType.type}`, 400);
  }

  async validateCustomerAccount(
    customerId,
    grandTotal,
    saleType,
    session,
    userId,
    storeId,
    payment_type,
    request,
    saleId = null,
    date
  ) {
    if (!customerId) return null;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    // Initialize base transaction data
    const baseTransactionData = {
      customer_id: customerId,
      store_id: storeId,
      added_by: userId,
      date: date,
      transaction_type: saleType === "returned" ? "return" : "sale",
      sale_id: saleId,
    };

    // Case 1: Split payment - handle part cash, part credit
    if (payment_type.type === "split") {
      if (customer.account.type !== "credit") {
        throw new AppError(
          "Customer does not have a credit account for split payment",
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

      const creditLimit = customer.account.amount;
      const currentUsedAmount = customer.account.usedAmount || 0;
      const currentBalance = customer.account.balance || 0;

      // Calculate net balance (customer's current position)
      const netBalance = currentBalance - currentUsedAmount;

      let newUsedAmount = currentUsedAmount;
      let newBalance = currentBalance;
      let useFromBalance = 0;

      if (saleType === "returned") {
        // For returns: add credit portion to balance
        newBalance = currentBalance + creditAmount;
      } else {
        // For sales: first use available balance for credit portion
        if (currentBalance > 0) {
          useFromBalance = Math.min(currentBalance, creditAmount);
          newBalance = currentBalance - useFromBalance;

          // If credit amount exceeds available balance
          if (creditAmount > useFromBalance) {
            const remainingAmount = creditAmount - useFromBalance;

            // Check if this would exceed credit limit
            if (currentUsedAmount + remainingAmount > creditLimit) {
              throw new AppError(
                `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${remainingAmount}`,
                400
              );
            }
            newUsedAmount = currentUsedAmount + remainingAmount;
          }
        } else {
          // No balance available, all credit portion goes to credit
          if (currentUsedAmount + creditAmount > creditLimit) {
            throw new AppError(
              `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${creditAmount}`,
              400
            );
          }
          newUsedAmount = currentUsedAmount + creditAmount;
        }
      }

      // Calculate new net balance after transaction
      const newNetBalance = newBalance - newUsedAmount;

      // Update customer account
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $set: {
            "account.usedAmount": newUsedAmount,
            "account.balance": newBalance,
          },
        },
        { session }
      );

      // Create transaction record for split payment
      const splitTransaction = new CustomerCreditTransactionModel({
        ...baseTransactionData,
        previous_balance: netBalance,
        amount: saleType === "returned" ? -grandTotal : grandTotal, // Store full transaction amount
        cash_amount: cashAmount, // Store cash portion
        credit_amount: creditAmount, // Store credit portion
        remaining_balance: newNetBalance,
        payment_type: "split", // Mark as split payment
        note:
          saleType === "returned"
            ? `Return of ${grandTotal}. Split payment: ${cashAmount} cash, ${creditAmount} credit.`
            : useFromBalance > 0
            ? `Sale of ${grandTotal}. Split payment: ${cashAmount} cash, ${creditAmount} credit. Used ${useFromBalance} from balance and ${
                creditAmount - useFromBalance
              } from credit.`
            : `Split payment sale of ${grandTotal}. ${cashAmount} cash, ${creditAmount} credit.`,
      });

      await splitTransaction.save({ session });

      // Send notification
      const notificationMsg =
        saleType === "returned"
          ? `${
              customer.name
            } has returned products worth ${grandTotal} with split payment. New balance: ${
              newNetBalance > 0 ? "+" + newNetBalance : newNetBalance
            }.`
          : `${
              customer.name
            } has purchased products for ${grandTotal} with split payment (${cashAmount} cash, ${creditAmount} credit). ${
              useFromBalance > 0 ? `Used ${useFromBalance} from balance.` : ""
            } New balance: ${
              newNetBalance > 0 ? "+" + newNetBalance : newNetBalance
            }.`;

      await notificationService.sendNotification(
        {
          title: "Split Payment Sale",
          message: notificationMsg,
          type: "SALE",
        },
        request.user._id
      );

      return {
        previous_balance: netBalance,
        deducted_amount: useFromBalance > 0 ? useFromBalance : 0,
        credit_used:
          creditAmount - useFromBalance > 0 ? creditAmount - useFromBalance : 0,
        remaining_balance: newNetBalance,
        credit_limit: creditLimit,
        account_type: "credit",
        transaction_id: splitTransaction._id,
        balance_used: useFromBalance,
        cash_amount: cashAmount,
        credit_amount: creditAmount,
      };
    }

    // Case 2: Payment is on credit - manipulate customer credit usage
    if (payment_type.type === "credit") {
      if (customer.account.type !== "credit") {
        throw new AppError("Customer does not have a credit account", 400);
      }

      const creditLimit = customer.account.amount;
      const currentUsedAmount = customer.account.usedAmount || 0;
      const currentBalance = customer.account.balance || 0;

      // Calculate the NET balance (the actual representation of customer's position)
      // Positive means customer has credit with the store
      // Negative means customer owes money to the store
      const netBalance = currentBalance - currentUsedAmount;

      let newUsedAmount = currentUsedAmount;
      let newBalance = currentBalance;
      let transactionAmount = grandTotal;
      let useFromBalance = 0;

      if (saleType === "returned") {
        // For returns: add to balance instead of reducing usedAmount
        // This ensures we capture returns correctly in the balance
        newBalance = currentBalance + grandTotal;
        transactionAmount = -grandTotal; // Negative amount for returns
      } else {
        // For sales
        if (currentBalance > 0) {
          // If there's balance available, use it first
          useFromBalance = Math.min(currentBalance, grandTotal);
          newBalance = currentBalance - useFromBalance;

          // If there's remaining amount after using balance
          if (grandTotal > useFromBalance) {
            const remainingAmount = grandTotal - useFromBalance;
            // Check credit limit for the remaining amount
            if (currentUsedAmount + remainingAmount > creditLimit) {
              throw new AppError(
                `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${remainingAmount}`,
                400
              );
            }
            newUsedAmount = currentUsedAmount + remainingAmount;
          }
        } else {
          // No balance available, check if adding the full amount would exceed credit limit
          if (currentUsedAmount + grandTotal > creditLimit) {
            throw new AppError(
              `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${grandTotal}`,
              400
            );
          }
          newUsedAmount = currentUsedAmount + grandTotal;
        }
      }

      // Calculate new net balance after transaction
      const newNetBalance = newBalance - newUsedAmount;

      // Update customer account
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $set: {
            "account.usedAmount": newUsedAmount,
            "account.balance": newBalance,
          },
        },
        { session }
      );

      // Create transaction record
      const creditTransaction = new CustomerCreditTransactionModel({
        ...baseTransactionData,
        previous_balance: netBalance, // Use net balance here (positive means customer has credit)
        amount: transactionAmount,
        remaining_balance: newNetBalance, // Use new net balance
        payment_type: "credit",
        note:
          useFromBalance > 0
            ? `Sale of ${grandTotal}. Used ${useFromBalance} from balance and ${
                grandTotal - useFromBalance
              } from credit.`
            : `Credit sale of ${grandTotal}.`,
      });

      await creditTransaction.save({ session });

      // Send notification
      const notificationMsg =
        saleType === "returned"
          ? `${
              customer.name
            } has returned products worth ${grandTotal}. New balance: ${
              newNetBalance > 0 ? "+" + newNetBalance : newNetBalance
            }.`
          : `${customer.name} has purchased products for ${grandTotal}. ${
              useFromBalance > 0 ? `Used ${useFromBalance} from balance.` : ""
            } New balance: ${
              newNetBalance > 0 ? "+" + newNetBalance : newNetBalance
            }.`;

      await notificationService.sendNotification(
        {
          title: "Credit Sale",
          message: notificationMsg,
          type: "SALE",
        },
        request.user._id
      );

      return {
        previous_balance: netBalance,
        deducted_amount: useFromBalance > 0 ? useFromBalance : 0,
        credit_used:
          useFromBalance < grandTotal ? grandTotal - useFromBalance : 0,
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
        customer.account.type === "credit"
          ? customer.account.usedAmount || 0
          : 0;
      const currentBalance =
        customer.account.type === "credit" ? customer.account.balance || 0 : 0;
      const creditLimit =
        customer.account.type === "credit" ? customer.account.amount : 0;

      // Calculate net balance
      const netBalance = currentBalance - currentUsedAmount;

      // Record transaction without affecting account balances
      const cashTransaction = new CustomerCreditTransactionModel({
        ...baseTransactionData,
        previous_balance: netBalance,
        amount: saleType === "returned" ? -grandTotal : grandTotal,
        remaining_balance: netBalance, // No change for cash transactions
        payment_type: "cash",
        note:
          saleType === "returned"
            ? `Cash return of ${grandTotal}.`
            : `Cash sale of ${grandTotal}.`,
      });

      await cashTransaction.save({ session });

      return {
        previous_balance: netBalance,
        deducted_amount: grandTotal,
        remaining_balance: netBalance,
        credit_limit: creditLimit,
        account_type: customer.account.type,
        transaction_id: cashTransaction._id,
      };
    }

    // If payment type is neither credit nor cash
    throw new AppError(`Invalid payment type: ${payment_type.type}`, 400);
  }

  async updateInventory(sale, session) {
    try {
      const isReturn = sale.sale_type === "returned";
      const productIds = new Set(); // Track product IDs for final sync

      for (const item of sale.sale_items) {
        productIds.add(item.product_id);

        if (isReturn) {
          // Handle return: Add quantities back to batches
          const batches = await BatchInventoryModel.find(
            {
              product_id: item.product_id,
              store_id: sale.store_id,
              status: { $in: ["active", "depleted"] },
            },
            null,
            { session }
          ).sort({ expiry_date: 1 });

          if (batches.length === 0) {
            throw new AppError(
              `No batches found for product ID: ${item.product_id}`,
              400
            );
          }

          // Add quantity back to the first available batch
          const batch = batches[0];
          batch.current_quantity += item.quantity;
          batch.status = "active"; // Reactivate if it was depleted

          await batch.save({ session });

          // Create return transaction
          const transactionData = {
            batch_inventory_id: batch._id,
            transaction_type: "return",
            quantity: item.quantity, // Positive quantity for returns
            reference_id: sale._id,
            reference_model: "Sale",
            performed_by: sale.added_by,
            customer: sale.customer,
          };

          await InventoryTransactionModel.create([transactionData], {
            session,
          });

          // We'll sync the product quantity at the end
        } else {
          // Original sale logic
          let remainingQuantity = item.quantity;

          const batches = await BatchInventoryModel.find(
            {
              product_id: item.product_id,
              store_id: sale.store_id,
              status: "active",
              current_quantity: { $gt: 0 },
            },
            null,
            { session }
          ).sort({ expiry_date: 1 });

          if (batches.length === 0) {
            throw new AppError(
              `Insufficient stock for product ID: ${item.product_id}`,
              400
            );
          }

          for (const batch of batches) {
            if (remainingQuantity <= 0) break;

            const quantityToDeduct = Math.min(
              remainingQuantity,
              batch.current_quantity
            );

            batch.current_quantity -= quantityToDeduct;
            remainingQuantity -= quantityToDeduct;

            if (batch.current_quantity === 0) {
              batch.status = "depleted";
            }

            await batch.save({ session });

            const transactionData = {
              batch_inventory_id: batch._id,
              transaction_type: "sale",
              quantity: -quantityToDeduct, // Negative quantity for sales
              reference_id: sale._id,
              reference_model: "Sale",
              performed_by: sale.added_by,
              customer: sale.customer,
            };

            await InventoryTransactionModel.create([transactionData], {
              session,
            });
          }

          if (remainingQuantity > 0) {
            throw new AppError(
              `Insufficient stock for product ID: ${item.product_id}`,
              400
            );
          }

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

  async createSale(request) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        customer_payment_mode = {},
        customer,
        sold_items,
        sale_type = "sale",
        ...data
      } = request.body;

      if (
        !sold_items ||
        !Array.isArray(sold_items) ||
        sold_items.length === 0
      ) {
        throw new AppError("Sold items are required", 400);
      }

      if (!customer && data.payment_type.type == "credit") {
        throw new AppError(
          "Please select customer before proceeding credit payment sale.",
          400
        );
      }

      const productIds = sold_items.map((item) => item.product);
      const products = await Product.find({
        _id: { $in: productIds },
        store_id: request.user.store_id,
      });

      if (products.length !== sold_items.length) {
        throw new AppError(
          "Some products not found or don't belong to this store",
          404
        );
      }

      if (sale_type === "sale") {
        // Validate product quantities
        for (const item of sold_items) {
          const product = products.find(
            (p) => p._id.toString() === item.product
          );

          // Check batches for available quantity
          const batches = await BatchInventoryModel.find({
            product_id: item.product,
            store_id: request.user.store_id,
            status: "active",
            current_quantity: { $gt: 0 },
          });

          const totalAvailable = batches.reduce(
            (sum, batch) => sum + batch.current_quantity,
            0
          );

          if (totalAvailable < item.quantity) {
            throw new AppError(
              `Insufficient stock for product: ${product.prod_name}. Available: ${totalAvailable}, Requested: ${item.quantity}`,
              400
            );
          }
        }
      }

      const sale_items = sold_items.map((item) => ({
        product_id: item.product,
        quantity: item.quantity,
        sale_price: item.sale_price,
        discount_amount: item.discount_amount || 0,
      }));

      // Get customer account details if customer exists
      const customerAccountDetails = await this.validateCustomerAccount(
        customer,
        data.grand_total,
        sale_type,
        session,
        request.user._id,
        request.user.store_id,
        data.payment_type,
        request,
        null,
        data.date
      );

      const saleData = {
        sale_number: this.generateBatchNumber(data.date),
        customer: customer ? new mongoose.Types.ObjectId(customer) : null,
        customer_account_details: customerAccountDetails,
        store_id: request.user.store_id,
        sale_items,
        sale_type,
        discount_value: data.discount_value || 0,
        shipping_charges: data.shipping_charges || 0,
        grand_total: data.grand_total,
        payment_type: this.modifyPaymentType(data.payment_type),
        payment_status: data.payment_status || "paid",
        note: data.note || "",
        added_by: request.user._id,
        date: data.date || new Date(),
        customer_source: data.customer_source || "",
        salePerson: data.salePerson || "",
      };

      const sale = await SaleModel.create([saleData], { session });

      // Update the transaction record with the sale_id
      if (customerAccountDetails && customerAccountDetails.transaction_id) {
        await CustomerCreditTransactionModel.findByIdAndUpdate(
          customerAccountDetails.transaction_id,
          { sale_id: sale[0]._id },
          { session }
        );
      }

      await this.updateInventory(sale[0], session);

      await session.commitTransaction();
      return sale[0];
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(`${error.message}`, 500);
    } finally {
      session.endSession();
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
  async reverseInventoryChanges(sale, session) {
    try {
      const isReturn = sale.sale_type === "returned";
      const productIds = new Set(); // Track affected products

      // Find all inventory transactions for this sale
      const transactions = await InventoryTransactionModel.find(
        {
          reference_id: sale._id,
          reference_model: "Sale",
        },
        null,
        { session }
      ).populate("batch_inventory_id");

      // Group transactions by batch
      const batchTransactions = {};

      for (const transaction of transactions) {
        if (!transaction.batch_inventory_id) continue;

        const batchId = transaction.batch_inventory_id._id.toString();
        if (!batchTransactions[batchId]) {
          batchTransactions[batchId] = [];
        }
        batchTransactions[batchId].push(transaction);

        // Track product ID
        productIds.add(transaction.batch_inventory_id.product_id);
      }

      // Process each batch
      for (const batchId in batchTransactions) {
        const batch = await BatchInventoryModel.findById(batchId, null, {
          session,
        });
        if (!batch) continue;

        // Calculate quantity to restore
        const quantityChange = batchTransactions[batchId].reduce((sum, t) => {
          // For sale transactions, quantity is negative, so we negate it to restore
          // For return transactions, quantity is positive, so we negate it to reverse
          return sum - t.quantity;
        }, 0);

        // Update batch
        batch.current_quantity += quantityChange;
        batch.status = batch.current_quantity > 0 ? "active" : "depleted";
        await batch.save({ session });
      }

      // Delete all related inventory transactions
      await InventoryTransactionModel.deleteMany(
        { reference_id: sale._id, reference_model: "Sale" },
        { session }
      );

      // Handle customer account if needed
      if (
        sale.customer &&
        sale.customer_account_details &&
        sale.payment_type.type === "credit"
      ) {
        // Find the customer to update
        const customer = await Customer.findById(sale.customer);
        if (customer) {
          // For credit sales: need to reverse the usedAmount
          // If it was a sale, we decrease usedAmount. If it was a return, we increase usedAmount
          const amountToReverse = isReturn
            ? sale.grand_total
            : -sale.grand_total;

          // Calculate new usedAmount and ensure it doesn't go negative
          const newUsedAmount = Math.max(
            0,
            (customer.account.usedAmount || 0) + amountToReverse
          );

          // Update customer's used credit amount
          await Customer.findByIdAndUpdate(
            sale.customer,
            { $set: { "account.usedAmount": newUsedAmount } },
            { session }
          );

          // Delete the credit transaction if it exists
          if (sale.customer_account_details.transaction_id) {
            await CustomerCreditTransactionModel.findByIdAndDelete(
              sale.customer_account_details.transaction_id,
              { session }
            );
          }
        }
      }

      // Sync product quantities
      for (const productId of productIds) {
        await this.syncProductQuantity(productId, session);
      }
    } catch (error) {
      throw new AppError(
        `Failed to reverse inventory changes: ${error.message}`,
        500
      );
    }
  }

  async findSale(filterQuery) {
    const sale = await SaleModel.findById(filterQuery.id)
      .populate("customer")
      .populate("store_id")
      .populate({
        path: "sale_items.product_id",
        select: "prod_name prod_code sku images maximum_retail_price",
      })
      .populate("added_by", "name image role");

    if (!sale) {
      throw new AppError("Sale not found", 404);
    }

    return sale;
  }

  async findAllSales(filterQuery, { user }) {
    // Build base query
    let query = {};

    // Apply filters if provided in filterQuery
    if (filterQuery.sale_type && filterQuery.sale_type !== "all") {
      query.sale_type = filterQuery.sale_type;
    }
    if (filterQuery.customer_source) {
      query.customer_source = filterQuery.customer_source;
    }

    // Add payment type filter
    if (filterQuery.payment_type) {
      query["payment_type.type"] = filterQuery.payment_type;
    }

    if (filterQuery.payment_status) {
      query.payment_status = filterQuery.payment_status;
    }

    if (filterQuery.customer) {
      query.customer = new mongoose.Types.ObjectId(filterQuery.customer);
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

    // Important: Add store filter for non-super-admin users
    if (user && user.role !== "super_admin") {
      query.store_id = new mongoose.Types.ObjectId(user.store_id);
    }

    // Use populate instead of complex aggregation
    const sales = await SaleModel.find(query)
      .populate({
        path: "store_id",
        select: "name address",
      })
      .populate({
        path: "added_by",
        select: "name image role",
      })
      .populate({
        path: "customer",
        select: "name customer_type contact_no cnic image account",
      })
      .populate({
        path: "salePerson",
        select: "name image",
      })
      .populate({
        path: "sale_items.product_id",
        select:
          "prod_name prod_code sku type maximum_retail_price actual_retail_price whole_sale_price company category images",
      })
      .sort({ createdAt: -1 });

    // Transform the populated data to match the expected response format
    const formattedSales = sales.map((sale) => {
      // Calculate totals
      const total_items = sale.sale_items.length;
      const total_quantity = sale.sale_items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const total_sale_value = sale.sale_items.reduce(
        (sum, item) => sum + item.quantity * item.sale_price,
        0
      );

      return {
        _id: sale._id,
        sale_number: sale.sale_number,
        date: sale.date,
        sale_type: sale.sale_type,
        customer_source: sale.customer_source,
        salePerson: sale.salePerson,
        sale_items: sale.sale_items,
        discount_value: sale.discount_value,
        shipping_charges: sale.shipping_charges,

        grand_total: sale.grand_total,
        payment_type: sale.payment_type,
        customer_account_details: sale.customer_account_details,
        payment_status: sale.payment_status,
        note: sale.note,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
        total_items,
        total_quantity,
        total_sale_value,
        store_details: sale.store_id,
        added_by: sale.added_by,
        customer_info: sale.customer,
      };
    });

    return formattedSales;
  }

  async deleteSale(filterQuery) {
    const sale = await SaleModel.findById(filterQuery.id);
    if (!sale) {
      throw new AppError("Sale not found", 404);
    }

    try {
      // Delete the sale
      await SaleModel.findByIdAndDelete(sale._id);

      return sale;
    } catch (error) {
      throw new AppError(`Failed to delete sale: ${error.message}`, 500);
    }
  }

  async updateSale(filterQuery, saleData, request) {
    if (Object.keys(saleData).length === 1 && saleData.customer_source) {
      return await SaleModel.findByIdAndUpdate(
        filterQuery.id,
        { customer_source: saleData.customer_source },
        { new: true }
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find existing sale
      const existingSale = await SaleModel.findById(filterQuery.id);
      if (!existingSale) {
        throw new AppError("Sale not found", 404);
      }

      const {
        customer_payment_mode = {},
        customer,
        sold_items,
        sale_type = existingSale.sale_type,
        payment_type = existingSale.payment_type,
        ...data
      } = saleData;

      // Check if items have changed
      let itemsChanged = false;
      if (sold_items) {
        if (!Array.isArray(sold_items) || sold_items.length === 0) {
          throw new AppError("Sold items are required", 400);
        }

        // Check if the arrays are different lengths
        if (existingSale.sale_items.length !== sold_items.length) {
          itemsChanged = true;
        } else {
          // Check if any items have changed quantity or product
          const existingMap = existingSale.sale_items.reduce((map, item) => {
            map[item.product_id.toString()] = item;
            return map;
          }, {});

          for (const item of sold_items) {
            const existingItem = existingMap[item.product];
            if (
              !existingItem ||
              existingItem.quantity !== item.quantity ||
              existingItem.sale_price !== item.sale_price
            ) {
              itemsChanged = true;
              break;
            }
          }
        }

        // If items changed, validate the new items
        if (itemsChanged) {
          const productIds = sold_items.map((item) => item.product);
          const products = await Product.find({
            _id: { $in: productIds },
            store_id: request.user.store_id,
          });

          if (products.length !== sold_items.length) {
            throw new AppError(
              "Some products not found or don't belong to this store",
              404
            );
          }

          // Check stock availability for new items (only for sales, not returns)
          if (sale_type === "sale") {
            for (const item of sold_items) {
              const product = products.find(
                (p) => p._id.toString() === item.product
              );

              // Get current available quantity in batches
              const batches = await BatchInventoryModel.find({
                product_id: item.product,
                store_id: request.user.store_id,
                status: "active",
                current_quantity: { $gt: 0 },
              });

              const totalAvailable = batches.reduce(
                (sum, batch) => sum + batch.current_quantity,
                0
              );

              // For updates, we need to consider the existing quantity
              const existingItem = existingSale.sale_items.find(
                (si) => si.product_id.toString() === item.product
              );

              const netQuantityChange = existingItem
                ? item.quantity - existingItem.quantity
                : item.quantity;

              if (netQuantityChange > 0 && netQuantityChange > totalAvailable) {
                throw new AppError(
                  `Insufficient stock for product: ${product.prod_name}. Available: ${totalAvailable}, Additional Requested: ${netQuantityChange}`,
                  400
                );
              }
            }
          }
        }
      }

      // Prepare sale items
      const sale_items = sold_items
        ? sold_items.map((item) => ({
            product_id: item.product,
            quantity: item.quantity,
            sale_price: item.sale_price,
            discount_amount: item.discount_amount || 0,
          }))
        : existingSale.sale_items;

      // Check for changes that would require updating customer account
      const isCustomerChanged =
        customer && customer !== existingSale.customer?.toString();
      const isPaymentTypeChanged =
        payment_type?.type !== existingSale.payment_type?.type;

      // Convert both values to numbers for accurate comparison
      const isAmountChanged =
        data.grand_total !== undefined &&
        Number(data.grand_total) !== Number(existingSale.grand_total);

      const isSaleTypeChanged = sale_type !== existingSale.sale_type;

      // Handle customer account updates
      let customerAccountDetails = existingSale.customer_account_details;

      if (isCustomerChanged) {
        // If customer changed, we need to:
        // 1. Reverse the transaction for the old customer
        if (existingSale.customer && existingSale.customer_account_details) {
          const prevCustomer = await Customer.findById(existingSale.customer);

          if (prevCustomer && existingSale.payment_type.type === "credit") {
            // Reverse the previous credit transaction by updating usedAmount
            const reversalAmount =
              existingSale.sale_type === "returned"
                ? existingSale.grand_total // If it was a return, add back to usedAmount
                : -existingSale.grand_total; // If it was a sale, subtract from usedAmount

            // Calculate new usedAmount ensuring it doesn't go negative
            const newUsedAmount = Math.max(
              0,
              (prevCustomer.account.usedAmount || 0) + reversalAmount
            );

            await Customer.findByIdAndUpdate(
              existingSale.customer,
              {
                $set: {
                  "account.usedAmount": newUsedAmount,
                },
              },
              { session }
            );

            // Delete the previous credit transaction
            if (existingSale.customer_account_details.transaction_id) {
              await CustomerCreditTransactionModel.findByIdAndDelete(
                existingSale.customer_account_details.transaction_id,
                { session }
              );
            }
          }
        }

        // 2. Create a new transaction for the new customer
        customerAccountDetails = await this.validateCustomerAccount(
          customer,
          data.grand_total || existingSale.grand_total,
          sale_type,
          session,
          request.user._id,
          request.user.store_id,
          payment_type || existingSale.payment_type,
          request,
          existingSale._id,
          existingSale.date
        );
      } else if (isPaymentTypeChanged || isAmountChanged || isSaleTypeChanged) {
        // If same customer but other details changed
        const newGrandTotal =
          data.grand_total !== undefined
            ? data.grand_total
            : existingSale.grand_total;

        // Direct update of transaction amount to ensure it gets updated
        if (
          existingSale.customer_account_details?.transaction_id &&
          isAmountChanged
        ) {
          const transactionAmount =
            sale_type === "returned"
              ? -Number(newGrandTotal)
              : Number(newGrandTotal);

          await CustomerCreditTransactionModel.findByIdAndUpdate(
            existingSale.customer_account_details.transaction_id,
            { $set: { amount: transactionAmount } },
            { session }
          );
        }

        // Proceed with normal transaction update
        customerAccountDetails = await this.updateCustomerTransaction(
          existingSale,
          newGrandTotal,
          sale_type,
          session,
          request.user._id,
          request.user.store_id,
          payment_type || existingSale.payment_type,
          request,
          existingSale.customer
        );

        // Final verification to ensure amount updated
        if (
          customerAccountDetails?.transaction_id &&
          isAmountChanged &&
          data.grand_total !== undefined
        ) {
          const checkTransaction =
            await CustomerCreditTransactionModel.findById(
              customerAccountDetails.transaction_id
            ).session(session);

          // If amount is still not updated correctly, force update one more time
          if (
            checkTransaction &&
            Math.abs(Number(checkTransaction.amount)) !==
              Number(data.grand_total)
          ) {
            const finalAmount =
              sale_type === "returned"
                ? -Number(data.grand_total)
                : Number(data.grand_total);

            await CustomerCreditTransactionModel.findByIdAndUpdate(
              customerAccountDetails.transaction_id,
              { $set: { amount: finalAmount } },
              { session }
            );
          }
        }
      }

      // Prepare update data
      const updateData = {
        ...data,
        customer: customer
          ? new mongoose.Types.ObjectId(customer)
          : existingSale.customer,
        sale_items,
        sale_type,
        customer_account_details: customerAccountDetails,
        payment_type: payment_type
          ? this.modifyPaymentType(payment_type)
          : existingSale.payment_type,
      };

      // Update inventory if items or sale type changed
      if (itemsChanged || isSaleTypeChanged) {
        // First reverse previous inventory changes
        await this.reverseInventoryChanges(existingSale, session);

        // Update sale document with new data
        const updatedSale = await SaleModel.findByIdAndUpdate(
          filterQuery.id,
          updateData,
          { new: true, session }
        );

        // Apply new inventory updates
        await this.updateInventory(updatedSale, session);
      } else {
        // Simple update without inventory changes
        await SaleModel.findByIdAndUpdate(filterQuery.id, updateData, {
          session,
        });
      }

      await session.commitTransaction();

      // Return the updated sale
      return await SaleModel.findById(filterQuery.id)
        .populate("customer")
        .populate("store_id")
        .populate({
          path: "sale_items.product_id",
          select: "prod_name prod_code sku images maximum_retail_price",
        })
        .populate("added_by", "name image role");
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(`Sale update failed: ${error.message}`, 500);
    } finally {
      session.endSession();
    }
  }
}

export default new SaleService();
