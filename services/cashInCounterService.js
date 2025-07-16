import userModel from "../models/userModel.js";
import StoreModel from "../models/storeModel.js";
import AppError from "../utils/apiError.js";
import notificationService from "./notificationService.js";
import CashInCounterModel, {
  StoreCashBalanceModel,
} from "../models/CashInCounterModel.js";
import mongoose from "mongoose";

class CashInCounterService {
  async createTransaction(request) {
    const { amount, type, description, store_id, transaction_type } =
      request.body;
    const user = request.user;

    // Validate user permissions
    if (type === "deduct" && user.role === "user") {
      throw new AppError("You don't have permission to deduct cash", 403);
    }

    // Determine the store_id based on user role
    let storeId = store_id;

    if (user.role !== "super_admin") {
      // For managers and users, they can only add/deduct from their own store
      storeId = user.store_id;
    } else if (!storeId) {
      // Super admin must specify a store_id
      throw new AppError("store_id is required for super_admin", 400);
    }

    // Verify that the store exists
    const storeExists = await StoreModel.findById(storeId); // Uppercase here too

    if (!storeExists) {
      throw new AppError("Store not found", 404);
    }

    // Create the transaction
    const transaction = await this.createTransactionSystemGenerated({
      store_id: storeId,
      amount: {
        cash: transaction_type === "cash" ? amount : 0,
        credit: transaction_type === "credit" ? amount : 0,
      },
      type,
      description: `Transaction made by System Administrator :  ${description}`,
      created_by: user._id,
      is_system_generated: false,
    });

    // Send notifications to relevant users
    await this.notifyUsers(transaction, user);

    return transaction;
  }

  async getTransactionsByStore(request) {
    const user = request.user;
    const { store_id } = request.params;
    const { startDate, endDate, type } = request.query;

    // Validate permissions
    if (user.role !== "super_admin" && store_id !== user.store_id.toString()) {
      throw new AppError(
        "You don't have permission to view this store's transactions",
        403
      );
    }

    // Build filter object with store_id
    let filter = { store_id: mongoose.Types.ObjectId(store_id) };

    // Add date filters if provided
    if (startDate) {
      try {
        const parsedStartDate = new Date(startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          filter.createdAt = { $gte: parsedStartDate };
        }
      } catch (error) {
        console.error("Invalid start date format:", error);
      }
    }

    if (endDate) {
      try {
        const parsedEndDate = new Date(endDate);
        if (!isNaN(parsedEndDate.getTime())) {
          parsedEndDate.setHours(23, 59, 59, 999);
          filter.createdAt = {
            ...(filter.createdAt || {}),
            $lte: parsedEndDate,
          };
        }
      } catch (error) {
        console.error("Invalid end date format:", error);
      }
    }

    // Add transaction type filter if provided
    if (type && ["add", "deduct"].includes(type)) {
      filter.type = type;
    }

    // Get transactions for the store with filters
    const transactions = await CashInCounterModel.find(filter).sort({
      createdAt: -1,
    });

    // Get current store balance
    const storeBalance = await StoreCashBalanceModel.findOne({ store_id });
    const credit = storeBalance ? storeBalance.credit : 0;
    const cash = storeBalance ? storeBalance.cash : 0;

    return {
      credit,
      cash,
      transactions,
    };
  }

