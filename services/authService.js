import UnAuthenticatedError from "../errors/unauthenticatedError.js";
import userRepository from "../repositories/userRepository.js";
import getJwtToken from "../utils/getJwtToken.js";
import bcrypt from "bcrypt";
import Token from "../models/tokenModel.js";
import AppError from "../utils/apiError.js";
// import { permissions } from "../utils/permissions.js";

class AuthService {
  async doLogin(filterQuery, res) {
    const { email, password } = filterQuery;

    const user = await userRepository.findOneByQuery({
      filterQuery: { email: email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnAuthenticatedError("Invalid credentials.");
    }
    const token = getJwtToken(user);
    res.setHeader("Authorization", token);
    return { token: token, user };
  }

  async authenticate(filterQuery, res) {
    let user = await userRepository.findOneById({ _id: filterQuery._id });
    user = user.toObject();
    return { user, permissions: user.permissions };
  }

  async changePermission(req, res) {
    const { id } = req.params;
    const updatedPermissions = req.body;
    const modifyingUser = req.user;

    const targetUser = await userRepository.findOneById(id);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    const canManagePermissions = {
      super_admin: ["manager", "user"],
      manager: ["user"],
      user: [],
    };

    if (!canManagePermissions[modifyingUser.role]?.includes(targetUser.role)) {
      throw new AppError("Unauthorized to modify permissions", 403);
    }

    if (
      modifyingUser.role === "manager" &&
      targetUser.store_id.toString() !== modifyingUser.store_id.toString()
    ) {
      throw new AppError("Cannot modify users from other stores", 403);
    }

    const validatePermissionObject = (permObj) => {
      const requiredActions = ["add", "delete", "edit", "view"];
      return requiredActions.every(
        (action) => typeof permObj[action] === "boolean"
      );
    };

    // Get existing permissions
    const existingPermissions = targetUser.permissions?.toObject() || {};

    // Validate and update permissions
    const [moduleKey] = Object.keys(updatedPermissions);
    if (!validatePermissionObject(updatedPermissions[moduleKey])) {
      throw new AppError(
        `Invalid permission structure for module: ${moduleKey}`,
        400
      );
    }

    const updatedUser = await userRepository.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          permissions: {
            ...existingPermissions, // Keep existing permissions
            ...updatedPermissions, // Update with new permissions
          },
          permissions_modified_by: modifyingUser._id,
          permissions_modified_at: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return {
      message: "Permissions updated successfully",
      user: updatedUser,
    };
  }
  async forgotPassword(request) {
    try {
      const user = await userRepository.findOneByQuery({
        email: request.body.email,
      });
      if (!user)
        return res.status(400).send("User with given email doesn't exist");

      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
      }

      const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
      await sendEmail(user.email, "Password reset", link);

      res.send("Password reset link sent to your email account");
    } catch (error) {
      res.send("An error occurred");
      console.error(error);
    }
  }

  async resetPassword(request) {
    try {
      const user = await userRepository.findOneById(request.params.userId);
      if (!user) return res.status(400).send("Invalid link or expired");

      const token = await Token.findOne({
        userId: user._id,
        token: request.params.token,
      });
      if (!token) return res.status(400).send("Invalid link or expired");

      user.password = request.body.password;
      await user.save();
      await token.delete();

      return "Password reset successfully.";
    } catch (error) {
      res.send("An error occurred");
      console.error(error);
    }
  }
}

export default new AuthService();
