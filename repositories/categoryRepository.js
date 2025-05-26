import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import Store from "../models/storeModel.js";
import AbstractRepository from "./abstractRepository.js";

class CategoryRepository extends AbstractRepository {
  constructor() {
    super(Category);
  }

  async filteredCategoryList(filterQuery = {}) {
    const {
      status = "all",
      order = "asc",
      sort_by_quantity: { minimum: minQuantity, maximum: maxQuantity } = {},
      sort_by_mrp: { minimum: minMrp, maximum: maxMrp } = {},
      store_id,
    } = filterQuery;

    const matchConditions = {};

    if (status !== "all") {
      matchConditions["category_details.status"] = status;
    }

    // Add store_id to match conditions if provided
    if (store_id) {
      matchConditions["category_details.store_id"] =
        mongoose.Types.ObjectId(store_id);
    }

    const data = await Store.aggregate([
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product_id",
          foreignField: "_id",
          as: "product_details",
        },
      },
      {
        $unwind: "$product_details",
      },
      {
        $lookup: {
          from: "categories",
          localField: "product_details.category",
          foreignField: "_id",
          as: "category_details",
          pipeline: [
            {
              $project: {
                _id: 1,
                status: 1,
                name: 1,
                image: 1,
                store_id: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$category_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: matchConditions,
      },
      {
        $project: {
          quantity: "$products.quantity",
          category_id: "$category_details._id",
          name: "$category_details.name",
          image: "$category_details.image",
          status: "$category_details.status", // Include status
        },
      },
      {
        $group: {
          _id: "$category_id",
          totalQuantity: { $sum: "$quantity" }, // Sum the quantities
          name: { $first: "$name" },
          image: { $first: "$image" },
          status: { $first: "$status" }, // Group on status
        },
      },
      {
        $match: {
          totalQuantity: {
            $gte: minQuantity || 0,
            $lte: maxQuantity || Infinity,
          },
        },
      },
      {
        $sort: {
          name: sortOrder,
        },
      },
      {
        $project: {
          _id: "$_id", // category_id
          totalQuantity: 1,
          name: 1,
          image: 1,
          status: 1, // Project status
        },
      },
    ]);

    return data;
  }
}

export default new CategoryRepository();
