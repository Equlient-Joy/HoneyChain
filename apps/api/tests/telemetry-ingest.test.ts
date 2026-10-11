import { describe, expect, it } from "bun:test";
import { generateKeyPairSync, sign } from "node:crypto";
import app from "../src/index";
import { canonicalStringify } from "@honeychain/shared";

describe("Telemetry Ingestion (M3 & Appendix C)", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubKeyBase64 = publicKey.export({ type: "spki", format: "der" }).toString("base64");

  it("should accept validly signed telemetry message with 202 Accepted", async () => {
    const unsignedMessage = {
      schema_version: "1.0",
      message_id: "c8f5d023-74b8-4c07-9f2d-8067cbbd8412",
      gateway_id: "GW-104928",
      apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      sent_at: new Date().toISOString(),
      readings: [
        {
          hive_code: "HV-012",
          node_id: "node-12",
          seq: 1,
          sampled_at: new Date().toISOString(),
          mode: "scheduled",
          sensors: {
            hive_weight: { kg: 45.2, std_g: 5, n: 10 }
          },
          power: { battery_v: 3.8 }
        }
      ]
    };

    const signatureBytes = sign(null, Buffer.from(canonicalStringify(unsignedMessage)), privateKey);
    const signedPayload = {
      ...unsignedMessage,
      signature: {
        alg: "ed25519",
        key_id: "node-12",
        value: signatureBytes.toString("base64")
      }
    };

    const res = await app.request("/api/v1/ingest/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Public-Key": pubKeyBase64
      },
      body: JSON.stringify(signedPayload)
    });

    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.status).toBe("ACCEPTED");
    expect(json.processed_count).toBe(1);
  });

  it("should reject telemetry with timestamp > 10 minutes in the future", async () => {
    const futureTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const futureMessage = {
      schema_version: "1.0",
      message_id: "c8f5d023-74b8-4c07-9f2d-8067cbbd8413",
      gateway_id: "GW-104928",
      apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      sent_at: futureTime,
      readings: [
        {
          hive_code: "HV-012",
          node_id: "node-12",
          seq: 2,
          sampled_at: futureTime,
          mode: "scheduled",
          sensors: { hive_weight: { kg: 45.2, std_g: 5, n: 10 } },
          power: { battery_v: 3.8 }
        }
      ],
      signature: {
        alg: "ed25519",
        key_id: "node-12",
        value: "dummy"
      }
    };

    const res = await app.request("/api/v1/ingest/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(futureMessage)
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("TIMESTAMP_IN_FUTURE");
  });

  it("should reject invalid ed25519 signature", async () => {
    const unsignedMessage = {
      schema_version: "1.0",
      message_id: "c8f5d023-74b8-4c07-9f2d-8067cbbd8414",
      gateway_id: "GW-104928",
      apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      sent_at: new Date().toISOString(),
      readings: [
        {
          hive_code: "HV-012",
          node_id: "node-12",
          seq: 3,
          sampled_at: new Date().toISOString(),
          mode: "scheduled",
          sensors: { hive_weight: { kg: 45.2, std_g: 5, n: 10 } },
          power: { battery_v: 3.8 }
        }
      ],
      signature: {
        alg: "ed25519",
        key_id: "node-12",
        value: Buffer.from("invalidsignaturedata1234567890").toString("base64")
      }
    };

    const res = await app.request("/api/v1/ingest/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Public-Key": pubKeyBase64
      },
      body: JSON.stringify(unsignedMessage)
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("SIGNATURE_INVALID");
  });
});
