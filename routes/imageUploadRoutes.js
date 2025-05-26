import multer from "../config/multerConfig.js";

import Image from "../controllers/imageUploadController.js";
import resizeImage from "../middleware/resizeImage.js";
import express from "express";

const router = express.Router();

router.post(
  "/",
  multer.upload.array("files", 10),
  resizeImage.resizeImages,
  Image.uploadImage
);

export default router;
