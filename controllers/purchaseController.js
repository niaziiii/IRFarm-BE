import purchaseModel from "../models/purchaseModel.js";
import purchaseService from "../services/purchaseService.js";
import catchAsync from "../utils/catchAsync.js";
import { getSalePurchaseStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

const createPurchase = catchAsync(async (req, res, next) => {
  const purchase = await purchaseService.createPurchase(req);
  return successResponse(res, purchase);
});

const findPurchase = catchAsync(async (req, res, next) => {
  const purchase = await purchaseService.findPurchase(req.params);
  return successResponse(res, purchase);
});

const findAllPurchases = catchAsync(async (req, res, next) => {
  const purchase = await purchaseService.findAllPurchases(req.body, req);
  const count = await getSalePurchaseStatusCounts(
    req,
    purchaseModel,
    "purchase"
  );

  return successResponse(res, purchase, count);
});

const updatePurchase = catchAsync(async (req, res, next) => {
  const purchase = await purchaseService.updatePurchase(
    req.params,
    req.body,
    req
  );
  return successResponse(res, purchase);
});

const deletePurchase = catchAsync(async (req, res, next) => {
  const purchase = await purchaseService.deletePurchase(req.params, req);
  return successResponse(res, purchase);
});

const filteredPurchaseList = catchAsync(async (req, res, next) => {
  const purchase = await purchaseService.filteredPurchaseList(req.body);
  return successResponse(res, purchase, purchase.length);
});

export default {
  createPurchase,
  findPurchase,
  findAllPurchases,
  updatePurchase,
  deletePurchase,
  filteredPurchaseList,
};
