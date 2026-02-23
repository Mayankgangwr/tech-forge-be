import { connectDB } from "../config/db";

export const loadDatabase = async (): Promise<void> => {
  await connectDB();
};

