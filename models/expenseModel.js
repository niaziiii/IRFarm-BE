import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      // enum: [
      //   "salary",
      //   "utility",
      //   "rent",
      //   "inventory",
      //   "equipment",
      //   "maintenance",
      //   "marketing",
      //   "insurance",
      //   "tax",
      //   "transportation",
      //   "other",
      // ],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit"],
    },
    description: String,
    image: String,
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "pending",
      index: true,
    },
    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
expenseSchema.index({ store_id: 1, date: -1 });

expenseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Expense", expenseSchema);

const expenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
expenseCategorySchema.index({ store_id: 1, name: 1 }, { unique: true });

expenseCategorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const expenseCategoryModel = mongoose.model(
  "ExpenseCategory",
  expenseCategorySchema
);
