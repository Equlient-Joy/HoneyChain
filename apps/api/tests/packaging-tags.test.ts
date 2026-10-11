import { describe, expect, it } from "bun:test";
import app from "../src/index";
import { generateVirtualTap, verifyVirtualTap } from "../src/modules/m11-tags/virtual-crypto";

describe("Packaging Quota & Tag Crypto (FR10.2, FR11.1, AT-07, AT-09)", () => {
  it("should calculate tag quota accurately: 10 kg, 500g jars, 2% loss -> 19 units", async () => {
    const res = await app.request("/api/v1/batches/b1/quota?kg_net=10.0&unit_size_g=500&handling_loss=0.02");
    expect(res.status).toBe(200);
    const json = await res.json();
    // floor(10 * (1 - 0.02) / 0.5) = floor(9.8 / 0.5) = 19
    expect(json.max_units).toBe(19);
  });

  it("should enforce packaging quota and refuse 20th unit when quota is 19 (AT-09)", async () => {
    // Attempt to provision 20 units for a 10 kg batch
    const payload = {
      batch_id: "b1",
      kg_net: 10.0,
      unit_size_g: 500,
      quantity_requested: 20
    };

    const res = await app.request("/api/v1/batches/b1/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("QUOTA_EXCEEDED");
    expect(json.max_allowed).toBe(19);
  });

  it("should generate and verify virtual NTAG 424 tap code with counter check", () => {
    const uid = "04A1B2C3D4E5F6";
    const masterKey = "00112233445566778899aabbccddeeff";
    const counter = 5;

    const tapCode = generateVirtualTap(uid, counter, masterKey);
    expect(tapCode).toBeDefined();

    const verification = verifyVirtualTap(uid, counter, tapCode, masterKey, 4);
    expect(verification.valid).toBe(true);

    // Replay check (counter <= lastCounter)
    const replayVerification = verifyVirtualTap(uid, 4, tapCode, masterKey, 4);
    expect(replayVerification.valid).toBe(false);
    expect(replayVerification.reason).toBe("COUNTER_REPLAY");

    // Cloned / invalid signature check
    const fakeVerification = verifyVirtualTap(uid, counter + 1, "invalidtapcode12", masterKey, 4);
    expect(fakeVerification.valid).toBe(false);
    expect(fakeVerification.reason).toBe("SIGNATURE_INVALID");
  });
});
