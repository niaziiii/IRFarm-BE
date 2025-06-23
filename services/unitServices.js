import mongoose from "mongoose";
import Unit from "../models/unitModel.js";
import AppError from "../utils/apiError.js";
import productModel from "../models/productModel.js";

class UnitService {
  async createUnit(req, unitData) {
    const { user } = req;

    // Determine store_id based on user role
    let store_id;
    if (user.role === "super_admin") {
      // For super_admin, take store_id from request body
      store_id = unitData.store_id;
    } else {
      // For manager and user, use store_id from their session
      store_id = user.store_id;
      if (!store_id) {
        throw new AppError("Store ID not found in user session");
      }
    }

    return await Unit.create({
      ...unitData,
      store_id,
      created_by: user._id,
    });
  }

  async findUnit(req, filterQuery) {
    const query = this._buildQueryWithStoreAccess(req, { _id: filterQuery.id });
    return await Unit.findOne(query);
  }

  async findAllUnits(req) {
    // Destructure status and order from request body with default values
    const { status = "all", order = "asc" } = req.body;

    // Build base query
    let query = {};

    // Add status filter if specified
    if (status === "active" || status === "inactive") {
      query.status = status;
    }

    // Add store access restrictions
    if (req.user.role !== "super_admin") {
      query.store_id = mongoose.Types.ObjectId(req.user.store_id);
    }

    const units = await Unit.find(query).sort({
      name: order === "asc" ? 1 : -1,
    });

    return units;
  }

  async updateUnit(req, filterQuery, unitData) {
    const query = this._buildQueryWithStoreAccess(req, { _id: filterQuery.id });
    return await Unit.findOneAndUpdate(query, unitData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteUnit(req, filterQuery) {
    const query = this._buildQueryWithStoreAccess(req, { _id: filterQuery.id });

    let transactionCount = await productModel.countDocuments({
      "unit_profile.unit": filterQuery.id,  
    });
    console.log({ transactionCount, qq: filterQuery.id });

    if (transactionCount > 0) {
      throw new AppError(
        "This Unit cannot be deleted because products are associated with them.",
        400
      );
    }

    return await Unit.findOneAndDelete(query);
  }

  _buildQueryWithStoreAccess(req, baseQuery = {}) {
    const { user } = req;

    if (user.role === "super_admin") {
      return baseQuery; // No restrictions for super_admin
    }

    // For manager and user, restrict to their store
    return {
      ...baseQuery,
      store_id: user.store_id,
    };
  }
}

export default new UnitService();
