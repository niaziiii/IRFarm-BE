import mongoose from "mongoose";
import AppError from "./apiError.js";

export const getStatusCounts = async (Req, Model, type) => {
  try {
    const user = Req.user;
    let counts;

    if (user.role == "super_admin") {
      counts = await Model.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
    } else {
      const store_id = user.store_id;

      // For other models that have store_id
      counts = await Model.aggregate([
        {
          $match: { store_id: store_id },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
    }

    // Initialize result
    const result = {
      active: 0,
      inactive: 0,
      total: 0,
    };

    // Fill in the counts
    counts.forEach((item) => {
      if (item._id) {
        result[item._id] = item.count;
        result.total += item.count;
      }
    });

    return result;
  } catch (error) {
    console.error("Error in getStatusCounts:", error);
    throw new AppError(error.message || "Error getting counts");
  }
};

export const getSalePurchaseStatusCounts = async (Req, Model, type) => {
  try {
    const user = Req.user;
    let counts;
    const statusField = type === "sale" ? "sale_type" : "purchased_type";

    if (user.role === "super_admin") {
      counts = await Model.aggregate([
        {
          $group: {
            _id: `$${statusField}`,
            count: { $sum: 1 },
          },
        },
      ]);
    } else {
      const store_id = user.store_id;

      counts = await Model.aggregate([
        {
          $match: { store_id: store_id },
        },
        {
          $group: {
            _id: `$${statusField}`,
            count: { $sum: 1 },
          },
        },
      ]);
    }

    // Initialize result based on type
    const result = {
      sale: 0,
      returned: 0,
      total: 0,
    };

    // For purchase type, rename 'sale' to 'purchased'
    if (type === "purchase") {
      delete result.sale;
      result.purchased = 0;
    }

    // Fill in the counts
    counts.forEach((item) => {
      if (item._id) {
        result[item._id] = item.count;
        result.total += item.count;
      }
    });

    return result;
  } catch (error) {
    console.error("Error in getOrderStatusCounts:", error);
    throw new AppError(error.message || "Error getting counts");
  }
};
