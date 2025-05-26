import express from "express";
const router = express.Router();
import Unit from "../controllers/unitController.js";
// import unitSchema from "../validations/unitValidation.js";
// import validateRequest from "../middleware/validateMiddleware.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

// Apply allowedOnlyTo middleware to routes with shared permissions
router.use(allowedOnlyTo("super_admin", "manager", "user"));
router.post("/list", Unit.findAllUnits);
router.get("/single/:id", Unit.findUnit);

// For routes where only super_admin and manager have access, create a sub-router
router.post(
  "/create",
  //  validateRequest(unitSchema),
  Unit.createUnit
);
router.put("/edit/:id", Unit.updateUnit);
router.delete("/delete/:id", Unit.deleteUnit);

export default router;
