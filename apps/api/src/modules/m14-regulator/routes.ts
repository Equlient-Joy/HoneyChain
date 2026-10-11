import { Hono } from "hono";
import { batchesStore } from "../m8-batches/routes";

export interface PendingOrganization {
  org_id: string;
  name: string;
  org_name: string;
  type: string;
  district: string;
  state: string;
  madhukranti_no: string;
  registry_status: "pending" | "verified" | "rejected" | string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | string;
  submitted_at: string;
  hives_count: number;
  reason?: string;
  verified_at?: string;
}

export interface AuditBatchRecord {
  batch_id: string;
  public_code: string;
  risk_score: number;
  factors: string[];
  status: string;
  kg_net: number;
  owner_org: string;
  flagged_at: string;
  recall_reason?: string;
  recalled_at?: string;
}

export const SEED_REGISTRY_QUEUE: PendingOrganization[] = [
  {
    org_id: "org-salem-nc",
    name: "Salem Non-Compliant Beekeeper",
    org_name: "Salem Non-Compliant Beekeeper",
    type: "farmer",
    district: "Salem",
    state: "Tamil Nadu",
    madhukranti_no: "MK-TN-2026-9041",
    registry_status: "pending",
    status: "PENDING_VERIFICATION",
    submitted_at: "2026-10-05T08:30:00Z",
    hives_count: 12,
  },
  {
    org_id: "org-madurai-02",
    name: "Madurai Valley Beekeepers",
    org_name: "Madurai Valley Beekeepers",
    type: "society_fpo",
    district: "Madurai",
    state: "Tamil Nadu",
    madhukranti_no: "MK-TN-2026-8812",
    registry_status: "pending",
    status: "PENDING_VERIFICATION",
    submitted_at: "2026-10-08T11:20:00Z",
    hives_count: 45,
  },
];

export const SEED_AUDIT_QUEUE: AuditBatchRecord[] = [
  {
    batch_id: "batch-hc-0421",
    public_code: "HC-0421",
    risk_score: 12,
    factors: [],
    status: "TEST_PASSED",
    kg_net: 10.0,
    owner_org: "Kanchipuram Natural Apiaries FPO",
    flagged_at: "2026-09-15T10:00:00Z",
  },
  {
    batch_id: "batch-hc-0999",
    public_code: "HC-0999",
    risk_score: 88,
    factors: ["tamper_event", "hash_mismatch"],
    status: "ON_HOLD",
    kg_net: 15.0,
    owner_org: "Salem Honey Traders",
    flagged_at: "2026-10-10T14:22:00Z",
  },
];

export let registryQueueStore: PendingOrganization[] = [];
export let auditQueueStore: AuditBatchRecord[] = [];

export function initRegulatorStores(): void {
  registryQueueStore = SEED_REGISTRY_QUEUE.map((org) => ({ ...org }));
  auditQueueStore = SEED_AUDIT_QUEUE.map((b) => ({ ...b, factors: [...b.factors] }));
}

// Initialise stores
initRegulatorStores();

export const regulatorRoutes = new Hono();

// GET /regulator/registry-queue
regulatorRoutes.get("/regulator/registry-queue", (c) => {
  return c.json(registryQueueStore, 200);
});

// POST /regulator/registry-verify
regulatorRoutes.post("/regulator/registry-verify", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "VALIDATION_ERROR", message: "Invalid JSON payload" }, 400);
  }

  const { org_id, action, reason } = body || {};

  if (!org_id || !action || !["verify", "reject"].includes(action.toLowerCase())) {
    return c.json(
      {
        error: "VALIDATION_ERROR",
        message: "org_id and action ('verify' or 'reject') are required.",
      },
      400
    );
  }

  const normalizedAction = action.toLowerCase() as "verify" | "reject";
  const org = registryQueueStore.find(
    (o) => o.org_id === org_id || o.name.toLowerCase() === org_id.toLowerCase()
  );

  if (!org) {
    return c.json(
      {
        error: "ORG_NOT_FOUND",
        message: `Organization '${org_id}' not found in registry queue.`,
      },
      404
    );
  }

  const newStatus = normalizedAction === "verify" ? "VERIFIED" : "REJECTED";
  const newRegistryStatus = normalizedAction === "verify" ? "verified" : "rejected";
  const verifiedAt = new Date().toISOString();

  org.status = newStatus;
  org.registry_status = newRegistryStatus;
  org.reason = reason || (normalizedAction === "verify" ? "Verified by regulator" : "Rejected by regulator");
  org.verified_at = verifiedAt;

  return c.json(
    {
      success: true,
      action: normalizedAction,
      org_id: org.org_id,
      status: newStatus,
      registry_status: newRegistryStatus,
      reason: org.reason,
      verified_at: verifiedAt,
      organization: org,
    },
    200
  );
});

// GET /regulator/audit-queue
regulatorRoutes.get("/regulator/audit-queue", (c) => {
  return c.json(auditQueueStore, 200);
});

// POST /regulator/batch-recall
regulatorRoutes.post("/regulator/batch-recall", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "VALIDATION_ERROR", message: "Invalid JSON payload" }, 400);
  }

  const { batch_id, reason } = body || {};

  if (!batch_id) {
    return c.json(
      {
        error: "VALIDATION_ERROR",
        message: "batch_id is required.",
      },
      400
    );
  }

  const recallReason = reason || "Recalled by regulatory authority.";
  const recalledAt = new Date().toISOString();

  // Update in audit queue if found
  const auditItem = auditQueueStore.find(
    (b) => b.batch_id === batch_id || b.public_code.toUpperCase() === batch_id.toUpperCase()
  );

  if (auditItem) {
    auditItem.status = "RECALLED";
    auditItem.recall_reason = recallReason;
    auditItem.recalled_at = recalledAt;
  }

  // Also sync with batchesStore if present
  const mainBatch = batchesStore.find(
    (b) => b.batch_id === batch_id || b.public_code.toUpperCase() === batch_id.toUpperCase()
  );
  if (mainBatch) {
    mainBatch.status = "RECALLED";
  }

  const publicCode = auditItem?.public_code || mainBatch?.public_code || batch_id;

  return c.json(
    {
      success: true,
      batch_id,
      public_code: publicCode,
      status: "RECALLED",
      reason: recallReason,
      recalled_at: recalledAt,
    },
    200
  );
});
