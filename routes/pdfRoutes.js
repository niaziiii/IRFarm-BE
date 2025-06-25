import express from "express";
import pdfController from "../controllers/pdfController.js";

const router = express.Router();

router.post("/expense", pdfController.generateExpenseReport);
router.post("/purchase", pdfController.generatePurchaseReport);

router.post("/sale", pdfController.generateSaleReport);
router.post("/sales-report", pdfController.generateSaleListReports);

router.post("/customer-ladger", pdfController.generateCustomerLadgerReport);
router.post("/customer-list", pdfController.generateCustomerList);

router.post("/supplier-ladger", pdfController.generateSupplierLadgerReport);
router.post("/company-list", pdfController.generateCompanyList);

router.post("/product-ladger", pdfController.generateProductLadgerReport);
router.post("/product-list", pdfController.generateProductListReport);
router.post(
  "/financial-overview",
  pdfController.generateFinancialOverviewReport
);

export default router;
