import express from "express";
const router = express.Router();
import authRoute from "./authRoutes.js";
import userRoute from "./userRoutes.js";
import productRoute from "./productRoutes.js";
import uniqueCodeRoute from "./uniqueCodeRoutes.js";
import categoryRoute from "./categoryRoutes.js";
import unitRoute from "./unitRoutes.js";
import storeRoute from "./storeRoutes.js";
import warehouseRoute from "./warehouseRoutes.js";
import searchRoute from "./searchRoutes.js";
import companyRoute from "./companyRoutes.js";
import purchaseRoute from "./purchaseRoutes.js";
import imageUploadRoute from "./imageUploadRoutes.js";
import customerRoute from "./customerRoutes.js";
import saleRoute from "./saleRoutes.js";
import quotationRoute from "./quotationRoutes.js";

import passwordResetRoute from "./passwordResetRoutes.js";
import notificationRoute from "./notificationRoutes.js";
import statisticsRoute from "./statisticsRoutes.js";
import reportsRoutes from "./reportRoutes.js";
import expenseRoutes from "./expenseRoute.js";
import cashInCounterRoute from "./cashInCounterRoutes.js";
import pdfRoutes from "./pdfRoutes.js";
import salePersonRoute from "./salePersonRoute.js";

//Auth routes
router.use("/api/v1/auth", authRoute);

//Auth routes
router.use("/api/v1/statistics", statisticsRoute);

//PasswordReset routes
router.use("/api/v1/password-reset", passwordResetRoute);

//User routes
router.use("/api/v1/user", userRoute);

//Product routes
router.use("/api/v1/product", productRoute);

//ProductCode routes
router.use("/api/v1/unique-code", uniqueCodeRoute);

//Category routes
router.use("/api/v1/category", categoryRoute);

//Unit routes
router.use("/api/v1/unit", unitRoute);

//Store routes
router.use("/api/v1/store", storeRoute);

//Warehouse routes
router.use("/api/v1/warehouse", warehouseRoute);

//Search routes
router.use("/api/v1/search", searchRoute);

//company routes
router.use("/api/v1/company", companyRoute);

//purchase routes
router.use("/api/v1/purchase", purchaseRoute);

//customer routes
router.use("/api/v1/customer", customerRoute);

//imageUpload routes
router.use("/api/v1/file", imageUploadRoute);

//Sale routes
router.use("/api/v1/sale", saleRoute);

//Notification routes
router.use("/api/v1/notification", notificationRoute);

// Reports
router.use("/api/v1/report", reportsRoutes);

// Reports
router.use("/api/v1/expense", expenseRoutes);

// Quotation Maker
router.use("/api/v1/quotation-maker", quotationRoute);

//CashInCounter routes
router.use("/api/v1/cash-counter", cashInCounterRoute);

//PDF routes
router.use("/api/v1/pdf", pdfRoutes);

router.use("/api/v1/sale-person", salePersonRoute);

export default router;
