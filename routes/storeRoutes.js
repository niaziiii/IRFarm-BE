import express from "express";
const router = express.Router();
import Store from "../controllers/storeController.js";
import storeSchema from "../validations/storeValidation.js";
import validateRequest from "../middleware/validateMiddleware.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

router.get("/products-from-store/:id", Store.findProductsFromStore);
router.get("/store-products/:id", Store.getStoreProducts);

router.get(
  "/single/:id",
  allowedOnlyTo("super_admin", "manager", "user"),
  Store.findStore
); //should get access to user role.
router.get("/product-stats", Store.storeProductsStats);
router.use(allowedOnlyTo("super_admin", "manager"));
router.post("/list", Store.findAllStores);
router.put("/edit/:id", Store.updateStore);

router.use(allowedOnlyTo("super_admin"));
router.post("/create", Store.createStore);
router.delete("/delete/:id", Store.deleteStore);
router.get("/available", Store.findAvailableStores); //not-enrolled stores

export default router;
