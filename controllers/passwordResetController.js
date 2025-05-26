import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";
import passwordResetService from "../services/passwordResetServices.js";

const forgotPassword = catchAsync(async (req, res, next) => {
  const result = await passwordResetService.forgotPassword(req);
  return successResponse(res, result);
});

const resetPassword = catchAsync(async (req, res, next) => {
  const result = await passwordResetService.resetPassword(req);
  return successResponse(res, result);
});

export default {
  forgotPassword,
  resetPassword,
};
