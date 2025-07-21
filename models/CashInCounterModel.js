import mongoose from "mongoose";

const StoreCashBalanceSchema = new mongoose.Schema(
  {
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
      unique: true,
    },
    cash: {
      type: Number,
      default: 0,
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const CashInCounterSchema = new mongoose.Schema(
  {
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
    },
    transaction_type: String,
    is_system_generated: {
      type: Boolean,
      default: false, // Indicates if the transaction was created by the system
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["add", "deduct"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Reference to the user who created this transaction
    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Middleware to auto-populate user info when querying
function autoPopulateRefs(next) {
  this.populate({
    path: "created_by",
    select: "name _id",
  });
  next();
}

// Apply the middleware
CashInCounterSchema.pre("find", autoPopulateRefs)
  .pre("findOne", autoPopulateRefs)
  .pre("findOneAndUpdate", autoPopulateRefs);

export default mongoose.model("CashInCounter", CashInCounterSchema);

export const StoreCashBalanceModel = mongoose.model(
  "StoreCashBalance",
  StoreCashBalanceSchema
);
