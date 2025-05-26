import QuotationModel from "../models/quotationModel.js";
import Product from "../models/productModel.js";
import Customer from "../models/customerModel.js";
import AppError from "../utils/apiError.js";
import { BatchInventoryModel } from "../models/batchInventoryModel.js";
import mongoose from "mongoose";
import notificationService from "./notificationService.js";
import saleService from "./saleServices.js"; // Import for conversion to sale

class QuotationService {
  modifyPaymentType(payment_type = {}) {
    if (!payment_type.type) return payment_type;

    if (payment_type.type === "cash" && payment_type.cash) {
      const { type } = payment_type.cash;
      return {
        type: payment_type.type,
        cash: {
          type: type,
          ...(type === "by_hand" ? { by_hand: payment_type.cash.by_hand } : {}),
          ...(type === "online" ? { online: payment_type.cash.online } : {}),
        },
      };
    } else if (payment_type.type === "credit" && payment_type.credit) {
      return {
        type: payment_type.type,
        credit: payment_type.credit,
      };
    } else if (payment_type.type === "split" && payment_type.split) {
      const { type } = payment_type.split;
      return {
        type: payment_type.type,
        split: {
          type: type,
          cash_amount: Number(payment_type.split.cash_amount),
          credit_amount: Number(payment_type.split.credit_amount),
          ...(type === "by_hand"
            ? { by_hand: payment_type.split.by_hand }
            : {}),
          ...(type === "online" ? { online: payment_type.split.online } : {}),
        },
      };
    }
    return payment_type;
  }

  generateQuotationNumber(date) {
    const getRandomFiveDigitNumber = () =>
      Math.floor(10000 + Math.random() * 90000);

    const quotationNumber = `QUOTE-${date}-${getRandomFiveDigitNumber()}`;
    return quotationNumber;
  }

