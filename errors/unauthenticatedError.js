import CustomAPIError from "./customError.js";
import { StatusCodes } from "http-status-codes";

class UnAuthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
    this.name = "UnauthenticatedError";
    this.isOperational = true;
  }
}

export default UnAuthenticatedError;
