import companyModel from "../models/companyModel.js";
import companyService from "../services/companyServices.js";
import notificationService from "../services/notificationService.js";
import catchAsync from "../utils/catchAsync.js";
import { getStatusCounts } from "../utils/getStatusCounts.js";
import { successResponse } from "../utils/responseFormat.js";

const createCompany = catchAsync(async (req, res, next) => {
  const company = await companyService.createCompany(req, req.body);

  await notificationService.sendNotification(
    {
      title: "New Company Added",
      message: `${company.name} has been added to store by ${req.user.name}.`,
      type: "CREATE",
    },
    req.user._id
  );
  return successResponse(res, company);
});

const findCompany = catchAsync(async (req, res, next) => {
  const company = await companyService.findCompany(req, req.params);
  return successResponse(res, company);
});

const findAllCompanies = catchAsync(async (req, res, next) => {
  const company = await companyService.findAllCompanies(req);
  const count = await getStatusCounts(req, companyModel);
  return successResponse(res, company, count);
});

const updateCompany = catchAsync(async (req, res, next) => {
  const company = await companyService.updateCompany(req, req.params, req.body);
  return successResponse(res, company);
});

const deleteCompany = catchAsync(async (req, res, next) => {
  const company = await companyService.deleteCompany(req, req.params);

  await notificationService.sendNotification(
    {
      title: "Company Deleted",
      message: `${company.name ?? ""} has been deleted from store by ${
        req.user.name
      }.`,
      type: "DELETE",
    },
    req.user._id
  );
  return successResponse(res, company);
});

const findCompanyProducts = catchAsync(async (req, res, next) => {
  const company = await companyService.findCompanyProducts(req, req.body);
  return successResponse(res, company);
});
const companyStats = catchAsync(async (req, res, next) => {
  const companyStats = await companyService.companyStats(req, req.body);
  return successResponse(res, companyStats);
});

const creditHistory = catchAsync(async (req, res, next) => {
  const company = await companyService.creditHistory(req);
  return successResponse(res, company);
});

const processCompanyPayment = catchAsync(async (req, res, next) => {
  const company = await companyService.processCompanyPayment(req);
  return successResponse(res, company);
});

export default {
  creditHistory,
  createCompany,
  findCompany,
  findAllCompanies,
  updateCompany,
  deleteCompany,
  findCompanyProducts,
  companyStats,
  processCompanyPayment,
};
