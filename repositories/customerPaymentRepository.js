import CustomerPayment from "../models/customerPaymentMode.js";
import AbstractRepository from "./abstractRepository.js";

class CustomerPaymentRepository extends AbstractRepository {
  constructor() {
    super(CustomerPayment);
  }
}

export default new CustomerPaymentRepository();
