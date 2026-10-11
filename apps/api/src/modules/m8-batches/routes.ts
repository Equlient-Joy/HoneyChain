import { Hono } from "hono";
import { appendCustodyHash } from "../m13-custody/hash-chain";

export interface BatchRecord {
  batch_id: string;
  public_code: string;
  status: string;
  kg_net: number;
  moisture_pct?: number;
  units_issued?: number;
  destination: string;
  tx_hash?: string;
  explorer_url?: string;
  event_hash?: string;
  lot_id?: string;
  farmer_org_id?: string;
  created_at: string;
}

export interface LotRecord {
  id: string;
  apiary: string;
  farmer_org_name?: string;
  kg_declared: number;
  status: "READY" | "ACCEPTED" | "REJECTED" | string;
  harvest_date: string;
  moisture_pct: number;
  received_weight_kg?: number;
  received_moisture_pct?: number;
  seal_verified?: boolean;
  decision?: "ACCEPTED" | "REJECTED";
  notes?: string;
  intake_at?: string;
}

export const BENCHMARK_BATCH: BatchRecord = {
  batch_id: "batch-hc-0421",
  public_code: "HC-0421",
  status: "TEST_PASSED",
  kg_net: 10.0,
  moisture_pct: 17.8,
  units_issued: 19,
  destination: "domestic",
  tx_hash: "0x8f2d5a9b7e3c1a4d6f8e0b2c4a6e8d0f1a3b5c7e9d1f3b5a7c9e1d3f5b7a9c1e",
  explorer_url: "https://amoy.polygonscan.com/tx/0x8f2d5a9b7e3c1a4d6f8e0b2c4a6e8d0f1a3b5c7e9d1f3b5a7c9e1d3f5b7a9c1e",
  event_hash: "0000000000000000000000000000000000000000000000000000000000000000",
  lot_id: "lot-0421",
  farmer_org_id: "org-farmer-01",
  created_at: "2026-09-15T10:00:00Z",
};

export const SEED_LOTS: LotRecord[] = [
  {
    id: "lot-0421",
    apiary: "Kanchipuram Apiary",
    farmer_org_name: "Kanchipuram Natural Apiaries FPO",
    kg_declared: 14.0,
    status: "READY",
    harvest_date: "2026-09-14",
    moisture_pct: 17.8,
  },
  {
    id: "lot-0422",
    apiary: "Salem Apiary",
    farmer_org_name: "Salem Apiary",
    kg_declared: 18.5,
    status: "READY",
    harvest_date: "2026-10-01",
    moisture_pct: 18.2,
  },
];

export let batchesStore: BatchRecord[] = [];
export let lotsStore: LotRecord[] = [];

export function initBatchesStore(): void {
  batchesStore = [{ ...BENCHMARK_BATCH }];
}

export function initLotsStore(): void {
  lotsStore = SEED_LOTS.map((lot) => ({ ...lot }));
}

// Initialise stores
initBatchesStore();
initLotsStore();

export const batchRoutes = new Hono();

// GET /batches
batchRoutes.get("/batches", (c) => {
  return c.json(batchesStore, 200);
});

// GET /lots
batchRoutes.get("/lots", (c) => {
  return c.json(lotsStore, 200);
});

// POST /lots/:id/intake
batchRoutes.post("/lots/:id/intake", async (c) => {
  const id = c.req.param("id");
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "VALIDATION_ERROR", message: "Invalid JSON payload" }, 400);
  }

  const lot = lotsStore.find((l) => l.id === id);
  if (!lot) {
    return c.json({ error: "LOT_NOT_FOUND", message: `Lot with ID '${id}' not found.` }, 404);
  }

  const decision = body.decision === "REJECTED" ? "REJECTED" : "ACCEPTED";
  const receivedWeight =
    typeof body.received_weight_kg === "number"
      ? body.received_weight_kg
      : parseFloat(body.received_weight_kg) || lot.kg_declared;
  const moisturePct =
    typeof body.moisture_pct === "number"
      ? body.moisture_pct
      : parseFloat(body.moisture_pct) || lot.moisture_pct;
  const sealVerified =
    body.seal_verified !== undefined ? Boolean(body.seal_verified) : true;
  const notes = body.notes || "";

  lot.status = decision;
  lot.received_weight_kg = receivedWeight;
  lot.received_moisture_pct = moisturePct;
  lot.seal_verified = sealVerified;
  lot.decision = decision;
  lot.notes = notes;
  lot.intake_at = new Date().toISOString();

  return c.json(
    {
      status: "INTAKE_CONFIRMED",
      lot_id: lot.id,
      lot,
      decision,
      received_weight_kg: receivedWeight,
      moisture_pct: moisturePct,
      seal_verified: sealVerified,
      notes,
    },
    200
  );
});

// POST /batches
batchRoutes.post("/batches", async (c) => {
  const registryStatus = c.req.header("X-Mock-Registry-Status") || "not_registered";
  if (registryStatus !== "verified") {
    return c.json(
      {
        error: "REGISTRY_REQUIRED",
        message: "Register on Madhukranti to create a batch. It takes about 10 minutes.",
      },
      403
    );
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
    created_at: new Date().toISOString(),
  };

  const eventHash = appendCustodyHash(genesisHash, eventPayload);

  const createdBatch: BatchRecord = {
    batch_id: batchId,
    public_code: publicCode,
    destination: body.destination || "domestic",
    kg_net: body.kg_net || 10.0,
    status: "DRAFT",
    lot_id: body.lot_id,
    farmer_org_id: body.farmer_org_id,
    event_hash: eventHash,
    created_at: new Date().toISOString(),
  };

  batchesStore.push(createdBatch);

  return c.json(
    {
      status: "DRAFT",
      batch_id: batchId,
      public_code: publicCode,
      destination: body.destination,
      event_hash: eventHash,
    },
    201
  );
});
