import AppError from "../utils/apiError.js";
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    next(new AppError(`${error.details[0].message}`, 500));
  }
  next();
};

export default validateRequest;
