import sharp from "sharp";
import fs from "fs";
import catchAsync from "../utils/catchAsync.js";

const resizeImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new Error("No files uploaded"));
  }

  // Process each file in memory
  req.processedImages = await Promise.all(
    req.files.map(async (file) => {
      const resizedBuffer = await sharp(file.buffer)
        .resize(700, 700)
        .toBuffer();

      return {
        originalname: file.originalname,
        buffer: resizedBuffer,
        mimetype: file.mimetype,
      };
    })
  );

  next();
});
export default { resizeImages };
