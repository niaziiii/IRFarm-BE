import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import AppError from "../utils/apiError.js";
import { BatchInventoryModel } from "../models/batchInventoryModel.js";

class StoreService {
  async createStore(req, storeData) {
    return await Store.create({
      ...storeData,
      created_by: req.user._id,
    });
  }

  async findStore(filterQuery) {
    return await Store.findById(filterQuery.id).populate(
      "created_by",
      "name _id image"
    );
  }

  async getStoreProduct(id) {
    if (!id) {
      throw new AppError("Store ID is required", 400);
    }

    // Find all products for the specified store
    const products = await Product.find({ store_id: id })
      .populate("category", "name _id")
      .populate("company", "name _id")
      .populate("created_by", "name _id image role")
      .populate("unit_profile.unit", "name _id");

    // Enhance products with batch information
    const enhancedProducts = await Promise.all(
      products.map(async (product) => {
        const batches = await BatchInventoryModel.find({
          product_id: product._id,
          store_id: id,
          status: "active",
          current_quantity: { $gt: 0 },
        });

        return {
          ...product._doc,
          total_quantity: product.quantity,
          active_batches: batches.length,
          batches: batches,
        };
      })
    );

    return enhancedProducts;
  }

  async findAllStores(request) {
    // Destructure status and order from request body with default values
    const { order = "asc" } = request.body;

    // Determine sort parameters based on order
    const sortParams = { name: order === "asc" ? 1 : -1 };

    let { user } = request;

    if (user.role === "super_admin") {
      // For super admin, get all stores with their managers
      const stores = await Store.aggregate([
        {
          $lookup: {
            from: "users",
            let: { store_id: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$store_id", "$$store_id"] } } },
              { $match: { role: "manager" } },
              // Only select essential fields for manager
              {
                $project: {
                  _id: 1,
                  name: 1,
                  image: 1,
                  email: 1,
                  role: 1,
                  status: 1,
                },
              },
            ],
            as: "managers",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "created_by",
            foreignField: "_id",
            pipeline: [
              // Only select essential fields for created_by
              {
                $project: {
                  _id: 1,
                  name: 1,
                  image: 1,
                  email: 1,
                  role: 1,
                },
              },
            ],
            as: "creator",
          },
        },
        {
          $addFields: {
            manager: { $arrayElemAt: ["$managers", 0] },
            created_by: { $arrayElemAt: ["$creator", 0] },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            image: 1,
            address: 1,
            manager: 1,
            created_by: 1,
            createdAt: 1,
            updatedAt: 1,
            // Don't mix inclusion and exclusion in the same $project
            // So instead of excluding, we just don't include these fields
            // managers: 0,
            // creator: 0,
          },
        },
        {
          $sort: sortParams,
        },
      ]);

      return stores;
    } else {
      // For other users, find just their store
      const userStore = await User.findById(user._id, { store_id: 1 }).populate(
        {
          path: "store_id",
          populate: {
            path: "created_by",
            select: "name _id image email",
          },
        }
      );

      return userStore.store_id;
    }
  }

  async updateStore(filterQuery, storeData) {
    return await Store.findByIdAndUpdate(filterQuery.id, storeData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteStore(filterQuery) {
    return await Store.findByIdAndDelete(filterQuery.id);
  }

  async findProductsFromStore(filterQuery) {
    return await this.getStoreProduct(filterQuery.id);
  }

  async findAvailableStores() {
    // Find stores that don't have any managers assigned
    const availableStores = await Store.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "store_id",
          as: "users",
        },
      },
      {
        $match: {
          users: { $size: 0 },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          city: "$address.city",
          image: 1,
        },
      },
    ]);

    return availableStores;
  }

  calculatePercentage(part, total) {
    const percentage =
      total === 0 ? "0%" : ((part / total) * 100).toFixed(2) + "%";
    return percentage;
  }

  async calculateProductStats(storeId = null) {
    // Build query based on store ID
    const query = storeId ? { store_id: storeId } : {};

    // Get all products matching the query
    const products = await Product.find(query);

    let totalProducts = products.length;
    let totalQuantity = products.reduce((sum, prod) => sum + prod.quantity, 0);
    let totalCostValue = products.reduce(
      (sum, prod) => sum + prod.quantity * prod.purchase_price,
      0
    );

    // Calculate last month's stats
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthProducts = products.filter(
      (p) => new Date(p.createdAt) >= lastMonth
    ).length;
    const lastMonthQuantity = products
      .filter((p) => new Date(p.createdAt) >= lastMonth)
      .reduce((sum, prod) => sum + prod.quantity, 0);
    const lastMonthCostValue = products
      .filter((p) => new Date(p.createdAt) >= lastMonth)
      .reduce((sum, prod) => sum + prod.quantity * prod.purchase_price, 0);

    const productStats = {
      product_stats: {
        products: {
          total: totalProducts,
          percentage: this.calculatePercentage(
            lastMonthProducts,
            totalProducts
          ),
          last_month: lastMonthProducts,
        },
        quantity: {
          total: totalQuantity,
          percentage: this.calculatePercentage(
            lastMonthQuantity,
            totalQuantity
          ),
          last_month: lastMonthQuantity,
        },
        cost_value: {
          total: totalCostValue,
          percentage: this.calculatePercentage(
            lastMonthCostValue,
            totalCostValue
          ),
          last_month: lastMonthCostValue,
        },
      },
    };

    return productStats;
  }

  async storeProductsStats(request) {
    let storeId = null;
    if (request.user.role === "manager") {
      storeId = request.user.store_id;
    }

    const result = await this.calculateProductStats(storeId);
    return result;
  }
}

export default new StoreService();
