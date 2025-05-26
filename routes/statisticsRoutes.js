// statisticsRoutes.js
import express from "express";
const router = express.Router();
import Statistics from "../controllers/statisticsController.js";

router.get("/dashboard", Statistics.getDashboardStats);
router.get("/financial", Statistics.getFinancialStats);
router.get("/inventory", Statistics.getInventoryStats);

export default router;
