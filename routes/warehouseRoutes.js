import express from "express";
const router = express.Router();
import Warehouse from "../controllers/warehouseController.js";
import warehouseSchema from "../validations/warehouseValidation.js";
import validateRequest from "../middleware/validateMiddleware.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

router.use(allowedOnlyTo("super_admin", "manager"));
router.get("/list", Warehouse.findAllWarehouses);
router.post(
  "/create",
  validateRequest(warehouseSchema),
  Warehouse.createWarehouse
);
router.get("/single/:id", Warehouse.findWarehouse);
router.put("/edit/:id", Warehouse.updateWarehouse);
router.delete("/delete/:id", Warehouse.deleteWarehouse);

export default router;
