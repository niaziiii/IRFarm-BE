import Account from "../models/accountModel.js";
import AbstractRepository from "./abstractRepository.js";

class AccountRepository extends AbstractRepository {
  constructor() {
    super(Account);
  }
}

export default new AccountRepository();
