import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { telemetryRoutes } from "./modules/m3-telemetry/routes";
import { harvestRoutes } from "./modules/m7-harvest/routes";
import { batchRoutes } from "./modules/m8-batches/routes";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.route("/api/v1", telemetryRoutes);
app.route("/api/v1", harvestRoutes);
app.route("/api/v1", batchRoutes);

app.get("/api/v1/health", (c) => {
  return c.json({
    status: "ok",
    version: "1.0.0",
    service: "honeychain-api",
    timestamp: new Date().toISOString()
  });
});

export default app;

