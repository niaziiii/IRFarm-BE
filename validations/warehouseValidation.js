import Joi from "joi";

const warehouseSchema = Joi.object({
  name: Joi.string().required(),
  store_id: Joi.string().required(),
  city: Joi.string().required(),
  products: Joi.array().items(
    Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().required().default(0),
    })
  ), // products array is optional but validated if present
  manager: Joi.string().required(),
}).unknown();

export default warehouseSchema;
