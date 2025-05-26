import mongoose from "mongoose";
const Warehouse = new mongoose.Schema(
  {
    name: { type: String, required: true },
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
    },
    city: { type: String, required: true },
    province: { type: String, required: false },
    country: { type: String, required: false },
    address: { type: String, required: false },
    description: { type: String, required: false },
    image: { type: String, required: false },
    products: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 0 }, // Add quantity to track how many of each product
      },
    ],
    manager: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    }, //REF user
  },
  { timestamps: true }
);

// Middleware to auto-populate refs with specific fields
function autoPopulateRefs(next) {
  const options = this.getOptions ? this.getOptions() : {};

  if (!options.skipPopulate) {
    this.populate({
      path: "store_id",
      select: "name address",
    });
  }
  this.populate({
    path: "manager",
    select: "_id name",
  });
  next();
}

// Apply the middleware
Warehouse.pre("find", autoPopulateRefs).pre("findOne", autoPopulateRefs);
// Pre-remove hook using deleteOne
Warehouse.pre("remove", function (next) {
  console.log({ "Warehouse is about to be removed:": this._id });

  next();
});

export default mongoose.model("Warehouse", Warehouse);
