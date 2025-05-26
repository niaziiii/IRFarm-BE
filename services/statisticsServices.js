import Product from "../models/productModel.js";
import Purchase from "../models/purchaseModel.js";
import Sale from "../models/saleModel.js";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";
import AppError from "../utils/apiError.js";
import mongoose from "mongoose";
import { BatchInventoryModel } from "../models/batchInventoryModel.js";

class StatisticsService {
  // Helper function to calculate growth
  calculateGrowth(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  async getDashboardStats(req) {
    const { _id, store_id, role } = req.user;
    const currentDate = new Date();

    // Current month range
    const startOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Previous month range
    const startOfPrevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const endOfPrevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );

    let result = {};

    if (role === "super_admin") {
      // For super admin, get stats across all stores
      const [
        totalStores,
        currentUsers,
        previousUsers,
        currentProducts,
        previousProducts,
        currentPurchases,
        previousPurchases,
        currentSales,
        previousSales,
      ] = await Promise.all([
        Store.countDocuments(),
        User.countDocuments({
          role: { $ne: "super_admin" },
          createdAt: { $lte: endOfCurrentMonth },
        }),
        User.countDocuments({
          role: { $ne: "super_admin" },
          createdAt: { $lte: endOfPrevMonth },
        }),
        Product.countDocuments({ createdAt: { $lte: endOfCurrentMonth } }),
        Product.countDocuments({ createdAt: { $lte: endOfPrevMonth } }),
        Purchase.countDocuments({
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        }),
        Purchase.countDocuments({
          date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
        }),
        Sale.countDocuments({
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        }),
        Sale.countDocuments({
          date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
        }),
      ]);

      result = {
        stores: {
          total: totalStores,
          // Add growth metrics if you track store creation dates
        },
        users: {
          total: currentUsers,
          growth: this.calculateGrowth(currentUsers, previousUsers),
          monthly: {
            current: currentUsers - previousUsers,
            previous: previousUsers,
          },
        },
        products: {
          total: currentProducts,
          growth: this.calculateGrowth(currentProducts, previousProducts),
          monthly: {
            current: currentProducts - previousProducts,
            previous: previousProducts,
          },
        },
        purchases: {
          total: currentPurchases,
          growth: this.calculateGrowth(currentPurchases, previousPurchases),
          monthly: {
            current: currentPurchases,
            previous: previousPurchases,
          },
        },
        sales: {
          total: currentSales,
          growth: this.calculateGrowth(currentSales, previousSales),
          monthly: {
            current: currentSales,
            previous: previousSales,
          },
        },
      };
    } else {
      // For store-specific users, get stats for their store only
      const [
        currentUsers,
        previousUsers,
        currentProducts,
        previousProducts,
        currentPurchases,
        previousPurchases,
        currentSales,
        previousSales,
      ] = await Promise.all([
        User.countDocuments({
          store_id,
          createdAt: { $lte: endOfCurrentMonth },
        }),
        User.countDocuments({
          store_id,
          createdAt: { $lte: endOfPrevMonth },
        }),
        // Get products for specific store
        Product.countDocuments({
          store_id,
          createdAt: { $lte: endOfCurrentMonth },
        }),
        Product.countDocuments({
          store_id,
          createdAt: { $lte: endOfPrevMonth },
        }),
        Purchase.countDocuments({
          store_id,
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        }),
        Purchase.countDocuments({
          store_id,
          date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
        }),
        Sale.countDocuments({
          store_id,
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
        }),
        Sale.countDocuments({
          store_id,
          date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
        }),
      ]);

      result = {
        users: {
          total: currentUsers,
          growth: this.calculateGrowth(currentUsers, previousUsers),
          monthly: {
            current: currentUsers - previousUsers,
            previous: previousUsers,
          },
        },
        products: {
          total: currentProducts,
          growth: this.calculateGrowth(currentProducts, previousProducts),
          monthly: {
            current: currentProducts - previousProducts,
            previous: previousProducts,
          },
        },
        purchases: {
          total: currentPurchases,
          growth: this.calculateGrowth(currentPurchases, previousPurchases),
          monthly: {
            current: currentPurchases,
            previous: previousPurchases,
          },
        },
        sales: {
          total: currentSales,
          growth: this.calculateGrowth(currentSales, previousSales),
          monthly: {
            current: currentSales,
            previous: previousSales,
          },
        },
      };
    }

    return result;
  }

