import mongoose from "mongoose";
import { env } from "./env";
import logger from "./logger";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed");
    process.exit(1);
  }
};