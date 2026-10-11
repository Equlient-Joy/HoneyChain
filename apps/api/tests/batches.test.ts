import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Batches and Madhukranti Gate (FR1.4, M8)", () => {
  it("should reject batch creation with 403 REGISTRY_REQUIRED if farmer is not verified", async () => {
    const payload = {
      farmer_org_id: "org-unverified-123",
      lot_id: "lot-1",
      destination: "domestic"
    };

    const res = await app.request("/api/v1/batches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mock-Registry-Status": "not_registered"
      },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("REGISTRY_REQUIRED");
  });

  it("should create batch HC-0421 and append custody event when farmer is verified", async () => {
    const payload = {
      farmer_org_id: "org-verified-123",
      lot_id: "lot-1",
      destination: "domestic",
      kg_net: 14.2
    };

    const res = await app.request("/api/v1/batches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mock-Registry-Status": "verified"
      },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.public_code).toMatch(/^HC-\d{4}$/);
    expect(json.status).toBe("DRAFT");
    expect(json.event_hash).toBeDefined();
  });
});
