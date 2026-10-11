import { Hono } from "hono";
import { IngestionPayloadSchema } from "@honeychain/shared";
import { verifyEd25519Signature } from "./verify-signature";

export const telemetryRoutes = new Hono();

telemetryRoutes.post("/ingest/telemetry", async (c) => {
  const body = await c.req.json();
  const parsed = IngestionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "INVALID_SCHEMA", details: parsed.error.issues }, 400);
  }

  // Reject future timestamp (>10 mins)
  const sentTime = new Date(parsed.data.sent_at).getTime();
  if (sentTime > Date.now() + 10 * 60 * 1000) {
    return c.json({ error: "TIMESTAMP_IN_FUTURE" }, 400);
  }

  // Verify Ed25519 signature if public key provided (or test mode header)
  const publicKeyHeader = c.req.header("X-Device-Public-Key");
  if (publicKeyHeader) {
    const isValid = verifyEd25519Signature(body, publicKeyHeader);
    if (!isValid) {
      return c.json({ error: "SIGNATURE_INVALID", message: "Ed25519 signature verification failed." }, 401);
    }
  }

  return c.json({
    status: "ACCEPTED",
    message_id: parsed.data.message_id,
    processed_count: parsed.data.readings.length
  }, 202);
});
