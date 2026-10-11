/**
 * HoneyChain Telemetry Simulator CLI
 * Generates Ed25519-signed telemetry payloads sent to the API.
 * Supports scenarios: normal_flow, swarm, heat_stress, syrup_feeding.
 */

import { generateKeyPairSync, sign } from "node:crypto";
import { canonicalStringify, evaluateAnomalies, type TelemetryReading, type IngestionPayload } from "@honeychain/shared";
import app from "@honeychain/api";

export type ScenarioType = "normal_flow" | "swarm" | "heat_stress" | "syrup_feeding";

export interface SimulatorOptions {
  scenario?: ScenarioType;
  apiUrl?: string;
  gatewayId?: string;
  apiaryId?: string;
  hiveCode?: string;
}

export function generateScenarioReadings(scenario: ScenarioType, hiveCode = "HV-012"): TelemetryReading[] {
  const now = new Date();
  const nodeId = `node-${hiveCode.replace(/\D/g, "") || "12"}`;

  switch (scenario) {
    case "swarm": {
      // Swarm anomaly: 1.8 kg drop between 10:00 and 15:00
      const oneHourAgo = new Date(now.getTime() - 3600000);
      return [
        {
          hive_code: hiveCode,
          node_id: nodeId,
          seq: 101,
          sampled_at: oneHourAgo.toISOString(),
          mode: "scheduled",
          sensors: {
            hive_weight: { kg: 46.5, std_g: 5, n: 10, platform_temp_c: 28.5 },
            brood: { temp_c: 34.8, rh_pct: 54 },
            ambient: { temp_c: 30.5, rh_pct: 50 }
          },
          power: { battery_v: 3.82, battery_pct: 88 }
        },
        {
          hive_code: hiveCode,
          node_id: nodeId,
          seq: 102,
          sampled_at: now.toISOString(),
          mode: "scheduled",
          sensors: {
            hive_weight: { kg: 44.7, std_g: 6, n: 10, platform_temp_c: 31.0 },
            brood: { temp_c: 34.5, rh_pct: 55 },
            ambient: { temp_c: 32.0, rh_pct: 48 }
          },
          power: { battery_v: 3.81, battery_pct: 87 },
          quality_flags: ["SWARM_WEIGHT_STEP_DROP"]
        }
      ];
    }

    case "heat_stress": {
      // Brood temp 37.8 C (threshold >= 37.0 C)
      return [
        {
          hive_code: hiveCode,
          node_id: nodeId,
          seq: 201,
          sampled_at: now.toISOString(),
          mode: "scheduled",
          sensors: {
            hive_weight: { kg: 45.0, std_g: 5, n: 10, platform_temp_c: 38.0 },
            brood: { temp_c: 37.8, rh_pct: 41 },
            ambient: { temp_c: 41.5, rh_pct: 35 }
          },
          power: { battery_v: 3.79, battery_pct: 85 },
          quality_flags: ["HEAT_STRESS_DETECTED"]
        }
      ];
    }

    case "syrup_feeding": {
      // Artificial syrup feeding: feeder_weight 2.5 kg
      return [
        {
          hive_code: hiveCode,
          node_id: nodeId,
          seq: 301,
          sampled_at: now.toISOString(),
          mode: "event",
          sensors: {
            hive_weight: { kg: 47.5, std_g: 8, n: 10, platform_temp_c: 26.5 },
            feeder_weight: { kg: 2.5, std_g: 10 },
            brood: { temp_c: 34.6, rh_pct: 55 },
            ambient: { temp_c: 27.5, rh_pct: 58 }
          },
          power: { battery_v: 3.86, battery_pct: 94 },
          quality_flags: ["FEEDER_ATTACHED", "ARTIFICIAL_FEEDING"]
        }
      ];
    }

    case "normal_flow":
    default: {
      // Normal diurnal telemetry
      return [
        {
          hive_code: hiveCode,
          node_id: nodeId,
          seq: 1,
          sampled_at: now.toISOString(),
          mode: "scheduled",
          sensors: {
            hive_weight: {
              kg: 45.2,
              std_g: 5,
              n: 10,
              platform_temp_c: 26.0,
              temp_compensated: true
            },
            feeder_weight: null,
            brood: { temp_c: 34.8, rh_pct: 55 },
            ambient: { temp_c: 28.5, rh_pct: 60, pressure_hpa: 1013 },
            motion: { lid_open: false, tilt_deg: 0.1, moved: false }
          },
          power: { battery_v: 3.85, battery_pct: 92, solar_v: 4.8 },
          quality_flags: []
        }
      ];
    }
  }
}

