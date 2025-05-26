import express from "express";
import quotation from "../controllers/quotationController.js";

const router = express.Router();

router.post("/list", quotation.findAllQuotations);
router.get("/single/:id", quotation.findQuotation);

router.post("/create", quotation.createQuotation);
router.put("/edit/:id", quotation.updateQuotation);
router.put("/convert-to-sale/:id", quotation.convertToSale);

router.delete("/delete/:id", quotation.deleteQuotation);

export default router;
