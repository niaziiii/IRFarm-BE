import UniqueCode from "../models/uniqueCodeModel.js";
import Product from "../models/productModel.js";
import Company from "../models/companyModel.js";
import catchAsync from "../utils/catchAsync.js";
import { successResponse } from "../utils/responseFormat.js";

const generateNewCode = async (type, store_id) => {
  const lastCode = await UniqueCode.findOne({ type, store_id })
    .sort({ code: -1 })
    .select("code");
  return lastCode ? lastCode.code + 1 : 100000;
};

const validateProductCode = catchAsync(async (req, res, next) => {
  const { prod_code, comp_code } = req.query;
  const store_id = req.user.store_id;

  // Generate recommended codes for this specific store
  const recommendedProductCode = await generateNewCode("product", store_id);
  const recommendedCompanyCode = await generateNewCode("company", store_id);

  // Initialize response object
  const codes = {
    product: {
      recommended_code: recommendedProductCode.toString(),
      code: prod_code || recommendedProductCode.toString(),
      valid: true,
    },
    company: {
      recommended_code: recommendedCompanyCode.toString(),
      code: comp_code || recommendedCompanyCode.toString(),
      valid: true,
    },
  };

  // Validate product code for this specific store
  if (prod_code) {
    const existingProduct = await Product.findOne({
      prod_code: parseInt(prod_code),
      store_id,
    });
    if (existingProduct) {
      codes.product.valid = false;
    }
  }

  // Validate company code for this specific store
  if (comp_code) {
    const existingCompany = await Company.findOne({
      comp_code: parseInt(comp_code),
      store_id,
    });
    if (existingCompany) {
      codes.company.valid = false;
    }
  }

  return successResponse(res, codes);
});

// Other functions remain the same
const createUniqueCode = catchAsync(async (req, res, next) => {
  const { code, type } = req.body;
  const uniqueCode = await UniqueCode.create({
    code: parseInt(code),
    type,
    store_id: req.user.store_id,
  });
  return successResponse(res, uniqueCode);
});

const findProductCode = catchAsync(async (req, res, next) => {
  // Add store_id to the query to ensure it finds codes for the current store
  const uniqueCode = await UniqueCode.findOne({
    _id: req.params.id,
    store_id: req.user.store_id,
  });
  return successResponse(res, uniqueCode);
});

export default {
  validateProductCode,
  createUniqueCode,
  findProductCode,
};
