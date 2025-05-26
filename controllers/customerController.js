import customerModel from "../models/customerModel.js";
import customerService from "../services/customerServices.js";
import notificationService from "../services/notificationService.js";
import catchAsync from "../utils/catchAsync.js";
import { getStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

const createCustomer = catchAsync(async (req, res, next) => {
  const customer = await customerService.createCustomer(req);

  await notificationService.sendNotification(
    {
      title: "New Customer Added",
      message: `${customer.name} has been added to store by ${req.user.name}.`,
      type: "CREATE",
    },
    req.user._id
  );
  return successResponse(res, customer);
});

const findCustomer = catchAsync(async (req, res, next) => {
  const customer = await customerService.findCustomer(req.params);
  return successResponse(res, customer);
});

const findAllCustomers = catchAsync(async (req, res, next) => {
  const customer = await customerService.findAllCustomers(req);
  const count = await getStatusCounts(req, customerModel);
  return successResponse(res, customer, count);
});

const updateCustomer = catchAsync(async (req, res, next) => {
  const customer = await customerService.updateCustomer(req.params, req);
  return successResponse(res, customer);
});

const deleteCustomer = catchAsync(async (req, res, next) => {
  const customer = await customerService.deleteCustomer(req.params);

  await notificationService.sendNotification(
    {
      title: "Customer Deleted",
      message: `${customer.name} has been deleted from store by ${req.user.name}.`,
      type: "DELETE",
    },
    req.user._id
  );
  return successResponse(res, customer);
});

const creditHistory = catchAsync(async (req, res, next) => {
  const customer = await customerService.creditHistory(req);
  return successResponse(res, customer);
});

const processCustomerPayment = catchAsync(async (req, res, next) => {
  const customer = await customerService.processCustomerPayment(req);
  return successResponse(res, customer);
});

export default {
  createCustomer,
  creditHistory,
  findCustomer,
  findAllCustomers,
  updateCustomer,
  deleteCustomer,
  processCustomerPayment,
};
