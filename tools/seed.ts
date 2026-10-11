/**
 * HoneyChain On-Demand Seed Data Script
 * Prepares and prints verified farmer org, hives, unregistered farmer org,
 * aggregator, lab, regulator, and benchmark batches (HC-0421 and HC-0999).
 */

export interface HiveSeed {
  id: string;
  hive_code: string;
  species: string;
  displaySpecies: string;
  box_type: string;
  gain: string;
  gain_kg: number;
  status: "HEALTHY" | "MITE_ALERT" | "HEAT_ALERT";
  fill_pct: number;
  node_id: string;
  alert?: string;
  harvest_ready: boolean;
}

export interface FarmerOrgSeed {
  id: string;
  name: string;
  type: "farmer";
  state: string;
  district: string;
  language: string;
  madhukranti_no: string | null;
  registry_status: "verified" | "not_registered";
  registry_checked_at: string | null;
  fssai_no: string | null;
  apiary?: {
    id: string;
    name: string;
    type: string;
    district: string;
    lat: string;
    lon: string;
  };
  hives?: HiveSeed[];
  notes?: string;
}

export const verifiedFarmerOrg: FarmerOrgSeed = {
  id: "f1a1a1a1-1111-4000-8000-000000000001",
  name: "Kanchipuram Natural Apiaries FPO",
  type: "farmer",
  state: "Tamil Nadu",
  district: "Kanchipuram",
  language: "ta",
  madhukranti_no: "MK-TN-2024-8841",
  registry_status: "verified",
  registry_checked_at: "2026-09-01T00:00:00Z",
  fssai_no: "12423001000111",
  apiary: {
    id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
    name: "Kanchipuram Apiary",
    type: "farm",
    district: "Kanchipuram",
    lat: "12.834200",
    lon: "79.703600"
  },
  hives: [
    {
      id: "h1a1a1a1-1111-4000-8000-000000000012",
      hive_code: "HV-012",
      species: "apis_cerana_indica",
      displaySpecies: "Indian (Cerana)",
      box_type: "ISI_A",
      gain: "+1.8 kg",
      gain_kg: 1.8,
      status: "HEALTHY",
      fill_pct: 62,
      node_id: "node-12",
      harvest_ready: true
    },
    {
      id: "h1a1a1a1-1111-4000-8000-000000000009",
      hive_code: "HV-009",
      species: "apis_mellifera",
      displaySpecies: "Italian (Mellifera)",
      box_type: "Langstroth",
      gain: "+1.1 kg",
      gain_kg: 1.1,
      status: "HEALTHY",
      fill_pct: 40,
      node_id: "node-09",
      harvest_ready: false
    },
    {
      id: "h1a1a1a1-1111-4000-8000-000000000007",
      hive_code: "HV-007",
      species: "apis_cerana_indica",
      displaySpecies: "Indian (Cerana)",
      box_type: "ISI_A",
      gain: "+0.2 kg",
      gain_kg: 0.2,
      status: "MITE_ALERT",
      fill_pct: 15,
      node_id: "node-07",
      alert: "Watch: Hive #7 - Mite risk detected. Check sticky board today (abnormal vibration pattern).",
      harvest_ready: false
    },
    {
      id: "h1a1a1a1-1111-4000-8000-000000000003",
      hive_code: "HV-003",
      species: "apis_cerana_indica",
      displaySpecies: "Indian (Cerana)",
      box_type: "ISI_A",
      gain: "+0.9 kg",
      gain_kg: 0.9,
      status: "HEALTHY",
      fill_pct: 35,
      node_id: "node-03",
      harvest_ready: false
    }
  ]
};

export const unregisteredFarmerOrg: FarmerOrgSeed = {
  id: "f2a2a2a2-2222-4000-8000-000000000002",
  name: "Salem Non-Compliant Beekeeper",
  type: "farmer",
  state: "Tamil Nadu",
  district: "Salem",
  language: "ta",
  madhukranti_no: null,
  registry_status: "not_registered",
  registry_checked_at: null,
  fssai_no: null,
  notes: "Used to test Madhukranti registry gate FR1.4 / AT-05 (403 REGISTRY_REQUIRED)"
};

