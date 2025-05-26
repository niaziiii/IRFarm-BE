import userRepository from "../repositories/userRepository.js";
import storeRepository from "../repositories/storeRepository.js";
import AppError from "../utils/apiError.js";
import notificationService from "./notificationService.js";
import userModel from "../models/userModel.js";
class UserService {
  async createUser(request) {
    let userData = request.body;

    let { store_id, role, user_id } = userData;

    if (request.user.role === "super_admin") {
      if (role === "manager" && !store_id) {
        throw new AppError("store_id is required for role of manager");
      } else if (role === "user" && !user_id) {
        throw new AppError("user_id is required for role of user");
      }
      if (role === "user") {
        let store = await userRepository.findOneById(
          { _id: user_id },
          { store_id: 1 }
        );
        userData.store_id = store.store_id;
      } else {
        await storeRepository.findOneById({ _id: store_id });
      }
    } else if (request.user.role === "manager") {
      // Restrict managers from creating other managers.
      if (role === "manager") {
        throw new AppError(
          `You're not authorized to perform this action, only super_admin can create a manager.`
        );
      }

      userData.store_id = request.user.store_id;
    }

    const newUser = await userRepository.create({
      ...userData,
      created_by: request.user._id,
      email: userData.email.toLowerCase(),
    });

    await notificationService.createAndSendNotification({
      title: "Welcome",
      message: `We're thrilled to have you here! Explore amazing features and add products to your store.`,
      recipient: newUser._id,
    });

    return newUser;
  }

  async createAdmin(request) {
    let userData = request.body;
    return await userRepository.create({
      ...userData,
      email: userData.email.toLowerCase(),
    });
  }

  async findUser(_id) {
    return await userRepository.findOneById({ _id: _id });
  }

  async findAllUsers(request) {
    let { user } = request;
    // Destructure status and order from request body with default values
    const { status = "all", order = "asc", role = "all" } = request.body;

    // Construct filter query based on status
    let query = status === "active" || status === "inactive" ? { status } : {};

    // Determine sort parameters based on order
    const sortParams = { name: order === "asc" ? 1 : -1 };

    // return categories;
    if (user.role === "super_admin") {
      if (role != "all") query.role = role;
      return await userRepository.find({
        filterQuery: { _id: { $ne: user._id }, ...query },
        sortParams: sortParams,
      });
    } else {
      return await userRepository.find({
        filterQuery: { store_id: user.store_id, role: "user", ...query },
        sortParams: sortParams,
        // store_id: user.store_id,
        // role: "user",
      });
    }
  }

  async updateUser(filterQuery, request) {
    let userData = request.body;
    if (request.user.role === "manager" && userData.role === "manager") {
      throw new AppError(
        "You're not authorized to change role from user to manager"
      );
    }
    return await userRepository.findOneAndUpdate(filterQuery.id, userData);
  }

  async deleteUser(filterQuery) {
    return await userRepository.findOneAndDelete({ _id: filterQuery.id });
  }

  async updateProfile(filterQuery, request) {
    let { role, ...userData } = request.body;
    return await userRepository.findOneAndUpdate(filterQuery._id, userData);
  }

  async findManagers(request) {
    return await userModel.find({ role: "manager" });
  }

  async changePassword(request) {
    const id = request.params.id;
    const { password } = request.body;

    return await userRepository.findOneAndUpdate(id, { password: password });
  }
}

export default new UserService();
