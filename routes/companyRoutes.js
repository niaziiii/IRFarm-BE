import express from "express";
const router = express.Router();
import Company from "../controllers/companyController.js";
import companySchema from "../validations/companyValidation.js";
import validateRequest from "../middleware/validateMiddleware.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

// Apply allowedOnlyTo middleware to routes with shared permissions
router.use(allowedOnlyTo("super_admin", "manager", "user"));
router.post("/list", Company.findAllCompanies);
router.get("/single/:id", Company.findCompany);
router.get("/credit-history/:id", Company.creditHistory);

router.post("/products", Company.findCompanyProducts);
router.post("/stats", Company.companyStats);

// For routes where only super_admin and manager have access, create a sub-router
router.post("/create", validateRequest(companySchema), Company.createCompany);
router.put("/edit/:id", Company.updateCompany);
router.put("/manage-balance", Company.processCompanyPayment);

router.delete("/delete/:id", Company.deleteCompany);

export default router;
