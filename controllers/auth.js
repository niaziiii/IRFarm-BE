import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/apiError.js";
import { successResponse } from "../utils/responseFormat.js";
import localStrategy from "../config/localStrategy.js";
import getJwtToken from "../utils/getJwtToken.js";
import authService from "../services/authService.js";
// import { permissions } from "../utils/permissions.js";

const login = catchAsync(async (req, res, next) => {
  localStrategy.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return next(new AppError(info.message, 401));
    }

    if (user.status !== "active") {
      return next(
        new AppError(
          "Your account is inactive. Please contact an administrator.",
          401
        )
      );
    }

    // Sign JWT token
    const token = getJwtToken(user);

    return successResponse(res, {
      token,
      user,
      permissions: user.permissions,
    });
  })(req, res, next);
});

const authenticate = catchAsync(async (req, res, next) => {
  const user = await authService.authenticate(req.user, res);
  return successResponse(res, user);
});

const changePermission = catchAsync(async (req, res, next) => {
  const permissions = await authService.changePermission(req, res);
  return successResponse(res, permissions);
});

const restrictTo = (...roles) => {
  // roles are : admin, agent
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You are not allowed!", 500));
    }
    next();
  };
};

export default {
  login,
  authenticate,
  restrictTo,
  changePermission,
};
