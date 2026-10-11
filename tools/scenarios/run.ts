/**
 * HoneyChain Acceptance Scenario Test Runner
 * Executes acceptance scenarios AT-01 through AT-09 against the Hono API instance.
 */

import { generateKeyPairSync, sign } from "node:crypto";
import { app, generateVirtualTap, verifyVirtualTap } from "@honeychain/api";
import { canonicalStringify, evaluateAnomalies } from "@honeychain/shared";

interface ScenarioResult {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: ScenarioResult[] = [];

const green = "\x1b[32m";
const red = "\x1b[31m";
const cyan = "\x1b[36m";
const bold = "\x1b[1m";
const reset = "\x1b[0m";

async function runScenario(
  id: string,
  name: string,
  fn: () => Promise<void>
): Promise<boolean> {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    results.push({ id, name, passed: true, durationMs });
    console.log(`${green}[PASS]${reset} ${bold}${id}:${reset} ${name} ${cyan}(${durationMs}ms)${reset}`);
    return true;
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    const msg = err?.message || String(err);
    results.push({ id, name, passed: false, durationMs, error: msg });
    console.error(`${red}[FAIL]${reset} ${bold}${id}:${reset} ${name} ${cyan}(${durationMs}ms)${reset}`);
    console.error(`       ${red}Error:${reset} ${msg}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// AT-01: Farmer Happy Path
// Harvest -> Batch -> Lab -> Packaging -> Tap Verify -> VERIFIED
// ---------------------------------------------------------------------------
async function testAT01() {
  // 1. Harvest
  const harvestRes = await app.request("/api/v1/harvests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      hive_code: "HV-012",
      weight_before_kg: 46.5,
      weight_after_kg: 44.5,
      comb_tare_kg: 0.2,
      extracted_honey_kg: 1.75,
      evidence_level: "sensor_verified"
    })
  });
  if (harvestRes.status !== 201) {
    throw new Error(`Harvest step failed: status ${harvestRes.status}`);
  }
  const harvestJson = await harvestRes.json();
  if (harvestJson.yield_check === "BLOCK") {
    throw new Error(`Harvest yield check blocked: ${harvestJson.yield_check}`);
  }
  const lotId = harvestJson.lot_id;
  if (!lotId) throw new Error("Missing lot_id from harvest response");

  // 2. Batch Creation (Madhukranti verified)
  const batchRes = await app.request("/api/v1/batches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Mock-Registry-Status": "verified"
    },
    body: JSON.stringify({
      lot_id: lotId,
      kg_net: 10.0,
      destination: "Accredited Lab"
    })
  });
  if (batchRes.status !== 201) {
    throw new Error(`Batch creation step failed: status ${batchRes.status}`);
  }
  const batchJson = await batchRes.json();
  if (batchJson.public_code !== "HC-0421") {
    throw new Error(`Expected public_code HC-0421, received ${batchJson.public_code}`);
  }
  const batchId = batchJson.batch_id;

  // 3. Lab Report (Moisture 17.8% -> PASS)
  const labRes = await app.request(`/api/v1/lab-requests/req-0421/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      batch_id: batchId,
      lab_verdict: "PASS",
      values: {
        moisture_pct: 17.8,
        hmf_mg_kg: 12.0
      }
    })
  });
  if (labRes.status !== 200) {
    throw new Error(`Lab report step failed: status ${labRes.status}`);
  }
  const labJson = await labRes.json();
  if (labJson.status !== "TEST_PASSED" || labJson.system_verdict !== "PASS") {
    throw new Error(`Expected TEST_PASSED with system_verdict PASS, got status ${labJson.status}`);
  }

  // 4. Packaging Units (10 kg -> 19 units issued)
  const pkgRes = await app.request(`/api/v1/batches/${batchId}/units`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kg_net: 10.0,
      unit_size_g: 500,
      handling_loss: 0.02,
      quantity_requested: 19
    })
  });
  if (pkgRes.status !== 201) {
    throw new Error(`Packaging step failed: status ${pkgRes.status}`);
  }
  const pkgJson = await pkgRes.json();
  if (pkgJson.units_issued !== 19) {
    throw new Error(`Expected 19 units issued, got ${pkgJson.units_issued}`);
  }

  // 5. Tap Verify (NFC mode -> VERIFIED)
  const verifyRes = await app.request("/api/v1/public/verify?code=HC-0421-0001&mode=nfc&tap=valid");
  if (verifyRes.status !== 200) {
    throw new Error(`Verify step failed: status ${verifyRes.status}`);
  }
  const verifyJson = await verifyRes.json();
  if (verifyJson.result !== "VERIFIED") {
    throw new Error(`Expected result VERIFIED, got ${verifyJson.result}`);
  }
  if (!verifyJson.explorer_url?.includes("amoy.polygonscan.com")) {
    throw new Error(`Expected polygonscan explorer URL in verification response`);
  }
}

