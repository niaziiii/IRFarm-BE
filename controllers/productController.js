import productModel from "../models/productModel.js";
import notificationService from "../services/notificationService.js";
import productServices from "../services/productServices.js";
import productService from "../services/productServices.js";
import catchAsync from "../utils/catchAsync.js";
import { getStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

const createProduct = catchAsync(async (req, res, next) => {
  const product = await productService.createProduct(req);

  await notificationService.sendNotification(
    {
      title: "New Product Added",
      message: `${product.prod_name} has been added to store inventory by ${req.user.name}.`,
      type: "CREATE",
    },
    req.user._id
  );
  return successResponse(res, product);
});

const getProductLedger = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const dateRange = req.body.date_range || {};

  const ledger = await productServices.getProductLedger(id, dateRange);

  return successResponse(res, ledger);
});

const findProduct = catchAsync(async (req, res, next) => {
  const product = await productService.findProduct(req, req.params);
  return successResponse(res, product);
});

const findAllProducts = catchAsync(async (req, res, next) => {
  const product = await productService.findAllProducts(req);
  const count = await getStatusCounts(req, productModel);
  return successResponse(res, product, count);
});

const updateProduct = catchAsync(async (req, res, next) => {
  const product = await productService.updateProduct(req.params, req.body);
  return successResponse(res, product);
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await productService.deleteProduct(req.params);

  await notificationService.sendNotification(
    {
      title: "Product Deleted",
      message: `${product.prod_name} has been deleted from store by ${req.user.name}.`,
      type: "DELETE",
    },
    req.user._id
  );
  return successResponse(res, product);
});

export default {
  createProduct,
  findProduct,
  findAllProducts,
  updateProduct,
  deleteProduct,
  getProductLedger,
};