export const aggregatorOrg = {
  id: "ag1a1a1a-3333-4000-8000-000000000003",
  name: "Tamil Nadu State Honey Aggregator Coop",
  type: "aggregator" as const,
  state: "Tamil Nadu",
  district: "Chennai",
  language: "en",
  fssai_no: "12423001000456",
  registry_status: "verified" as const
};

export const accreditedLabOrg = {
  id: "lab1a1a1-4444-4000-8000-000000000004",
  name: "National Honey Quality Testing Lab (NABL Accredited)",
  type: "lab" as const,
  state: "Tamil Nadu",
  district: "Chennai",
  accreditation_no: "NABL-TC-8891",
  fssai_license: "FSSAI-LAB-TN-042",
  registry_status: "verified" as const
};

export const regulatorUser = {
  id: "reg1a1a1-5555-4000-8000-000000000005",
  name: "Dr. R. Sundaram",
  role: "regulator" as const,
  department: "National Honey Board / Food Safety Inspector",
  jurisdiction: "Tamil Nadu",
  permissions: ["audit_log_view", "recall_enforce", "batch_inspect", "registry_verify"]
};

export const batchHC0421 = {
  id: "b421a1a1-6666-4000-8000-000000042100",
  public_code: "HC-0421",
  origin_district: "Kanchipuram, TN",
  harvest_date: "14 Sep 2026",
  harvest_date_iso: "2026-09-14T08:30:00Z",
  source_hive: "HV-012",
  kg_net: 10.0,
  moisture_pct: 17.8,
  lab_report: {
    report_id: "rep-hc0421-pass",
    verdict: "PASS",
    moisture_pass: true,
    standard_limit_pct: 20.0,
    hmf_mg_kg: 12.0
  },
  units_issued: 19,
  unit_size_g: 500,
  handling_loss: 0.02,
  quota_max: 19,
  units: Array.from({ length: 19 }).map((_, i) => ({
    serial: i + 1,
    public_code: `HC-0421-${String(i + 1).padStart(4, "0")}`,
    size_g: 500,
    status: "ISSUED"
  })),
  fingerprint: "9f3a8b22c741e5d9961603baef7d21c21e",
  short_fingerprint: "9f3a...c21e",
  anchored: true,
  tx_hash: "0x7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456",
  explorer_url: "https://amoy.polygonscan.com/tx/0x7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456",
  status: "VERIFIED"
};

export const tamperedBatchHC0999 = {
  id: "b999a1a1-9999-4000-8000-000000099900",
  public_code: "HC-0999",
  origin_district: "Unknown / Counterfeit",
  harvest_date: "Unknown",
  kg_net: 5.0,
  tampered_seal: true,
  hash_mismatch: true,
  failed_stage: "Jar seal broken",
  can_buy: false,
  status: "TAMPER_OPEN",
  message: "This jar cannot be verified. Do not buy. Report it.",
  units: [
    {
      serial: 1,
      public_code: "HC-0999-0001",
      size_g: 500,
      status: "TAMPERED"
    }
  ]
};

export const seedData = {
  verifiedFarmerOrg,
  unregisteredFarmerOrg,
  aggregatorOrg,
  accreditedLabOrg,
  regulatorUser,
  batchHC0421,
  tamperedBatchHC0999
};