  async getAllTransactions(request) {
    const user = request.user;
    const { startDate, endDate, store_id, type } = request.query;

    // Only super_admin can view all transactions
    if (user.role !== "super_admin") {
      throw new AppError(
        "You don't have permission to view all transactions",
        403
      );
    }

    // Create pipeline match conditions
    let matchConditions = {};

    // Add date filters if provided
    if (startDate) {
      try {
        const parsedStartDate = new Date(startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          matchConditions.createdAt = { $gte: parsedStartDate };
        }
      } catch (error) {
        console.error("Invalid start date format:", error);
      }
    }

    if (endDate) {
      try {
        const parsedEndDate = new Date(endDate);
        if (!isNaN(parsedEndDate.getTime())) {
          // Set to end of day
          parsedEndDate.setHours(23, 59, 59, 999);
          matchConditions.createdAt = {
            ...(matchConditions.createdAt || {}),
            $lte: parsedEndDate,
          };
        }
      } catch (error) {
        console.error("Invalid end date format:", error);
      }
    }

    // Add store filter if provided
    if (store_id) {
      try {
        matchConditions.store_id = new mongoose.Types.ObjectId(store_id);
      } catch (error) {
        console.error("Invalid store_id format:", error);
      }
    }

    // Add transaction type filter if provided
    if (type && ["add", "deduct"].includes(type)) {
      matchConditions.type = type;
    }

    // Get all transactions with store info
    const transactions = await CashInCounterModel.aggregate([
      {
        $match: matchConditions,
      },
      {
        $lookup: {
          from: "stores",
          localField: "store_id",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $unwind: {
          path: "$store",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "created_by",
          foreignField: "_id",
          as: "created_by",
        },
      },
      {
        $unwind: {
          path: "$created_by",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          cash: 1,
          credit: 1,
          type: 1,
          description: 1,
          createdAt: 1,
          is_system_generated: 1,
          "store.name": { $ifNull: ["$store.name", "Unknown Store"] },
          "created_by.name": { $ifNull: ["$created_by.name", "Unknown User"] },
          "created_by._id": "$created_by._id",
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    const storeTotals = await StoreCashBalanceModel.aggregate([
      {
        $lookup: {
          from: "stores",
          localField: "store_id",
          foreignField: "_id",
          as: "storeInfo",
        },
      },
      {
        $unwind: {
          path: "$storeInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: "$store_id", // Use the actual store ID as the _id field
          storeName: { $ifNull: ["$storeInfo.name", "Unknown Store"] },
          cash: "$cash",
          credit: "$credit",
        },
      },
    ]);

    return {
      storeTotals,
      transactions,
    };
  }

  async notifyUsers(transaction, user) {
    try {
      // Get store information
      const store = await StoreModel.findById(transaction.store_id);

      // Get manager of the store
      const manager = await userModel.findOne({
        store_id: transaction.store_id,
        role: "manager",
      });

      let notificationTitle =
        transaction.type === "add"
          ? "Cash Added to Counter"
          : "Cash Deducted from Counter";

      let notificationMessage = `${user.name} has ${
        transaction.type === "add" ? "added" : "deducted"
      } ${transaction.amount} PKR ${
        transaction.type === "add" ? "to" : "from"
      } ${store.name}'s cash counter.`;

      // Notify store manager (if transaction wasn't created by them)
      if (manager && manager._id.toString() !== user._id.toString()) {
        await notificationService.createAndSendNotification({
          title: notificationTitle,
          message: notificationMessage,
          recipient: manager._id,
        });
      }

      // If super_admin made the transaction, notify all users of that store
      if (user.role === "super_admin") {
        // Get all users of the store
        const storeUsers = await userModel.find({
          store_id: transaction.store_id,
        });

        // Notify each user
        for (const storeUser of storeUsers) {
          await notificationService.createAndSendNotification({
            title: notificationTitle,
            message: notificationMessage,
            recipient: storeUser._id,
          });
        }
      }
    } catch (error) {
      // Log error but don't fail the transaction
      console.error("Failed to send notifications:", error);
    }
  }

  async createTransactionSystemGenerated({
    store_id,
    amount = { cash: 0, credit: 0, total: 0 },
    type = "add", // "add" or "deduct"
    description,
    created_by,
    is_system_generated = true, // Default to true for system-generated transactions
  }) {
    const { cash = 0, credit = 0, total = 0 } = amount;

    const storeBalance = await StoreCashBalanceModel.findOneAndUpdate(
      { store_id },
      {},
      { upsert: true, new: true }
    );

    if (type === "add") {
      storeBalance.cash += cash;
      storeBalance.credit += credit;
    } else if (type === "deduct") {
      // Validate both balances
      if (cash > 0) {
        if (storeBalance.cash < cash) {
          throw new AppError(
            "Insufficient cash in counter for deduction.",
            400
          );
        }
        storeBalance.cash -= cash;
        storeBalance.current_balance -= cash;
      }

      if (credit > 0) {
        if (storeBalance.credit < credit) {
          throw new AppError("Insufficient credit balance for deduction.", 400);
        }
        storeBalance.credit -= credit;
      }
    } else {
      throw new AppError("Invalid transaction type.", 400);
    }

    await storeBalance.save();

    const transaction = await CashInCounterModel.create({
      store_id,
      cash: cash,
      credit: credit,
      amount: total,
      type,
      description,
      created_by,
      is_system_generated,
    });

    return transaction;
  }
}

export default new CashInCounterService();
