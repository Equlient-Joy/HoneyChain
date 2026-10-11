import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Harvest API (M7)", () => {
  it("should reject harvest when extracted weight exceeds allowable yield by >10% (BLOCK)", async () => {
    const payload = {
      hive_id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
      harvested_at: new Date().toISOString(),
      supers_removed: 2,
      weight_before_kg: 58.0,
      weight_after_kg: 40.0,
      comb_tare_kg: 3.0,
      extracted_honey_kg: 25.0, // Vastly over allowable (removed mass is 18kg, tare is 3kg -> max 15kg)
      moisture_pct: 17.5,
      witness_name: "KVK Officer Kumar",
      witness_phone_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      evidence_level: "sensor_verified"
    };

    const res = await app.request("/api/v1/harvests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("YIELD_CHECK_BLOCKED");
  });

  it("should accept valid harvest within allowable yield and weight agreement", async () => {
    const payload = {
      hive_id: "a1a1a1a1-a1a1-a1a1-a1a1a1a1a1a1",
      harvested_at: new Date().toISOString(),
      supers_removed: 2,
      weight_before_kg: 58.0,
      weight_after_kg: 41.0,
      comb_tare_kg: 3.0,
      extracted_honey_kg: 14.0, // Removed mass 17kg - tare 3kg = 14kg -> exact match
      moisture_pct: 17.8,
      witness_name: "KVK Officer Kumar",
      witness_phone_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      evidence_level: "sensor_verified"
    };

    const res = await app.request("/api/v1/harvests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.status).toBe("CREATED");
    expect(json.harvest_record_id).toBeDefined();
    expect(json.lot_id).toBeDefined();
    expect(json.yield_check).toBe("PASS");
    expect(json.weight_agreement).toBe("PASS");
  });
});
