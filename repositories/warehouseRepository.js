import Warehouse from "../models/warehouseModel.js";
import AbstractRepository from "./abstractRepository.js";

class WarehouseRepository extends AbstractRepository {
  constructor() {
    super(Warehouse);
  }
}

export default new WarehouseRepository();
