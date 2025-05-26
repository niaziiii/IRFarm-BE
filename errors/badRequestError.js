import { StatusCodes } from "http-status-codes";
import CustomAPIError from "./customError.js";

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
    this.name = "BadRequestError";
    this.isOperational = true;
  }
}
export default BadRequestError;
