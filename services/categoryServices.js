import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import SaleModel from "../models/saleModel.js";
import AppError from "../utils/apiError.js";
import productModel from "../models/productModel.js";
import { BatchInventoryModel } from "../models/batchInventoryModel.js";

class CategoryService {
  async createCategory(req, categoryData) {
    const { user } = req;

    // Determine store_id based on user role
    let store_id;
    if (user.role === "super_admin") {
      // For super_admin, take store_id from request body
      store_id = categoryData.store_id;
    } else {
      // For manager and user, use store_id from their session
      store_id = user.store_id;
      if (!store_id) {
        throw new AppError("Store ID not found in user session");
      }
    }

    return await Category.create({
      ...categoryData,
      store_id,
      created_by: user._id,
    });
  }

  async findCategory(req, filterQuery) {
    const query = this._buildQueryWithStoreAccess(req, { _id: filterQuery.id });
    return await Category.findOne(query);
  }

  async findAllCategories(req, filterQuery) {
    const { status = "all", order = "asc" } = filterQuery;

    let query = status === "active" || status === "inactive" ? { status } : {};
    query = this._buildQueryWithStoreAccess(req, query);

    const sortOptions = { name: order === "asc" ? 1 : -1 };

    const categories = await Category.find(query, {
      _id: 1,
      name: 1,
      image: 1,
      status: 1,
      store_id: 1,
    }).sort(sortOptions);

    const enhancedCategories = await Promise.all(
      categories.map(async (category) => {
        // Find all products in this category and store
        const products = await Product.find({
          category: category._id,
        }).select("_id");

        const productIds = products.map((p) => p._id);

        // Find all batch inventories for these products
        const batches = await BatchInventoryModel.find({
          product_id: { $in: productIds },
        }).select("purchase_price current_quantity");

        // Calculate total product count and total value from batches
        const totalProduct = products.length;

        const value = batches.reduce((sum, batch) => {
          const price = batch.purchase_price || 0;
          const quantity = batch.current_quantity || 0;
          return sum + price * quantity;
        }, 0);

        return {
          ...category.toObject(),
          totalProduct,
          value,
        };
      })
    );

    return enhancedCategories;
  }

  async updateCategory(req, filterQuery, categoryData) {
    const query = this._buildQueryWithStoreAccess(req, { _id: filterQuery.id });

    return await Category.findOneAndUpdate(
      query,
      { $set: categoryData },
      { new: true, runValidators: true }
    );
  }

  async deleteCategory(req, filterQuery) {
    const query = this._buildQueryWithStoreAccess(req, { _id: filterQuery.id });

    // Check if has any history
    let transactionCount = 0;

    transactionCount = await productModel.countDocuments({
      category: filterQuery.id,
    });
    // If products exist, prevent deletion
    if (transactionCount > 0) {
      throw new AppError(
        "This Category cannot be deleted because they have products associated with them.",
        400
      );
    }
    return await Category.findOneAndDelete(query);
  }

  async filteredCategoryList(req, filterQuery) {
    let { sort_by_quantity } = filterQuery;

    // Add store access to the filter query
    filterQuery = {
      ...filterQuery,
      ...this._buildQueryWithStoreAccess(req, {}),
    };

    if (!sort_by_quantity) {
      return await this.findAllCategories(req, filterQuery);
    }

    // For quantity-based sorting, we need to look at products
    const categories = await Category.find(
      this._buildQueryWithStoreAccess(req, {})
    );

    const result = await Promise.all(
      categories.map(async (category) => {
        // Count products in this category
        const productCount = await Product.countDocuments({
          category: category._id,
          store_id: req.user.store_id,
        });

        // Calculate the total quantity of products in this category
        const products = await Product.find({
          category: category._id,
          store_id: req.user.store_id,
        });

        const totalQuantity = products.reduce(
          (sum, product) => sum + (product.quantity || 0),
          0
        );

        return {
          ...category.toObject(),
          product_count: productCount,
          total_quantity: totalQuantity,
        };
      })
    );

    // Sort by quantity if requested
    if (sort_by_quantity) {
      result.sort((a, b) => {
        const direction = sort_by_quantity.direction === "asc" ? 1 : -1;
        return direction * (a.total_quantity - b.total_quantity);
      });
    }

    return result;
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

  async categoryStats(req, filterQuery) {
    const query = this._buildQueryWithStoreAccess(req, {});

    // Get categories for the specific store
    const categories = await Category.find(query);
    const result = this.calculateCategoryStats(categories);

    // Get category items stats
    const itemsStats = await this.getCategoryItemsStats(
      req,
      filterQuery.category
    );
    result.category_stats.items = itemsStats;

    // Get category sales stats
    const salesStats = await this.getCategorySalesStats(
      req,
      filterQuery.category
    );
    result.category_stats.sales = salesStats;

    return result;
  }

  calculateCategoryStats(categories) {
    if (!categories || categories.length === 0) {
      return {
        category_stats: {
          categories: {
            total: 0,
            percentage: "0%",
            last_month: 0,
          },
        },
      };
    }

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const totalCategories = categories.length;
    const lastMonthCategories = categories.filter(
      (category) => new Date(category.createdAt) >= lastMonth
    ).length;

    return {
      category_stats: {
        categories: {
          total: totalCategories,
          percentage: this.calculatePercentage(
            lastMonthCategories,
            totalCategories
          ),
          last_month: lastMonthCategories,
        },
      },
    };
  }

  async getCategoryItemsStats(req, categoryId) {
    // First get all categories for this store
    const storeQuery = this._buildQueryWithStoreAccess(req, {});
    const categories = await Category.find(storeQuery).select("_id");
    const categoryIds = categories.map((c) => c._id);

    // Build query to find products
    const query = {
      // Filter by store's categories
      category: {
        $in: categoryId ? [mongoose.Types.ObjectId(categoryId)] : categoryIds,
      },
      store_id: req.user.store_id,
    };

    // Get products stats - use basic query instead of aggregation
    const allProducts = await Product.find(query);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const total = allProducts.length;
    const lastMonthProducts = allProducts.filter(
      (product) => new Date(product.createdAt) >= lastMonth
    ).length;

    return {
      total,
      last_month: lastMonthProducts,
      percentage: this.calculatePercentage(lastMonthProducts, total),
    };
  }

  async getCategorySalesStats(req, categoryId) {
    // Get all categories for this store
    const storeQuery = this._buildQueryWithStoreAccess(req, {});
    const categories = await Category.find(storeQuery).select("_id");
    const categoryIds = categories.map((c) => c._id);

    // Query relevant product IDs
    const productQuery = {
      category: categoryId
        ? mongoose.Types.ObjectId(categoryId)
        : { $in: categoryIds },
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
      // Only count sale items from our category products
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

  calculatePercentage(part, total) {
    const percentage =
      total === 0 ? "0%" : ((part / total) * 100).toFixed(2) + "%";
    return percentage;
  }

  findCategoryProducts(req) {
    const category = req.body.category;

    const query = {
      category: category ? mongoose.Types.ObjectId(category) : null,
    };

    return Product.find(query);
  }
}

export default new CategoryService();
