import mongoose from "mongoose";
import AppError from "../utils/apiError.js";

const Category = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
      message: "Store id is required",
    },
    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      message: "Created by is required",
    },
  },
  { timestamps: true }
);

Category.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    // Customize the error message for duplicate name
    next(
      new AppError(
        "The category name must be unique. This name already exists."
      )
    );
  } else {
    next(new AppError(error.message));
  }
});

function autoPopulateRefs(next) {
  this.populate({
    path: "created_by",
    select: "name _id image",
  });

  next();
}

Category.pre("find", autoPopulateRefs)
  .pre("findOne", autoPopulateRefs)
  .pre("findOneAndUpdate", autoPopulateRefs);

export default mongoose.model("Category", Category);
