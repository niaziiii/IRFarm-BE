import reportService from "../services/reportService.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const salesReport = catchAsync(async (req, res, next) => {
  const reportData = await reportService.generateSalesReport(req);
  return successResponse(res, reportData);
});

const inventoryReport = catchAsync(async (req, res, next) => {
  const reportData = await reportService.generateInventoryReport(req);
  return successResponse(res, reportData);
});

const purchaseReport = catchAsync(async (req, res, next) => {
  const reportData = await reportService.generatePurchaseReport(req);
  return successResponse(res, reportData);
});

const financialReport = catchAsync(async (req, res, next) => {
  const reportData = await reportService.generateFinancialReport(req);
  return successResponse(res, reportData);
});

export default {
  salesReport,
  inventoryReport,
  purchaseReport,
  financialReport,
};
