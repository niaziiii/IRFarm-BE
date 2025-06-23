import SalePerson from "../models/SalePersonModel.js";
import AppError from "../utils/apiError.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

export const addSalePerson = catchAsync(async (req, res) => {
  const data = req.body;
  data.store_id = req.user.store_id || data.store_id;
  if (!data.store_id) {
    throw new AppError(`Store ID is required to create a sale person`, 400);
  }
  const created = await SalePerson.create(data);
  return successResponse(res, created);
});

export const getAllSalePersons = catchAsync(async (req, res) => {
  const filter =
    req.user.role === "super_admin" ? {} : { store_id: req.user.store_id };
  const salePersons = await SalePerson.find(filter);
  return successResponse(res, salePersons);
});

export const getSalePerson = catchAsync(async (req, res) => {
  const salePerson = await SalePerson.findById(req.params.id);
  return successResponse(res, salePerson);
});

export const updateSalePerson = catchAsync(async (req, res) => {
  const updated = await SalePerson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  return successResponse(res, updated);
});

export const deleteSalePerson = catchAsync(async (req, res) => {
  await SalePerson.findByIdAndDelete(req.params.id);
  return successResponse(res, { message: "Deleted successfully" });
});
