import jwtStrategy from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import userRepository from "../repositories/userRepository.js";
import unauthorizedError from "../errors/unauthorizedError.js";
import { config } from "dotenv";
config();
// JWT Strategy
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

jwtStrategy.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await userRepository.findOneById({ _id: jwt_payload._id }, [
        "email",
        "role",
        "store_id",
        "name",
      ]);

      if (user) return done(null, user);
      return done(null, false);
    } catch (error) {
      return done(new unauthorizedError(error.message), false);
    }
  })
);

export default jwtStrategy;
