import express from "express";
const router = express.Router();
import Category from "../controllers/categoryController.js";
import categorySchema from "../validations/categoryValidation.js";
import validateRequest from "../middleware/validateMiddleware.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

// Apply allowedOnlyTo middleware to routes with shared permissions
router.use(allowedOnlyTo("super_admin", "manager", "user"));
router.get("/list", Category.findAllCategories);
router.post("/filtered-list", Category.filteredCategoryList);
router.get("/single/:id", Category.findCategory);
router.post("/products", Category.findCategoryProducts);

// For routes where only super_admin and manager have access, create a sub-router
router.post(
  "/create",
  validateRequest(categorySchema),
  Category.createCategory
);
router.put("/edit/:id", Category.updateCategory);

router.route("/stats").get(Category.categoryStats);

router.delete("/delete/:id", Category.deleteCategory);

export default router;
