import userRepository from "../repositories/userRepository.js";
import Token from "../models/tokenModel.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import "dotenv/config";
import AppError from "../utils/apiError.js";

class PasswordResetService {
  async forgotPassword(request) {
    const user = await userRepository.findOneByQuery({
      filterQuery: { email: request.body.email },
    });
    if (!user)
      return res.status(400).send("User with given email doesn't exist");

    let token = await Token.findOne({ user_id: user._id });
    if (!token) {
      token = await new Token({
        user_id: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
    }

    const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;

    await sendEmail(user.email, "Password reset", link);

    return { user_id: user._id, toke: token.token };
  }

  async resetPassword(request) {
    let user = await userRepository.findOneById({
      _id: request.params.user_id,
    });
    if (!user) {
      throw new AppError("Invalid link or expired");
    }
    const token = await Token.findOne({
      user_id: user._id,
      token: request.params.token,
    });
    if (!token) {
      throw new AppError("Invalid link or expired");
    }

    user.password = request.body.password;
    user = await user.save();

    await token.delete();

    return "Password reset successfully.";
  }
}

export default new PasswordResetService();