// ---------------------------------------------------------------------------
// AT-02: Syrup Fraud
// Extracted honey > allowable yield -> YIELD_CHECK_BLOCKED
// ---------------------------------------------------------------------------
async function testAT02() {
  // Allowable yield = (46.5 - 44.5) - 0.2 = 1.8 kg
  // Declaring 3.5 kg exceeds allowable yield by >10%
  const res = await app.request("/api/v1/harvests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      hive_code: "HV-012",
      weight_before_kg: 46.5,
      weight_after_kg: 44.5,
      comb_tare_kg: 0.2,
      extracted_honey_kg: 3.5,
      evidence_level: "sensor_verified"
    })
  });

  if (res.status !== 400) {
    throw new Error(`Expected status 400 for syrup fraud, received ${res.status}`);
  }
  const json = await res.json();
  if (json.error !== "YIELD_CHECK_BLOCKED") {
    throw new Error(`Expected error code YIELD_CHECK_BLOCKED, received ${json.error}`);
  }
}

// ---------------------------------------------------------------------------
// AT-03: Swarm Anomaly
// Step drop 1.8 kg -> SWARM_RISK
// ---------------------------------------------------------------------------
async function testAT03() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);

  const points = [
    { weightKg: 46.5, timestamp: oneHourAgo.toISOString() },
    { weightKg: 44.7, timestamp: now.toISOString() }
  ];

  const alerts = evaluateAnomalies(points, "apis_cerana_indica");
  const swarmAlert = alerts.find((a) => a.ruleId === "SWARM_RISK");
  if (!swarmAlert) {
    throw new Error("Insight engine failed to detect SWARM_RISK from 1.8 kg drop");
  }
  if (swarmAlert.severity !== "critical") {
    throw new Error(`Expected severity critical, got ${swarmAlert.severity}`);
  }

  // Also verify API ingestion accepts the signed telemetry
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubKeyDerBase64 = publicKey.export({ type: "spki", format: "der" }).toString("base64");

  const unsigned = {
    schema_version: "1.0",
    message_id: crypto.randomUUID(),
    gateway_id: "GW-104928",
    apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
    sent_at: now.toISOString(),
    readings: [
      {
        hive_code: "HV-012",
        node_id: "node-12",
        seq: 10,
        sampled_at: oneHourAgo.toISOString(),
        mode: "scheduled",
        sensors: { hive_weight: { kg: 46.5, std_g: 5, n: 10 } },
        power: { battery_v: 3.8 }
      },
      {
        hive_code: "HV-012",
        node_id: "node-12",
        seq: 11,
        sampled_at: now.toISOString(),
        mode: "scheduled",
        sensors: { hive_weight: { kg: 44.7, std_g: 5, n: 10 } },
        power: { battery_v: 3.8 }
      }
    ]
  };

  const sig = sign(null, Buffer.from(canonicalStringify(unsigned)), privateKey);
  const ingestRes = await app.request("/api/v1/ingest/telemetry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Public-Key": pubKeyDerBase64
    },
    body: JSON.stringify({
      ...unsigned,
      signature: { alg: "ed25519", key_id: "node-12", value: sig.toString("base64") }
    })
  });

  if (ingestRes.status !== 202) {
    throw new Error(`Telemetry ingestion returned status ${ingestRes.status}`);
  }
}

