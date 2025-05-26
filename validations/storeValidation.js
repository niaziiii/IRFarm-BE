import Joi from "joi";

const storeSchema = Joi.object({
  name: Joi.string().required(),
  products: Joi.array().items(
    Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().required().default(0),
    })
  ),
}).unknown();

export default storeSchema;
