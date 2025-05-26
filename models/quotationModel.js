import mongoose from "mongoose";

const QuotationSchema = new mongoose.Schema(
  {
    quotation_number: { type: String, required: true },
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: "Customer",
      default: null,
    },
    store_id: { type: mongoose.Schema.ObjectId, ref: "Store", required: true },
    quotation_items: [
      {
        product_id: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        sale_price: { type: Number, required: true },
        discount_amount: { type: Number, default: 0 },
      },
    ],
    discount_value: { type: Number, default: 0 },
    shipping_charges: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },
    payment_type: {
      type: { type: String, required: false },
      cash: {
        type: {
          type: String,
        },
        by_hand: {
          invoice: String,
        },
        online: {
          invoice: String,
          receipt: String,
        },
      },
      credit: {
        invoice: String,
      },
      split: {
        type: { type: String },
        cash_amount: { type: Number },
        credit_amount: { type: Number },
        by_hand: {
          invoice: String,
        },
        online: {
          invoice: String,
          receipt: String,
        },
      },
    },
    status: {
      type: String,
      enum: ["active", "expired", "converted", "cancelled"],
      default: "active",
    },
    validity: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      },
    },
    note: { type: String, default: "" },
    added_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    converted_to_sale: {
      sale_id: { type: mongoose.Schema.ObjectId, ref: "Sale" },
      converted_date: { type: Date },
      converted_by: { type: mongoose.Schema.ObjectId, ref: "User" },
    },
    verification_details: {
      inventory_checks: [Object],
      customer_credit_check: Object,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Middleware to auto-populate refs
QuotationSchema.pre("find", function (next) {
  this.populate([
    { path: "customer", select: "name contact_no image account" },
    { path: "store_id", select: "name address" },
    { path: "added_by", select: "name image role" },
    {
      path: "quotation_items.product_id",
      select: "prod_name prod_code sku images maximum_retail_price",
    },
  ]);
  next();
});

QuotationSchema.pre("findOne", function (next) {
  this.populate([
    { path: "customer", select: "name contact_no image account" },
    { path: "store_id", select: "name address" },
    { path: "added_by", select: "name image role" },
    {
      path: "quotation_items.product_id",
      select: "prod_name prod_code sku images maximum_retail_price",
    },
  ]);
  next();
});

const QuotationModel = mongoose.model("Quotation", QuotationSchema);
export default QuotationModel;
