import SaleModel from "../models/saleModel.js";
import AbstractRepository from "./abstractRepository.js";

class SaleRepository extends AbstractRepository {
  constructor() {
    super(SaleModel);
  }
}

export default new SaleRepository();
