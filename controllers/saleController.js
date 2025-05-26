import SaleModel from "../models/saleModel.js";
import saleService from "../services/saleServices.js";
import catchAsync from "../utils/catchAsync.js";
import { getSalePurchaseStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

const createSale = catchAsync(async (req, res, next) => {
  const sale = await saleService.createSale(req);
  return successResponse(res, sale);
});

const findSale = catchAsync(async (req, res, next) => {
  const sale = await saleService.findSale(req.params);
  return successResponse(res, sale);
});

const findAllSales = catchAsync(async (req, res, next) => {
  const sale = await saleService.findAllSales(req.body, req);
  const count = await getSalePurchaseStatusCounts(req, SaleModel, "sale");
  return successResponse(res, sale, count);
});

const updateSale = catchAsync(async (req, res, next) => {
  const sale = await saleService.updateSale(req.params, req.body, req);
  return successResponse(res, sale);
});

const deleteSale = catchAsync(async (req, res, next) => {
  const sale = await saleService.deleteSale(req.params);
  return successResponse(res, sale);
});

export default {
  createSale,
  findSale,
  findAllSales,
  updateSale,
  deleteSale,
};
