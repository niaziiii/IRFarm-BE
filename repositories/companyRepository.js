import mongoose from "mongoose";
import Company from "../models/companyModel.js";
import Store from "../models/storeModel.js";
import AbstractRepository from "./abstractRepository.js";
import productModel from "../models/productModel.js";
import SaleModel from "../models/saleModel.js";

class CompanyRepository extends AbstractRepository {
  constructor() {
    super(Company);
  }
  async findCompanyProducts(query) {
    const { company } = query;
    const matchConditions = {};
    matchConditions["product_details.company"] =
      mongoose.Types.ObjectId(company);

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
          minimum_sale_price: "$product_details.minimum_sale_price",
          margin_in_percentage: "$product_details.margin_in_percentage",
          profit_calculate_in_rupees:
            "$product_details.profit_calculate_in_rupees",
          sku: "$product_details.sku",
          batch_code: "$product_details.batch_code",
          expire_date: "$product_details.expire_date",
          manufactured_date: "$product_details.manufactured_date",
          whole_sale_price: "$product_details.whole_sale_price",
          purchase_price: "$product_details.purchase_price",
          maximum_retail_price: "$product_details.maximum_retail_price",
          minimum_stock_alert: "$product_details.minimum_stock_alert",
          images: "$product_details.images",
          prod_description: "$product_details.prod_description",
          unit_profile: "$product_details.unit_profile",
          type: "$product_details.type",
          quantity: "$products.quantity",
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
    ]);
    return data;
  }

  async findCompaniesWithProductCount({ filterQuery = {}, sortParams = {} }) {
    const companies = await Company.aggregate([
      {
        $match: filterQuery,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "company",
          as: "products",
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
        $addFields: {
          total_products: { $size: "$products" },
        },
      },
      {
        $project: {
          name: 1,
          status: 1,
          registration_no: 1,
          address: 1,
          contact_no: 1,
          email_address: 1,
          website: 1,
          instagram: 1,
          image: 1,
          up_till: 1,
          account_details: 1,
          reference: 1,
          store_id: 1,
          total_products: 1,
          created_by: {
            _id: "$created_by._id",
            name: "$created_by.name",
            image: "$created_by.image",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: sortParams,
      },
    ]);

    return companies;
  }
  async companySalesStats(query) {
    const { store_id, company } = query;

    // Define the start of last month
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(
      startOfCurrentMonth.getFullYear(),
      startOfCurrentMonth.getMonth() - 1,
      1
    );

    const matchQuery = {
      store_id: mongoose.Types.ObjectId(store_id),
    };

    if (company) {
      matchQuery["sale_items.product_id.company"] =
        mongoose.Types.ObjectId(company);
    }

    const aggregation = [
      {
        $lookup: {
          from: "products",
          localField: "sale_items.product_id",
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
        },
      },
      {
        $unwind: "$company_details",
      },
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: "$company_details._id",
          name: { $first: "$company_details.name" },
          image: { $first: "$company_details.image" },
          total_sales: { $sum: "$grand_total" },
          last_month_sales: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", startOfLastMonth] },
                "$grand_total",
                0,
              ],
            },
          },
        },
      },
    ];

    return await SaleModel.aggregate(aggregation);
  }

  async companyItemsStats(query) {
    const { store_id, company } = query;

    // Define the start of last month
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(
      startOfCurrentMonth.getFullYear(),
      startOfCurrentMonth.getMonth() - 1,
      1
    );

    const matchQuery = {
      store_id: mongoose.Types.ObjectId(store_id),
    };

    if (company) {
      matchQuery.company = mongoose.Types.ObjectId(company);
    }

    const aggregation = [
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "company_details",
        },
      },
      {
        $unwind: "$company_details",
      },
      {
        $group: {
          _id: "$company_details._id",
          name: { $first: "$company_details.name" },
          image: { $first: "$company_details.image" },
          total: { $sum: 1 },
          last_month: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", startOfLastMonth] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          company_id: "$_id",
          name: 1,
          image: 1,
          total: 1,
          last_month: 1,
        },
      },
    ];

    return await productModel.aggregate(aggregation);
  }
}

export default new CompanyRepository();
