export type OrgType = "farmer" | "society_fpo" | "aggregator" | "lab" | "retailer" | "station" | "regulator";
export type RegistryStatus = "not_registered" | "self_declared" | "verified" | "expired";
export type HiveSpecies = "apis_cerana_indica" | "apis_mellifera";
export type FeederState = "locked" | "open" | "quarantine";
export type EvidenceCapability = "sensor" | "manual";
export type BatchStatus = "DRAFT" | "SAMPLED" | "SAMPLE_IN_TRANSIT" | "AT_LAB" | "TEST_PASSED" | "TEST_FAILED" | "PACKAGING" | "TAGGED" | "ON_HOLD" | "RECALLED";
export type LotStatus = "READY" | "ACCEPTED" | "REJECTED" | "IN_BATCH";
export type UnitStatus = "ISSUED" | "ACTIVE" | "SOLD" | "SPOILED" | "RECALLED";
