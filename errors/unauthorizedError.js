import CustomAPIError from "./customError.js";
import { StatusCodes } from "http-status-codes";

class UnAuthorizedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
    this.name = "UnauthorizedError";
    this.isOperational = true;
  }
}

export default UnAuthorizedError;
