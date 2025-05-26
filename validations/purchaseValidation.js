// validation.js
import Joi from "joi";
import mongoose from "mongoose";

// Validate MongoDB ObjectId
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

// Define the Joi schema
const purchaseSchema = Joi.object({
  date: Joi.date().required(),
  order_status: Joi.string().valid("received", "pending", "order").required(),
  payment_status: Joi.string().valid("paid", "unpaid").optional(), // 'required: false' is equivalent to 'optional()'
  grand_total: Joi.number().required(),
  paid: Joi.number().optional(),
  due: Joi.number().optional(),
  note: Joi.string().optional(),
  supplier: Joi.string().custom(objectId).required(),
}).unknown();

export default purchaseSchema;
