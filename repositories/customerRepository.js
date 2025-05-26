import Customer from "../models/customerModel.js";
import AbstractRepository from "./abstractRepository.js";

class CustomerRepository extends AbstractRepository {
  constructor() {
    super(Customer);
  }
}

export default new CustomerRepository();
