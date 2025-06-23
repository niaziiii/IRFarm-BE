import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema(
  {
    sale_number: { type: String, required: true },
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: "Customer",
      default: null,
    },
    customer_account_details: {
      previous_balance: { type: Number },
      deducted_amount: { type: Number },
      remaining_balance: { type: Number },
      credit_used: { type: Number },
      balance_used: { type: Number },
      cash_amount: { type: Number }, // New field for split payments
      credit_amount: { type: Number }, // New field for split payments
      account_type: {
        type: String,
        enum: ["cash", "credit"],
      },
      transaction_id: {
        type: mongoose.Schema.ObjectId,
        ref: "CustomerCreditTransaction",
      },
    },
    sale_type: {
      type: String,
      enum: ["sale", "returned"],
      required: true,
      default: "sale",
    },
    customer_source: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    store_id: { type: mongoose.Schema.ObjectId, ref: "Store", required: true },
    sale_items: [
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
    shipping_charges: { type: Number, default: 0 },
    discount_value: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },
    payment_type: {
      type: { type: String, required: false }, // now: 'cash', 'credit', or 'split'
      cash: {
        type: {
          type: String, // e.g., 'online' or 'by_hand'
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
        type: { type: String }, // 'by_hand' or 'online'
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
    payment_status: {
      type: String,
      enum: ["paid", "loan"],
      default: "paid",
    },
    note: { type: String, default: "" },
    added_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    salePerson: {
      type: mongoose.Schema.ObjectId,
      ref: "SalePerson",
      default: null,
    },
  },
  { timestamps: true }
);

const SaleModel = mongoose.model("Sale", SaleSchema);
export default SaleModel;
