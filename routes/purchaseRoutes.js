import express from "express";
const router = express.Router();
import Purchase from "../controllers/purchaseController.js";
import purchaseSchema from "../validations/purchaseValidation.js";
import validateRequest from "../middleware/validateMiddleware.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

// Apply allowedOnlyTo middleware to routes with shared permissions
router.use(allowedOnlyTo("super_admin", "manager", "user"));
router.post("/list", Purchase.findAllPurchases);
router.get("/single/:id", Purchase.findPurchase);

// For routes where only super_admin and manager have access, create a sub-router
router.post(
  "/create",
  // validateRequest(purchaseSchema),
  Purchase.createPurchase
);
router.put("/edit/:id", Purchase.updatePurchase);

router.use(allowedOnlyTo("super_admin", "manager"));
router.delete("/delete/:id", Purchase.deletePurchase);

export default router;
