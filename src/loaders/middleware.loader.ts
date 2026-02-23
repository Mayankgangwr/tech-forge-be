import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import type { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "../config/env";
import { requestIdMiddleware } from "../middlewares/requestId.middleware";

export const loadMiddlewares = (app: Express): void => {
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
};