// ---------------------------------------------------------------------------
// AT-04: Heat Stress
// Brood temp 37.8 C -> HEAT_STRESS
// ---------------------------------------------------------------------------
async function testAT04() {
  const now = new Date();
  const points = [
    {
      weightKg: 45.0,
      timestamp: now.toISOString(),
      broodTempC: 37.8,
      ambientTempC: 41.2
    }
  ];

  const alerts = evaluateAnomalies(points, "apis_cerana_indica");
  const heatAlert = alerts.find((a) => a.ruleId === "HEAT_STRESS");
  if (!heatAlert) {
    throw new Error("Insight engine failed to detect HEAT_STRESS when brood temp is 37.8 C");
  }
  if (heatAlert.severity !== "critical") {
    throw new Error(`Expected severity critical, got ${heatAlert.severity}`);
  }

  // Also verify API ingestion
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubKeyDerBase64 = publicKey.export({ type: "spki", format: "der" }).toString("base64");

  const unsigned = {
    schema_version: "1.0",
    message_id: crypto.randomUUID(),
    gateway_id: "GW-104928",
    apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
    sent_at: now.toISOString(),
    readings: [
      {
        hive_code: "HV-012",
        node_id: "node-12",
        seq: 20,
        sampled_at: now.toISOString(),
        mode: "scheduled",
        sensors: {
          hive_weight: { kg: 45.0, std_g: 5, n: 10 },
          brood: { temp_c: 37.8, rh_pct: 42 },
          ambient: { temp_c: 41.2, rh_pct: 35 }
        },
        power: { battery_v: 3.8 }
      }
    ]
  };

  const sig = sign(null, Buffer.from(canonicalStringify(unsigned)), privateKey);
  const ingestRes = await app.request("/api/v1/ingest/telemetry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Public-Key": pubKeyDerBase64
    },
    body: JSON.stringify({
      ...unsigned,
      signature: { alg: "ed25519", key_id: "node-12", value: sig.toString("base64") }
    })
  });

  if (ingestRes.status !== 202) {
    throw new Error(`Telemetry ingestion returned status ${ingestRes.status}`);
  }
}

// ---------------------------------------------------------------------------
// AT-05: Unregistered Farmer
// Batch creation -> 403 REGISTRY_REQUIRED
// ---------------------------------------------------------------------------
async function testAT05() {
  const res = await app.request("/api/v1/batches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Mock-Registry-Status": "not_registered"
    },
    body: JSON.stringify({
      lot_id: "lot-unregistered-test",
      kg_net: 5.0,
      destination: "Local Market"
    })
  });

  if (res.status !== 403) {
    throw new Error(`Expected status 403 for unregistered farmer, received ${res.status}`);
  }
  const json = await res.json();
  if (json.error !== "REGISTRY_REQUIRED") {
    throw new Error(`Expected error REGISTRY_REQUIRED, received ${json.error}`);
  }
}

// ---------------------------------------------------------------------------
// AT-06: Compromised Sample Seal
// Seal broken on receive -> COMPROMISED & ON_HOLD
// ---------------------------------------------------------------------------
async function testAT06() {
  const res = await app.request("/api/v1/lab-requests/req-at06-broken/receive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seal_broken: true
    })
  });

  if (res.status !== 200) {
    throw new Error(`Expected status 200, received ${res.status}`);
  }
  const json = await res.json();
  if (json.sample_status !== "COMPROMISED") {
    throw new Error(`Expected sample_status COMPROMISED, received ${json.sample_status}`);
  }
  if (json.batch_status !== "ON_HOLD") {
    throw new Error(`Expected batch_status ON_HOLD, received ${json.batch_status}`);
  }
}