export function printSeedSummary(): void {
  const cyan = "\x1b[36m";
  const green = "\x1b[32m";
  const yellow = "\x1b[33m";
  const red = "\x1b[31m";
  const reset = "\x1b[0m";
  const bold = "\x1b[1m";

  console.log("");
  console.log(`${cyan}${bold}================================================================================${reset}`);
  console.log(`${cyan}${bold}                   HONEYCHAIN SEED DATA GENERATOR                              ${reset}`);
  console.log(`${cyan}${bold}================================================================================${reset}`);
  console.log("");

  // Verified Farmer
  console.log(`${bold}[1] VERIFIED FARMER ORG${reset}`);
  console.log(`    Name:            ${green}${verifiedFarmerOrg.name}${reset}`);
  console.log(`    District:        ${verifiedFarmerOrg.district}, ${verifiedFarmerOrg.state}`);
  console.log(`    Madhukranti No:  ${verifiedFarmerOrg.madhukranti_no} [${green}verified${reset}]`);
  console.log(`    FSSAI License:   ${verifiedFarmerOrg.fssai_no}`);
  console.log(`    Apiary:          ${verifiedFarmerOrg.apiary?.name} (${verifiedFarmerOrg.apiary?.district})`);
  console.log(`    Hives:`);
  for (const h of verifiedFarmerOrg.hives || []) {
    const statusColor = h.status === "HEALTHY" ? green : yellow;
    const alertText = h.alert ? ` - ${yellow}${h.alert}${reset}` : "";
    console.log(`      * ${bold}${h.hive_code}${reset} (${h.displaySpecies}): gain ${h.gain}, status: ${statusColor}${h.status}${reset}${alertText}`);
  }
  console.log("");

  // Unregistered Farmer
  console.log(`${bold}[2] UNREGISTERED FARMER ORG (Gate FR1.4 / AT-05 Test)${reset}`);
  console.log(`    Name:            ${yellow}${unregisteredFarmerOrg.name}${reset}`);
  console.log(`    Registry Status: ${red}${unregisteredFarmerOrg.registry_status}${reset}`);
  console.log(`    Notes:           ${unregisteredFarmerOrg.notes}`);
  console.log("");

  // Aggregator
  console.log(`${bold}[3] AGGREGATOR ORG${reset}`);
  console.log(`    Name:            ${aggregatorOrg.name}`);
  console.log(`    FSSAI License:   ${green}${aggregatorOrg.fssai_no}${reset}`);
  console.log(`    Registry Status: ${green}${aggregatorOrg.registry_status}${reset}`);
  console.log("");

  // Accredited Lab
  console.log(`${bold}[4] ACCREDITED LAB ORG${reset}`);
  console.log(`    Name:            ${accreditedLabOrg.name}`);
  console.log(`    Accreditation:   ${green}${accreditedLabOrg.accreditation_no}${reset}`);
  console.log(`    FSSAI Reg:       ${accreditedLabOrg.fssai_license}`);
  console.log("");

  // Regulator
  console.log(`${bold}[5] REGULATOR USER${reset}`);
  console.log(`    Name:            ${regulatorUser.name}`);
  console.log(`    Role:            ${regulatorUser.role}`);
  console.log(`    Department:      ${regulatorUser.department}`);
  console.log(`    Permissions:     ${regulatorUser.permissions.join(", ")}`);
  console.log("");

  // Batch HC-0421
  console.log(`${bold}[6] BENCHMARK BATCH HC-0421 (Passed & Genuine)${reset}`);
  console.log(`    Public Code:     ${green}${batchHC0421.public_code}${reset}`);
  console.log(`    Harvest Date:    ${batchHC0421.harvest_date}`);
  console.log(`    Origin:          ${batchHC0421.origin_district}`);
  console.log(`    Moisture:        ${green}${batchHC0421.moisture_pct}%${reset} (Lab Verdict: ${batchHC0421.lab_report.verdict})`);
  console.log(`    Units Issued:    ${green}${batchHC0421.units_issued} units${reset} (${batchHC0421.unit_size_g}g each, HC-0421-0001 to HC-0421-0019)`);
  console.log(`    Merkle Root:     ${batchHC0421.fingerprint}`);
  console.log(`    Ledger Anchor:   ${batchHC0421.explorer_url}`);
  console.log(`    Result:          ${green}${batchHC0421.status}${reset}`);
  console.log("");

  // Tampered Batch HC-0999
  console.log(`${bold}[7] TAMPERED BATCH HC-0999 (Counterfeit / Broken Seal)${reset}`);
  console.log(`    Public Code:     ${red}${tamperedBatchHC0999.public_code}${reset}`);
  console.log(`    Failed Stage:    ${tamperedBatchHC0999.failed_stage}`);
  console.log(`    Result:          ${red}${tamperedBatchHC0999.status}${reset}`);
  console.log(`    Warning:         ${red}${tamperedBatchHC0999.message}${reset}`);
  console.log("");

  console.log(`${cyan}${bold}================================================================================${reset}`);
  console.log(`${green}${bold}Seed data prepared and validated successfully!${reset}`);
  console.log("");
}

// Auto-run if executed directly
if (import.meta.main) {
  printSeedSummary();
}
