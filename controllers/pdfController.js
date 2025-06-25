import pdfService from "../services/pdfService.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/apiError.js";
import { successResponse } from "../utils/responseFormat.js";
import { generateExpenseReportHTML } from "../utils/pdf-reports/expense.js";
import { generateSaleReportHTML } from "../utils/pdf-reports/sale.js";
import { getStoreInfo } from "./storeController.js";
import { generatePurchaseReportHTML } from "../utils/pdf-reports/purchase.js";
import { generateCustomerLadgerReportHTML } from "../utils/pdf-reports/customerLadger.js";
import { generateSupplierLadgerReportHTML } from "../utils/pdf-reports/supplierLadger.js";
import { generateSingleProductLadgerReportHTML } from "../utils/pdf-reports/product.js";
import { generateProductListReportHTML } from "../utils/pdf-reports/productList.js";
import { generateFinancialOverviewReportHTML } from "../utils/pdf-reports/financialOverview.js";
import { generateCustomerListReportHTML } from "../utils/pdf-reports/customerList.js";

const generateExpenseReport = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Expenses Report"
  );

  const html = generateExpenseReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

const generateSaleReport = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Sale Report"
  );

  const html = generateSaleReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

const generatePurchaseReport = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Purchase Report"
  );

  const html = generatePurchaseReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

const generateCustomerLadgerReport = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Ladger Report"
  );

  const html = generateCustomerLadgerReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

const generateSupplierLadgerReport = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Ladger Report"
  );

  const html = generateSupplierLadgerReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

const generateProductLadgerReport = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Ladger Report"
  );

  const html = generateSingleProductLadgerReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

const generateProductListReport = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Ladger Report"
  );

  const html = generateProductListReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

const generateFinancialOverviewReport = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Financial Overview"
  );

  const html = generateFinancialOverviewReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

const generateCustomerList = catchAsync(async (req, res, next) => {
  const { data } = req.body;
  if (!data) {
    throw new AppError("data is required.", 400);
  }

  const options = await getStoreInfo(
    req.user.store_id,
    req.user.role,
    "Customer List"
  );

  const html = generateCustomerListReportHTML(data, options);
  const pdfResult = await pdfService.generatePDFReport(html, options);
  return successResponse(res, pdfResult);
});

export default {
  generateExpenseReport,
  generateSaleReport,
  generatePurchaseReport,
  generateCustomerLadgerReport,
  generateSupplierLadgerReport,
  generateProductLadgerReport,
  generateProductListReport,
  generateFinancialOverviewReport,
  generateCustomerList,
};
