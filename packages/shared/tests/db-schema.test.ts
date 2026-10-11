import { describe, expect, it } from "bun:test";
import { getTableName } from "drizzle-orm";
import {
  organisations,
  users,
  apiaries,
  hives,
  telemetry_logs,
  harvest_records,
  lots,
  batches,
  units,
  tags,
  custody_events,
  anchors,
  scan_events,
  config_thresholds,
} from "../src";

describe("Database Schema Tables", () => {
  it("should define and export all core schema tables", () => {
    expect(organisations).toBeDefined();
    expect(users).toBeDefined();
    expect(apiaries).toBeDefined();
    expect(hives).toBeDefined();
    expect(telemetry_logs).toBeDefined();
    expect(harvest_records).toBeDefined();
    expect(lots).toBeDefined();
    expect(batches).toBeDefined();
    expect(units).toBeDefined();
    expect(tags).toBeDefined();
    expect(custody_events).toBeDefined();
    expect(anchors).toBeDefined();
    expect(scan_events).toBeDefined();
    expect(config_thresholds).toBeDefined();
  });

  it("should have correct SQL table names", () => {
    expect(getTableName(organisations)).toBe("organisations");
    expect(getTableName(users)).toBe("users");
    expect(getTableName(apiaries)).toBe("apiaries");
    expect(getTableName(hives)).toBe("hives");
    expect(getTableName(telemetry_logs)).toBe("telemetry_logs");
    expect(getTableName(harvest_records)).toBe("harvest_records");
    expect(getTableName(lots)).toBe("lots");
    expect(getTableName(batches)).toBe("batches");
    expect(getTableName(units)).toBe("units");
    expect(getTableName(tags)).toBe("tags");
    expect(getTableName(custody_events)).toBe("custody_events");
    expect(getTableName(anchors)).toBe("anchors");
    expect(getTableName(scan_events)).toBe("scan_events");
    expect(getTableName(config_thresholds)).toBe("config_thresholds");
  });

  it("should have expected primary key and column definitions", () => {
    expect(organisations.id).toBeDefined();
    expect(organisations.name).toBeDefined();
    expect(organisations.type).toBeDefined();

    expect(users.id).toBeDefined();
    expect(users.org_id).toBeDefined();
    expect(users.name).toBeDefined();
    expect(users.email).toBeDefined();
    expect(users.phone).toBeDefined();
    expect(users.password_hash).toBeDefined();
    expect(users.role).toBeDefined();
    expect(users.language).toBeDefined();
    expect(users.created_at).toBeDefined();

    expect(hives.id).toBeDefined();
    expect(hives.hive_code).toBeDefined();
    expect(hives.apiary_id).toBeDefined();

    expect(telemetry_logs.id).toBeDefined();
    expect(telemetry_logs.hive_id).toBeDefined();
    expect(telemetry_logs.hive_weight_kg).toBeDefined();

    expect(harvest_records.id).toBeDefined();
    expect(harvest_records.supersedes_id).toBeDefined();
    expect(harvest_records.extracted_honey_kg).toBeDefined();

    expect(batches.id).toBeDefined();
    expect(batches.public_code).toBeDefined();

    expect(units.id).toBeDefined();
    expect(units.batch_id).toBeDefined();
    expect(units.public_code).toBeDefined();

    expect(tags.id).toBeDefined();
    expect(tags.uid).toBeDefined();

    expect(custody_events.id).toBeDefined();
    expect(custody_events.event_hash).toBeDefined();

    expect(anchors.id).toBeDefined();
    expect(anchors.merkle_root).toBeDefined();
  });
});
