import mongoose from "mongoose";
const CustomerPaymentMode = new mongoose.Schema(
  {
    payment_mode: {
      type: String,
      required: true,
      enum: ["cash", "credit"],
    },

    mobile_no: {
      type: String,
      required: false,
    },

    paid: {
      type: Number,
      required: false,
    },

    balance: {
      type: Number,
      required: false,
    },

    net_receivable: {
      type: Number,
      required: false,
    },

    cash_on_delivery: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CustomerPaymentMode", CustomerPaymentMode);
