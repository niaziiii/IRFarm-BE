// routes/uniqueCodeRoute.js
import express from "express";
const router = express.Router();
import ProductCode from "../controllers/uniqueCodeController.js";

router.get("/validate", ProductCode.validateProductCode);
router.post("/create", ProductCode.createUniqueCode);
router.get("/:id", ProductCode.findProductCode);

export default router;
