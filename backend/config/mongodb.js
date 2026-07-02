import mongoose from "mongoose";

const MONGODB_URI = `${process.env.MONGODB_URI}/e-commerce`;

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
    });

    isConnected = conn.connections[0].readyState === 1;

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
};

export default connectDB;