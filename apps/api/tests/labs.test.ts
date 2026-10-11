import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Lab Workflow & Reports (FR9.5, FR9.7, M9, AT-06)", () => {
  it("should recompute verdict from moisture and flag mismatch if lab claims pass on 21.5% moisture", async () => {
    const payload = {
      sample_id: "sample-1",
      panel: "domestic",
      lab_verdict: "PASS",
      values: {
        moisture_pct: 21.5, // Standard threshold is max 20%
        sucrose_pct: 3.2,
        hmf_mg_kg: 24.0
      }
    };

    const res = await app.request("/api/v1/lab-requests/req-1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.system_verdict).toBe("FAIL");
    expect(json.needs_review).toBe(true);
    expect(json.status).toBe("ON_HOLD");
  });

  it("should certify batch with TEST_PASSED when lab and system verdicts agree on passing moisture (17.8%)", async () => {
    const payload = {
      sample_id: "sample-2",
      panel: "domestic",
      lab_verdict: "PASS",
      values: {
        moisture_pct: 17.8,
        sucrose_pct: 3.0,
        hmf_mg_kg: 18.0
      }
    };

    const res = await app.request("/api/v1/lab-requests/req-2/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.system_verdict).toBe("PASS");
    expect(json.needs_review).toBe(false);
    expect(json.status).toBe("TEST_PASSED");
  });

  it("should mark sample COMPROMISED and batch ON_HOLD if tag tamper loop is broken on receipt (AT-06)", async () => {
    const payload = {
      sample_id: "sample-3",
      tag_uid: "04A1B2C3D4E5F6",
      seal_broken: true
    };

    const res = await app.request("/api/v1/lab-requests/req-3/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sample_status).toBe("COMPROMISED");
    expect(json.batch_status).toBe("ON_HOLD");
  });
});
