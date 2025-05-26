import mongoose from "mongoose";
import AppError from "../utils/apiError.js";

const Unit = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    description: { type: String, default: "" },
    unit_symbol: { type: String, default: "" },
    unit_type: { type: String, default: "" },
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

Unit.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    // Customize the error message for duplicate name
    next(
      // new AppError("The store name must be unique. This name already exists.")
      new AppError(error.message)
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

  // this.populate({
  //   path: "store_id",
  //   select: "+_id name image", // Using +_id to explicitly include it
  //   model: "Store", // Explicitly specify the model
  //   transform: (doc) => {
  //     return {
  //       _id: doc._id,
  //       name: doc.name,
  //       image: doc.image,
  //     };
  //   },
  // });

  next();
}

Unit.pre("find", autoPopulateRefs)
  .pre("findOne", autoPopulateRefs)
  .pre("findOneAndUpdate", autoPopulateRefs);

export default mongoose.model("Unit", Unit);
