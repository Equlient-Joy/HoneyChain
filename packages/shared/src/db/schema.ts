import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  language: text("language").notNull().default("en"),
  madhukranti_no: text("madhukranti_no"),
  registry_status: text("registry_status").notNull().default("not_registered"),
  registry_checked_at: timestamp("registry_checked_at", { withTimezone: true }),
  fssai_no: text("fssai_no"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  org_id: uuid("org_id").notNull().references(() => organisations.id),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'farmer' | 'aggregator' | 'lab' | 'regulator' | 'station'
  language: text("language").notNull().default("en"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiaries = pgTable("apiaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  org_id: uuid("org_id").notNull().references(() => organisations.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("farm"),
  district: text("district").notNull(),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lon: numeric("lon", { precision: 9, scale: 6 }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const hives = pgTable("hives", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiary_id: uuid("apiary_id").notNull().references(() => apiaries.id),
  hive_code: text("hive_code").notNull().unique(),
  species: text("species").notNull(),
  box_type: text("box_type").notNull(),
  frame_count: integer("frame_count").notNull().default(8),
  mode: text("mode").notNull().default("production"),
  feeder_state: text("feeder_state").notNull().default("locked"),
  quarantine_until: timestamp("quarantine_until", { withTimezone: true }),
  evidence_capability: text("evidence_capability").notNull().default("sensor"),
  supers_on: boolean("supers_on").notNull().default(false),
  supers_on_since: timestamp("supers_on_since", { withTimezone: true }),
  weight_at_supers_on_kg: numeric("weight_at_supers_on_kg", { precision: 6, scale: 2 }),
  target_super_gain_kg: numeric("target_super_gain_kg", { precision: 6, scale: 2 }).default("10.0"),
  node_id: text("node_id"),
  device_public_key: text("device_public_key"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const telemetry_logs = pgTable("telemetry_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  hive_id: uuid("hive_id").notNull().references(() => hives.id),
  message_id: uuid("message_id").notNull(),
  seq: integer("seq").notNull(),
  recorded_at: timestamp("recorded_at", { withTimezone: true }).notNull(),
  hive_weight_kg: numeric("hive_weight_kg", { precision: 6, scale: 3 }).notNull(),
  feeder_weight_kg: numeric("feeder_weight_kg", { precision: 6, scale: 3 }),
  brood_temp_c: numeric("brood_temp_c", { precision: 5, scale: 2 }),
  brood_rh_pct: numeric("brood_rh_pct", { precision: 5, scale: 2 }),
  ambient_temp_c: numeric("ambient_temp_c", { precision: 5, scale: 2 }),
  ambient_rh_pct: numeric("ambient_rh_pct", { precision: 5, scale: 2 }),
  lid_open: boolean("lid_open").default(false),
  battery_v: numeric("battery_v", { precision: 4, scale: 2 }).notNull(),
  quality_flags: text("quality_flags").array(),
  signature_valid: boolean("signature_valid").notNull().default(true),
  payload_hash: text("payload_hash").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const telemetryLogs = telemetry_logs;

export const harvest_records = pgTable("harvest_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  supersedes_id: uuid("supersedes_id").references((): any => harvest_records.id),
  hive_id: uuid("hive_id").notNull().references(() => hives.id),
  harvested_at: timestamp("harvested_at", { withTimezone: true }).notNull(),
  supers_removed: integer("supers_removed").notNull(),
  weight_before_kg: numeric("weight_before_kg", { precision: 6, scale: 2 }).notNull(),
  weight_after_kg: numeric("weight_after_kg", { precision: 6, scale: 2 }).notNull(),
  comb_tare_kg: numeric("comb_tare_kg", { precision: 6, scale: 2 }).notNull(),
  extracted_honey_kg: numeric("extracted_honey_kg", { precision: 6, scale: 2 }).notNull(),
  allowable_yield_kg: numeric("allowable_yield_kg", { precision: 6, scale: 2 }).notNull(),
  moisture_pct: numeric("moisture_pct", { precision: 4, scale: 2 }).notNull(),
  yield_check: text("yield_check").notNull(),
  weight_agreement: text("weight_agreement").notNull(),
  witness_name: text("witness_name").notNull(),
  witness_phone_hash: text("witness_phone_hash").notNull(),
  evidence_level: text("evidence_level").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const harvestRecords = harvest_records;

export const lots = pgTable("lots", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmer_org_id: uuid("farmer_org_id").notNull().references(() => organisations.id),
  harvest_record_id: uuid("harvest_record_id").notNull().references(() => harvest_records.id),
  kg_declared: numeric("kg_declared", { precision: 6, scale: 2 }).notNull(),
  status: text("status").notNull().default("READY"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  public_code: text("public_code").notNull().unique(),
  owner_org_id: uuid("owner_org_id").notNull().references(() => organisations.id),
  destination: text("destination").notNull(),
  kg_net: numeric("kg_net", { precision: 6, scale: 2 }).notNull(),
  status: text("status").notNull().default("DRAFT"),
  report_id: uuid("report_id"),
  event_head_hash: text("event_head_hash"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  uid: text("uid").notNull().unique(),
  role: text("role").notNull(),
  kind: text("kind").notNull().default("virtual"),
  state: text("state").notNull().default("PROVISIONING"),
  last_counter: integer("last_counter").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id").notNull().references(() => batches.id),
  serial: integer("serial").notNull(),
  public_code: text("public_code").notNull().unique(),
  size_g: integer("size_g").notNull(),
  tag_id: uuid("tag_id").references(() => tags.id),
  status: text("status").notNull().default("ISSUED"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const custody_events = pgTable("custody_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id"),
  subject_type: text("subject_type").notNull(),
  subject_id: uuid("subject_id").notNull(),
  type: text("type").notNull(),
  actor_user_id: uuid("actor_user_id"),
  org_id: uuid("org_id").notNull().references(() => organisations.id),
  payload: jsonb("payload").notNull(),
  prev_hash: text("prev_hash").notNull(),
  event_hash: text("event_hash").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const custodyEvents = custody_events;

export const anchors = pgTable("anchors", {
  id: uuid("id").primaryKey().defaultRandom(),
  merkle_root: text("merkle_root").notNull(),
  tx_hash: text("tx_hash").notNull(),
  event_from_id: uuid("event_from_id").notNull(),
  event_to_id: uuid("event_to_id").notNull(),
  anchored_at: timestamp("anchored_at", { withTimezone: true }).notNull().defaultNow(),
  ledger: text("ledger").notNull().default("polygon_amoy"),
});

export const scan_events = pgTable("scan_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tag_id: uuid("tag_id").references(() => tags.id),
  public_code: text("public_code").notNull(),
  mode: text("mode").notNull(),
  result: text("result").notNull(),
  counter: integer("counter"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const scanEvents = scan_events;

export const config_thresholds = pgTable("config_thresholds", {
  key: text("key").primaryKey(),
  value: numeric("value").notNull(),
  unit: text("unit"),
  description: text("description"),
});
export const configThresholds = config_thresholds;
