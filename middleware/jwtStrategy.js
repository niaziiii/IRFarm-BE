import jwtStrategy from "../config/jwtStrategy.js";
import UnAuthenticatedError from "../errors/unauthenticatedError.js";

const jwtStrategyMiddleware = (req, res, next) => {
  jwtStrategy.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err); // Passes error to the global error handler
    }
    if (!user) {
      throw new UnAuthenticatedError("Invalid or expired token");
    }

    req.user = user; // Attach user to request object
    next();
  })(req, res, next);
};

export default jwtStrategyMiddleware;
