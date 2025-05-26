import express from "express";
const router = express.Router();
import PasswordReset from "../controllers/passwordResetController.js";
router.post("/", PasswordReset.forgotPassword);
router.post("/:user_id/:token", PasswordReset.resetPassword);

export default router;
