import express from "express";
const router = express.Router();
import CashInCounter from "../controllers/cashInCounterController.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

// Apply middleware to all routes - only authenticated users can access
router.use(allowedOnlyTo("super_admin", "manager", "user"));

// Create a new cash transaction - all roles can access, but service layer handles permissions
router.post("/create", CashInCounter.createTransaction);

// Get transactions for a specific store
router.get("/store/:store_id", CashInCounter.getTransactionsByStore);

// Get all transactions across all stores - only super admin
router.get(
  "/all",
  allowedOnlyTo("super_admin"),
  CashInCounter.getAllTransactions
);

// Get dashboard summary for a specific store - includes totals and recent transactions
router.get("/summary/:store_id", CashInCounter.getTransactionSummary);

export default router;
