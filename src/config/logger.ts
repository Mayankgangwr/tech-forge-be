import { createLogger, transports, format } from "winston";

const logger = createLogger({
  level: "info",
  defaultMeta: { service: "tech-forge-be" },
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()],
});

export default logger;
