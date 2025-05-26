import mongoose from "mongoose";

const CompanyAccountModel = new mongoose.Schema(
  {
    account_holder_name: {
      type: String,
      required: false,
      default: "",
    },
    bank_name: {
      type: String,
      required: false,
      default: "",
    },
    account_number: {
      type: String,
      required: false,
      default: "",
    },
    iban: {
      type: String,
      required: false,
      default: "",
    },
    branch_address: {
      type: String,
      required: false,
      default: "",
    },
    account: {
      type: { type: String, enum: ["cash", "credit"], required: true },
      amount: {
        type: Number,
        required: false,
        default: 0, // This represents credit limit
      },
      usedAmount: {
        type: Number,
        required: false,
        default: 0, // This tracks how much credit your business has used
      },
      balance: {
        type: Number,
        required: false,
        default: 0, // This represents money your business has with the supplier
      },
    },
    agreement_expiry_date: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

const CompanyCreditTransaction = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    purchase_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Purchase",
    },
    transaction_type: {
      type: String,
      enum: [
        "purchase",
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
      enum: ["cash", "credit", "split"], // Added 'split'
    },
    previous_balance: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // New fields for split payment details
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
CompanyCreditTransaction.pre("find", function (next) {
  this.populate([
    { path: "company_id", select: "name contact_no" },
    { path: "added_by", select: "name" },
  ]);
  next();
});

export const CompanyCreditTransactionModel = mongoose.model(
  "CompanyCreditTransaction",
  CompanyCreditTransaction
);

export default mongoose.model("CompanyAccountModel", CompanyAccountModel);
