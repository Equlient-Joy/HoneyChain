import { describe, expect, it, beforeEach } from "bun:test";
import app from "../src/index";
import { initHivesStore } from "../src/modules/m2-hives/routes";
import { initBatchesStore, initLotsStore } from "../src/modules/m8-batches/routes";
import { initLabRequestsStore } from "../src/modules/m9-labs/routes";
import { initRegulatorStores } from "../src/modules/m14-regulator/routes";

describe("Live Data Modules (Task A3)", () => {
  beforeEach(() => {
    initHivesStore();
    initBatchesStore();
    initLotsStore();
    initLabRequestsStore();
    initRegulatorStores();
  });

  describe("Hives Module (M2)", () => {
    it("GET /api/v1/hives should return Kanchipuram Apiary hives including HV-012, HV-009, HV-007, HV-003", async () => {
      const res = await app.request("/api/v1/hives", { method: "GET" });
      expect(res.status).toBe(200);

      const hives = await res.json();
      expect(Array.isArray(hives)).toBe(true);
      expect(hives.length).toBeGreaterThanOrEqual(4);

      // HV-012: Indian (Cerana), ISI_A, +1.8 kg today, 62% full, status: "Healthy", harvest_ready: true, allowable_yield_kg: 14.0
      const hv012 = hives.find((h: any) => h.hive_code === "HV-012");
      expect(hv012).toBeDefined();
      expect(hv012.species).toBe("Indian (Cerana)");
      expect(hv012.box_type).toBe("ISI_A");
      expect(hv012.gain_today).toBe("+1.8 kg");
      expect(hv012.gain_today_kg).toBe(1.8);
      expect(hv012.fill_pct).toBe(62);
      expect(hv012.status).toBe("Healthy");
      expect(hv012.harvest_ready).toBe(true);
      expect(hv012.allowable_yield_kg).toBe(14.0);

      // HV-009: Italian (Mellifera), Langstroth, +1.1 kg today, 40% full, status: "Healthy", harvest_ready: false
      const hv009 = hives.find((h: any) => h.hive_code === "HV-009");
      expect(hv009).toBeDefined();
      expect(hv009.species).toBe("Italian (Mellifera)");
      expect(hv009.box_type).toBe("Langstroth");
      expect(hv009.gain_today).toBe("+1.1 kg");
      expect(hv009.fill_pct).toBe(40);
      expect(hv009.status).toBe("Healthy");
      expect(hv009.harvest_ready).toBe(false);

      // HV-007: Indian (Cerana), ISI_A, +0.2 kg today, 15% full, status: "Watch", alert: "Mite risk detected. Check sticky board today.", harvest_ready: false
      const hv007 = hives.find((h: any) => h.hive_code === "HV-007");
      expect(hv007).toBeDefined();
      expect(hv007.status).toBe("Watch");
      expect(hv007.alert).toBe("Mite risk detected. Check sticky board today.");
      expect(hv007.fill_pct).toBe(15);
      expect(hv007.harvest_ready).toBe(false);

      // HV-003: Indian (Cerana), ISI_A, +0.9 kg today, 35% full, status: "Healthy", harvest_ready: false
      const hv003 = hives.find((h: any) => h.hive_code === "HV-003");
      expect(hv003).toBeDefined();
      expect(hv003.gain_today).toBe("+0.9 kg");
      expect(hv003.fill_pct).toBe(35);
      expect(hv003.status).toBe("Healthy");
      expect(hv003.harvest_ready).toBe(false);
    });

    it("GET /api/v1/hives/:id should return single hive details with historical 24h readings", async () => {
      const res = await app.request("/api/v1/hives/HV-012", { method: "GET" });
      expect(res.status).toBe(200);

      const hive = await res.json();
      expect(hive.hive_code).toBe("HV-012");
      expect(hive.readings_24h).toBeDefined();
      expect(Array.isArray(hive.readings_24h)).toBe(true);
      expect(hive.readings_24h.length).toBeGreaterThanOrEqual(24);

      const firstReading = hive.readings_24h[0];
      expect(firstReading.timestamp).toBeDefined();
      expect(firstReading.weight_kg).toBeDefined();
      expect(firstReading.brood_temp_c).toBeDefined();
      expect(firstReading.brood_rh_pct).toBeDefined();
    });

    it("GET /api/v1/hives/:id should return 404 for non-existent hive", async () => {
      const res = await app.request("/api/v1/hives/HV-999", { method: "GET" });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("HIVE_NOT_FOUND");
    });

    it("POST /api/v1/hives should register a new hive", async () => {
      const newHivePayload = {
        hive_code: "HV-021",
        species: "Indian (Cerana)",
        box_type: "ISI_A",
        frame_count: 8,
      };

      const res = await app.request("/api/v1/hives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHivePayload),
      });

      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.hive_code).toBe("HV-021");
      expect(created.species).toBe("Indian (Cerana)");
      expect(created.box_type).toBe("ISI_A");
      expect(created.frame_count).toBe(8);
      expect(created.status).toBe("Healthy");
      expect(created.id).toBeDefined();

      // Verify it appears in GET /api/v1/hives
      const listRes = await app.request("/api/v1/hives", { method: "GET" });
      const hives = await listRes.json();
      expect(hives.some((h: any) => h.hive_code === "HV-021")).toBe(true);
    });

    it("POST /api/v1/hives should reject duplicate hive code", async () => {
      const duplicatePayload = {
        hive_code: "HV-012",
        species: "Indian (Cerana)",
        box_type: "ISI_A",
        frame_count: 8,
      };

      const res = await app.request("/api/v1/hives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatePayload),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("DUPLICATE_HIVE");
    });
  });

  describe("Batches & Lots Module (M8)", () => {
    it("GET /api/v1/lots should return initialized lots", async () => {
      const res = await app.request("/api/v1/lots", { method: "GET" });
      expect(res.status).toBe(200);

      const lots = await res.json();
      expect(Array.isArray(lots)).toBe(true);
      expect(lots.length).toBe(2);

      const lot0421 = lots.find((l: any) => l.id === "lot-0421");
      expect(lot0421).toBeDefined();
      expect(lot0421.apiary).toBe("Kanchipuram Apiary");
      expect(lot0421.kg_declared).toBe(14.0);
      expect(lot0421.status).toBe("READY");
      expect(lot0421.harvest_date).toBe("2026-09-14");
      expect(lot0421.moisture_pct).toBe(17.8);

      const lot0422 = lots.find((l: any) => l.id === "lot-0422");
      expect(lot0422).toBeDefined();
      expect(lot0422.apiary).toBe("Salem Apiary");
      expect(lot0422.kg_declared).toBe(18.5);
      expect(lot0422.status).toBe("READY");
      expect(lot0422.harvest_date).toBe("2026-10-01");
      expect(lot0422.moisture_pct).toBe(18.2);
    });

    it("POST /api/v1/lots/:id/intake should record intake confirmation and update status", async () => {
      const intakePayload = {
        received_weight_kg: 14.1,
        moisture_pct: 17.8,
        seal_verified: true,
        decision: "ACCEPTED",
        notes: "Tamper seal intact. Density & refractive index verified.",
      };

      const res = await app.request("/api/v1/lots/lot-0421/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intakePayload),
      });

      expect(res.status).toBe(200);
      const intakeResult = await res.json();
      expect(intakeResult.status).toBe("INTAKE_CONFIRMED");
      expect(intakeResult.decision).toBe("ACCEPTED");
      expect(intakeResult.received_weight_kg).toBe(14.1);
      expect(intakeResult.moisture_pct).toBe(17.8);
      expect(intakeResult.seal_verified).toBe(true);

      // Verify updated status in GET /api/v1/lots
      const checkRes = await app.request("/api/v1/lots", { method: "GET" });
      const lots = await checkRes.json();
      const updatedLot = lots.find((l: any) => l.id === "lot-0421");
      expect(updatedLot.status).toBe("ACCEPTED");
      expect(updatedLot.received_weight_kg).toBe(14.1);
    });

    it("POST /api/v1/lots/:id/intake should return 404 for non-existent lot", async () => {
      const res = await app.request("/api/v1/lots/non-existent-lot/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          received_weight_kg: 10.0,
          moisture_pct: 18.0,
          seal_verified: true,
          decision: "ACCEPTED",
        }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("LOT_NOT_FOUND");
    });

    it("GET /api/v1/batches should return benchmark batch HC-0421 and newly created batches", async () => {
      const res = await app.request("/api/v1/batches", { method: "GET" });
      expect(res.status).toBe(200);

      const batches = await res.json();
      expect(Array.isArray(batches)).toBe(true);
      expect(batches.length).toBeGreaterThanOrEqual(1);

      const benchmark = batches.find((b: any) => b.public_code === "HC-0421");
      expect(benchmark).toBeDefined();
      expect(benchmark.status).toBe("TEST_PASSED");
      expect(benchmark.kg_net).toBe(10.0);
      expect(benchmark.moisture_pct).toBe(17.8);
      expect(benchmark.units_issued).toBe(19);
      expect(benchmark.tx_hash).toBeDefined();
      expect(benchmark.explorer_url).toContain("polygonscan.com");

      // Now create a new batch via POST /batches
      const postRes = await app.request("/api/v1/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Mock-Registry-Status": "verified",
        },
        body: JSON.stringify({
          farmer_org_id: "org-farmer-01",
          lot_id: "lot-0422",
          destination: "export",
          kg_net: 18.0,
        }),
      });
      expect(postRes.status).toBe(201);

      // Check that GET /batches returns both
      const updatedBatchesRes = await app.request("/api/v1/batches", { method: "GET" });
      const updatedBatches = await updatedBatchesRes.json();
      expect(updatedBatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Labs Module (M9)", () => {
    it("GET /api/v1/lab-requests should return list of testing requests (req-1 and req-2)", async () => {
      const res = await app.request("/api/v1/lab-requests", { method: "GET" });
      expect(res.status).toBe(200);

      const requests = await res.json();
      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBe(2);

      // req-1: Batch HC-0421, sample SMP-0421, panel domestic, status TEST_PASSED, moisture 17.8%, verdict PASS
      const req1 = requests.find((r: any) => r.id === "req-1");
      expect(req1).toBeDefined();
      expect(req1.batch_code).toBe("HC-0421");
      expect(req1.sample_id).toBe("SMP-0421");
      expect(req1.panel).toBe("domestic");
      expect(req1.status).toBe("TEST_PASSED");
      expect(req1.moisture).toBe(17.8);
      expect(req1.verdict).toBe("PASS");

      // req-2: Batch HC-0422, sample SMP-0422, panel export, status SEALED, moisture null, verdict pending
      const req2 = requests.find((r: any) => r.id === "req-2");
      expect(req2).toBeDefined();
      expect(req2.batch_code).toBe("HC-0422");
      expect(req2.sample_id).toBe("SMP-0422");
      expect(req2.panel).toBe("export");
      expect(req2.status).toBe("SEALED");
      expect(req2.moisture).toBeNull();
      expect(req2.verdict).toBe("pending");
    });
  });

  describe("Regulator Module (M14)", () => {
    it("GET /api/v1/regulator/registry-queue should return pending organizations including Salem Beekeeper", async () => {
      const res = await app.request("/api/v1/regulator/registry-queue", { method: "GET" });
      expect(res.status).toBe(200);

      const queue = await res.json();
      expect(Array.isArray(queue)).toBe(true);
      expect(queue.length).toBeGreaterThanOrEqual(1);

      const salem = queue.find((o: any) => o.name.includes("Salem Non-Compliant Beekeeper"));
      expect(salem).toBeDefined();
      expect(salem.org_id).toBe("org-salem-nc");
      expect(salem.status).toBe("PENDING_VERIFICATION");
      expect(salem.madhukranti_no).toBeDefined();
    });

    it("POST /api/v1/regulator/registry-verify should verify or reject pending organization", async () => {
      // Verify
      const verifyRes = await app.request("/api/v1/regulator/registry-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: "org-salem-nc",
          action: "verify",
          reason: "Completed on-site inspection and biometric verification.",
        }),
      });

      expect(verifyRes.status).toBe(200);
      const verifyResult = await verifyRes.json();
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.status).toBe("VERIFIED");
      expect(verifyResult.registry_status).toBe("verified");
      expect(verifyResult.reason).toContain("inspection");

      // Verify rejection flow
      const rejectRes = await app.request("/api/v1/regulator/registry-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: "org-madurai-02",
          action: "reject",
          reason: "FSSAI certificate expired.",
        }),
      });

      expect(rejectRes.status).toBe(200);
      const rejectResult = await rejectRes.json();
      expect(rejectResult.success).toBe(true);
      expect(rejectResult.status).toBe("REJECTED");
      expect(rejectResult.registry_status).toBe("rejected");
    });

    it("GET /api/v1/regulator/audit-queue should return batches with risk scores and factors", async () => {
      const res = await app.request("/api/v1/regulator/audit-queue", { method: "GET" });
      expect(res.status).toBe(200);

      const auditQueue = await res.json();
      expect(Array.isArray(auditQueue)).toBe(true);
      expect(auditQueue.length).toBeGreaterThanOrEqual(2);

      const hc0421 = auditQueue.find((b: any) => b.public_code === "HC-0421");
      expect(hc0421).toBeDefined();
      expect(hc0421.risk_score).toBe(12);

      const hc0999 = auditQueue.find((b: any) => b.public_code === "HC-0999");
      expect(hc0999).toBeDefined();
      expect(hc0999.risk_score).toBe(88);
      expect(hc0999.factors).toContain("tamper_event");
      expect(hc0999.factors).toContain("hash_mismatch");
    });

    it("POST /api/v1/regulator/batch-recall should mark batch RECALLED", async () => {
      const recallRes = await app.request("/api/v1/regulator/batch-recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_id: "HC-0999",
          reason: "Cryptographic tamper loop broken; adulteration risk.",
        }),
      });

      expect(recallRes.status).toBe(200);
      const recallJson = await recallRes.json();
      expect(recallJson.success).toBe(true);
      expect(recallJson.status).toBe("RECALLED");
      expect(recallJson.reason).toContain("Cryptographic tamper loop");

      // Verify audit queue reflection
      const auditRes = await app.request("/api/v1/regulator/audit-queue", { method: "GET" });
      const auditQueue = await auditRes.json();
      const recalledBatch = auditQueue.find((b: any) => b.public_code === "HC-0999");
      expect(recalledBatch.status).toBe("RECALLED");
    });
  });
});
