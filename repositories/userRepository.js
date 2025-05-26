import User from "../models/userModel.js";
import AbstractRepository from "./abstractRepository.js";

class UserRepository extends AbstractRepository {
  constructor() {
    super(User);
  }

  async searchUser(query) {
    return await User.find({
      name: { $regex: query, $options: "i" }, // case-insensitive search
      email: { $regex: query, $options: "i" }, // case-insensitive search
    });
  }

  async findUserStore(query, projection) {
    let { store_id: store } = await User.findOne(query, projection).populate(
      "store_id"
    );
    return store;
  }
}

export default new UserRepository();
