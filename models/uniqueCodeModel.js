// models/uniqueCodeModel.js
import mongoose from "mongoose";

const UniqueCodeSchema = new mongoose.Schema(
  {
    code: { type: Number, required: true },
    type: {
      type: String,
      enum: ["product", "company"],
      required: true,
    },
    store_id: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
      message: "Store id is required",
    },
  },
  { timestamps: true }
);

// Create compound unique index for code and type
UniqueCodeSchema.index({ code: 1, type: 1 }, { unique: true });

export default mongoose.model("UniqueCode", UniqueCodeSchema);