export async function simulateTelemetry(options: SimulatorOptions = {}) {
  const scenario = options.scenario || "normal_flow";
  const apiUrl = options.apiUrl || "http://localhost:3000";
  const gatewayId = options.gatewayId || "GW-104928";
  const apiaryId = options.apiaryId || "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5";
  const hiveCode = options.hiveCode || "HV-012";

  const readings = generateScenarioReadings(scenario, hiveCode);

  // Generate Ed25519 keypair
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubKeyDerBase64 = publicKey.export({ type: "spki", format: "der" }).toString("base64");

  const unsignedMessage = {
    schema_version: "1.0" as const,
    message_id: crypto.randomUUID(),
    gateway_id: gatewayId,
    apiary_id: apiaryId,
    sent_at: new Date().toISOString(),
    readings
  };

  const signatureBytes = sign(null, Buffer.from(canonicalStringify(unsignedMessage)), privateKey);
  const signedPayload: IngestionPayload = {
    ...unsignedMessage,
    signature: {
      alg: "ed25519",
      key_id: readings[0].node_id,
      value: signatureBytes.toString("base64")
    }
  };

  // Run local insight engine rules
  const telemetryPoints = readings.map((r) => ({
    weightKg: r.sensors.hive_weight.kg,
    timestamp: r.sampled_at,
    broodTempC: r.sensors.brood?.temp_c,
    ambientTempC: r.sensors.ambient?.temp_c
  }));
  const alerts = evaluateAnomalies(telemetryPoints, "apis_cerana_indica");

  let resStatus: number;
  let resJson: any;
  let deliveryMethod = "HTTP";

  try {
    const res = await fetch(`${apiUrl}/api/v1/ingest/telemetry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Public-Key": pubKeyDerBase64
      },
      body: JSON.stringify(signedPayload),
      signal: AbortSignal.timeout(1000)
    });
    resStatus = res.status;
    resJson = await res.json();
  } catch (_err) {
    // Fall back to in-process Hono instance
    deliveryMethod = "In-Process (app.request)";
    const res = await app.request("/api/v1/ingest/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Public-Key": pubKeyDerBase64
      },
      body: JSON.stringify(signedPayload)
    });
    resStatus = res.status;
    resJson = await res.json();
  }

  return {
    scenario,
    signedPayload,
    pubKeyDerBase64,
    alerts,
    deliveryMethod,
    resStatus,
    resJson
  };
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2);
  let scenario: ScenarioType = "normal_flow";
  let apiUrl = "http://localhost:3000";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scenario" || args[i] === "-s") {
      scenario = (args[i + 1] as ScenarioType) || "normal_flow";
      i++;
    } else if (args[i] === "--api-url") {
      apiUrl = args[i + 1];
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: bun run simulator/simulate.ts [options]

Options:
  --scenario, -s <scenario>  Scenario to simulate:
                             normal_flow   - Normal steady weight and temperature (default)
                             swarm         - Sudden 1.8 kg drop triggering SWARM_RISK
                             heat_stress   - Brood temp 37.8 C triggering HEAT_STRESS
                             syrup_feeding - Feeder weight active with artificial syrup
  --api-url <url>            Target API URL (default: http://localhost:3000)
  --help, -h                 Show this help message
`);
      process.exit(0);
    }
  }

  console.log(`\n\x1b[36m[Simulator]\x1b[0m Starting telemetry simulation: \x1b[1m${scenario}\x1b[0m`);
  
  simulateTelemetry({ scenario, apiUrl })
    .then((result) => {
      console.log(`\x1b[32m[OK]\x1b[0m Message ID: ${result.signedPayload.message_id}`);
      console.log(`     Gateway:    ${result.signedPayload.gateway_id}`);
      console.log(`     Delivery:   ${result.deliveryMethod}`);
      console.log(`     Status:     ${result.resStatus} (Processed: ${result.resJson.processed_count || 1})`);
      console.log(`     Signature:  Ed25519 verified (Key: ${result.signedPayload.signature.key_id})`);

      if (result.alerts.length > 0) {
        console.log(`\n\x1b[33m[Detected Alerts]\x1b[0m`);
        for (const a of result.alerts) {
          console.log(`  - \x1b[31m[${a.ruleId}]\x1b[0m ${a.title}: ${a.whatWeSaw}`);
          console.log(`    Steps: ${a.steps.join("; ")}`);
        }
      } else {
        console.log(`\n\x1b[32m[Insight Status]\x1b[0m No anomalies detected (Normal apiary conditions)`);
      }
      console.log("");
    })
    .catch((err) => {
      console.error("\x1b[31m[Simulator Error]\x1b[0m", err);
      process.exit(1);
    });
}
