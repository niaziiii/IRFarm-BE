import express from "express";
const router = express.Router();
import Customer from "../controllers/customerController.js";
import customerSchema from "../validations/customerValidation.js";
import validateRequest from "../middleware/validateMiddleware.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

// Apply allowedOnlyTo middleware to routes with shared permissions
router.use(allowedOnlyTo("super_admin", "manager", "user"));
router.post("/list", Customer.findAllCustomers);
router.get("/single/:id", Customer.findCustomer);
router.get("/credit-history/:id", Customer.creditHistory);
router.put("/manage-balance", Customer.processCustomerPayment);

// For routes where only super_admin and manager have access, create a sub-router
router.post(
  "/create",
  validateRequest(customerSchema),
  Customer.createCustomer
);
router.put("/edit/:id", Customer.updateCustomer);
router.delete("/delete/:id", Customer.deleteCustomer);

export default router;
