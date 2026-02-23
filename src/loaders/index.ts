import type { Express } from "express";
import { loadConfig } from "./config.loader";
import { loadDatabase } from "./database.loader";
import { loadMiddlewares } from "./middleware.loader";
import { loadRoutes } from "./route.loader";

export const loadApp = (app: Express): void => {
  loadConfig();
  loadMiddlewares(app);
  loadRoutes(app);
};

export { loadDatabase };
