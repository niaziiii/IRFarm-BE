import cashInCounterService from "../services/cashInCounterService.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const createTransaction = catchAsync(async (req, res, next) => {
  const transaction = await cashInCounterService.createTransaction(req);
  return successResponse(res, transaction);
});

const getTransactionsByStore = catchAsync(async (req, res, next) => {
  const data = await cashInCounterService.getTransactionsByStore(req);
  return successResponse(res, data);
});

const getAllTransactions = catchAsync(async (req, res, next) => {
  const data = await cashInCounterService.getAllTransactions(req);
  return successResponse(res, data);
});

// New method to get a simplified summary for dashboard purposes
const getTransactionSummary = catchAsync(async (req, res, next) => {
  const { store_id } = req.params;

  // Get current cash total and recent transactions
  const data = await cashInCounterService.getTransactionsByStore(req);

  // Limit to just 5 recent transactions for summary
  const summary = {
    totalCash: data.totalCash,
    recentTransactions: data.transactions.slice(0, 5),
  };

  return successResponse(res, summary);
});

export default {
  createTransaction,
  getTransactionsByStore,
  getAllTransactions,
  getTransactionSummary,
};
