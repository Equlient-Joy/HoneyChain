import { Hono } from "hono";
import { appendCustodyHash } from "../m13-custody/hash-chain";

export const batchRoutes = new Hono();

batchRoutes.post("/batches", async (c) => {
  const registryStatus = c.req.header("X-Mock-Registry-Status") || "not_registered";
  if (registryStatus !== "verified") {
    return c.json({
      error: "REGISTRY_REQUIRED",
      message: "Register on Madhukranti to create a batch. It takes about 10 minutes."
    }, 403);
  }

  const body = await c.req.json();
  const batchId = crypto.randomUUID();
  const publicCode = "HC-0421"; // Seed identifier for demo / AT-01
  const genesisHash = "0000000000000000000000000000000000000000000000000000000000000000";

  const eventPayload = {
    batch_id: batchId,
    public_code: publicCode,
    lot_id: body.lot_id,
    action: "BATCH_CREATED",
    kg_net: body.kg_net,
    created_at: new Date().toISOString()
  };

  const eventHash = appendCustodyHash(genesisHash, eventPayload);

  return c.json({
    status: "DRAFT",
    batch_id: batchId,
    public_code: publicCode,
    destination: body.destination,
    event_hash: eventHash
  }, 201);
});
