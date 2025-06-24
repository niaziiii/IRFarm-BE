import storeModel from "../models/storeModel.js";
import storeService from "../services/storeServices.js";
import AppError from "../utils/apiError.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const createStore = catchAsync(async (req, res, next) => {
  const store = await storeService.createStore(req, req.body);
  return successResponse(res, store);
});

const getStoreProducts = catchAsync(async (req, res, next) => {
  const store = await storeService.getStoreProduct(req.params.id);
  return successResponse(res, store);
});
const findStore = catchAsync(async (req, res, next) => {
  const store = await storeService.findStore(req.params);
  return successResponse(res, store);
});
const findAllStores = catchAsync(async (req, res, next) => {
  const store = await storeService.findAllStores(req);
  return successResponse(res, store);
});

const updateStore = catchAsync(async (req, res, next) => {
  const store = await storeService.updateStore(req.params, req.body);
  return successResponse(res, store);
});

const deleteStore = catchAsync(async (req, res, next) => {
  const store = await storeService.deleteStore(req.params);
  return successResponse(res, store);
});
const findProductsFromStore = catchAsync(async (req, res, next) => {
  const store = await storeService.findProductsFromStore(req.params);
  return successResponse(res, store);
});

const findAvailableStores = catchAsync(async (req, res, next) => {
  const stores = await storeService.findAvailableStores(req);
  return successResponse(res, stores);
});

const storeProductsStats = catchAsync(async (req, res, next) => {
  const productStats = await storeService.storeProductsStats(req);
  return successResponse(res, productStats);
});

export const getStoreInfo = async (storeId, role, title) => {
  return {
    role: "user",
    title: title,
    storeInfo: {
      name: "name",
      address: "addres",
      phone: "store.phone",
      email: " store.email",
    },
  };

  if (!storeId || !role || !title) {
    throw new AppError("storeId || role || title are missing.", 400);
  }

  if (role === "super_admin") {
    return {
      role: "super_admin",
      title: title,
      storeInfo: {
        name: "IRFARM",
        address: "Your Business Address",
        phone: "+91 XXXXXXXXXX",
        email: "contact@irfarm.com",
      },
    };
  }

  const store = await storeModel.findById(storeId);

  return {
    role: role,
    title: title,
    storeInfo: {
      name: store.name,
      address:
        store.address.city +
        " " +
        store.address.province +
        " " +
        store.address.country,
      phone: store.phone,
      email: store.email,
    },
  };
};

export default {
  createStore,
  findStore,
  findAllStores,
  updateStore,
  deleteStore,
  findProductsFromStore,
  findAvailableStores,
  storeProductsStats,
  getStoreProducts,
};
