import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Sale from "../models/saleModel.js";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";
import Purchase from "../models/purchaseModel.js";
import Customer from "../models/customerModel.js";
import Company from "../models/companyModel.js";
import { BatchInventoryModel } from "../models/batchInventoryModel.js";
import Expense from "../models/expenseModel.js";
import AppError from "../utils/apiError.js";
import SaleModel from "../models/saleModel.js";
import purchaseModel from "../models/purchaseModel.js";

class ReportService {
  // Helper function to calculate date range
  getDateRange(startDateStr, endDateStr) {
    // Get Pakistan's timezone offset in minutes (UTC+5 = -300 minutes)
    const PK_OFFSET = 5 * 60; // 5 hours in minutes
    const MS_PER_MINUTE = 60 * 1000;

    if (!startDateStr || !endDateStr) {
      return { startDate: null, endDate: null };
    }

    try {
      // Parse the dates and set them to start and end of day in Pakistan time
      let startDate = new Date(startDateStr);
      let endDate = new Date(endDateStr);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { startDate: null, endDate: null };
      }

      // Set start date to beginning of day in Pakistan time
      startDate.setUTCHours(0, 0, 0, 0);
      // Adjust for Pakistan timezone
      startDate = new Date(startDate.getTime() - PK_OFFSET * MS_PER_MINUTE);

      // Set end date to end of day in Pakistan time
      endDate.setUTCHours(23, 59, 59, 999);
      // Adjust for Pakistan timezone
      endDate = new Date(endDate.getTime() - PK_OFFSET * MS_PER_MINUTE);

      return { startDate, endDate };
    } catch (error) {
      console.error("Error parsing dates:", error);
      return { startDate: null, endDate: null };
    }
  }

  // Sales Report
  async generateSalesReport(req) {
    const {
      startDate: startDateStr,
      endDate: endDateStr,
      category,
      customer,
    } = req.query;
    const { startDate, endDate } = this.getDateRange(startDateStr, endDateStr);

    const dateMatch =
      startDate && endDate ? { date: { $gte: startDate, $lte: endDate } } : {};

    // Create customer filter
    let customerFilter = {};
    if (customer) {
      if (mongoose.isValidObjectId(customer)) {
        customerFilter = { customer: new mongoose.Types.ObjectId(customer) };
      } else {
        customerFilter = {
          "customer.name": { $regex: customer, $options: "i" },
        };
      }
    }

    try {
      if (req.user.role === "super_admin") {
        // For super admin - get sales data for all stores
        const stores = await Store.find()
          .select("_id name image description")
          .lean();

        // Get managers for each store
        const managers = await User.find({
          role: "manager",
        })
          .select("_id name image email store_id")
          .lean();

        // Create a lookup map for managers
        const managerMap = {};
        managers.forEach((manager) => {
          if (manager.store_id) {
            managerMap[manager.store_id.toString()] = manager;
          }
        });

        // Process each store's sales
        const result = await Promise.all(
          stores.map(async (store) => {
            // Get sales for this store
            const sales = await Sale.aggregate([
              {
                $match: {
                  store_id: store._id,
                  ...dateMatch,
                  ...(category && {
                    "sale_items.product_id.category":
                      new mongoose.Types.ObjectId(category),
                  }),
                },
              },
              {
                $lookup: {
                  from: "customers",
                  localField: "customer",
                  foreignField: "_id",
                  as: "customer",
                },
              },
              {
                $unwind: {
                  path: "$customer",
                  preserveNullAndEmptyArrays: true,
                },
              },
              // Apply customer filter if provided
              ...(customerFilter.customer
                ? [{ $match: customerFilter }]
                : customerFilter["customer.name"]
                ? [{ $match: customerFilter }]
                : []),
              // Group by customer and date
              {
                $group: {
                  _id: {
                    customerId: { $ifNull: ["$customer._id", null] },
                    date: {
                      $dateToString: { format: "%Y-%m-%d", date: "$date" },
                    },
                  },
                  customerInfo: { $first: "$customer" },
                  sales: {
                    $push: {
                      _id: "$_id",
                      sale_number: "$sale_number",
                      grand_total: "$grand_total",
                      discount_value: "$discount_value",
                      payment_type: "$payment_type",
                      payment_status: "$payment_status",
                      sale_type: "$sale_type",
                      customer_account_details: "$customer_account_details",
                      date: "$date",
                      sale_items: "$sale_items",
                    },
                  },
                  totalSales: { $sum: 1 },
                  totalAmount: { $sum: "$grand_total" },
                  totalItems: { $sum: { $size: "$sale_items" } },
                },
              },
              // Sort by date
              { $sort: { "_id.date": 1 } },
            ]);

            // Skip stores with no sales
            if (sales.length === 0) {
              return null;
            }

            // Process sale_items for each sale to include product details
            for (const saleGroup of sales) {
              for (const sale of saleGroup.sales) {
                // Get product details for each sale item
                const productIds = sale.sale_items.map(
                  (item) => item.product_id
                );
                const products = await Product.find({
                  _id: { $in: productIds },
                })
                  .select("_id prod_name sku images")
                  .lean();

                // Create a lookup map for products
                const productMap = {};
                products.forEach((product) => {
                  productMap[product._id.toString()] = product;
                });

                // Enhance sale items with product details
                sale.sale_items = sale.sale_items.map((item) => {
                  const product = productMap[item.product_id.toString()];
                  return {
                    productId: item.product_id,
                    productName: product?.prod_name || "Unknown Product",
                    sku: product?.sku || "N/A",
                    images: product?.images || [],
                    quantity: item.quantity,
                    salePrice: item.sale_price,
                    subtotal: item.quantity * item.sale_price,
                  };
                });
              }
            }

            return {
              store: {
                _id: store._id,
                name: store.name,
                image: store.image,
                description: store.description,
              },
              manager: managerMap[store._id.toString()] || {
                _id: null,
                name: "No Manager Assigned",
                image: "",
                email: "",
              },
              sales,
            };
          })
        );

        // Filter out null results (stores with no sales)
        return result.filter((store) => store !== null);
      } else {
        // For manager/user - get data only for their store
        const storeId = new mongoose.Types.ObjectId(req.user.store_id);

        // Get sales for this store
        const sales = await Sale.aggregate([
          {
            $match: {
              store_id: storeId,
              ...dateMatch,
              ...(category && {
                "sale_items.product_id.category": new mongoose.Types.ObjectId(
                  category
                ),
              }),
            },
          },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer",
            },
          },
          {
            $unwind: {
              path: "$customer",
              preserveNullAndEmptyArrays: true,
            },
          },
          // Apply customer filter if provided
          ...(customerFilter.customer
            ? [{ $match: customerFilter }]
            : customerFilter["customer.name"]
            ? [{ $match: customerFilter }]
            : []),
          // Group by customer and date
          {
            $group: {
              _id: {
                customerId: { $ifNull: ["$customer._id", null] },
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              },
              customerInfo: { $first: "$customer" },
              sales: {
                $push: {
                  _id: "$_id",
                  sale_number: "$sale_number",
                  grand_total: "$grand_total",
                  discount_value: "$discount_value",
                  payment_type: "$payment_type",
                  payment_status: "$payment_status",
                  sale_type: "$sale_type",
                  customer_account_details: "$customer_account_details",
                  date: "$date",
                  sale_items: "$sale_items",
                },
              },
              totalSales: { $sum: 1 },
              totalAmount: { $sum: "$grand_total" },
              totalItems: { $sum: { $size: "$sale_items" } },
            },
          },
          // Sort by date
          { $sort: { "_id.date": 1 } },
        ]);

        // Process sale_items for each sale to include product details
        for (const saleGroup of sales) {
          for (const sale of saleGroup.sales) {
            // Get product details for each sale item
            const productIds = sale.sale_items.map((item) => item.product_id);
            const products = await Product.find({
              _id: { $in: productIds },
            })
              .select("_id prod_name sku images")
              .lean();

            // Create a lookup map for products
            const productMap = {};
            products.forEach((product) => {
              productMap[product._id.toString()] = product;
            });

            // Enhance sale items with product details
            sale.sale_items = sale.sale_items.map((item) => {
              const product = productMap[item.product_id.toString()];
              return {
                productId: item.product_id,
                productName: product?.prod_name || "Unknown Product",
                sku: product?.sku || "N/A",
                images: product?.images || [],
                quantity: item.quantity,
                salePrice: item.sale_price,
                subtotal: item.quantity * item.sale_price,
              };
            });
          }
        }

        return sales;
      }
    } catch (error) {
      throw new AppError(
        `Error generating sales report: ${error.message}`,
        500
      );
    }
  }

  // Inventory Report
  async generateInventoryReport(req) {
    try {
      if (req.user.role === "super_admin") {
        // Get all stores with their basic info
        const stores = await Store.find()
          .select("_id name image description")
          .lean();

        // Get managers for each store
        const managers = await User.find({
          role: "manager",
        })
          .select("_id name image store_id")
          .lean();

        // Create a lookup map for managers
        const managerMap = {};
        managers.forEach((manager) => {
          if (manager.store_id) {
            managerMap[manager.store_id.toString()] = manager;
          }
        });

        // Process each store's inventory
        const inventory = await Promise.all(
          stores.map(async (store) => {
            // Get all active products for this store
            const products = await Product.find({
              store_id: store._id,
              status: "active",
            }).lean();

            if (products.length === 0) {
              return null; // Skip stores with no products
            }

            // Get batch information for accurate quantities
            const productIds = products.map((p) => p._id);
            const batches = await BatchInventoryModel.find({
              product_id: { $in: productIds },
              store_id: store._id,
              status: "active",
            }).lean();

            // Create a map of product quantities from batches
            const productQuantityMap = {};
            const productPriceMap = {};

            batches.forEach((batch) => {
              const productId = batch.product_id.toString();

              if (!productQuantityMap[productId]) {
                productQuantityMap[productId] = 0;
                productPriceMap[productId] = [];
              }

              productQuantityMap[productId] += batch.current_quantity;
              productPriceMap[productId].push(batch.purchase_price);
            });

            // Create the inventory items
            const inventoryItems = products.map((product) => {
              const productId = product._id.toString();
              const quantity = productQuantityMap[productId] || 0;
              const prices = productPriceMap[productId] || [];

              let avgPrice = 0;
              if (prices.length > 0) {
                avgPrice =
                  prices.reduce((sum, price) => sum + price, 0) / prices.length;
              } else {
                avgPrice = product.purchase_price || 0;
              }

              return {
                product,
                totalQuantity: quantity,
                averagePurchasePrice: avgPrice,
                inventoryValue: quantity * avgPrice,
                lowStock: quantity < product.minimum_stock_alert,
              };
            });

            return {
              store: {
                _id: store._id,
                name: store.name,
                image: store.image,
                description: store.description,
              },
              manager: managerMap[store._id.toString()] || {
                _id: null,
                name: "No Manager Assigned",
                image: "",
              },
              inventory: inventoryItems,
            };
          })
        );

        // Filter out null values (stores with no inventory)
        return inventory.filter((item) => item !== null);
      } else {
        // For manager/user - process only their store
        const storeId = req.user.store_id;

        const products = await Product.find({
          store_id: storeId,
        }).lean();

        return products.map((product) => {
          const quantity = product.quantity || 0;
          const prices = product.purchase_price * quantity;

          let avgPrice = 0;
          if (prices.length > 0) {
            avgPrice =
              prices.reduce((sum, price) => sum + price, 0) / prices.length;
          } else {
            avgPrice = product.purchase_price || 0;
          }

          return {
            productId: product._id,
            productName: product.prod_name,
            sku: product.sku,
            totalQuantity: quantity,
            images: product.images,
            averagePurchasePrice: avgPrice,
            inventoryValue: quantity * avgPrice,
            lowStock: quantity < product.minimum_stock_alert,
          };
        });
      }
    } catch (error) {
      throw new AppError(
        `Error generating inventory report: ${error.message}`,
        500
      );
    }
  }

  // Purchase Report
  async generatePurchaseReport(req) {
    const {
      startDate: startDateStr,
      endDate: endDateStr,
      supplier,
    } = req.query;
    const { startDate, endDate } = this.getDateRange(startDateStr, endDateStr);

    const dateMatch =
      startDate && endDate ? { date: { $gte: startDate, $lte: endDate } } : {};

    // Create supplier filter
    let supplierFilter = {};
    if (supplier) {
      if (mongoose.isValidObjectId(supplier)) {
        supplierFilter = { supplier: new mongoose.Types.ObjectId(supplier) };
      } else {
        supplierFilter = {
          "supplier.name": { $regex: supplier, $options: "i" },
        };
      }
    }

    try {
      if (req.user.role === "super_admin") {
        // For super admin - get data for all stores
        const stores = await Store.find()
          .select("_id name image description")
          .lean();

        // Get managers for each store
        const managers = await User.find({
          role: "manager",
        })
          .select("_id name image store_id")
          .lean();

        // Create a lookup map for managers
        const managerMap = {};
        managers.forEach((manager) => {
          if (manager.store_id) {
            managerMap[manager.store_id.toString()] = manager;
          }
        });

        // Process each store's purchases
        const result = await Promise.all(
          stores.map(async (store) => {
            // Get purchases for this store
            const purchases = await Purchase.aggregate([
              {
                $match: {
                  store_id: store._id,
                  ...dateMatch,
                },
              },
              {
                $lookup: {
                  from: "companies",
                  localField: "supplier",
                  foreignField: "_id",
                  as: "supplier",
                },
              },
              {
                $unwind: {
                  path: "$supplier",
                  preserveNullAndEmptyArrays: true,
                },
              },
              // Apply supplier filter if provided
              ...(supplierFilter.supplier
                ? [{ $match: supplierFilter }]
                : supplierFilter["supplier.name"]
                ? [{ $match: supplierFilter }]
                : []),
              // Group by supplier and date
              {
                $group: {
                  _id: {
                    supplierId: { $ifNull: ["$supplier._id", null] },
                    date: {
                      $dateToString: { format: "%Y-%m-%d", date: "$date" },
                    },
                  },
                  supplierInfo: { $first: "$supplier" },
                  purchases: {
                    $push: {
                      _id: "$_id",
                      purchase_number: "$purchase_number",
                      grand_total: "$grand_total",
                      shipping_charges: "$shipping_charges",
                      discount_value: "$discount_value",
                      order_status: "$order_status",
                      purchased_type: "$purchased_type",
                      date: "$date",
                      order_items: "$order_items",
                    },
                  },
                  totalPurchases: { $sum: 1 },
                  totalAmount: { $sum: "$grand_total" },
                  totalItems: { $sum: { $size: "$order_items" } },
                },
              },
              // Sort by date
              { $sort: { "_id.date": 1 } },
            ]);

            // Skip stores with no purchases
            if (purchases.length === 0) {
              return null;
            }

            // Process order_items for each purchase to include product details
            for (const purchaseGroup of purchases) {
              for (const purchase of purchaseGroup.purchases) {
                // Get product details for each order item
                const productIds = purchase.order_items.map(
                  (item) => item.product_id
                );
                const products = await Product.find({
                  _id: { $in: productIds },
                })
                  .select("_id prod_name sku images")
                  .lean();

                // Create a lookup map for products
                const productMap = {};
                products.forEach((product) => {
                  productMap[product._id.toString()] = product;
                });

                // Enhance order items with product details
                purchase.order_items = purchase.order_items.map((item) => {
                  const product = productMap[item.product_id.toString()];
                  return {
                    productId: item.product_id,
                    productName: product?.prod_name || "Unknown Product",
                    sku: product?.sku || "N/A",
                    batchNumber: item.batch_number,
                    images: product?.images || [],
                    quantity: item.quantity,
                    purchasePrice: item.purchase_price,
                    manufacturedDate: item.manufactured_date,
                    expiryDate: item.expiry_date,
                    subtotal: item.quantity * item.purchase_price,
                  };
                });
              }
            }

            return {
              store: {
                _id: store._id,
                name: store.name,
                image: store.image,
                description: store.description,
              },
              manager: managerMap[store._id.toString()] || {
                _id: null,
                name: "No Manager Assigned",
                image: "",
              },
              purchases,
            };
          })
        );

        // Filter out null results (stores with no purchases)
        return result.filter((store) => store !== null);
      } else {
        // For manager/user - get data only for their store
        const storeId = new mongoose.Types.ObjectId(req.user.store_id);

        // Get purchases for this store
        const purchases = await Purchase.aggregate([
          {
            $match: {
              store_id: storeId,
              ...dateMatch,
            },
          },
          {
            $lookup: {
              from: "companies",
              localField: "supplier",
              foreignField: "_id",
              as: "supplier",
            },
          },
          {
            $unwind: {
              path: "$supplier",
              preserveNullAndEmptyArrays: true,
            },
          },
          // Apply supplier filter if provided
          ...(supplierFilter.supplier
            ? [{ $match: supplierFilter }]
            : supplierFilter["supplier.name"]
            ? [{ $match: supplierFilter }]
            : []),
          // Group by supplier and date
          {
            $group: {
              _id: {
                supplierId: { $ifNull: ["$supplier._id", null] },
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              },
              supplierInfo: { $first: "$supplier" },
              purchases: {
                $push: {
                  _id: "$_id",
                  purchase_number: "$purchase_number",
                  grand_total: "$grand_total",
                  shipping_charges: "$shipping_charges",
                  discount_value: "$discount_value",
                  order_status: "$order_status",
                  purchased_type: "$purchased_type",
                  date: "$date",
                  order_items: "$order_items",
                },
              },
              totalPurchases: { $sum: 1 },
              totalAmount: { $sum: "$grand_total" },
              totalItems: { $sum: { $size: "$order_items" } },
            },
          },
          // Sort by date
          { $sort: { "_id.date": 1 } },
        ]);

        // Process order_items for each purchase to include product details
        for (const purchaseGroup of purchases) {
          for (const purchase of purchaseGroup.purchases) {
            // Get product details for each order item
            const productIds = purchase.order_items.map(
              (item) => item.product_id
            );
            const products = await Product.find({
              _id: { $in: productIds },
            })
              .select("_id prod_name sku images")
              .lean();

            // Create a lookup map for products
            const productMap = {};
            products.forEach((product) => {
              productMap[product._id.toString()] = product;
            });

            // Enhance order items with product details
            purchase.order_items = purchase.order_items.map((item) => {
              const product = productMap[item.product_id.toString()];
              return {
                productId: item.product_id,
                productName: product?.prod_name || "Unknown Product",
                sku: product?.sku || "N/A",
                batchNumber: item.batch_number,
                images: product?.images || [],
                quantity: item.quantity,
                purchasePrice: item.purchase_price,
                manufacturedDate: item.manufactured_date,
                expiryDate: item.expiry_date,
                subtotal: item.quantity * item.purchase_price,
              };
            });
          }
        }

        return purchases;
      }
    } catch (error) {
      throw new AppError(
        `Error generating purchase report: ${error.message}`,
        500
      );
    }
  }

  // Financial Report
  async generateFinancialReport(req) {
    const { startDate: startDateStr, endDate: endDateStr } = req.query;
    const { startDate, endDate } = this.getDateRange(startDateStr, endDateStr);

    const dateMatch =
      startDate && endDate ? { date: { $gte: startDate, $lte: endDate } } : {};

    try {
      if (req.user.role === "super_admin") {
        // For super admin - get financial data for all stores
        const stores = await Store.find()
          .select("_id name image description address")
          .lean();

        // Get managers for each store
        const managers = await User.find({
          role: "manager",
        })
          .select("_id name email image contact_no store_id")
          .lean();

        // Create a lookup map for managers
        const managerMap = {};
        managers.forEach((manager) => {
          if (manager.store_id) {
            managerMap[manager.store_id.toString()] = manager;
          }
        });

        // Process each store's financial data
        const result = await Promise.all(
          stores.map(async (store) => {
            const financialData = await this.calculateFinancialData(
              store._id,
              dateMatch
            );

            return {
              store: store,
              manager: managerMap[store._id.toString()] || {
                _id: null,
                name: "No Manager Assigned",
                email: "",
                image: "",
                contact_no: "",
              },
              ...financialData,
            };
          })
        );

        return result;
      } else {
        const storeId = new mongoose.Types.ObjectId(req.user.store_id);
        return await this.calculateFinancialData(storeId, dateMatch);
      }
    } catch (error) {
      throw new AppError(
        `Error generating financial report: ${error.message}`,
        500
      );
    }
  }

  async calculateFinancialData(storeId, dateMatch) {
    // Get sales data with more details
    const salesData = await Sale.aggregate([
      {
        $match: {
          store_id: storeId,
          ...dateMatch,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grand_total" },
          totalDiscounts: { $sum: "$discount_value" },
          salesCount: { $sum: 1 },
          cashRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$payment_type.type", "cash"] },
                "$grand_total",
                0,
              ],
            },
          },
          creditRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$payment_type.type", "credit"] },
                "$grand_total",
                0,
              ],
            },
          },
          cashSalesCount: {
            $sum: {
              $cond: [{ $eq: ["$payment_type.type", "cash"] }, 1, 0],
            },
          },
          creditSalesCount: {
            $sum: {
              $cond: [{ $eq: ["$payment_type.type", "credit"] }, 1, 0],
            },
          },
          salesShippingCharges: { $sum: "$shipping_charges" },
        },
      },
    ]);

    // Get purchase data with more details
    const purchaseData = await Purchase.aggregate([
      {
        $match: {
          store_id: storeId,
          ...dateMatch,
        },
      },
      {
        $group: {
          _id: null,
          totalCosts: { $sum: "$grand_total" },
          purchaseCount: { $sum: 1 },
          shippingCharges: { $sum: "$shipping_charges" },
          cashPurchases: {
            $sum: {
              $cond: [
                { $eq: ["$payment_type.type", "cash"] },
                "$grand_total",
                0,
              ],
            },
          },
          creditPurchases: {
            $sum: {
              $cond: [
                { $eq: ["$payment_type.type", "credit"] },
                "$grand_total",
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get expense data with category breakdown
    const expenseData = await Expense.aggregate([
      {
        $match: {
          store_id: storeId,
          status: "active",
          ...dateMatch,
        },
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          cashAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$amount", 0],
            },
          },
          creditAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "credit"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    // Process expense data
    const expenseSummary = expenseData.reduce(
      (acc, expense) => {
        acc.total += expense.totalAmount;
        acc.cash += expense.cashAmount;
        acc.credit += expense.creditAmount;
        acc.count += expense.count;
        return acc;
      },
      { total: 0, cash: 0, credit: 0, count: 0, categories: [] }
    );

    // Calculate detailed values
    const totalRevenue = salesData[0]?.totalRevenue || 0;
    const totalPurchaseCosts = purchaseData[0]?.totalCosts || 0;
    const totalExpenses = expenseSummary.total;

    // Calculate net values
    const netRevenue = totalRevenue;
    const netPurchaseCosts = totalPurchaseCosts;
    const totalCosts = netPurchaseCosts + totalExpenses;

    // Shipping charges breakdown
    const salesShipping = salesData[0]?.salesShippingCharges || 0;
    const purchaseShipping = purchaseData[0]?.shippingCharges || 0;
    const totalShippingCharges = salesShipping + purchaseShipping;

    return {
      // Revenue section with consistent structure
      revenue: {
        total: totalRevenue,
        cash: salesData[0]?.cashRevenue || 0,
        credit: salesData[0]?.creditRevenue || 0,
      },
      costs: {
        total: totalCosts,
        breakdown: {
          purchases: {
            total: netPurchaseCosts,
            gross: totalPurchaseCosts,
            cash: purchaseData[0]?.cashPurchases || 0,
            credit: purchaseData[0]?.creditPurchases || 0,
            transactions: purchaseData[0]?.purchaseCount || 0,
          },
          expenses: {
            total: totalExpenses,
            cash: expenseSummary.cash,
            credit: expenseSummary.credit,
          },
        },
      },
      shippingCharges: {
        total: totalShippingCharges,
        breakdown: {
          fromSales: salesShipping,
          fromPurchases: purchaseShipping,
        },
      },
      discounts: {
        total: salesData[0]?.totalDiscounts || 0,
      },
      profitAnalysis: {
        grossRevenue: totalRevenue,
        netRevenue: netRevenue,
        grossProfit: totalRevenue - totalPurchaseCosts,
        netProfit: netRevenue - totalCosts,
        profitMargin:
          netRevenue > 0
            ? (((netRevenue - totalCosts) / netRevenue) * 100).toFixed(2)
            : 0,
      },
    };
  }
}

export default new ReportService();
