import mongoose from "mongoose";

const SalePersonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    reference: { type: String, default: "" },
    address: {
      country: { type: String, default: "" },
      province: { type: String, default: "" },
      city: { type: String, default: "" },
    },
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
    },
  },
  { timestamps: true }
);

// function autoPopulateRefs(next) {
//   this.populate({
//     path: "store_id",
//     select: "name _id image",
//   });

//   next();
// }

// SalePersonSchema.pre("find", autoPopulateRefs)
//   .pre("findOne", autoPopulateRefs)
//   .pre("findOneAndUpdate", autoPopulateRefs);

const SalePersonModel = mongoose.model("SalePerson", SalePersonSchema);
export default SalePersonModel;
