import express from "express";
const router = express.Router();
import userSchema from "../validations/userValidation.js";
import validateRequest from "../middleware/validateMiddleware.js";
import User from "../controllers/userController.js";
import allowedOnlyTo from "../middleware/allowedOnlyTo.js";

// router.post("/create-admin", User.createAdmin);

router.use(allowedOnlyTo("super_admin", "manager", "user"));
router.get("/managers", allowedOnlyTo("super_admin"), User.findManagers);
router.get("/single/:id", User.findUser);
router.put("/edit/:id", User.updateUser);
router.put("/change-password/:id", User.changePassword);
router.post("/list", User.findAllUsers);
router.post("/create", validateRequest(userSchema), User.createUser);
router.delete("/delete/:id", User.deleteUser);

router.get("/profile", User.userProfile);
router.put("/update-profile", User.updateProfile);

export default router;
