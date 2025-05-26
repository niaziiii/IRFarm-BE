import mongoose from "mongoose";

const BatchInventory = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: true,
    },
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
    },
    purchase_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Purchase",
      required: true,
    },
    batch_number: {
      type: String,
      required: true,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    initial_quantity: {
      type: Number,
      required: true,
      min: [0, "Initial quantity cannot be negative"],
    },
    current_quantity: {
      type: Number,
      required: true,
      min: [0, "Current quantity cannot be negative"],
    },
    purchase_price: {
      type: Number,
      required: true,
      min: [0, "Purchase price cannot be negative"],
    },
    status: {
      type: String,
      enum: ["active", "depleted", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

BatchInventory.index(
  { product_id: 1, store_id: 1, batch_number: 1 },
  { unique: true }
);

BatchInventory.index({ status: 1, current_quantity: 1 });
BatchInventory.index({ expiry_date: 1 });

function autoPopulateProduct(next) {
  this.populate({
    path: "product_id",
    select:
      "prod_name prod_code sku maximum_retail_price actual_retail_price whole_sale_price images company category",
  });
  next();
}

BatchInventory.pre("find", autoPopulateProduct);
BatchInventory.pre("findOne", autoPopulateProduct);
BatchInventory.pre("findOneAndUpdate", autoPopulateProduct);
BatchInventory.pre("findOneAndDelete", autoPopulateProduct);

const InventoryTransaction = new mongoose.Schema(
  {
    batch_inventory_id: {
      type: mongoose.Schema.ObjectId,
      ref: "BatchInventory",
      required: true,
    },
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: "Customer",
      default: null,
    },
    transaction_type: {
      type: String,
      enum: ["purchase", "sale", "adjustment", "return"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reference_id: {
      type: mongoose.Schema.ObjectId,
      refPath: "reference_model",
      required: true,
    },
    reference_model: {
      type: String,
      enum: ["Purchase", "Sale", "Adjustment"],
      required: true,
    },
    performed_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const BatchInventoryModel = mongoose.model(
  "BatchInventory",
  BatchInventory
);
export const InventoryTransactionModel = mongoose.model(
  "InventoryTransaction",
  InventoryTransaction
);