// ---------------------------------------------------------------------------
// AT-07: Cloned Tag & Replay Counter
// Counter replay -> COUNTER_REPLAY, HC-0999 -> TAMPER_OPEN
// ---------------------------------------------------------------------------
async function testAT07() {
  // Part 1: Counter replay detection using virtual-crypto
  const uid = "04A1B2C3D4E5F6";
  const masterKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const tapCode = generateVirtualTap(uid, 5, masterKey);

  const initialCheck = verifyVirtualTap(uid, 5, tapCode, masterKey, 4);
  if (!initialCheck.valid) {
    throw new Error(`Initial fresh tap failed: ${initialCheck.reason}`);
  }

  // Replay: counter <= lastRecordedCounter (5 <= 5)
  const replayCheck = verifyVirtualTap(uid, 5, tapCode, masterKey, 5);
  if (replayCheck.valid || replayCheck.reason !== "COUNTER_REPLAY") {
    throw new Error(`Expected COUNTER_REPLAY, got valid=${replayCheck.valid}, reason=${replayCheck.reason}`);
  }

  // Part 2: Tampered batch HC-0999 returns TAMPER_OPEN
  const verifyRes = await app.request("/api/v1/public/verify?code=HC-0999-0001");
  if (verifyRes.status !== 200) {
    throw new Error(`Verify status expected 200, received ${verifyRes.status}`);
  }
  const verifyJson = await verifyRes.json();
  if (verifyJson.result !== "TAMPER_OPEN") {
    throw new Error(`Expected result TAMPER_OPEN, received ${verifyJson.result}`);
  }
  if (verifyJson.can_buy !== false) {
    throw new Error(`Expected can_buy false, received ${verifyJson.can_buy}`);
  }
}

// ---------------------------------------------------------------------------
// AT-08: Manual Hive Harvest
// Manual evidence level accepted
// ---------------------------------------------------------------------------
async function testAT08() {
  const res = await app.request("/api/v1/harvests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      hive_code: "HV-003",
      weight_before_kg: 25.0,
      weight_after_kg: 23.5,
      comb_tare_kg: 0.2,
      extracted_honey_kg: 1.2,
      evidence_level: "manual"
    })
  });

  if (res.status !== 201) {
    throw new Error(`Expected status 201 for manual harvest, received ${res.status}`);
  }
  const json = await res.json();
  if (json.status !== "CREATED") {
    throw new Error(`Expected status CREATED, received ${json.status}`);
  }
  if (json.evidence_level !== "manual") {
    throw new Error(`Expected evidence_level manual, received ${json.evidence_level}`);
  }
  if (json.yield_check === "BLOCK") {
    throw new Error(`Manual harvest was unexpectedly blocked: ${json.yield_check}`);
  }
}

