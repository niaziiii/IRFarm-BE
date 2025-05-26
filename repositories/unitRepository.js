import Unit from "../models/unitModel.js";
import AbstractRepository from "./abstractRepository.js";

class UnitRepository extends AbstractRepository {
  constructor() {
    super(Unit);
  }
}

export default new UnitRepository();
