import mongoose from "mongoose";
import customerRepository from "../repositories/customerRepository.js";
import customerModel, {
  CustomerCreditTransactionModel,
} from "../models/customerModel.js";
import AppError from "../utils/apiError.js";

class CustomerService {
  async createCustomer(request) {
    try {
      const { account, ...customerData } = request.body;

      // Create the customer
      const customer = await customerRepository.create({
        created_by: request.user._id,
        store_id: request.user.store_id,
        account: {
          type: account.type,
          amount: account.amount || 0, // Credit limit
          usedAmount: 0,
          balance: account.balance || 0, // Initialize actual balance
        },
        ...customerData,
      });

      return customer;
    } catch (error) {
      throw new AppError(`Error creating customer: ${error.message}`, 500);
    }
  }

  async findCustomer(filterQuery) {
    return await customerRepository.findOneById({ _id: filterQuery.id });
  }

  async findAllCustomers(request) {
    const {
      status = "all",
      order = "asc",
      account = { type: "" },
      balance_status = "",
    } = request.body;

    // Initialize query object
    let query = {};

    // Add status filter if specified
    if (status === "active" || status === "inactive") {
      query.status = status;
    }

    // Add account type filter if specified
    if (account.type === "cash" || account.type === "credit") {
      query["account.type"] = account.type;
    }

    // Determine sort parameters based on order
    const sortParams = { name: order === "asc" ? 1 : -1 };

    // Fetch initial customers before filtering by balance
    let customers;

    if (request.user.role === "super_admin") {
      customers = await customerRepository.find({
        filterQuery: query,
        sortParams: sortParams,
      });
    } else {
      // Combine store_id filter with other filters for non-admin users
      customers = await customerRepository.find({
        filterQuery: {
          store_id: request.user.store_id,
          ...query,
        },
        sortParams: sortParams,
      });
    }

    // Apply balance_status filter if specified
    if (balance_status === "positive" || balance_status === "negative") {
      customers = customers.filter((customer) => {
        // Calculate the net balance as shown in frontend (balance - usedAmount)

        const netBalance =
          (customer.account.balance || 0) - (customer.account.usedAmount || 0);

        // Filter based on balance status
        if (balance_status === "positive") {
          return netBalance > 0;
        } else {
          // negative
          return netBalance < 0;
        }
      });
    }

    return customers;
  }

