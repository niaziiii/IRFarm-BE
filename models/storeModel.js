import mongoose from "mongoose";
import AppError from "../utils/apiError.js";

const Store = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    description: { type: String, required: false, default: "" },
    image: { type: String, default: "" },
    address: {
      country: { type: String, default: "" },
      province: { type: String, default: "" },
      city: { type: String, default: "" },
    },
    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      message: "Created by is required",
    },
    phone: {
      type: String,
      default: "+91 XXXXXXXXXX",
    },
    email: {
      type: String,
      default: "contact@mail.com",
    },
  },
  { timestamps: true }
);

Store.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new AppError(error.message));
  } else {
    next(new AppError(error.name));
  }
});

// Pre-remove hook to handle product associations
Store.pre("remove", async function (next) {
  console.log({ "Store is about to be removed:": this._id });
  // Update all products associated with this store (set them as inactive)
  await mongoose
    .model("Product")
    .updateMany({ store_id: this._id }, { status: "inactive" });
  next();
});

// Add middleware to limit populated fields
function populateWithLimitedFields(next) {
  this.populate({
    path: "created_by",
    select: "name _id image email", // Only select essential fields
  });

  next();
}

// Apply middleware to find and findOne operations
Store.pre("find", populateWithLimitedFields);
Store.pre("findOne", populateWithLimitedFields);
Store.pre("findOneAndUpdate", populateWithLimitedFields);

export default mongoose.model("Store", Store);