  async getFinancialStats(req) {
    const { store_id, role } = req.user;
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    let matchStage =
      role === "super_admin"
        ? {}
        : { store_id: new mongoose.Types.ObjectId(store_id) };

    const [purchaseStats, salesStats] = await Promise.all([
      Purchase.aggregate([
        {
          $match: {
            ...matchStage,
            date: { $gte: startOfMonth },
            order_status: "received",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$grand_total" },
            averageOrderValue: { $avg: "$grand_total" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
      Sale.aggregate([
        {
          $match: {
            ...matchStage,
            date: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$grand_total" },
            averageSaleValue: { $avg: "$grand_total" },
            totalSales: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      purchases: purchaseStats[0] || {
        totalAmount: 0,
        averageOrderValue: 0,
        totalOrders: 0,
      },
      sales: salesStats[0] || {
        totalRevenue: 0,
        averageSaleValue: 0,
        totalSales: 0,
      },
    };
  }

  async getInventoryStats(req) {
    const { store_id, role } = req.user;

    // Get last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();

    // Get monthly stats for product counts and types
    const monthlyStats = await Promise.all(
      months.map(async (date) => {
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Build query based on user role
        const query =
          role === "super_admin"
            ? {
                createdAt: {
                  $gte: startOfMonth,
                  $lte: endOfMonth,
                },
              }
            : {
                store_id: new mongoose.Types.ObjectId(store_id),
                createdAt: {
                  $gte: startOfMonth,
                  $lte: endOfMonth,
                },
              };

        // Get product counts for regular and trial products
        const [productStats, batches] = await Promise.all([
          Product.aggregate([
            { $match: query },
            {
              $group: {
                _id: "$type",
                count: { $sum: 1 },
              },
            },
          ]),
          // Get total quantity from batch inventory
          BatchInventoryModel.aggregate([
            {
              $match: {
                ...(role !== "super_admin"
                  ? { store_id: new mongoose.Types.ObjectId(store_id) }
                  : {}),
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
              },
            },
            {
              $group: {
                _id: null,
                totalQuantity: { $sum: "$initial_quantity" },
              },
            },
          ]),
        ]);

        // Process product stats
        const regularProducts =
          productStats.find((p) => p._id === "regular")?.count || 0;
        const trialProducts =
          productStats.find((p) => p._id === "trial")?.count || 0;
        const totalQuantity = batches[0]?.totalQuantity || 0;

        return {
          month: date.toLocaleString("default", { month: "short" }),
          year: date.getFullYear(),
          regularProducts,
          trialProducts,
          totalQuantity,
        };
      })
    );

    // Get current inventory stats
    const currentStatsQuery =
      role === "super_admin"
        ? {}
        : { store_id: new mongoose.Types.ObjectId(store_id) };

    const [productCount, totalQuantity, lowStockCount] = await Promise.all([
      // Total products count
      Product.countDocuments(currentStatsQuery),

      // Total quantity across all products
      Product.aggregate([
        { $match: currentStatsQuery },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: "$quantity" },
          },
        },
      ]),

      // Low stock products count
      Product.countDocuments({
        ...currentStatsQuery,
        $expr: {
          $and: [
            { $gt: ["$minimum_stock_alert", 0] },
            { $lte: ["$quantity", "$minimum_stock_alert"] },
          ],
        },
      }),
    ]);

    return {
      current: {
        totalProducts: productCount,
        totalQuantity: totalQuantity[0]?.totalQuantity || 0,
        lowStockProducts: lowStockCount,
      },
      monthly: monthlyStats,
    };
  }
}

export default new StatisticsService();
