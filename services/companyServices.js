import mongoose from "mongoose";
import Company from "../models/companyModel.js";
import Product from "../models/productModel.js";
import SaleModel from "../models/saleModel.js";
import AppError from "../utils/apiError.js";
import { CompanyCreditTransactionModel } from "../models/companyAccountModel.js";
import notificationService from "./notificationService.js";
import uniqueCodeModel from "../models/uniqueCodeModel.js";
import purchaseModel from "../models/purchaseModel.js";
import productModel from "../models/productModel.js";

class CompanyService {
  async createCompany(req, companyData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { user } = req;

      // Determine store_id based on user role
      let store_id;
      if (user.role === "super_admin") {
        // For super_admin, take store_id from request body
        store_id = companyData.store_id;
      } else {
        // For manager and user, use store_id from their session
        store_id = user.store_id;
        if (!store_id) {
          throw new AppError("Store ID not found in user session");
        }
      }

      // Ensure account properties are properly set
      if (companyData.account_details && companyData.account_details.account) {
        companyData.account_details.account = {
          ...companyData.account_details.account,
          usedAmount: 0, // Initialize usedAmount to 0
          balance: companyData.account_details.account.balance || 0, // Initialize balance
        };
      }

      // Create company
      const company = await Company.create(
        [
          {
            ...companyData,
            comp_code: parseInt(companyData.comp_code),
            store_id,
            created_by: user._id,
          },
        ],
        { session }
      );

      await uniqueCodeModel.create({
        code: parseInt(companyData.comp_code),
        type: "company",
        store_id: user.store_id,
      });
      await session.commitTransaction();
      return company[0];
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(`Error creating company: ${error.message}`, 500);
    } finally {
      session.endSession();
    }
  }

  async findCompany(req, filterQuery) {
    const query = this._buildQueryWithStoreAccess(req, { _id: filterQuery.id });
    return await Company.findOne(query);
  }

  async findAllCompanies(request) {
    const { status = "all", order = "asc", balance_status = "" } = request.body;

    // Build base query based on status
    let query = status === "active" || status === "inactive" ? { status } : {};

    // Add store access restrictions
    query = this._buildQueryWithStoreAccess(request, query);

    // Fetch companies
    const companies = await Company.find(query).sort({
      name: order === "asc" ? 1 : -1,
    });

    // Enhance companies with product count and filter by balance status if needed
    let enhancedCompanies = await Promise.all(
      companies.map(async (company) => {
        const productCount = await Product.countDocuments({
          company: company._id,
          store_id: request.user.store_id,
        });

        return {
          ...company.toObject(),
          total_products: productCount,
        };
      })
    );

    // Apply balance_status filter if specified
    if (balance_status === "positive" || balance_status === "negative") {
      enhancedCompanies = enhancedCompanies.filter((company) => {
        // Get account details
        const account = company.account_details?.account;

        // If the company doesn't have account details, skip it
        if (!account || account.type !== "credit") return false;

        // Calculate the net balance as shown in frontend (balance - usedAmount)
        const balance = account.balance || 0;
        const usedAmount = account.usedAmount || 0;
        const netBalance = balance - usedAmount;

        // Filter based on balance status
        if (balance_status === "positive") {
          return netBalance > 0;
        } else {
          // negative
          return netBalance < 0;
        }
      });
    }

    return enhancedCompanies;
  }

  async updateCompany(req, filterQuery, companyData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const query = this._buildQueryWithStoreAccess(req, {
        _id: filterQuery.id,
      });
      const company = await Company.findOne(query);

      if (!company) {
        throw new AppError("Company not found", 404);
      }

      // Get account data if it exists in the update
      const { account } = companyData.account_details || {};

      // Check if credit limit is being updated
      if (
        account?.type === "credit" &&
        account.amount !== undefined &&
        company.account_details?.account?.type === "credit" &&
        account.amount !== company.account_details.account.amount
      ) {
        // Create transaction record for credit limit update
        const creditTransaction = new CompanyCreditTransactionModel({
          company_id: company._id,
          purchase_id: null,
          transaction_type: "balance-updated",
          payment_type: "credit",
          previous_balance: company.account_details.account.amount, // Previous credit limit
          amount: account.amount - company.account_details.account.amount, // Change in credit limit
          remaining_balance: account.amount, // New credit limit
          date: new Date(),
          store_id: req.user.store_id,
          added_by: req.user._id,
          note: `Credit limit updated from ${company.account_details.account.amount} to ${account.amount}`,
        });

        await creditTransaction.save({ session });
      }

      // If changing from credit to cash, verify no outstanding credit used
      if (
        company.account_details?.account?.type === "credit" &&
        account?.type === "cash" &&
        (company.account_details.account.usedAmount || 0) > 0
      ) {
        throw new AppError(
          "Cannot change to cash account while credit is being used",
          400
        );
      }

      // Prepare the account update while preserving usedAmount
      let accountUpdate = {};
      if (account) {
        accountUpdate = {
          type: account.type || company.account_details?.account?.type,
          amount:
            account.amount !== undefined
              ? account.amount
              : company.account_details?.account?.amount,
          usedAmount: company.account_details?.account?.usedAmount || 0, // Preserve existing usedAmount
          balance:
            account.balance !== undefined
              ? account.balance
              : company.account_details?.account?.balance || 0,
        };
      }

      // Update the company
      const updatedCompany = await Company.findByIdAndUpdate(
        filterQuery.id,
        {
          ...companyData,
          ...(Object.keys(accountUpdate).length > 0
            ? { "account_details.account": accountUpdate }
            : {}),
        },
        { new: true, session }
      );

      await session.commitTransaction();
      return updatedCompany;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(`Error updating company: ${error.message}`, 500);
    } finally {
      session.endSession();
    }
  }

  async deleteCompany(req, filterQuery) {
    const query = this._buildQueryWithStoreAccess(req, { _id: filterQuery.id });

    // Check if customer has any transactions
    let transactionCount = 0;

    transactionCount = await purchaseModel.countDocuments({
      supplier: filterQuery.id,
    });

    // If transactions exist, prevent deletion
    if (transactionCount > 0) {
      throw new AppError(
        "This Supplier cannot be deleted because they have transaction history.",
        400
      );
    }

    transactionCount = await productModel.countDocuments({
      company: filterQuery.id,
    });
    // If products exist, prevent deletion
    if (transactionCount > 0) {
      throw new AppError(
        "This Company cannot be deleted because they have products associated with them.",
        400
      );
    }

    return await Company.findOneAndDelete(query);
  }

  async creditHistory(req) {
    const companyId = req.params.id;
    const { startDate, endDate } = req.query;

    // Validate company exists
    const company = await Company.findById(companyId);
    if (!company) {
      throw new AppError("Company not found", 404);
    }

    if (!startDate || !endDate) {
      throw new AppError("Start date and end date are required", 400);
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999); // Set to end of day

    // Get transactions within date range
    const query = {
      company_id: new mongoose.Types.ObjectId(companyId),
      date: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
    };

    // Fetch transactions with purchase details
    const transactions = await CompanyCreditTransactionModel.find(query)
      .sort({ date: -1 })
      .populate({
        path: "purchase_id",
        select:
          "purchase_number order_items grand_total purchased_type payment_type date",
        populate: {
          path: "order_items.product_id",
          select: "prod_name prod_code sku images",
        },
      })
      .populate({
        path: "added_by",
        select: "name",
      });

    // Calculate summary statistics - now including split payments
    let totalCreditUsed = 0;
    let totalCashUsed = 0;

    transactions.forEach((trans) => {
      if (trans.transaction_type === "purchase") {
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

    // Calculate current balance (available credit = limit - used)
    const creditLimit =
      company.account_details.account.type === "credit"
        ? company.account_details.account.amount || 0
        : 0;
    const usedAmount =
      company.account_details.account.type === "credit"
        ? company.account_details.account.usedAmount || 0
        : 0;
    const balance = company.account_details.account.balance || 0;
    const netBalance = balance - usedAmount;

    const summary = {
      balance: balance,
      credit_limit: creditLimit,
      used_amount: usedAmount,
      net_balance: netBalance,
      total_credit_used: totalCreditUsed,
      total_cash_used: totalCashUsed,
      transaction_count: transactions.length,
    };

    return {
      company: {
        name: company.name,
        contact_no: company.contact_no,
      },
      summary,
      transactions,
    };
  }

  async findCompanyProducts(req, filterQuery) {
    if (!filterQuery.company) {
      throw new AppError("Invalid request, company is required");
    }

    // Build query with store access checks
    const query = {
      company: mongoose.Types.ObjectId(filterQuery.company),
      ...this._buildQueryWithStoreAccess(req, {}),
    };

    // Find products directly
    const products = await Product.find(query)
      .populate("category", "name image")
      .populate("created_by", "name image role")
      .sort({ prod_name: 1 });

    return products;
  }

  async companyStats(req, filterQuery) {
    const query = this._buildQueryWithStoreAccess(req, {});

    // Get companies for the specific store
    const companies = await Company.find(query);
    const result = this.calculateCompanyStats(companies);

    // Get company items stats
    const itemsStats = await this.getCompanyItemsStats(
      req,
      filterQuery.company
    );
    result.company_stats.items = itemsStats;

    // Get company sales stats
    const salesStats = await this.getCompanySalesStats(
      req,
      filterQuery.company
    );
    result.company_stats.sales = salesStats;

    return result;
  }

  async getCompanyItemsStats(req, companyId) {
    // Get company IDs for this store
    const storeQuery = this._buildQueryWithStoreAccess(req, {});
    const companies = await Company.find(storeQuery).select("_id");
    const companyIds = companies.map((c) => c._id);

    // Build product query
    const productQuery = {
      company: companyId
        ? mongoose.Types.ObjectId(companyId)
        : { $in: companyIds },
      store_id: req.user.store_id,
    };

    // Get all products for stats calculation
    const products = await Product.find(productQuery);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const total = products.length;
    const lastMonthProducts = products.filter(
      (product) => new Date(product.createdAt) >= lastMonth
    ).length;

    return {
      total,
      last_month: lastMonthProducts,
      percentage: this.calculatePercentage(lastMonthProducts, total),
    };
  }

  async getCompanySalesStats(req, companyId) {
    // Get company IDs for this store
    const storeQuery = this._buildQueryWithStoreAccess(req, {});
    const companies = await Company.find(storeQuery).select("_id");
    const companyIds = companies.map((c) => c._id);

    // Find relevant product IDs
    const productQuery = {
      company: companyId
        ? mongoose.Types.ObjectId(companyId)
        : { $in: companyIds },
      store_id: req.user.store_id,
    };

    const productIds = await Product.find(productQuery).distinct("_id");

    // Find sales containing these products
    const sales = await SaleModel.find({
      store_id: req.user.store_id,
      "sale_items.product_id": { $in: productIds },
    });

    // Calculate sales stats
    let totalSales = 0;
    let lastMonthSales = 0;

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    sales.forEach((sale) => {
      // Only count sale items from our company products
      sale.sale_items.forEach((item) => {
        if (productIds.some((id) => id.equals(item.product_id))) {
          const itemTotal = item.quantity * item.sale_price;
          totalSales += itemTotal;

          if (new Date(sale.createdAt) >= lastMonth) {
            lastMonthSales += itemTotal;
          }
        }
      });
    });

    return {
      total: totalSales,
      last_month: lastMonthSales,
      percentage: this.calculatePercentage(lastMonthSales, totalSales),
    };
  }

  _buildQueryWithStoreAccess(req, baseQuery = {}) {
    const { user } = req;

    if (user.role === "super_admin") {
      return baseQuery;
    }

    // For manager and user, restrict to their store
    return {
      ...baseQuery,
      store_id: mongoose.Types.ObjectId(user.store_id),
    };
  }

  calculatePercentage(part, total) {
    const percentage =
      total === 0 ? "0%" : ((part / total) * 100).toFixed(2) + "%";
    return percentage;
  }

  calculateCompanyStats(companies) {
    if (!companies || companies.length === 0) {
      return {
        company_stats: {
          companies: {
            total: 0,
            percentage: "0%",
            last_month: 0,
          },
        },
      };
    }

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const totalCompanies = companies.length;
    const lastMonthCompanies = companies.filter(
      (company) => new Date(company.createdAt) >= lastMonth
    ).length;

    return {
      company_stats: {
        companies: {
          total: totalCompanies,
          percentage: this.calculatePercentage(
            lastMonthCompanies,
            totalCompanies
          ),
          last_month: lastMonthCompanies,
        },
      },
    };
  }

  async processCompanyPayment(request) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id, balance, type, note, payment_type, image } = request.body;

      // Validate inputs
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Valid company ID is required", 400);
      }

      if (!balance || typeof balance !== "number" || balance <= 0) {
        throw new AppError("Balance must be a positive number", 400);
      }

      if (type !== "add" && type !== "exclude") {
        throw new AppError("Type must be either 'add' or 'exclude'", 400);
      }

      // Find the company
      const company = await Company.findById(id);
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      // Verify the company has a credit account
      if (company.account_details.account.type !== "credit") {
        throw new AppError(
          "This operation is only valid for credit accounts",
          400
        );
      }

      // Get current values
      const currentUsedAmount = company.account_details.account.usedAmount || 0;
      const currentBalance = company.account_details.account.balance || 0;
      const creditLimit = company.account_details.account.amount || 0;

      // Calculate net balance (positive means business has credit with supplier)
      const netBalance = currentBalance - currentUsedAmount;

      let newUsedAmount = currentUsedAmount;
      let newBalance = currentBalance;
      let transactionNote = "";
      let amountDeductedFromDebt = 0;

      if (type === "add") {
        // Business is making a payment to the supplier
        if (currentUsedAmount > 0) {
          // Business has debt to supplier, so first reduce the debt
          amountDeductedFromDebt = Math.min(balance, currentUsedAmount);
          newUsedAmount = currentUsedAmount - amountDeductedFromDebt;

          // If there's remaining balance after clearing debt, add it to balance
          if (balance > amountDeductedFromDebt) {
            const remainingAmount = balance - amountDeductedFromDebt;
            newBalance = currentBalance + remainingAmount;
            transactionNote = `Payment made: ${balance}. Reduced debt by ${amountDeductedFromDebt} and added ${remainingAmount} to balance. New debt: ${newUsedAmount}, New balance: ${newBalance}`;
          } else {
            // All payment went to debt reduction
            transactionNote = `Payment made: ${balance}. Reduced debt by ${amountDeductedFromDebt}. Remaining debt: ${newUsedAmount}`;
          }
        } else {
          // No debt, just add to balance
          newBalance = currentBalance + balance;
          transactionNote = `Payment made: ${balance} added to account balance. New balance: ${newBalance}`;
        }
      } else {
        // type === "exclude" - Business is using credit/increasing debt with supplier
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

            transactionNote = `Credit used: ${balance}. Used ${amountFromBalance} from available balance and added ${remainingToCredit} to credit used.`;
          } else {
            transactionNote = `Credit used: ${balance}. Fully deducted from available balance.`;
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

          transactionNote = `Credit used: ${balance} added to credit used. Total credit used: ${newUsedAmount}`;
        }
      }

      // Calculate new net balance
      const newNetBalance = newBalance - newUsedAmount;

      // Create transaction record
      const paymentTransaction = new CompanyCreditTransactionModel({
        company_id: company._id,
        transaction_type:
          type === "add" ? "Balance-Added" : "Balance-Excluding",
        payment_type: payment_type, // Payments are typically in cash
        previous_balance: netBalance, // Current net balance
        amount: type === "add" ? balance : -balance, // Positive for adding balance, negative for excluding
        remaining_balance: newNetBalance, // New net balance after transaction
        date: new Date(),
        store_id: request.user.store_id,
        added_by: request.user._id,
        note: transactionNote + " User note: " + note,
        slip: image,
      });

      await paymentTransaction.save({ session });

      const updatedCompany = await Company.findByIdAndUpdate(
        id,
        {
          $set: {
            "account_details.account.usedAmount": newUsedAmount,
            "account_details.account.balance": newBalance,
          },
        },
        { session, new: true }
      );

      await session.commitTransaction();

      return {
        company: updatedCompany,
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

export default new CompanyService();
