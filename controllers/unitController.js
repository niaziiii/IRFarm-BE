import notificationService from "../services/notificationService.js";
import unitService from "../services/unitServices.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const createUnit = catchAsync(async (req, res, next) => {
  const unit = await unitService.createUnit(req, req.body);

  await notificationService.sendNotification(
    {
      title: "New Unit Added",
      message: `${unit.name} has been added to store by ${req.user.name}.`,
      type: "CREATE",
    },
    req.user._id
  );
  return successResponse(res, unit);
});

const findUnit = catchAsync(async (req, res, next) => {
  const unit = await unitService.findUnit(req, req.params);
  return successResponse(res, unit);
});

const findAllUnits = catchAsync(async (req, res, next) => {
  const unit = await unitService.findAllUnits(req);
  return successResponse(res, unit, unit.length);
});

const updateUnit = catchAsync(async (req, res, next) => {
  const unit = await unitService.updateUnit(req, req.params, req.body);
  return successResponse(res, unit);
});

const deleteUnit = catchAsync(async (req, res, next) => {
  const unit = await unitService.deleteUnit(req, req.params);

  await notificationService.sendNotification(
    {
      title: "Unit Deleted",
      message: `${unit.name} has been deleted from store by ${req.user.name}.`,
      type: "DELETE",
    },
    req.user._id
  );
  return successResponse(res, unit);
});

export default {
  createUnit,
  findUnit,
  findAllUnits,
  updateUnit,
  deleteUnit,
};
