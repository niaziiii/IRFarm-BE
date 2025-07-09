import mongoose from "mongoose";
import SaleModel from "../models/saleModel.js";
import SalePerson from "../models/SalePersonModel.js";
import AppError from "../utils/apiError.js";
import catchAsync from "../utils/catchAsync.js";
import { getStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

export const addSalePerson = catchAsync(async (req, res) => {
  const data = req.body;
  data.store_id = req.user.store_id || data.store_id;
  if (!data.store_id) {
    throw new AppError(`Store ID is required to create a sale person`, 400);
  }
  const created = await SalePerson.create(data);
  return successResponse(res, created);
});

export const getAllSalePersons = catchAsync(async (req, res) => {
  let filters = {};

  const filter_query = req.body.filter_query || {};

  if (req.user.role !== "super_admin") {
    filters.store_id = req.user.store_id;
  }

  if (filter_query.status) {
    filters.status = filter_query.status;
  }
  if (filter_query.status == "all" && filters.status) {
    delete filters.status;
  }

  const salePersons = await SalePerson.find(filters).populate({
    path: "store_id",
    select: "name address",
  });
  const count = await getStatusCounts(req, SalePerson);
  return successResponse(res, salePersons, count);
});

export const getSalePerson = catchAsync(async (req, res) => {
  const salePerson = await SalePerson.findById(req.params.id);
  return successResponse(res, salePerson);
});

export const updateSalePerson = catchAsync(async (req, res) => {
  const updated = await SalePerson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  return successResponse(res, updated);
});

export const deleteSalePerson = catchAsync(async (req, res) => {
  await SalePerson.findByIdAndDelete(req.params.id);
  return successResponse(res, { message: "Deleted successfully" });
});

export const salePersonLadgerReports = catchAsync(async (req, res) => {
  const { id } = req.params;
  const dateRange = req.body.date_range || {};

  // Validate sale person exists
  const salePerson = await SalePerson.findById(id);
  if (!salePerson) {
    throw new AppError("Sale person not found", 404);
  }

  // Build date filter
  const dateFilter = {};
  if (dateRange.start && dateRange.end) {
    dateFilter.date = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end + "T23:59:59.999Z"),
    };
  } else if (dateRange.start) {
    dateFilter.date = { $gte: new Date(dateRange.start) };
  } else if (dateRange.end) {
    dateFilter.date = { $lte: new Date(dateRange.end + "T23:59:59.999Z") };
  }

  // Fetch sales data with aggregation
  const salesData = await SaleModel.aggregate([
    {
      $match: {
        salePerson: new mongoose.Types.ObjectId(id),
        ...dateFilter,
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "sale_items.product_id",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $sort: { date: -1 },
    },
  ]);

  // Calculate summary statistics
  const summary = {
    totalSales: salesData.length,
    totalAmount: 0,
    cashSales: 0,
    creditSales: 0,
    cashAmount: 0,
    creditAmount: 0,
    splitPayments: 0,
    averageOrderValue: 0,
    totalDiscount: 0,
    totalShipping: 0,
    returnedSales: 0,
    returnedAmount: 0,
  };

  // Process each sale and calculate totals
  const ledgerEntries = salesData.map((sale) => {
    const customer = sale.customerDetails[0] || {};
    const isReturn = sale.sale_type === "returned";

    // Update summary
    summary.totalAmount += isReturn ? -sale.grand_total : sale.grand_total;
    summary.totalDiscount += sale.discount_value || 0;
    summary.totalShipping += sale.shipping_charges || 0;

    if (isReturn) {
      summary.returnedSales++;
      summary.returnedAmount += sale.grand_total;
    }

    // Payment type analysis
    const paymentType = sale.payment_type?.type || "cash";

    switch (paymentType) {
      case "cash":
        summary.cashSales++;
        summary.cashAmount += sale.grand_total;
        break;
      case "credit":
        summary.creditSales++;
        summary.creditAmount += sale.grand_total;
        break;
      case "split":
        summary.splitPayments++;
        summary.cashAmount += sale.payment_type.split?.cash_amount || 0;
        summary.creditAmount += sale.payment_type.split?.credit_amount || 0;
        break;
    }

    return {
      _id: sale._id,
      date: sale.date,
      saleNumber: sale.sale_number,
      customer: {
        name: customer.name || "Walk-in Customer",
        phone: customer.phone || "N/A",
        email: customer.email || "N/A",
      },
      saleType: sale.sale_type,
      paymentType: paymentType,
      paymentStatus: sale.payment_status,
      items: sale.sale_items.map((item) => {
        const product = sale.productDetails.find((p) =>
          p._id.equals(item.product_id)
        );
        return {
          productName: product?.name || "Unknown Product",
          quantity: item.quantity,
          salePrice: item.sale_price,
          discount: item.discount_amount || 0,
          total: item.quantity * item.sale_price - (item.discount_amount || 0),
        };
      }),
      subtotal: sale.sale_items.reduce(
        (sum, item) =>
          sum + item.quantity * item.sale_price - (item.discount_amount || 0),
        0
      ),
      discount: sale.discount_value || 0,
      shipping: sale.shipping_charges || 0,
      grandTotal: sale.grand_total,
      customerSource: sale.customer_source || "Direct",
      note: sale.note || "",
    };
  });

  // Calculate average order value
  summary.averageOrderValue =
    summary.totalSales > 0 ? summary.totalAmount / summary.totalSales : 0;

  // Response data
  const responseData = {
    salePerson: {
      _id: salePerson._id,
      name: salePerson.name,
      email: salePerson.email,
      phone: salePerson.phone,
      status: salePerson.status,
    },
    summary,
    ledger: ledgerEntries,
    dateRange: {
      start: dateRange.start,
      end: dateRange.end,
    },
    generatedAt: new Date(),
    totalRecords: ledgerEntries.length,
  };

  return successResponse(res, responseData);
});
