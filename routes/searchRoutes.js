import express from "express";
const router = express.Router();
import SearchDocument from "../controllers/searchController.js";
router.get("/", SearchDocument.searchDocument);

export default router;
