import express from "express";
import Sale from "../controllers/saleController.js";

const router = express.Router();

router.post("/list", Sale.findAllSales);
router.get("/single/:id", Sale.findSale);

router.post("/create", Sale.createSale);
router.put("/edit/:id", Sale.updateSale);
router.delete("/delete/:id", Sale.deleteSale);

export default router;
