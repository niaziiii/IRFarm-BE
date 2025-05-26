import imageUploadService from "../services/imageUploadService.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const uploadImage = catchAsync(async (req, res, next) => {
  let result = await imageUploadService.imageUpload(req);
  return successResponse(res, result);
});

export default { uploadImage };
