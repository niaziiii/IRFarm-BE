import mongoose from "mongoose";
import AppError from "../utils/apiError.js";
import {
  InventoryTransactionModel,
  BatchInventoryModel,
} from "../models/batchInventoryModel.js";

class BatchInventoryRepository {
  async create(data) {
    return await BatchInventoryModel.create(data);
  }

  async createTransaction(data) {
    return await InventoryTransactionModel.create(data);
  }

  async findBatchById(id) {
    return await BatchInventoryModel.findById(id);
  }

  async findBatchesForProduct(productId, storeId = null) {
    const query = {
      product_id: new mongoose.Types.ObjectId(productId),
    };

    if (storeId) {
      query.store_id = new mongoose.Types.ObjectId(storeId);
    }

    return await BatchInventoryModel.aggregate([
      {
        $match: query,
      },
      {
        $sort: { expiry_date: 1 },
      },
      {
        $group: {
          _id: "$store_id",
          total_quantity: { $sum: "$current_quantity" },
          active_batches: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "active"] },
                    { $gt: ["$current_quantity", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          batches: {
            $push: {
              _id: "$_id",
              batch_number: "$batch_number",
              current_quantity: "$current_quantity",
              purchase_price: "$purchase_price",
              expiry_date: "$expiry_date",
              manufactured_date: "$manufactured_date",
              status: "$status",
            },
          },
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $unwind: "$store",
      },
      {
        $project: {
          store_name: "$store.name",
          total_quantity: 1,
          active_batches: 1,
          batches: 1,
        },
      },
    ]);
  }

  async updateBatchQuantity(batchId, quantity, type, userId, referenceData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const batch = await BatchInventoryModel.findById(batchId).session(
        session
      );
      if (!batch) {
        throw new AppError("Batch not found", 404);
      }

      const newQuantity =
        type === "reduce"
          ? batch.current_quantity - quantity
          : batch.current_quantity + quantity;

      if (newQuantity < 0) {
        throw new AppError(
          `Insufficient quantity in batch ${batch.batch_number}`,
          400
        );
      }

      // Update batch quantity
      const updatedBatch = await BatchInventoryModel.findByIdAndUpdate(
        batchId,
        {
          $set: {
            current_quantity: newQuantity,
            status: newQuantity === 0 ? "depleted" : "active",
          },
        },
        { new: true, session }
      );

      // Create transaction record
      await InventoryTransactionModel.create(
        [
          {
            batch_inventory_id: batchId,
            transaction_type: referenceData.type,
            quantity: type === "reduce" ? -quantity : quantity,
            reference_id: referenceData.referenceId,
            reference_model: referenceData.referenceModel,
            performed_by: userId,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return updatedBatch;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getExpiringBatches(storeId, daysThreshold = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return await BatchInventoryModel.aggregate([
      {
        $match: {
          store_id: new mongoose.Types.ObjectId(storeId),
          status: "active",
          current_quantity: { $gt: 0 },
          expiry_date: { $lte: thresholdDate },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $project: {
          product_name: "$product.prod_name",
          product_code: "$product.prod_code",
          batch_number: 1,
          current_quantity: 1,
          expiry_date: 1,
          days_until_expiry: {
            $ceil: {
              $divide: [
                { $subtract: ["$expiry_date", new Date()] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
      {
        $sort: { expiry_date: 1 },
      },
    ]);
  }

  async findBatchesForSale(productId, storeId, quantityNeeded) {
    return await BatchInventoryModel.aggregate([
      {
        $match: {
          product_id: new mongoose.Types.ObjectId(productId),
          store_id: new mongoose.Types.ObjectId(storeId),
          status: "active",
          current_quantity: { $gt: 0 },
        },
      },
      {
        $sort: { expiry_date: 1 }, // FEFO principle
      },
    ]);
  }

  async getBatchTransactions(batchId) {
    return await InventoryTransactionModel.find({ batch_inventory_id: batchId })
      .populate("performed_by", "name")
      .sort({ createdAt: -1 });
  }

  async deleteManyByProduct(productId) {
    return await BatchInventoryModel.deleteMany({
      product_id: new mongoose.Types.ObjectId(productId),
    });
  }
}

export default new BatchInventoryRepository();
