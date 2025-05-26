import localStrategy from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import userRepository from "../repositories/userRepository.js";
// Local Strategy
localStrategy.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      // Replace with your user authentication logic
      let user = await userRepository.findOneByQuery({
        filterQuery: { email: email.toLowerCase() },
      });

      if (!user) return done(null, false, { message: "Invalid credentials." });

      if (!(await user.comparePassword(password)))
        return done(null, false, { message: "Invalid credentials." });
      return done(null, user);
    }
  )
);

export default localStrategy;
