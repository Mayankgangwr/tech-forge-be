import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import apiRouter from "./routes";
import { env } from "./config/env";
import { AppError } from "./utils/appError";

const app = express();

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

app.get("/api/v1/health", (_, res) => {
  res.json({ success: true, message: "OK" });
});

app.use("/api/v1", apiRouter);

app.use(() => {
  throw new AppError("Route not found", 404);
});

app.use(errorHandler);

export default app;