  async deleteCustomer(filterQuery) {
    try {
      const customerId = filterQuery.id;

      // Check if customer has any transactions
      const transactionCount =
        await CustomerCreditTransactionModel.countDocuments({
          customer_id: customerId,
        });

      // If transactions exist, prevent deletion
      if (transactionCount > 0) {
        throw new AppError(
          "This customer cannot be deleted because they have transaction history. ",
          400
        );
      }

      // No transactions found, proceed with deletion
      return await customerRepository.findOneAndDelete({ _id: customerId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Re-throw our custom error
      }
      throw new AppError(`Error deleting customer: ${error.message}`, 500);
    }
  }

  // Update to creditHistory method in CustomerService class

  async creditHistory(req) {
    const customerId = req.params.id;
    const { startDate, endDate } = req.query;

    // Validate customer exists
    const customer = await customerRepository.findOneById({ _id: customerId });
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    if (!startDate || !endDate) {
      throw new AppError("Start date and end date are required", 400);
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999); // Set to end of day

    // Get transactions within date range
    const query = {
      customer_id: new mongoose.Types.ObjectId(customerId),
      date: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
    };

    // Fetch transactions with sale details - remove customer_id population
    const transactions = await CustomerCreditTransactionModel.find(query)
      .sort({ date: -1 })
      .populate({
        path: "sale_id",
        select:
          "sale_number sale_items grand_total sale_type payment_type date",
        populate: {
          path: "sale_items.product_id",
          select: "prod_name prod_code sku images",
        },
      })
      .populate({
        path: "added_by",
        select: "name",
      });

    // Calculate summary statistics - now handling split payments
    let totalCreditUsed = 0;
    let totalCashUsed = 0;

    transactions.forEach((trans) => {
      if (trans.transaction_type === "sale") {
        if (trans.payment_type === "credit") {
          totalCreditUsed += Math.abs(trans.amount);
        } else if (trans.payment_type === "cash") {
          totalCashUsed += Math.abs(trans.amount);
        } else if (trans.payment_type === "split") {
          // For split payments, add each portion to the appropriate total
          if (trans.credit_amount) {
            totalCreditUsed += Math.abs(trans.credit_amount);
          }
          if (trans.cash_amount) {
            totalCashUsed += Math.abs(trans.cash_amount);
          }
        }
      }
    });

    // Current balance calculation (available credit = limit - used)
    const balance = customer.account.balance ?? 0;

    const summary = {
      balance: balance,
      credit_limit:
        customer.account.type === "credit" ? customer.account.amount : 0,
      used_amount:
        customer.account.type === "credit"
          ? customer.account.usedAmount || 0
          : 0,
      total_credit_used: totalCreditUsed,
      total_cash_used: totalCashUsed,
      transaction_count: transactions.length,
    };

    // Return only summary and transactions, without customer object
    return {
      summary,
      transactions,
    };
  }

  async updateCustomer(filterQuery, request) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const customer = await customerRepository.findOneById({
        _id: filterQuery.id,
      });
      if (!customer) {
        throw new AppError("Customer not found", 404);
      }

      const { account, ...customerData } = request.body;

      // Prevent changing account type if already credit
      if (
        customer.account.type === "credit" &&
        account?.type &&
        account.type !== "credit"
      ) {
        throw new AppError(
          "Cannot change account type once it's set to credit",
          400
        );
      }

      // Prepare account update, maintaining the usedAmount
      let accountUpdate = {};
      if (account) {
        accountUpdate = {
          type: account.type || customer.account.type,
          amount:
            account.amount !== undefined
              ? account.amount
              : customer.account.amount,
          usedAmount: customer.account.usedAmount || 0, // Maintain the existing usedAmount
        };
      }

      // Check if credit limit is being updated
      if (
        customer.account.type === "credit" &&
        account?.amount !== undefined &&
        account.amount !== customer.account.amount
      ) {
        // Create transaction record for balance update
        const creditTransaction = new CustomerCreditTransactionModel({
          customer_id: customer._id,
          sale_id: null,
          transaction_type: "balance-updated",
          previous_balance: customer.account.amount,
          amount: account.amount - customer.account.amount, // Positive for increase, negative for decrease
          remaining_balance: account.amount,
          date: new Date(),
          store_id: request.user.store_id,
          added_by: request.user._id,
          note: `Credit limit updated from ${customer.account.amount} to ${account.amount}`,
        });

        await creditTransaction.save({ session });
      }

      // Update the customer
      const updatedCustomer = await customerRepository.findOneAndUpdate(
        { _id: filterQuery.id },
        {
          ...customerData,
          ...(Object.keys(accountUpdate).length > 0
            ? { account: accountUpdate }
            : {}),
        },
        { session }
      );

      await session.commitTransaction();
      return updatedCustomer;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(`Error updating customer: ${error.message}`, 500);
    } finally {
      session.endSession();
    }
  }

  async processCustomerPayment(request) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id, balance, type, note, payment_type, image } = request.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Valid customer ID is required", 400);
      }

      if (!balance || typeof balance !== "number" || balance <= 0) {
        throw new AppError("Balance must be a positive number", 400);
      }

      if (type !== "add" && type !== "exclude") {
        throw new AppError("Type must be either 'add' or 'exclude'", 400);
      }

      // Find the customer
      const customer = await customerRepository.findOneById({ _id: id });
      if (!customer) {
        throw new AppError("Customer not found", 404);
      }

      // Verify the customer has a credit account
      if (customer.account.type !== "credit") {
        throw new AppError(
          "This operation is only valid for credit accounts",
          400
        );
      }

      // Get current values
      const currentUsedAmount = customer.account.usedAmount || 0;
      const currentBalance = customer.account.balance || 0;
      const creditLimit = customer.account.amount || 0;

      // Calculate net balance (positive means customer has credit with store)
      const netBalance = currentBalance - currentUsedAmount;

      let newUsedAmount = currentUsedAmount;
      let newBalance = currentBalance;
      let transactionNote = "";
      let amountDeductedFromDebt = 0;

      if (type === "add") {
        // Customer is making a payment
        if (currentUsedAmount > 0) {
          // Customer has debt, so first reduce their debt
          amountDeductedFromDebt = Math.min(balance, currentUsedAmount);
          newUsedAmount = currentUsedAmount - amountDeductedFromDebt;

          // If there's remaining balance after clearing debt, add it to balance
          if (balance > amountDeductedFromDebt) {
            const remainingAmount = balance - amountDeductedFromDebt;
            newBalance = currentBalance + remainingAmount;
            transactionNote = `Payment received: ${balance}. Reduced debt by ${amountDeductedFromDebt} and added ${remainingAmount} to balance. New debt: ${newUsedAmount}, New balance: ${newBalance}`;
          } else {
            // All payment went to debt reduction
            transactionNote = `Payment received: ${balance}. Reduced debt by ${amountDeductedFromDebt}. Remaining debt: ${newUsedAmount}`;
          }
        } else {
          // No debt, just add to balance
          newBalance = currentBalance + balance;
          transactionNote = `Payment received: ${balance} added to account balance. New balance: ${newBalance}`;
        }
      } else {
        // type === "exclude" - Adding to customer's debt
        // First check if there's balance that can be used
        if (currentBalance > 0) {
          // Can use some or all of the balance
          const amountFromBalance = Math.min(currentBalance, balance);
          newBalance = currentBalance - amountFromBalance;

          // If more is needed beyond available balance
          if (balance > amountFromBalance) {
            const remainingToCredit = balance - amountFromBalance;
            newUsedAmount = currentUsedAmount + remainingToCredit;

            // Check if this exceeds credit limit
            if (newUsedAmount > creditLimit) {
              throw new AppError(
                `This transaction would exceed the credit limit of ${creditLimit}`,
                400
              );
            }

            transactionNote = `Balance excluded: ${balance}. Used ${amountFromBalance} from available balance and added ${remainingToCredit} to credit used.`;
          } else {
            transactionNote = `Balance excluded: ${balance}. Fully deducted from available balance.`;
          }
        } else {
          // No balance available, add directly to usedAmount
          newUsedAmount = currentUsedAmount + balance;

          // Check if this exceeds credit limit
          if (newUsedAmount > creditLimit) {
            throw new AppError(
              `This transaction would exceed the credit limit of ${creditLimit}`,
              400
            );
          }

          transactionNote = `Balance excluded: ${balance} added to credit used. Total credit used: ${newUsedAmount}`;
        }
      }

      // Append custom note if provided
      if (note && note.trim()) {
        transactionNote = `${transactionNote} User note: ${note.trim()}`;
      }

      // Calculate new net balance
      const newNetBalance = newBalance - newUsedAmount;

      // Create transaction record
      const paymentTransaction = new CustomerCreditTransactionModel({
        customer_id: customer._id,
        transaction_type:
          type === "add" ? "Balance-Added" : "Balance-Excluding",
        payment_type: payment_type, // Payments are typically in cash
        previous_balance: netBalance, // Current net balance
        amount: type === "add" ? balance : -balance, // Positive for adding balance, negative for excluding
        remaining_balance: newNetBalance, // New net balance after transaction
        date: new Date(),
        store_id: request.user.store_id,
        added_by: request.user._id,
        note: transactionNote,
        slip: image,
      });

      await paymentTransaction.save({ session });

      const updatedCustomer = await customerRepository.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            "account.usedAmount": newUsedAmount,
            "account.balance": newBalance,
          },
        },
        { session, new: true }
      );

      await session.commitTransaction();

      return {
        customer: updatedCustomer,
        transaction: paymentTransaction,
        available_credit: creditLimit - newUsedAmount,
        net_balance: newNetBalance,
        debt_reduced:
          amountDeductedFromDebt > 0 ? amountDeductedFromDebt : undefined,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(`Error processing payment: ${error.message}`, 500);
    } finally {
      session.endSession();
    }
  }
}

export default new CustomerService();
