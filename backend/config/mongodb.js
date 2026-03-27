import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            `${process.env.MONGODB_URI}/e-commerce`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1); // stop app if DB fails
    }
};

export default connectDB;