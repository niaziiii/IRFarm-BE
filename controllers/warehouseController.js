import warehouseService from "../services/warehouseServices.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const createWarehouse = catchAsync(async (req, res, next) => {
  const warehouse = await warehouseService.createWarehouse(req.body);
  return successResponse(res, warehouse);
});

const findWarehouse = catchAsync(async (req, res, next) => {
  const warehouse = await warehouseService.findWarehouse(req.params);
  return successResponse(res, warehouse);
});
const findAllWarehouses = catchAsync(async (req, res, next) => {
  const warehouse = await warehouseService.findAllWarehouses(req);
  return successResponse(res, warehouse);
});

const updateWarehouse = catchAsync(async (req, res, next) => {
  const warehouse = await warehouseService.updateWarehouse(
    req.params,
    req.body
  );
  return successResponse(res, warehouse);
});

const deleteWarehouse = catchAsync(async (req, res, next) => {
  const warehouse = await warehouseService.deleteWarehouse(req.params);
  return successResponse(res, warehouse);
});

export default {
  createWarehouse,
  findWarehouse,
  findAllWarehouses,
  updateWarehouse,
  deleteWarehouse,
};
