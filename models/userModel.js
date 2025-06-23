import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { defaultPermissions } from "../utils/permissions.js";
const ModulePermissionSchema = new mongoose.Schema(
  {
    add: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    view: { type: Boolean, default: false },
  },
  { _id: false }
);

const PermissionsSchema = new mongoose.Schema(
  {
    product: ModulePermissionSchema,
    category: ModulePermissionSchema,
    company: ModulePermissionSchema,
    unit: ModulePermissionSchema,
    sale: ModulePermissionSchema,
    purchase: ModulePermissionSchema,
    store: ModulePermissionSchema,
    user: ModulePermissionSchema,
    report: ModulePermissionSchema,
    salePerson: ModulePermissionSchema,
  },
  { _id: false }
);

const User = new mongoose.Schema(
  {
    prefix: { type: String, required: false, default: "Mr." },
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    cnic: { type: String, index: true },
    contact_no: { type: String, required: true },
    image: { type: String, default: "" },

    address: {
      country: { type: String, default: "" },
      province: { type: String, default: "" },
      city: { type: String, default: "" },
    },

    status: { type: String, enum: ["active", "inactive"], default: "active" },

    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: function () {
        return this.role !== "super_admin";
      },
    },

    created_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    role: {
      type: String,
      enum: ["super_admin", "manager", "user"],
      required: true,
    },
    permissions: {
      type: PermissionsSchema,
      default: function () {
        return defaultPermissions[this.role] || defaultPermissions.user;
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
User.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
User.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
  }
  next();
});

User.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Middleware to remove related data
User.pre("remove", async function (next) {
  try {
    if (this.role === "manager") {
      const Store = mongoose.model("Store");

      const Product = mongoose.model("Product");

      const User = mongoose.model("User");

      // Find the store associated with this manager
      const store = await Store.findById(this.store_id);

      if (store) {
        // Delete all products associated with this store
        const productIds = store.products.map((p) => p.product_id);
        await Product.deleteMany({ _id: { $in: productIds } });

        // Delete the store
        await Store.findByIdAndDelete(store._id);

        // Delete all users associated with this store
        await User.deleteMany({ store_id: store._id });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware to auto-populate refs with specific fields
function autoPopulateRefs(next) {
  this.populate({
    path: "created_by",
    select: "name _id",
  });
  next();
}

// Apply the middleware
User.pre("find", autoPopulateRefs)
  .pre("findOne", autoPopulateRefs)
  .pre("findOneAndUpdate", autoPopulateRefs);

export default mongoose.model("User", User);
