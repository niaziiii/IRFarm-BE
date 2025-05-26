// validation.js
import Joi from "joi";

const companySchema = Joi.object({
  name: Joi.string().required(),
}).unknown();

export default companySchema;
