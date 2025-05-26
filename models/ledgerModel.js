import mongoose from "mongoose";
import AppError from "../utils/apiError.js";

const Ledger = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    description: { type: String, default: "" },
    unit_symbol: { type: String, default: "" },
    unit_type: { type: String, default: "" },
  },
  { timestamps: true }
);

Ledger.post("save", function (error, doc, next) {
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

export default mongoose.model("Ledger", Ledger);
