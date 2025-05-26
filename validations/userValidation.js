// validation.js
import Joi from "joi";
const roles = ["super_admin", "manager", "user"];

const userSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(5).required(),
  role: Joi.string()
    .valid(...roles)
    .required(),
}).unknown();

export default userSchema;
