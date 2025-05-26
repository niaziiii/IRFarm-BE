import mongoose from "mongoose";
import AppError from "../utils/apiError.js";

const PurchaseItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "Product is required"],
  },
  batch_number: {
    type: String,
    required: [true, "Batch number is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  purchase_price: {
    type: Number,
    required: [true, "Purchase price is required"],
    min: [0, "Purchase price cannot be negative"],
  },
  manufactured_date: {
    type: Date,
    required: [true, "Manufacturing date is required"],
    validate: {
      validator: function (value) {
        return value <= new Date();
      },
      message: "Manufacturing date cannot be in the future",
    },
  },
  expiry_date: {
    type: Date,
    required: [true, "Expiry date is required"],
    validate: {
      validator: function (value) {
        return value > this.manufactured_date;
      },
      message: "Expiry date must be after manufacturing date",
    },
  },
});

const PurchaseSchema = new mongoose.Schema(
  {
    payment_type: {
      type: { type: String, required: false }, // e.g., 'cash', 'credit', or 'split'
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
    purchased_type: {
      type: String,
      enum: ["purchased", "returned"],
      required: true,
      default: "purchased",
    },
    purchase_number: {
      type: String,
      unique: true,
      required: true,
      message: "Purchase number is required",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    supplier: {
      type: mongoose.Schema.ObjectId,
      ref: "Company",
      required: [true, "Supplier is required"],
    },
    supplier_account_details: {
      transaction_id: {
        type: mongoose.Schema.ObjectId,
        ref: "CompanyCreditTransaction",
      },
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
    },
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: [true, "Store is required"],
    },
    order_status: {
      type: String,
      required: true,
      enum: {
        values: ["pending", "received", "order"],
        message: "Invalid order status",
      },
      default: "draft",
    },

    order_items: [PurchaseItemSchema],

    discount_value: {
      type: Number,
      default: 0,
      min: 0,
    },
    shipping_charges: {
      type: Number,
      default: 0,
      min: 0,
    },
    grand_total: {
      type: Number,
      required: true,
      min: 0,
    },
    note: String,
    added_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
PurchaseSchema.index({ purchase_number: 1 }, { unique: true });
PurchaseSchema.index({ supplier: 1 });
PurchaseSchema.index({ store_id: 1 });
PurchaseSchema.index({ date: 1 });
PurchaseSchema.index({ order_status: 1 });

// Auto-populate references
PurchaseSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: "supplier",
      select: "name contact_person phone email",
    },
    {
      path: "store_id",
      select: "name",
    },
    {
      path: "added_by",
      select: "name email",
    },
    {
      path: "order_items.product_id",
      select: "prod_name sku prod_code unit_profile",
    },
  ]);
  next();
});

// Static method to get purchase statistics
PurchaseSchema.statics.getPurchaseStats = async function (
  storeId,
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        store_id: new mongoose.Types.ObjectId(storeId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        totalAmount: { $sum: "$grand_total" },
        averageAmount: { $avg: "$grand_total" },
        totalPaid: { $sum: "$amount_paid" },
        totalDue: { $sum: "$balance_due" },
      },
    },
  ]);
};

export default mongoose.model("Purchase", PurchaseSchema);
