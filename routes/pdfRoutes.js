import express from "express";
import pdfController from "../controllers/pdfController.js";

const router = express.Router();

router.post("/expense", pdfController.generateExpenseReport);
router.post("/sale", pdfController.generateSaleReport);
router.post("/purchase", pdfController.generatePurchaseReport);
router.post("/quotation", pdfController.generateQuotationReport);

router.post("/sales-report", pdfController.generateSaleListReports);
router.post("/customer-ladger", pdfController.generateCustomerLadgerReport);
router.post("/supplier-ladger", pdfController.generateSupplierLadgerReport);
router.post("/product-ladger", pdfController.generateProductLadgerReport);
router.post(
  "/financial-overview",
  pdfController.generateFinancialOverviewReport
);
router.post(
  "/purchase-history",
  pdfController.generatePurchaseHistoryOverviewReport
);
router.post("/sale-history", pdfController.generateSaleHistoryOverviewReport);

router.post("/customer-list", pdfController.generateCustomerList);
router.post("/category-list", pdfController.generateCategoryList);
router.post("/user-list", pdfController.generateUserList);
router.post("/unit-list", pdfController.generateUnitList);
router.post("/company-list", pdfController.generateCompanyList);
router.post("/product-list", pdfController.generateProductListReport);
router.post("/quotation-list", pdfController.generateQuotationListReport);

export default router;
