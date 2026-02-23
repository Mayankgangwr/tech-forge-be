import mongoose from "mongoose";
import { env } from "./env";
import logger from "./logger";

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("database_connected");
  } catch (error) {
    logger.error("database_connection_failed", {
      message: error instanceof Error ? error.message : "Unknown database error",
    });
    process.exit(1);
  }
};
