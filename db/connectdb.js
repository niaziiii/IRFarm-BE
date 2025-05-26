import mongoose from "mongoose";

const connectDB = async (DATABASE_URL, DB_NAME = "") => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Database connected successfully");
  } catch (err) {
    console.log({ err });
  }
};

export default connectDB;
