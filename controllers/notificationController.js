import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";
import notificationService from "../services/notificationService.js";

const getUserNotifications = catchAsync(async (req, res, next) => {
  const result = await notificationService.getUserNotifications(req, res, next);
  return successResponse(res, result);
});

const markAsRead = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const result = await notificationService.markAsRead(id, req.user._id);
  return successResponse(res, result);
});

const markAllAsRead = catchAsync(async (req, res, next) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  return successResponse(res, result);
});

export default {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
