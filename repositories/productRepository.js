import Product from "../models/productModel.js";
import AbstractRepository from "./abstractRepository.js";

class ProductRepository extends AbstractRepository {
  constructor() {
    super(Product);
  }

  async searchProduct(query) {
    return await Product.find({
      prod_name: { $regex: query, $options: "i" }, // case-insensitive search
    });
  }
}

export default new ProductRepository();
