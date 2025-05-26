import jwtAuthMiddleware from "../middleware/jwtStrategy.js";
const excludeJwtAuthRoutes = (excludedRoutes) => {
  return (req, res, next) => {
    if (
      excludedRoutes.includes(req.url) ||
      excludedRoutes.some((route) => req.path.startsWith(route))
    ) {
      return next(); // Skip JWT authentication for excluded routes
    }
    // Continue with JWT authentication middleware
    jwtAuthMiddleware(req, res, next);
    // next();
  };
};

export default excludeJwtAuthRoutes;
