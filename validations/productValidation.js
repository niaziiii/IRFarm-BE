import Joi from "joi";
const type = ["regular", "trial"];
const productSchema = Joi.object({
  prod_name: Joi.string().min(3).required(),
  company: Joi.string().required(),
  category: Joi.string().required(),
}).unknown();

export default productSchema;
