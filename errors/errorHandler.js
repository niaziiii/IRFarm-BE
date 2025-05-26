import AppError from "../utils/apiError.js";

function getFirstValidationError(error) {
  let message;
  for (const field in error.errors) {
    if (error.errors.hasOwnProperty(field)) {
      message = error.errors[field].message;
    }
  }
  return message;
}
const setCastError = (err) => {
  return new AppError(err.message, 500);
};

const setDuplicateNameError = (err) => {
  // if (err.keyPattern.email === 1) err.keyValue.name = "Email";
  // const msg =
  //   err.keyValue.name === "Email"
  //     ? `Already user has the same: / ${err.keyValue.name} /`
  //     : `Already user has the same name: / ${err.keyValue.name} /`;
  return new AppError(err.message, 404);
};

const setValidatorError = (err) => {
  const msgs = Object.values(err.errors)
    .map((el) => el.message)
    .join(",");
  return new AppError(`/ ${msgs} /`, 404);
};

const ValidationError = (err) => {
  let errorMessage = getFirstValidationError(err);
  return new AppError(errorMessage, 500);
};
const MongooseError = (err) => {
  /*   const msgs = Object.values(err.errors)
    .map((el) => el.message)
    .join(","); */

  return new AppError(err.message, 500);
};
const ReferenceError = (err) => {
  return new AppError(err.message, 500);
};

const setJwtError = (err) => {
  return new AppError(`${err.message}`, 402);
};

const unAuthorizedErrorHandler = (err) => {
  return new AppError(`${err.inner.message}`, 402);
};

const productionError = (err, req, res) => {
  let error = err;

  if (err.name === "UnauthorizedError") error = unAuthorizedErrorHandler(error);
  if (err.name === "MongoNetworkError") error.message = "Mongo Not working";
  if (err.name === "CastError") error = setCastError(error);
  if (err.name === "ValidationError") error = ValidationError(error);
  if (err.name === "MongooseError") error = MongooseError(error);
  if (err.name === "ReferenceError") error = ReferenceError(error);
  if (err.code === 11000) error = setDuplicateNameError(error);

  if (err._message === "Tour validation failed")
    error = setValidatorError(error);
  if (err._message === "users validation failed")
    error = setValidatorError(error);

  if (err.name === "JsonWebTokenError") error = setJwtError(error);
  if (err.name === "TokenExpiredError") error = setJwtError(error);

  return res.status(err.statusCode).json({
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
  });
};

const developmentError = (err, req, res) => {
  res.status(err.statusCode).json({
    name: err.name,
    message: err.message,
    status: err.status,
    statusCode: err.statusCode,
    isOperational: err.isOperational || false,
    stack: err.stack,
  });
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    developmentError(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    productionError(err, req, res);
  }

  next();
};

export default globalErrorHandler;
