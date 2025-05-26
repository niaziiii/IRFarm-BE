import Purchase from "../models/purchaseModel.js";
import AbstractRepository from "./abstractRepository.js";

class PurchaseRepository extends AbstractRepository {
  constructor() {
    super(Purchase);
  }
}

export default new PurchaseRepository();
