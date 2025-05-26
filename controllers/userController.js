import userModel from "../models/userModel.js";
import notificationService from "../services/notificationService.js";
import userService from "../services/userServices.js";
import catchAsync from "../utils/catchAsync.js";
import { getStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

const createUser = catchAsync(async (req, res, next) => {
  const user = await userService.createUser(req);

  await notificationService.sendNotification(
    {
      title: "New User Added",
      message: `${user.name} has been added to store by ${req.user.name}.`,
      type: "CREATE",
    },
    req.user._id
  );
  return successResponse(res, user);
});

const createAdmin = catchAsync(async (req, res, next) => {
  const admin = await userService.createAdmin(req);
  return successResponse(res, admin);
});
const findUser = catchAsync(async (req, res, next) => {
  const user = await userService.findUser(req.params.id);
  return successResponse(res, user);
});

const findAllUsers = catchAsync(async (req, res, next) => {
  const user = await userService.findAllUsers(req);
  const count = await getStatusCounts(req, userModel);

  return successResponse(res, user, count);
});

const updateUser = catchAsync(async (req, res, next) => {
  const user = await userService.updateUser(req.params, req);
  return successResponse(res, user);
});

const deleteUser = catchAsync(async (req, res, next) => {
  const user = await userService.deleteUser(req.params);

  await notificationService.sendNotification(
    {
      title: "User Deleted",
      message: `${user.name} has been deleted from store by ${req.user.name}.`,
      type: "DELETE",
    },
    req.user._id
  );
  return successResponse(res, user);
});

const userProfile = catchAsync(async (req, res, next) => {
  const user = await userService.findUser(req.user._id);
  return successResponse(res, user);
});

const updateProfile = catchAsync(async (req, res, next) => {
  const user = await userService.updateProfile(req.user, req);
  return successResponse(res, user);
});

const findManagers = catchAsync(async (req, res, next) => {
  const managers = await userService.findManagers(req);
  return successResponse(res, managers);
});

const changePassword = catchAsync(async (req, res, next) => {
  const user = await userService.changePassword(req);
  return successResponse(res, user);
});

export default {
  createUser,
  createAdmin,
  findUser,
  findAllUsers,
  updateUser,
  deleteUser,
  findManagers,
  userProfile,
  updateProfile,
  changePassword,
};
