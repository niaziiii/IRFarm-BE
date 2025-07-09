import express from "express";
import * as salePersonController from "../controllers/salePersonController.js";

const router = express.Router();

router.post("/", salePersonController.addSalePerson);
router.post("/list", salePersonController.getAllSalePersons);
router.get("/:id", salePersonController.getSalePerson);
router.put("/:id", salePersonController.updateSalePerson);
router.delete("/:id", salePersonController.deleteSalePerson);
router.post("/ladger-report/:id", salePersonController.salePersonLadgerReports);

export default router;
