import express from "express";
const router = express.Router();
import Auth from "../controllers/auth.js";
router.post("/login", Auth.login);
router.get("/authenticate", Auth.authenticate);
router.put("/permissions/:id", Auth.changePermission);

export default router;
