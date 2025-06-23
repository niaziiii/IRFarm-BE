import categoryModel from "../models/categoryModel.js";
import categoryService from "../services/categoryServices.js";
import notificationService from "../services/notificationService.js";
import catchAsync from "../utils/catchAsync.js";
import { getStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

const createCategory = catchAsync(async (req, res, next) => {
  const category = await categoryService.createCategory(req, req.body);

  await notificationService.sendNotification(
    {
      title: "New Category Added",
      message: `${category.name} has been added to store by ${req.user.name}.`,
      type: "CREATE",
    },
    req.user._id
  );
  return successResponse(res, category);
});

const findCategory = catchAsync(async (req, res, next) => {
  const category = await categoryService.findCategory(req, req.params);
  return successResponse(res, category);
});

const findAllCategories = catchAsync(async (req, res, next) => {
  const category = await categoryService.findAllCategories(req, req.body);

  const count = await getStatusCounts(req, categoryModel);
  return successResponse(res, category, count);
});

const updateCategory = catchAsync(async (req, res, next) => {
  const category = await categoryService.updateCategory(
    req,
    req.params,
    req.body
  );
  return successResponse(res, category);
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await categoryService.deleteCategory(req, req.params);

  await notificationService.sendNotification(
    {
      title: "Category Deleted",
      message: `${category.name} has been deleted from store by ${req.user.name}.`,
      type: "DELETE",
    },
    req.user._id
  );
  return successResponse(res, category);
});

const filteredCategoryList = catchAsync(async (req, res, next) => {
  const category = await categoryService.filteredCategoryList(req, req.body);
  return successResponse(res, category, category.length);
});

const categoryStats = catchAsync(async (req, res, next) => {
  const stats = await categoryService.categoryStats(req, req.body);
  return successResponse(res, stats);
});

const findCategoryProducts = catchAsync(async (req, res, next) => {
  const products = await categoryService.findCategoryProducts(req, req.params);
  return successResponse(res, products);
});

export default {
  createCategory,
  findCategory,
  findAllCategories,
  updateCategory,
  deleteCategory,
  filteredCategoryList,
  categoryStats,
  findCategoryProducts,
};
