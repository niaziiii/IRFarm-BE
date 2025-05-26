import jwt from "jsonwebtoken";
const getJwtToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      role: user.role,
      store_id: user.store_id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.EXPIRES_IN,
    }
  );
};
export default getJwtToken;
