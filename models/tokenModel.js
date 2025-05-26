import mongoose from "mongoose";
import AppError from "../utils/apiError.js";

const Token = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

export default mongoose.model("Token", Token);
