import { describe, expect, it } from "bun:test";
import { evaluateAnomalies } from "../src/insights/rules";
import { evaluateHarvestReadiness } from "../src/insights/readiness";

describe("Insight Engine (PRD Section 8.4 & 8.5)", () => {
  it("should detect Swarm anomaly on sudden 1.8 kg drop during midday", () => {
    const readingBefore = { weightKg: 46.0, timestamp: "2026-10-11T11:00:00Z", broodTempC: 34.5 };
    const readingAfter = { weightKg: 44.1, timestamp: "2026-10-11T11:30:00Z", broodTempC: 34.5 };
    const alerts = evaluateAnomalies([readingBefore, readingAfter], "apis_mellifera");
    expect(alerts.some((a) => a.ruleId === "SWARM_RISK")).toBe(true);
  });

  it("should detect Heat Stress when brood temp exceeds 37 C", () => {
    const readings = [{ weightKg: 45.0, timestamp: "2026-10-11T12:00:00Z", broodTempC: 37.8 }];
    const alerts = evaluateAnomalies(readings, "apis_mellifera");
    expect(alerts.some((a) => a.ruleId === "HEAT_STRESS")).toBe(true);
  });

  it("should evaluate 5-condition harvest readiness checklist", () => {
    const readiness = evaluateHarvestReadiness({
      superGainKg: 11.2,
      targetGainKg: 10.0,
      flowPastPeak: true,
      nightLossBelowThreshold: true,
      superRhBelow60: true,
      cappedHoneyPct: 85,
      quarantined: false
    });
    expect(readiness.isReady).toBe(true);
    expect(readiness.readinessPct).toBe(100);
  });
});
