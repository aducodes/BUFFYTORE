import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("DB Connected");
    });

    await mongoose.connect(
      `${process.env.MONGODB_URI}/e-commerce`
    );

  } catch (error) {
    console.error("MongoDB Connection Error:");
    console.error(error);
  }
};

export default connectDB;