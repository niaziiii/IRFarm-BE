import express from "express";
const router = express.Router();
import Product from "../controllers/productController.js";
import productSchema from "../validations/productValidation.js";
import validateRequest from "../middleware/validateMiddleware.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

// Apply allowedOnlyTo middleware to routes with shared permissions
router.use(allowedOnlyTo("super_admin", "manager", "user"));
router.post("/list", Product.findAllProducts);
router.get("/single/:id", Product.findProduct);
router.put("/edit/:id", Product.updateProduct);
router.post("/product-ladger-report/:id", Product.getProductLedger);

router.post(
  "/create",
  allowedOnlyTo("manager", "user"),
  validateRequest(productSchema),
  Product.createProduct
);

router.delete(
  "/delete/:id",
  allowedOnlyTo("super_admin", "manager"),
  Product.deleteProduct
);

export default router;
