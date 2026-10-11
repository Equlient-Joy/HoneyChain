import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./modules/m1-auth/routes";
import { hivesRoutes } from "./modules/m2-hives/routes";
import { telemetryRoutes } from "./modules/m3-telemetry/routes";
import { harvestRoutes } from "./modules/m7-harvest/routes";
import { batchRoutes } from "./modules/m8-batches/routes";
import { labRoutes } from "./modules/m9-labs/routes";
import { packagingRoutes } from "./modules/m10-packaging/routes";
import { verificationRoutes } from "./modules/m12-verification/routes";
import { regulatorRoutes } from "./modules/m14-regulator/routes";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.route("/api/v1", authRoutes);
app.route("/api/v1", hivesRoutes);
app.route("/api/v1", telemetryRoutes);
app.route("/api/v1", harvestRoutes);
app.route("/api/v1", batchRoutes);
app.route("/api/v1", labRoutes);
app.route("/api/v1", packagingRoutes);
app.route("/api/v1", verificationRoutes);
app.route("/api/v1", regulatorRoutes);

app.get("/api/v1/health", (c) => {
  return c.json({
    status: "ok",
    version: "1.0.0",
    service: "honeychain-api",
    timestamp: new Date().toISOString()
  });
});

export { app };
export * from "./modules/m11-tags/virtual-crypto";
export default app;

