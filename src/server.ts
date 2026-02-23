import app from "./app";
import { env } from "./config/env";
import logger from "./config/logger";
import { loadDatabase } from "./loaders";

const startServer = async () => {
  await loadDatabase();

  app.listen(env.PORT, () => {
    logger.info("server_started", { port: env.PORT });
  });
};

startServer().catch((error: unknown) => {
  logger.error("server_start_failed", {
    message: error instanceof Error ? error.message : "Unknown startup error",
  });
  process.exit(1);
});