  async validateCustomerCredit(customerId, grandTotal, paymentType) {
    // Only run validation if this is a credit or split payment
    if (
      !customerId ||
      (paymentType.type !== "credit" && paymentType.type !== "split")
    ) {
      return null;
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    // Check if customer has a credit account
    if (customer.account.type !== "credit") {
      throw new AppError("Customer does not have a credit account", 400);
    }

    const creditLimit = customer.account.amount;
    const currentUsedAmount = customer.account.usedAmount || 0;
    const currentBalance = customer.account.balance || 0;

    // Calculate amount that would need credit
    let creditAmount = grandTotal;

    if (paymentType.type === "split") {
      creditAmount = Number(paymentType.split.credit_amount);

      // Validate the split payment total matches grand total
      const cashAmount = Number(paymentType.split.cash_amount);
      if (Math.abs(cashAmount + creditAmount - Number(grandTotal)) > 0.01) {
        throw new AppError(
          "Split payment amounts do not add up to grand total",
          400
        );
      }
    }

    // Calculate how much of the credit amount would be covered by existing balance
    const useFromBalance = Math.min(currentBalance, creditAmount);
    const remainingAmount = creditAmount - useFromBalance;

    // Check if remaining amount would exceed credit limit
    if (currentUsedAmount + remainingAmount > creditLimit) {
      throw new AppError(
        `${customer.name} would exceed credit limit. Limit: ${creditLimit}, Used: ${currentUsedAmount}, Required: ${remainingAmount}`,
        400
      );
    }

    // Return customer account information for reference (doesn't actually update anything)
    return {
      account_type: customer.account.type,
      credit_limit: creditLimit,
      current_balance: currentBalance,
      current_used_amount: currentUsedAmount,
      would_use_from_balance: useFromBalance,
      would_use_from_credit: remainingAmount,
      new_balance_would_be: currentBalance - useFromBalance,
      new_used_amount_would_be: currentUsedAmount + remainingAmount,
    };
  }

  async checkInventoryAvailability(productId, quantity, storeId) {
    // Check batches for available quantity
    const batches = await BatchInventoryModel.find({
      product_id: productId,
      store_id: storeId,
      status: "active",
      current_quantity: { $gt: 0 },
    });

    const totalAvailable = batches.reduce(
      (sum, batch) => sum + batch.current_quantity,
      0
    );

    return {
      product_id: productId,
      quantity_requested: quantity,
      quantity_available: totalAvailable,
      is_available: totalAvailable >= quantity,
      batches: batches.map((batch) => ({
        batch_number: batch.batch_number,
        expiry_date: batch.expiry_date,
        quantity: batch.current_quantity,
      })),
    };
  }

  async createQuotation(request) {
    const {
      customer,
      quotation_items, // Changed from sold_items to quotation_items
      shipping_charges = 0,
      ...data
    } = request.body;

    if (
      !quotation_items ||
      !Array.isArray(quotation_items) ||
      quotation_items.length === 0
    ) {
      throw new AppError("Quotation items are required", 400);
    }

    if (
      !customer &&
      (data.payment_type.type === "credit" ||
        data.payment_type.type === "split")
    ) {
      throw new AppError(
        "Please select customer before proceeding with credit payment quotation.",
        400
      );
    }

    const productIds = quotation_items.map((item) => item.product);
    const products = await Product.find({
      _id: { $in: productIds },
      store_id: request.user.store_id,
    });

    if (products.length !== quotation_items.length) {
      throw new AppError(
        "Some products not found or don't belong to this store",
        404
      );
    }

    // Check inventory availability without updating
    const inventoryChecks = [];
    for (const item of quotation_items) {
      const product = products.find((p) => p._id.toString() === item.product);

      const availabilityCheck = await this.checkInventoryAvailability(
        item.product,
        item.quantity,
        request.user.store_id
      );

      if (!availabilityCheck.is_available) {
        throw new AppError(
          `Insufficient stock for product: ${product.prod_name}. Available: ${availabilityCheck.quantity_available}, Requested: ${item.quantity}`,
          400
        );
      }

      inventoryChecks.push(availabilityCheck);
    }

    let customerCreditCheck = null;
    if (customer) {
      customerCreditCheck = await this.validateCustomerCredit(
        customer,
        data.grand_total,
        data.payment_type
      );
    }

    const items = quotation_items.map((item) => ({
      product_id: item.product,
      quantity: item.quantity,
      sale_price: item.sale_price,
      discount_amount: item.discount_amount || 0,
    }));

    const quotationData = {
      quotation_number: this.generateQuotationNumber(data.date || new Date()),
      customer: customer ? new mongoose.Types.ObjectId(customer) : null,
      store_id: request.user.store_id,
      quotation_items: items,
      discount_value: data.discount_value || 0,
      grand_total: data.grand_total,
      shipping_charges: shipping_charges || 0,
      payment_type: this.modifyPaymentType(data.payment_type),
      status: "active",
      validity: data.validity || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      note: data.note || "",
      added_by: request.user._id,
      date: data.date || new Date(),
      verification_details: {
        inventory_checks: inventoryChecks,
        customer_credit_check: customerCreditCheck,
      },
    };

    const quotation = await QuotationModel.create(quotationData);

    // Send notification
    await notificationService.sendNotification(
      {
        title: "New Quotation Created",
        message: `A new quotation #${
          quotation.quotation_number
        } has been created${
          customer ? " for " + (await Customer.findById(customer)).name : ""
        }.`,
        type: "QUOTATION",
      },
      request.user._id
    );

    return quotation;
  }

  async findQuotation(filterQuery) {
    const quotation = await QuotationModel.findById(filterQuery.id);

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    return quotation;
  }

  async findAllQuotations(filterQuery, { user }) {
    // Build base query
    let query = {};

    // Apply filters if provided in filterQuery
    if (filterQuery.status) {
      query.status = filterQuery.status;
    }

    if (filterQuery.customer) {
      query.customer = new mongoose.Types.ObjectId(filterQuery.customer);
    }

    if (
      filterQuery.date &&
      filterQuery.date.from_date &&
      filterQuery.date.to_date
    ) {
      query.date = {
        $gte: new Date(filterQuery.date.from_date),
        $lte: new Date(filterQuery.date.to_date),
      };
    }

    // Add store filter for non-super-admin users
    if (user && user.role !== "super_admin") {
      query.store_id = new mongoose.Types.ObjectId(user.store_id);
    }

    // Fetch quotations
    const quotations = await QuotationModel.find(query).sort({ createdAt: -1 });

    // Calculate additional fields for each quotation
    const formattedQuotations = quotations.map((quotation) => {
      // Calculate totals
      const total_items = quotation.quotation_items.length;
      const total_quantity = quotation.quotation_items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const total_value = quotation.quotation_items.reduce(
        (sum, item) => sum + item.quantity * item.sale_price,
        0
      );

      return {
        ...quotation.toObject(),
        total_items,
        total_quantity,
        total_value,
      };
    });

    return formattedQuotations;
  }

  async updateQuotation(filterQuery, quotationData, request) {
    // Find existing quotation
    const existingQuotation = await QuotationModel.findById(filterQuery.id);

    if (!existingQuotation) {
      throw new AppError("Quotation not found", 404);
    }

    // Don't allow updates to converted quotations
    if (existingQuotation.status === "converted") {
      throw new AppError(
        "Cannot update a quotation that has been converted to a sale",
        400
      );
    }

    const { customer, quotation_items, shipping_charges, ...data } =
      quotationData;

    // Check if items have changed
    let itemsChanged = false;
    if (quotation_items) {
      if (!Array.isArray(quotation_items) || quotation_items.length === 0) {
        throw new AppError("Quotation items are required", 400);
      }

      // Check if the arrays are different lengths
      if (existingQuotation.quotation_items.length !== quotation_items.length) {
        itemsChanged = true;
      } else {
        // Check if any items have changed quantity or product
        const existingMap = existingQuotation.quotation_items.reduce(
          (map, item) => {
            map[item.product_id.toString()] = item;
            return map;
          },
          {}
        );

        for (const item of quotation_items) {
          const existingItem = existingMap[item.product];
          if (
            !existingItem ||
            existingItem.quantity !== item.quantity ||
            existingItem.sale_price !== item.sale_price
          ) {
            itemsChanged = true;
            break;
          }
        }
      }

      // If items changed, validate the new items
      if (itemsChanged) {
        const productIds = quotation_items.map((item) => item.product);
        const products = await Product.find({
          _id: { $in: productIds },
          store_id: request.user.store_id,
        });

        if (products.length !== quotation_items.length) {
          throw new AppError(
            "Some products not found or don't belong to this store",
            404
          );
        }

        // Check stock availability for new items
        for (const item of quotation_items) {
          const product = products.find(
            (p) => p._id.toString() === item.product
          );

          const availabilityCheck = await this.checkInventoryAvailability(
            item.product,
            item.quantity,
            request.user.store_id
          );

          if (!availabilityCheck.is_available) {
            throw new AppError(
              `Insufficient stock for product: ${product.prod_name}. Available: ${availabilityCheck.quantity_available}, Requested: ${item.quantity}`,
              400
            );
          }
        }
      }
    }

    // Prepare quotation items
    const items = quotation_items
      ? quotation_items.map((item) => ({
          product_id: item.product,
          quantity: item.quantity,
          sale_price: item.sale_price,
          discount_amount: item.discount_amount || 0,
        }))
      : existingQuotation.quotation_items;

    // Check customer credit if customer or payment info changed
    const customerChanged =
      customer && customer !== existingQuotation.customer?.toString();
    const paymentTypeChanged =
      data.payment_type &&
      data.payment_type.type !== existingQuotation.payment_type?.type;
    const amountChanged =
      data.grand_total &&
      Number(data.grand_total) !== Number(existingQuotation.grand_total);

    let customerCreditCheck =
      existingQuotation.verification_details?.customer_credit_check;

    if (customerChanged || paymentTypeChanged || amountChanged) {
      const customerId = customer || existingQuotation.customer;
      const grandTotal = data.grand_total || existingQuotation.grand_total;
      const paymentType = data.payment_type || existingQuotation.payment_type;

      if (
        customerId &&
        (paymentType.type === "credit" || paymentType.type === "split")
      ) {
        customerCreditCheck = await this.validateCustomerCredit(
          customerId,
          grandTotal,
          paymentType
        );
      }
    }

    // Prepare inventory checks if items changed
    let inventoryChecks =
      existingQuotation.verification_details?.inventory_checks || [];

    if (itemsChanged) {
      inventoryChecks = [];
      for (const item of items) {
        const availabilityCheck = await this.checkInventoryAvailability(
          item.product_id,
          item.quantity,
          request.user.store_id
        );
        inventoryChecks.push(availabilityCheck);
      }
    }

    // Prepare update data
    const updateData = {
      ...data,
      shipping_charges:
        shipping_charges || existingQuotation.shipping_charges || 0,
      customer: customer
        ? new mongoose.Types.ObjectId(customer)
        : existingQuotation.customer,
      quotation_items: items,
      payment_type: data.payment_type
        ? this.modifyPaymentType(data.payment_type)
        : existingQuotation.payment_type,
      verification_details: {
        inventory_checks: inventoryChecks,
        customer_credit_check: customerCreditCheck,
      },
    };

    // Update the quotation
    const updatedQuotation = await QuotationModel.findByIdAndUpdate(
      filterQuery.id,
      updateData,
      { new: true }
    );

    return updatedQuotation;
  }

  async deleteQuotation(filterQuery) {
    const quotation = await QuotationModel.findById(filterQuery.id);

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    // Don't allow deletion of converted quotations
    if (quotation.status === "converted") {
      throw new AppError(
        "Cannot delete a quotation that has been converted to a sale",
        400
      );
    }

    // Delete the quotation
    await QuotationModel.findByIdAndDelete(quotation._id);

    return quotation;
  }

  async convertToSale(quotationId, request) {
    // Find the quotation
    const quotation = await QuotationModel.findById(quotationId);

    if (!quotation) {
      throw new AppError("Quotation not found", 404);
    }

    if (quotation.status === "converted") {
      throw new AppError(
        "This quotation has already been converted to a sale",
        400
      );
    }

    if (quotation.status === "expired" || quotation.status === "cancelled") {
      throw new AppError(
        "Cannot convert an expired or cancelled quotation",
        400
      );
    }

    // Verify current stock availability before conversion
    for (const item of quotation.quotation_items) {
      const availabilityCheck = await this.checkInventoryAvailability(
        item.product_id,
        item.quantity,
        request.user.store_id
      );

      if (!availabilityCheck.is_available) {
        const product = await Product.findById(item.product_id);
        throw new AppError(
          `Cannot convert: Insufficient stock for product: ${product.prod_name}. Available: ${availabilityCheck.quantity_available}, Requested: ${item.quantity}`,
          400
        );
      }
    }

    // Store the original request body
    const originalBody = request.body;

    try {
      // Prepare request body for sale creation
      request.body = {
        customer: quotation.customer,
        sold_items: quotation.quotation_items.map((item) => ({
          product: item.product_id,
          quantity: item.quantity,
          sale_price: item.sale_price,
          discount_amount: item.discount_amount || 0,
        })),
        sale_type: "sale",
        payment_type: quotation.payment_type,
        payment_status: "paid", // Default to paid for the actual sale
        discount_value: quotation.discount_value,
        shipping_charges: quotation.shipping_charges,
        grand_total: quotation.grand_total,
        note: `Created from quotation #${quotation.quotation_number}. ${
          quotation.note || ""
        }`,
        date: quotation.date, // Use current date for the actual sale
      };

      // Create the actual sale using the sale service
      const sale = await saleService.createSale(request);

      // Update the quotation status to converted
      await QuotationModel.findByIdAndUpdate(quotationId, {
        status: "converted",
        converted_to_sale: {
          sale_id: sale._id,
          converted_date: new Date(),
          converted_by: request.user._id,
        },
      });

      // Send notification about conversion
      await notificationService.sendNotification(
        {
          title: "Quotation Converted to Sale",
          message: `Quotation #${quotation.quotation_number} has been converted to Sale #${sale.sale_number}.`,
          type: "SALE",
        },
        request.user._id
      );

      return sale;
    } finally {
      // Restore the original request body
      request.body = originalBody;
    }
  }

  // Additional utility method to check and update expired quotations
  async updateExpiredQuotations() {
    const now = new Date();

    // Find and update all expired quotations
    const expiredQuotations = await QuotationModel.updateMany(
      {
        status: "active",
        validity: { $lt: now },
      },
      { $set: { status: "expired" } }
    );

    return expiredQuotations.nModified;
  }
}

export default new QuotationService();
