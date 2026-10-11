import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { telemetryRoutes } from "./modules/m3-telemetry/routes";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.route("/api/v1", telemetryRoutes);

app.get("/api/v1/health", (c) => {
  return c.json({
    status: "ok",
    version: "1.0.0",
    service: "honeychain-api",
    timestamp: new Date().toISOString()
  });
});

export default app;