// ---------------------------------------------------------------------------
// AT-09: Packaging Quota
// 10 kg batch with 500g jars -> 19 units allowed, 20th refused with QUOTA_EXCEEDED
// ---------------------------------------------------------------------------
async function testAT09() {
  // Step 1: Check quota calculation
  // (10 kg * (1 - 0.02)) / 0.5 kg = 9.8 / 0.5 = 19.6 -> floor = 19
  const quotaRes = await app.request("/api/v1/batches/b1/quota?kg_net=10.0&unit_size_g=500&handling_loss=0.02");
  if (quotaRes.status !== 200) {
    throw new Error(`Quota calculation returned status ${quotaRes.status}`);
  }
  const quotaJson = await quotaRes.json();
  if (quotaJson.max_units !== 19) {
    throw new Error(`Expected max_units 19, received ${quotaJson.max_units}`);
  }

  // Step 2: 20th unit refused with QUOTA_EXCEEDED
  const refuseRes = await app.request("/api/v1/batches/b1/units", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kg_net: 10.0,
      unit_size_g: 500,
      handling_loss: 0.02,
      quantity_requested: 20
    })
  });
  if (refuseRes.status !== 400) {
    throw new Error(`Expected status 400 when exceeding quota, received ${refuseRes.status}`);
  }
  const refuseJson = await refuseRes.json();
  if (refuseJson.error !== "QUOTA_EXCEEDED") {
    throw new Error(`Expected error QUOTA_EXCEEDED, received ${refuseJson.error}`);
  }
  if (refuseJson.max_allowed !== 19) {
    throw new Error(`Expected max_allowed 19, received ${refuseJson.max_allowed}`);
  }

  // Step 3: 19 units accepted and issued
  const allowRes = await app.request("/api/v1/batches/b1/units", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kg_net: 10.0,
      unit_size_g: 500,
      handling_loss: 0.02,
      quantity_requested: 19
    })
  });
  if (allowRes.status !== 201) {
    throw new Error(`Expected status 201 for valid quota, received ${allowRes.status}`);
  }
  const allowJson = await allowRes.json();
  if (allowJson.status !== "SUCCESS" || allowJson.units_issued !== 19) {
    throw new Error(`Expected 19 units issued with status SUCCESS, received ${allowJson.units_issued}`);
  }
}

// ---------------------------------------------------------------------------
// Main Runner Execution
// ---------------------------------------------------------------------------
export async function runAllScenarios(): Promise<boolean> {
  console.log("");
  console.log(`${cyan}${bold}================================================================================${reset}`);
  console.log(`${cyan}${bold}       HONEYCHAIN ACCEPTANCE SCENARIO TEST SUITE (AT-01 - AT-09)                ${reset}`);
  console.log(`${cyan}${bold}================================================================================${reset}`);
  console.log("");

  await runScenario("AT-01", "Farmer Happy Path (Harvest -> Batch -> Lab -> Packaging -> Tap Verify -> VERIFIED)", testAT01);
  await runScenario("AT-02", "Syrup Fraud (Extracted honey > allowable yield -> YIELD_CHECK_BLOCKED)", testAT02);
  await runScenario("AT-03", "Swarm Anomaly (Step drop 1.8 kg -> SWARM_RISK)", testAT03);
  await runScenario("AT-04", "Heat Stress (Brood temp 37.8 C -> HEAT_STRESS)", testAT04);
  await runScenario("AT-05", "Unregistered Farmer (Batch creation -> 403 REGISTRY_REQUIRED)", testAT05);
  await runScenario("AT-06", "Compromised Sample Seal (Seal broken on receive -> COMPROMISED & ON_HOLD)", testAT06);
  await runScenario("AT-07", "Cloned Tag & Replay Counter (Counter replay -> COUNTER_REPLAY, HC-0999 -> TAMPER_OPEN)", testAT07);
  await runScenario("AT-08", "Manual Hive Harvest (Manual evidence level accepted)", testAT08);
  await runScenario("AT-09", "Packaging Quota (10 kg batch with 500g jars -> 19 units allowed, 20th refused with QUOTA_EXCEEDED)", testAT09);

  console.log("");
  console.log(`${cyan}${bold}================================================================================${reset}`);

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  if (failedCount === 0) {
    console.log(`${green}${bold}All 9 acceptance scenarios passed cleanly! (${passedCount}/9 passed, 0 failed)${reset}`);
    console.log(`${cyan}${bold}================================================================================${reset}`);
    console.log("");
    return true;
  } else {
    console.error(`${red}${bold}Scenario runner finished with ${failedCount} failure(s) (${passedCount}/9 passed)${reset}`);
    console.log(`${cyan}${bold}================================================================================${reset}`);
    console.log("");
    return false;
  }
}

if (import.meta.main) {
  runAllScenarios().then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
  });
}
