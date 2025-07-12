import mongoose from "mongoose";

const Product = new mongoose.Schema(
  {
    prod_name: { type: String, required: true, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    sku: { type: String, required: false }, // barcode
    maximum_retail_price: { type: Number, default: 0, min: 0 },
    minimum_retail_price: { type: Number, default: 0, min: 0 },
    actual_retail_price: { type: Number, default: 0, min: 0 },
    // margin_in_percentage: { type: String, default: "" },
    expiry_date_alert: { type: Date, default: null },
    whole_sale_price: { type: Number, default: 0, min: 0 },
    purchase_price: { type: Number, default: 0, min: 0 },
    // profit_calculate_in_rupees: { type: Number, default: 0, min: 0 },
    profit: {
      retail_price: {
        percentage: { type: String, default: "" },
        rupees: { type: String, default: "" },
      },
    },
    minimum_stock_alert: { type: Number, default: 0 },
    quantity: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    prod_description: { type: String, default: "" },
    prod_code: { type: Number, unique: true },
    unit_profile: {
      unit: { type: mongoose.Schema.ObjectId, ref: "Unit", required: false },
      value: { type: String, default: "" },
    },
    type: {
      type: String,
      enum: ["regular", "trial"],
      required: false,
      default: "regular",
    },
    // Added store_id to associate product with a store
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
    },
    company: { type: mongoose.Schema.ObjectId, ref: "Company", required: true },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Middleware to auto-populate refs with specific fields
function autoPopulateRefs(next) {
  this.populate({
    path: "company",
    select: "name _id",
  })
    .populate({
      path: "category",
      select: "name _id",
    })
    .populate({
      path: "created_by",
      select: "name _id",
    })
    .populate({
      path: "unit_profile.unit",
      select: "name _id",
    })
    .populate({
      path: "store_id",
      select: "name _id",
    });
  next();
}

// Apply the middleware
Product.pre("find", autoPopulateRefs)
  .pre("findOne", autoPopulateRefs)
  .pre("findOneAndUpdate", autoPopulateRefs);

export default mongoose.model("Product", Product);
