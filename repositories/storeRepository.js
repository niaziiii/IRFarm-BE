import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import AbstractRepository from "./abstractRepository.js";

class StoreRepository extends AbstractRepository {
  constructor() {
    super(Store);
  }

  async aggregate(pipeline) {
    return await this.model.aggregate(pipeline);
  }

  async findAllProductsForSuperAdmin(filterQuery = {}) {
    const {
      type,
      status = "all",
      company,
      sort_by_quantity: { minimum: minQuantity, maximum: maxQuantity } = {},
      category,
      sort_by_mrp: { minimum: minMrp, maximum: maxMrp } = {},
      expire_date: { from: expireFrom, to: expireTo } = {},
    } = filterQuery;

    const matchConditions = {};
    if (status != "all") {
      matchConditions["product_details.status"] = status;
    }
    if (type) matchConditions["product_details.type"] = type;

    if (company)
      matchConditions["product_details.company"] =
        mongoose.Types.ObjectId(company);
    if (category)
      matchConditions["product_details.category"] =
        mongoose.Types.ObjectId(category);

    if (expireFrom && expireTo) {
      matchConditions["product_details.expire_date"] = {
        $gte: new Date(expireFrom),
        $lte: new Date(expireTo),
      };
    }

    if (minMrp || maxMrp) {
      matchConditions["product_details.maximum_retail_price"] = {
        ...(minMrp ? { $gte: parseFloat(minMrp) } : {}),
        ...(maxMrp ? { $lte: parseFloat(maxMrp) } : {}),
      };
    }

    if (minQuantity || maxQuantity) {
      matchConditions["products.quantity"] = {
        ...(minQuantity ? { $gte: parseInt(minQuantity) } : {}),
        ...(maxQuantity ? { $lte: parseInt(maxQuantity) } : {}),
      };
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
          from: "companies",
          localField: "product_details.company",
          foreignField: "_id",
          as: "company_details",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                image: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$company_details",
          preserveNullAndEmptyArrays: true,
        },
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
                name: 1,
                image: 1,
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
        $lookup: {
          from: "units",
          localField: "product_details.unit_profile.unit",
          foreignField: "_id",
          as: "unit_details",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$unit_details",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "product_details.created_by",
          foreignField: "_id",
          as: "created_by_details",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                image: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$created_by_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: matchConditions },
      {
        $project: {
          store_id: "$_id",
          store_name: "$name",
          city: "$address.city",
          _id: "$product_details._id",
          prod_name: "$product_details.prod_name",
          status: "$product_details.status",
          prod_code: "$product_details.prod_code",
          minimum_sale_price: "$product_details.minimum_sale_price",
          actual_retail_price: "$product_details.actual_retail_price",
          // margin_in_percentage: "$product_details.margin_in_percentage",
          // profit_calculate_in_rupees:
          //   "$product_details.profit_calculate_in_rupees",
          profit: {
            retail_price: {
              percentage: "$product_details.profit.retail_price.percentage",
              rupees: "$product_details.profit.retail_price.rupees",
            },
            minimum_retail_price: {
              percentage:
                "$product_details.profit.minimum_retail_price.percentage",
              rupees: "$product_details.profit.minimum_retail_price.rupees",
            },
            maximum_retail_price: {
              percentage:
                "$product_details.profit.maximum_retail_price.percentage",
              rupees: "$product_details.profit.maximum_retail_price.rupees",
            },
          },
          sku: "$product_details.sku",
          batch_code: "$product_details.batch_code",
          expire_date: "$product_details.expire_date",
          manufactured_date: "$product_details.manufactured_date",
          whole_sale_price: "$product_details.whole_sale_price",
          minimum_sale_price: "$product_details.minimum_sale_price",
          purchase_price: "$product_details.purchase_price",
          maximum_retail_price: "$product_details.maximum_retail_price",
          minimum_stock_alert: "$product_details.minimum_stock_alert",
          images: "$product_details.images",
          prod_description: "$product_details.prod_description",
          unit_profile: {
            _id: "$unit_details._id",
            name: "$unit_details.name",
            value: "$product_details.unit_profile.value",
          },
          type: "$product_details.type",
          quantity: "$products.quantity",
          company: {
            _id: "$company_details._id",
            name: "$company_details.name",
          },
          category: {
            _id: "$category_details._id",
            name: "$category_details.name",
          },
          created_by: {
            _id: "$created_by_details._id",
            name: "$created_by_details.name",
          },
        },
      },
    ]);
    return data;
  }

  async findProductsFromStore(query, filterQuery = {}) {
    const {
      type,
      status = "all",
      company,
      sort_by_quantity: { minimum: minQuantity, maximum: maxQuantity } = {},
      category,
      sort_by_mrp: { minimum: minMrp, maximum: maxMrp } = {},
      expire_date: { from: expireFrom, to: expireTo } = {},
    } = filterQuery;

    const matchConditions = {};
    if (status !== "all") {
      matchConditions["product_details.status"] = status;
    }
    if (type) matchConditions["product_details.type"] = type;
    if (company)
      matchConditions["product_details.company"] =
        mongoose.Types.ObjectId(company);
    if (category)
      matchConditions["product_details.category"] =
        mongoose.Types.ObjectId(category);

    if (expireFrom && expireTo) {
      matchConditions["product_details.expire_date"] = {
        $gte: new Date(expireFrom),
        $lte: new Date(expireTo),
      };
    }

    if (minMrp || maxMrp) {
      matchConditions["product_details.maximum_retail_price"] = {
        ...(minMrp ? { $gte: parseFloat(minMrp) } : {}),
        ...(maxMrp ? { $lte: parseFloat(maxMrp) } : {}),
      };
    }

    if (minQuantity || maxQuantity) {
      matchConditions["products.quantity"] = {
        ...(minQuantity ? { $gte: parseInt(minQuantity) } : {}),
        ...(maxQuantity ? { $lte: parseInt(maxQuantity) } : {}),
      };
    }

    const data = await Store.aggregate([
      {
        $match: query,
      },
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
          from: "batchinventories",
          let: {
            productId: "$product_details._id",
            storeId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product_id", "$$productId"] },
                    { $eq: ["$store_id", "$$storeId"] },
                    { $eq: ["$status", "active"] },
                    { $gt: ["$current_quantity", 0] },
                  ],
                },
              },
            },
            {
              $project: {
                batch_number: 1,
                current_quantity: 1,
                purchase_price: 1,
                expiry_date: 1,
                manufactured_date: 1,
                status: 1,
              },
            },
          ],
          as: "batches",
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "product_details.company",
          foreignField: "_id",
          as: "company_details",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                image: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$company_details",
          preserveNullAndEmptyArrays: true,
        },
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
                name: 1,
                image: 1,
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
        $lookup: {
          from: "units",
          localField: "product_details.unit_profile.unit",
          foreignField: "_id",
          as: "unit_details",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$unit_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "product_details.created_by",
          foreignField: "_id",
          as: "created_by_details",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                image: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$created_by_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: matchConditions },
      {
        $project: {
          _id: "$product_details._id",
          prod_name: "$product_details.prod_name",
          prod_code: "$product_details.prod_code",
          status: "$product_details.status",
          sku: "$product_details.sku",
          expire_date: "$product_details.expire_date",
          manufactured_date: "$product_details.manufactured_date",
          maximum_retail_price: "$product_details.maximum_retail_price",
          actual_retail_price: "$product_details.actual_retail_price",
          margin_in_percentage: "$product_details.margin_in_percentage",
          whole_sale_price: "$product_details.whole_sale_price",
          purchase_price: "$product_details.purchase_price",
          minimum_stock_alert: "$product_details.minimum_stock_alert",
          images: "$product_details.images",
          prod_description: "$product_details.prod_description",
          unit_profile: {
            _id: "$unit_details._id",
            name: "$unit_details.name",
            value: "$product_details.unit_profile.value",
          },
          type: "$product_details.type",
          store_quantity: "$products.quantity",
          total_batch_quantity: {
            $sum: "$batches.current_quantity",
          },
          batches: 1,
          company: {
            _id: "$company_details._id",
            name: "$company_details.name",
            image: "$company_details.image",
          },
          category: {
            _id: "$category_details._id",
            name: "$category_details.name",
            image: "$category_details.image",
          },
          created_by: {
            _id: "$created_by_details._id",
            name: "$created_by_details.name",
            image: "$created_by_details.image",
            role: "$created_by_details.role",
          },
        },
      },
      {
        $sort: {
          prod_name: 1, // Default sorting by product name
        },
      },
    ]);

    return data;
  }

  async findAvailableStores() {
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
          city: 1,
          image: 1,
        },
      },
    ]);

    return availableStores;
  }

  async findStoresWithManagers({ sortParams = {} }) {
    const result = await Store.aggregate([
      {
        $lookup: {
          from: "users",
          let: { store_id: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$store_id", "$$store_id"] } } },
            { $match: { role: "manager" } },
          ],
          as: "managers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "created_by",
          foreignField: "_id",
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
          managers: 0,
          creator: 0,
          products: 0,
          "manager.password": 0,
          "manager.city": 0,
          "manager.cnic": 0,
          "manager.contact_no": 0,
          "manager.province": 0,
          "manager.country": 0,
          "manager.address": 0,
          "manager.store_id": 0,
          "created_by.password": 0,
        },
      },
      {
        $sort: sortParams,
      },
    ]);

    return result;
  }

  async storeProductStats(query) {
    const storeProducts = await Store.aggregate([
      { $match: query },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product_id",
          foreignField: "_id",
          as: "product_details",
          pipeline: [
            {
              $project: {
                _id: 1,
                purchase_price: 1,
                maximum_retail_price: 1,
                minimum_sale_price: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$product_details",
      },
    ]);
    return storeProducts;
  }
}

export default new StoreRepository();
