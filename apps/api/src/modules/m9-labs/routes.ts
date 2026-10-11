import { Hono } from "hono";
import crypto from "node:crypto";

export interface LabRequestRecord {
  id: string;
  batch_id: string;
  batch_code: string;
  sample_id: string;
  panel: "domestic" | "export" | string;
  status: string;
  moisture: number | null;
  moisture_pct: number | null;
  verdict: string;
  lab_verdict?: string;
  system_verdict?: string;
  created_at: string;
}

export const SEED_LAB_REQUESTS: LabRequestRecord[] = [
  {
    id: "req-1",
    batch_id: "batch-hc-0421",
    batch_code: "HC-0421",
    sample_id: "SMP-0421",
    panel: "domestic",
    status: "TEST_PASSED",
    moisture: 17.8,
    moisture_pct: 17.8,
    verdict: "PASS",
    lab_verdict: "PASS",
    system_verdict: "PASS",
    created_at: "2026-09-15T12:00:00Z",
  },
  {
    id: "req-2",
    batch_id: "batch-hc-0422",
    batch_code: "HC-0422",
    sample_id: "SMP-0422",
    panel: "export",
    status: "SEALED",
    moisture: null,
    moisture_pct: null,
    verdict: "pending",
    created_at: "2026-10-02T09:00:00Z",
  },
];

export let labRequestsStore: LabRequestRecord[] = [];

export function initLabRequestsStore(): void {
  labRequestsStore = SEED_LAB_REQUESTS.map((r) => ({ ...r }));
}

// Initialise store
initLabRequestsStore();

export const labRoutes = new Hono();

// GET /lab-requests
labRoutes.get("/lab-requests", (c) => {
  return c.json(labRequestsStore, 200);
});

// GET /lab-requests/:id
labRoutes.get("/lab-requests/:id", (c) => {
  const id = c.req.param("id");
  const reqItem = labRequestsStore.find((r) => r.id === id);
  if (!reqItem) {
    return c.json(
      { error: "LAB_REQUEST_NOT_FOUND", message: `Lab request '${id}' not found.` },
      404
    );
  }
  return c.json(reqItem, 200);
});

// POST /lab-requests/:id/receive
labRoutes.post("/lab-requests/:id/receive", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const reqItem = labRequestsStore.find((r) => r.id === id);

  if (body.seal_broken) {
    if (reqItem) {
      reqItem.status = "COMPROMISED";
    }
    return c.json(
      {
        status: "RECEIVED",
        sample_status: "COMPROMISED",
        batch_status: "ON_HOLD",
        message: "Sample tamper seal detected as broken on receipt.",
      },
      200
    );
  }

  if (reqItem) {
    reqItem.status = "AT_LAB";
  }

  return c.json(
    {
      status: "RECEIVED",
      sample_status: "AT_LAB",
      batch_status: "AT_LAB",
    },
    200
  );
});

// POST /lab-requests/:id/report
labRoutes.post("/lab-requests/:id/report", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const moisture = body.values.moisture_pct;

  // Recompute system verdict against FSSAI honey standard threshold (<= 20.0%)
  const systemVerdict = moisture <= 20.0 ? "PASS" : "FAIL";
  const verdictMismatch = systemVerdict !== body.lab_verdict;
  const status = verdictMismatch
    ? "ON_HOLD"
    : systemVerdict === "PASS"
    ? "TEST_PASSED"
    : "TEST_FAILED";

  const reqItem = labRequestsStore.find((r) => r.id === id);
  if (reqItem) {
    reqItem.moisture = moisture;
    reqItem.moisture_pct = moisture;
    reqItem.lab_verdict = body.lab_verdict;
    reqItem.system_verdict = systemVerdict;
    reqItem.verdict = body.lab_verdict;
    reqItem.status = status;
  }

  return c.json(
    {
      report_id: crypto.randomUUID(),
      lab_verdict: body.lab_verdict,
      system_verdict: systemVerdict,
      needs_review: verdictMismatch,
      status,
    },
    200
  );
});
