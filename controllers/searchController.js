import searchService from "../services/searchServices.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const searchDocument = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  const user = await searchService.searchDocument(q);
  return successResponse(res, user);
});

export default {
  searchDocument,
};
