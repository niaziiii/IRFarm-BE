import Joi from "joi";
const customerSchema = Joi.object({
  name: Joi.string().min(3).required(),
}).unknown();

export default customerSchema;
