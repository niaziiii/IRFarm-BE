import expenseModel, { expenseCategoryModel } from "../models/expenseModel.js";
import notificationService from "../services/notificationService.js";
import AppError from "../utils/apiError.js";
import catchAsync from "../utils/catchAsync.js";
import { getStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

const createExpense = catchAsync(async (req, res, next) => {
  const expense = await expenseModel.create({
    ...req.body,
    created_by: req.user._id,
    store_id: req.user.store_id || req.body.store_id,
  });

  await notificationService.sendNotification(
    {
      title: "New Expense Added",
      message: `New expense has been added to store by ${req.user.name}.`,
      type: "CREATE",
    },
    req.user._id
  );
  return successResponse(res, expense);
});

const getAllExpenses = catchAsync(async (req, res, next) => {
  const queryObj = {};

  if (req.user.role !== "super_admin") {
    queryObj.store_id = req.user.store_id || req.query.store_id;
  }

  if (req.query.category) {
    queryObj.category = req.query.category;
  }

  if (req.query.from_date && req.query.to_date) {
    queryObj.date = {
      $gte: new Date(req.query.from_date),
      $lte: new Date(req.query.to_date),
    };
  }

  if (
    req.query.status &&
    (req.query.status == "active" || req.query.status == "inactive")
  ) {
    queryObj.status = req.query.status;
  }

  const expenses = await expenseModel
    .find(queryObj)
    .populate("created_by", "name email");

  const count = await getStatusCounts(req, expenseModel);
  return successResponse(res, expenses, count);
});

const getExpenseById = catchAsync(async (req, res, next) => {
  const expense = await expenseModel
    .findById(req.params.id)
    .populate("created_by", "name email");

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  return successResponse(res, expense);
});

const updateExpense = catchAsync(async (req, res, next) => {
  const expense = await expenseModel.findById(req.params.id);
  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  // Fields that should not be updated directly
  const restrictedFields = ["created_by", "store_id", "createdAt", "updatedAt"];
  restrictedFields.forEach((field) => delete req.body[field]);

  // Update the expense
  const updatedExpense = await expenseModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  await notificationService.sendNotification(
    {
      title: "Expense Updated",
      message: `An expense has been updated by ${req.user.name}.`,
      type: "UPDATE",
    },
    req.user._id
  );

  return successResponse(res, updatedExpense);
});

const deleteExpense = catchAsync(async (req, res, next) => {
  const expense = await expenseModel.findById(req.params.id);

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  // Delete the expense
  await expenseModel.findByIdAndDelete(req.params.id);

  await notificationService.sendNotification(
    {
      title: "Expense Deleted",
      message: `An expense has been deleted by ${req.user.name}.`,
      type: "DELETE",
    },
    req.user._id
  );

  return successResponse(res, null, "Expense deleted successfully");
});

const getExpenseStats = catchAsync(async (req, res, next) => {
  const store_id = req.user.store_id;

  // Get date range from query or default to current month
  const today = new Date();
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const endDate = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const stats = await expenseModel.aggregate([
    {
      $match: {
        store_id: mongoose.Types.ObjectId(store_id),
        date: { $gte: startDate, $lte: endDate },
        status: "active",
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  // Calculate overall total
  const overallTotal = stats.reduce((sum, stat) => sum + stat.total, 0);

  return successResponse(res, {
    stats,
    overallTotal,
    period: {
      startDate,
      endDate,
    },
  });
});

const createExpenseCategory = catchAsync(async (req, res, next) => {
  if (req.user.role === "super_admin") {
    return next(new AppError("Only store owner can create", 404));
  }
  const expenseCategory = await expenseCategoryModel.create({
    ...req.body,
    created_by: req.user._id,
    store_id: req.user.store_id || req.body.store_id,
  });

  return successResponse(res, expenseCategory);
});

const getAllExpensesCategory = catchAsync(async (req, res, next) => {
  const queryObj = {};

  if (req.user.role !== "super_admin") {
    queryObj.store_id = req.user.store_id || req.query.store_id;
  }

  const expenseCategories = await expenseCategoryModel
    .find(queryObj)
    .populate("created_by", "name email");

  return successResponse(res, expenseCategories);
});

export default {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  createExpenseCategory,
  getAllExpensesCategory,
};
