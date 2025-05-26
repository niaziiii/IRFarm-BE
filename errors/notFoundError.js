import CustomAPIError from "./customError.js";
import { StatusCodes } from "http-status-codes";

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND;
    this.name = "NotFoundError";
    this.isOperational = true;
  }
}

export default NotFoundError;
