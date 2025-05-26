import express from "express";
const router = express.Router();
import reportController from "../controllers/reportController.js";

// Sales Reports
router.get("/sales", reportController.salesReport);

// Inventory Reports
router.get("/inventory", reportController.inventoryReport);

// Purchase Reports
router.get("/purchases", reportController.purchaseReport);

// Financial Reports
router.get("/financial", reportController.financialReport);

export default router;
