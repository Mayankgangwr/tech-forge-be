import type { Express } from "express";
import { errorHandler } from "../middlewares/error.middleware";
import apiRouter from "../routes";
import { AppError } from "../utils/appError";

export const loadRoutes = (app: Express): void => {
  app.get("/api/v1/health", (_req, res) => {
    res.json({ success: true, message: "Health Mast Bhai" });
  });

  app.use("/api/v1", apiRouter);

  app.use(() => {
    throw new AppError("Route not found", 404);
  });

  app.use(errorHandler);
};

