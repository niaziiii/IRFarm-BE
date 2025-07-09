import Product from "../models/productModel.js";
import mongoose from "mongoose";
import AppError from "../utils/apiError.js";
import {
  BatchInventoryModel,
  InventoryTransactionModel,
} from "../models/batchInventoryModel.js";
import notificationService, {
  NOTIFICATION_TYPES,
} from "./notificationService.js";
import userModel from "../models/userModel.js";
import uniqueCodeModel from "../models/uniqueCodeModel.js";
import SaleModel from "../models/saleModel.js";
import purchaseModel from "../models/purchaseModel.js";

class ProductService {
  async createProduct(request) {
    if (request.user.role === "super_admin") {
      throw new AppError("Only manager is allowed to add product.");
    }

    // Set created_by and store_id fields
    request.body.created_by = request.user._id;
    request.body.store_id = request.user.store_id;

    // Create new product
    const product = await Product.create(request.body);
    await uniqueCodeModel.create({
      code: parseInt(request.body.prod_code),
      type: "product",
      store_id: request.user.store_id,
    });

    return product;
  }

  async findProduct(req, filterQuery) {
    const product = await Product.findById(filterQuery.id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Get batch details for this product
    const batchDetails = await BatchInventoryModel.aggregate([
      {
        $match: {
          product_id: new mongoose.Types.ObjectId(filterQuery.id),
          status: "active",
          current_quantity: { $gt: 0 },
        },
      },
      {
        $sort: { expiry_date: 1 }, // Sort by expiry date (FEFO)
      },
      {
        $group: {
          _id: "$store_id",
          total_quantity: { $sum: "$current_quantity" },
          batches: {
            $push: {
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
    ]);

    const unitProfile = product.unit_profile || {};
    const unit = unitProfile.unit || {};

    const productData = {
      ...product._doc,
      unit_profile: {
        _id: unit._id || "",
        name: unit.name || "",
        value: unit.name ? unitProfile.value : 0,
      },
      batches: batchDetails,
    };

    return productData;
  }

  getProductComparisonOperators(filterQuery) {
    const filter = {};

    // Handle basic equality filters
    const basicFilters = ["type", "prod_name", "prod_code", "sku"];
    basicFilters.forEach((field) => {
      if (filterQuery[field]) {
        filter[field] = filterQuery[field];
      }
    });

    // Handle ObjectId fields
    const objectIdFields = ["company", "category", "store_id"];
    objectIdFields.forEach((field) => {
      if (filterQuery[field]) {
        filter[field] = new mongoose.Types.ObjectId(filterQuery[field]);
      }
    });

    if (filterQuery.status && filterQuery.status !== "all") {
      filter.status = filterQuery.status;
    }

    // Handle purchase price range
    if (filterQuery.purchase_price) {
      filter.purchase_price = {};
      if (filterQuery.purchase_price.minimum !== undefined) {
        filter.purchase_price.$gte = parseInt(
          filterQuery.purchase_price.minimum
        );
      }
      if (filterQuery.purchase_price.maximum !== undefined) {
        filter.purchase_price.$lte = parseInt(
          filterQuery.purchase_price.maximum
        );
      }
    }

    // Handle quantity filters
    if (filterQuery.quantity) {
      filter.quantity = {};
      if (filterQuery.quantity.minimum !== undefined) {
        filter.quantity.$gte = parseInt(filterQuery.quantity.minimum);
      }
      if (filterQuery.quantity.maximum !== undefined) {
        filter.quantity.$lte = parseInt(filterQuery.quantity.maximum);
      }
    }

    // Handle date range filters
    if (filterQuery.expire_date) {
      if (filterQuery.expire_date.from) {
        filter.createdAt = {
          ...filter.createdAt,
          $gte: new Date(filterQuery.expire_date.from),
        };
      }
      if (filterQuery.expire_date.to) {
        filter.createdAt = {
          ...filter.createdAt,
          $lte: new Date(filterQuery.expire_date.to),
        };
      }
    }

    // Handle expiry date alerts
    if (filterQuery.expiry_alert_days) {
      const alertDate = new Date();
      alertDate.setDate(
        alertDate.getDate() + parseInt(filterQuery.expiry_alert_days)
      );
      filter.expire_date = {
        $lte: alertDate,
        $gte: new Date(),
      };
    }

    // Handle stock alerts
    if (filterQuery.low_stock === true) {
      filter.$expr = {
        $lte: ["$quantity", "$minimum_stock_alert"],
      };
    }

    // Handle search query across multiple fields
    if (filterQuery.search) {
      const searchRegex = new RegExp(filterQuery.search, "i");
      filter.$or = [
        { prod_name: searchRegex },
        { prod_code: searchRegex },
        { sku: searchRegex },
        { prod_description: searchRegex },
      ];
    }

    // Handle multiple statuses
    if (filterQuery.statuses && Array.isArray(filterQuery.statuses)) {
      filter.status = { $in: filterQuery.statuses };
    }

    // Handle multiple types
    if (filterQuery.types && Array.isArray(filterQuery.types)) {
      filter.type = { $in: filterQuery.types };
    }

    // Handle multiple categories
    if (filterQuery.categories && Array.isArray(filterQuery.categories)) {
      filter.category = {
        $in: filterQuery.categories.map(
          (cat) => new mongoose.Types.ObjectId(cat)
        ),
      };
    }

    // Handle multiple companies
    if (filterQuery.companies && Array.isArray(filterQuery.companies)) {
      filter.company = {
        $in: filterQuery.companies.map(
          (comp) => new mongoose.Types.ObjectId(comp)
        ),
      };
    }

    return filter;
  }

  async findAllProducts(request) {
    const { user } = request;
    const filterQuery = request.body.filter_query || {};

    // Get filter conditions
    const filter = this.getProductComparisonOperators(filterQuery);

    // Prepare sort options
    const sortOptions = {};
    if (filterQuery.sort_by_quantity?.minimum !== undefined) {
      sortOptions.quantity =
        filterQuery.sort_by_quantity.minimum === "" ? -1 : 1;
    }
    if (filterQuery.sort_by_mrp?.minimum !== undefined) {
      sortOptions.maximum_retail_price =
        filterQuery.sort_by_mrp.minimum === "" ? -1 : 1;
    }

    let query;

    if (user.role === "super_admin") {
      // Super admin can see all products with optional store filter
      if (filterQuery.store) {
        filter.store_id = new mongoose.Types.ObjectId(filterQuery.store);
      }
      query = Product.find(filter);
    } else {
      // Store users only see products from their store
      filter.store_id = user.store_id;
      query = Product.find(filter);
    }

    // Apply sorting if needed
    if (Object.keys(sortOptions).length > 0) {
      query = query.sort(sortOptions);
    }

    // Execute the query
    const products = await query
      .populate("category", "name _id")
      .populate("company", "name _id")
      .populate("created_by", "name _id image role")
      .populate("unit_profile.unit", "name _id")
      .populate("store_id", "name _id");

    // Enhance product data with batch information
    const enhancedProducts = await Promise.all(
      products.map(async (product) => {
        // Get batches for this product - Sort by createdAt in descending order
        // to have newest batches first
        const batches = await BatchInventoryModel.find({
          product_id: product._id,
          status: "active",
          current_quantity: { $gt: 0 },
        }).sort({ createdAt: -1 }); // Add sorting to put newest batches first

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

  async updateProduct(filterQuery, productData) {
    return await Product.findByIdAndUpdate(filterQuery.id, productData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteProduct(filterQuery) {
    return await Product.findByIdAndDelete(filterQuery.id);
  }

  async getProductLedger(productId, dateRange = {}) {
    try {
      // Validate product exists
      const product = await Product.findOne({
        _id: productId,
      }).populate("unit_profile.unit", "name _id");

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      // Ensure we have a valid store_id
      const store_id = product.store_id._id.toString();

      // Build date filter
      const dateFilter = {};
      if (dateRange.start && dateRange.end) {
        dateFilter.createdAt = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end),
        };
      }

      // Get all batches for this product (stock in)
      const batches = await BatchInventoryModel.find({
        product_id: productId,
        store_id: store_id,
        ...dateFilter,
      })
        .populate({
          path: "purchase_id",
          select: "purchase_number date supplier",
          populate: {
            path: "supplier",
            select: "name _id contact_no email_address",
          },
        })
        .sort({ createdAt: 1 });

      const transactions = await InventoryTransactionModel.aggregate([
        {
          $lookup: {
            from: "batchinventories",
            localField: "batch_inventory_id",
            foreignField: "_id",
            as: "batch",
          },
        },
        {
          $unwind: "$batch",
        },
        {
          $match: {
            "batch.product_id": new mongoose.Types.ObjectId(productId),
            "batch.store_id": new mongoose.Types.ObjectId(store_id),
            transaction_type: { $ne: "purchase" }, // Exclude purchase transactions
            ...dateFilter,
          },
        },
        {
          $lookup: {
            from: "sales",
            localField: "reference_id",
            foreignField: "_id",
            as: "sale",
            pipeline: [
              {
                $lookup: {
                  from: "customers",
                  localField: "customer",
                  foreignField: "_id",
                  as: "customer_details",
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "purchases",
            localField: "reference_id",
            foreignField: "_id",
            as: "purchase",
            pipeline: [
              {
                $lookup: {
                  from: "companies",
                  localField: "supplier",
                  foreignField: "_id",
                  as: "supplier_details",
                },
              },
            ],
          },
        },
        {
          $project: {
            date: "$createdAt",
            transaction_type: 1,
            quantity: 1,
            reference_id: 1,
            batch_inventory_id: 1,
            batch_number: "$batch.batch_number",
            purchase_price: "$batch.purchase_price",
            purchase: { $arrayElemAt: ["$purchase", 0] },
            sale: { $arrayElemAt: ["$sale", 0] },
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);

      // Combine batches and transactions to create ledger entries
      const ledgerEntries = [];
      let runningTotal = 0;

      // Use a Map to track unique batches by their batch number
      const batchMap = new Map();

      // First, collect all batches in a Map to avoid duplicates
      for (const batch of batches) {
        // Only add each batch once, using batch_number as the key
        if (!batchMap.has(batch.batch_number)) {
          batchMap.set(batch.batch_number, batch);
        }
      }

      // Now process each unique batch (these represent purchases)
      for (const batch of batchMap.values()) {
        const purchaseDetails = batch.purchase_id;

        // Skip batches without a valid purchase_id to avoid duplicates
        if (!purchaseDetails) continue;

        runningTotal += batch.initial_quantity;

        // Extract supplier information
        const supplierInfo = purchaseDetails.supplier
          ? {
              name: purchaseDetails.supplier.name,
              _id: purchaseDetails.supplier._id,
              contact: purchaseDetails.supplier.contact_no?.[0] || "N/A",
              email: purchaseDetails.supplier.email_address || "N/A",
            }
          : null;

        ledgerEntries.push({
          date: batch.createdAt,
          invoice_number: purchaseDetails.purchase_number,
          price: batch.purchase_price,
          unit: product.unit_profile?.unit?.name || "Unit",
          in: batch.initial_quantity,
          out: 0,
          remaining: runningTotal,
          type: "purchase",
          batch_number: batch.batch_number,
          profit_loss: 0, // No profit/loss on purchases
          reference: supplierInfo, // Added supplier reference
          reference_type: "supplier",
        });
      }

      // Process sale/return transactions (purchases are already handled via batches)
      for (const transaction of transactions) {
        let invoiceNumber = "N/A";
        let price = 0;
        let profitLoss = 0;
        let reference = null;
        let referenceType = null;

        // Calculate price and profit/loss based on transaction type
        if (transaction.transaction_type === "sale" && transaction.sale) {
          // Find the sale item for this product in the sale document
          const sale = await SaleModel.findById(transaction.reference_id);
          if (sale) {
            const saleItem = sale.sale_items.find(
              (item) => item.product_id.toString() === productId.toString()
            );

            if (saleItem) {
              invoiceNumber = sale.sale_number;
              price = saleItem.sale_price;
              // Calculate profit/loss (sale price - purchase price)
              profitLoss =
                Math.abs(transaction.quantity) *
                (saleItem.sale_price - transaction.purchase_price);

              // Extract customer information
              const customerDetails = transaction.sale.customer_details?.[0];
              if (customerDetails) {
                reference = {
                  name: customerDetails.name,
                  _id: customerDetails._id,
                  phone: customerDetails.phone || "N/A",
                  email: customerDetails.email || "N/A",
                };
                referenceType = "customer";
              } else {
                reference = {
                  name: "Walk-in Customer",
                  _id: null,
                  phone: "N/A",
                  email: "N/A",
                };
                referenceType = "customer";
              }
            }
          }
        } else if (
          transaction.transaction_type === "return" &&
          transaction.purchase
        ) {
          // For purchase returns
          const purchase = await purchaseModel.findById(
            transaction.reference_id
          );
          if (purchase) {
            invoiceNumber = purchase.purchase_number;
            price = transaction.purchase_price;
            profitLoss = 0; // No profit/loss on purchase returns

            // Extract supplier information from purchase
            const supplierDetails = transaction.purchase.supplier_details?.[0];
            if (supplierDetails) {
              reference = {
                name: supplierDetails.name,
                _id: supplierDetails._id,
                contact: supplierDetails.contact_no?.[0] || "N/A",
                email: supplierDetails.email_address || "N/A",
              };
              referenceType = "supplier";
            }
          }
        } else if (transaction.transaction_type === "adjustment") {
          // Handle inventory adjustments
          invoiceNumber = "ADJUSTMENT";
          price = transaction.purchase_price || 0;
          profitLoss = 0;
          reference = {
            name: "System Adjustment",
            _id: null,
            type: "adjustment",
          };
          referenceType = "system";
        } else if (transaction.transaction_type === "damage") {
          // Handle damaged goods
          invoiceNumber = "DAMAGE";
          price = transaction.purchase_price || 0;
          profitLoss =
            -Math.abs(transaction.quantity) * (transaction.purchase_price || 0); // Loss due to damage
          reference = {
            name: "Damaged Goods",
            _id: null,
            type: "damage",
          };
          referenceType = "system";
        }

        // Update running total (note: sale quantities are negative, returns are positive)
        runningTotal += transaction.quantity;

        ledgerEntries.push({
          date: transaction.date,
          invoice_number: invoiceNumber,
          price: price,
          unit: product.unit_profile?.unit?.name || "Unit",
          in: transaction.quantity > 0 ? transaction.quantity : 0,
          out: transaction.quantity < 0 ? Math.abs(transaction.quantity) : 0,
          remaining: runningTotal,
          type: transaction.transaction_type,
          batch_number: transaction.batch_number,
          profit_loss: profitLoss,
          reference: reference,
          reference_type: referenceType,
        });
      }

      // Sort all entries by date
      ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate totals
      const totals = ledgerEntries.reduce(
        (acc, entry) => {
          acc.totalIn += entry.in;
          acc.totalOut += entry.out;
          acc.totalProfitLoss += entry.profit_loss;
          return acc;
        },
        { totalIn: 0, totalOut: 0, totalProfitLoss: 0 }
      );

      return {
        product: {
          _id: product._id,
          name: product.prod_name,
          code: product.prod_code,
          unit: product.unit_profile?.unit?.name || "Unit",
          current_quantity: product.quantity,
        },
        ledger: ledgerEntries,
        totals,
      };
    } catch (error) {
      throw new AppError(
        `Failed to generate product ledger: ${error.message}`,
        500
      );
    }
  }
}

export default new ProductService();
