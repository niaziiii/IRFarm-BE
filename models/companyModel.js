import mongoose from "mongoose";
import AppError from "../utils/apiError.js";
import CompanyAccountModel from "./companyAccountModel.js";

const Company = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    registration_no: { type: String, default: "" },
    address: {
      country: { type: String, default: "" },
      province: { type: String, default: "" },
      city: { type: String, default: "" },
    },
    comp_code: { type: Number, unique: true },
    contact_no: [{ type: String }],
    email_address: { type: String },
    website: { type: String, default: "" },
    instagram: [{ type: String }],
    image: { type: String, default: "" },
    up_till: { type: Date },
    account_details: { type: CompanyAccountModel.schema, default: {} },
    reference: { type: String, default: "" },
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

Company.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new AppError(error.message));
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

Company.pre("find", autoPopulateRefs)
  .pre("findOne", autoPopulateRefs)
  .pre("findOneAndUpdate", autoPopulateRefs);

export default mongoose.model("Company", Company);
