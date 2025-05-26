import AppError from "../utils/apiError.js";

const allowedOnlyTo = (...roles) => {
  return (req, res, next) => {
    const { role } = req.user;

    // Check if the user role is permitted
    if (!roles.includes(role)) {
      throw new AppError(
        `Access denied. Only ${roles.join(" or ")} can access this route.`
      );
    }

    next();
  };
};

export default allowedOnlyTo;
