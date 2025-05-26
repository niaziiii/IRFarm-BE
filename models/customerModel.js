import mongoose from "mongoose";
const Customer = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    name: { type: String, required: false, index: true },
    cnic: { type: String, required: false, index: true },
    contact_no: { type: String, required: false },
    image: { type: String, default: "" },
    reference: { type: String, default: "" },
    description: { type: String, default: "" },

    address: {
      country: { type: String, default: "" },
      province: { type: String, default: "" },
      city: { type: String, default: "" },
    },

    account: {
      type: { type: String, enum: ["cash", "credit"], required: true },
      amount: {
        type: Number,
        required: false,
        default: 0, // This remains as credit limit
      },
      usedAmount: {
        type: Number,
        required: false,
        default: 0, // This tracks how much credit is used
      },
      balance: {
        type: Number,
        required: false,
        default: 0, // This represents actual money the customer holds
      },
    },
    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
      message: "Customer store must be required",
    },
  },
  { timestamps: true }
);

const CustomerCreditTransaction = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    sale_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Sale",
    },
    transaction_type: {
      type: String,
      enum: [
        "sale",
        "return",
        "initial-credit",
        "balance-updated",
        "payment",
        "manual-adjustment",
        "Balance-Added",
        "Balance-Excluding",
      ],
      required: true,
    },
    payment_type: {
      type: String,
      enum: ["cash", "credit", "split"],
    },
    previous_balance: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    cash_amount: {
      type: Number,
    },
    credit_amount: {
      type: Number,
    },
    remaining_balance: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
    },
    added_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    note: String,
    slip: String,
  },
  { timestamps: true }
);

// Pre-save middleware to populate references
CustomerCreditTransaction.pre("find", function (next) {
  this.populate([
    { path: "customer_id", select: "name contact_no" },
    { path: "added_by", select: "name" },
  ]);
  next();
});

// Middleware to auto-populate refs with specific fields
function autoPopulateRefs(next) {
  this.populate({
    path: "created_by",
    select: "name _id image",
  });

  next();
}

Customer.pre("find", autoPopulateRefs).pre("findOne", autoPopulateRefs);

export default mongoose.model("Customer", Customer);

export const CustomerCreditTransactionModel = mongoose.model(
  "CustomerCreditTransaction",
  CustomerCreditTransaction
);
