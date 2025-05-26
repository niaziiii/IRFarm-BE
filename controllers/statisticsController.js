import statisticsService from "../services/statisticsServices.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const getDashboardStats = catchAsync(async (req, res, next) => {
  const result = await statisticsService.getDashboardStats(req);
  return successResponse(res, result);
});

const getFinancialStats = catchAsync(async (req, res, next) => {
  const result = await statisticsService.getFinancialStats(req);
  return successResponse(res, result);
});

const getInventoryStats = catchAsync(async (req, res, next) => {
  const result = await statisticsService.getInventoryStats(req);
  return successResponse(res, result);
});

export default {
  getDashboardStats,
  getFinancialStats,
  getInventoryStats,
};
