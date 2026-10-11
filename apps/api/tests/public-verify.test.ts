import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Public Verification Endpoint (M12, Screens 3 & 4)", () => {
  it("should return VERIFIED for genuine batch HC-0421 with live explorer URL", async () => {
    const res = await app.request("/api/v1/public/verify?code=HC-0421-0001&mode=nfc&tap=valid");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBe("VERIFIED");
    expect(json.batch_code).toBe("HC-0421");
    expect(json.origin_district).toBe("Kanchipuram, TN");
    expect(json.moisture_pct).toBe(17.8);
    expect(json.checks.hive).toBe("VERIFIED");
    expect(json.checks.lab_report).toBe("VERIFIED");
    expect(json.checks.jar_sealed).toBe("VERIFIED");
    expect(json.checks.store_shelf).toBe("VERIFIED");
    expect(json.anchored).toBe(true);
    expect(json.explorer_url).toContain("polygonscan.com");
  });

  it("should return RECORD_ONLY for QR scan without NFC tap code", async () => {
    const res = await app.request("/api/v1/public/verify?code=HC-0421-0001&mode=qr");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBe("RECORD_ONLY");
    expect(json.assurance_label).toBe("Record found. Tap the jar to confirm it is genuine.");
  });

  it("should return TAMPER_OPEN for tampered batch HC-0999 (Screen 4)", async () => {
    const res = await app.request("/api/v1/public/verify?code=HC-0999-0001");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBe("TAMPER_OPEN");
    expect(json.failed_stage).toBe("Jar seal broken");
    expect(json.can_buy).toBe(false);
  });
});
