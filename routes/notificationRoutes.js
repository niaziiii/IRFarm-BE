import express from "express";
const router = express.Router();
import notificationController from "../controllers/notificationController.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

router.use(allowedOnlyTo("super_admin", "manager", "user"));

router.post("/", notificationController.getUserNotifications);
router.put("/:id/read", notificationController.markAsRead);
router.put("/mark-all-read", notificationController.markAllAsRead);

export default router;
