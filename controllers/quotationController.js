import QuotationModel from "../models/quotationModel.js";
import quotationService from "../services/quotationService.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

// Helper function to get status counts
const getQuotationStatusCounts = async (req) => {
  const { user } = req;

  // Base query for counting
  const baseQuery =
    user && user.role !== "super_admin" ? { store_id: user.store_id } : {};

  // Count quotations by status
  const [active, expired, converted, cancelled, total] = await Promise.all([
    QuotationModel.countDocuments({ ...baseQuery, status: "active" }),
    QuotationModel.countDocuments({ ...baseQuery, status: "expired" }),
    QuotationModel.countDocuments({ ...baseQuery, status: "converted" }),
    QuotationModel.countDocuments({ ...baseQuery, status: "cancelled" }),
    QuotationModel.countDocuments(baseQuery),
  ]);

  return {
    active,
    expired,
    converted,
    cancelled,
    total,
  };
};

const createQuotation = catchAsync(async (req, res, next) => {
  const quotation = await quotationService.createQuotation(req);
  return successResponse(res, quotation);
});

const findQuotation = catchAsync(async (req, res, next) => {
  const quotation = await quotationService.findQuotation(req.params);
  return successResponse(res, quotation);
});

const findAllQuotations = catchAsync(async (req, res, next) => {
  const quotations = await quotationService.findAllQuotations(req.body, req);
  const counts = await getQuotationStatusCounts(req);
  return successResponse(res, quotations, counts);
});

const updateQuotation = catchAsync(async (req, res, next) => {
  const quotation = await quotationService.updateQuotation(
    req.params,
    req.body,
    req
  );
  return successResponse(res, quotation);
});

const deleteQuotation = catchAsync(async (req, res, next) => {
  const quotation = await quotationService.deleteQuotation(req.params);
  return successResponse(res, quotation);
});

const convertToSale = catchAsync(async (req, res, next) => {
  const sale = await quotationService.convertToSale(req.params.id, req);
  return successResponse(res, sale);
});

const cancelQuotation = catchAsync(async (req, res, next) => {
  const quotation = await QuotationModel.findByIdAndUpdate(
    req.params.id,
    { status: "cancelled" },
    { new: true }
  );

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  return successResponse(res, quotation);
});

// Route to manually refresh expired quotations
const refreshExpiredStatus = catchAsync(async (req, res, next) => {
  const updatedCount = await quotationService.updateExpiredQuotations();
  return successResponse(res, { updated_quotations: updatedCount });
});

export default {
  createQuotation,
  findQuotation,
  findAllQuotations,
  updateQuotation,
  deleteQuotation,
  convertToSale,
  cancelQuotation,
  refreshExpiredStatus,
};
