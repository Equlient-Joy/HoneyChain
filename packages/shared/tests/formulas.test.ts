import { describe, expect, it } from "bun:test";
import { calculateAllowableYield, checkYieldAgreement, checkWeightAgreement } from "../src/formulas/yield";

describe("Harvest Formulas (PRD Section 8.1)", () => {
  it("should calculate allowable yield correctly with consumption allowance and feed deduction", () => {
    // W_start = 45 kg, W_before = 62 kg, E = 0, C = 0.2 kg/day * 20 days = 4 kg, dF = 0
    const result = calculateAllowableYield({
      weightStartKg: 45,
      weightBeforeKg: 62,
      equipmentMassDeltaKg: 0,
      days: 20,
      consumptionPerDayKg: 0.2,
      syrupFedKg: 0
    });
    // (62 - 45 - 0) + (0.2 * 20) - 0 = 17 + 4 = 21 kg
    expect(result).toBe(21);
  });

  it("should enforce pass/review/block threshold for declared vs allowable yield", () => {
    const allowable = 20.0;
    expect(checkYieldAgreement(20.5, allowable)).toBe("PASS"); // 2.5% over (<=3%)
    expect(checkYieldAgreement(21.5, allowable)).toBe("REVIEW"); // 7.5% over (3-10%)
    expect(checkYieldAgreement(23.0, allowable)).toBe("BLOCK"); // 15% over (>10%)
  });

  it("should enforce three-way weight agreement check", () => {
    // extracted: 14 kg, removed: 17 kg, tare: 3 kg -> expected 14 kg -> diff 0% -> PASS
    expect(checkWeightAgreement(14.0, 17.0, 3.0)).toBe("PASS");
    // extracted: 15.5 kg, expected 14 kg -> ~10.7% diff -> REVIEW
    expect(checkWeightAgreement(15.5, 17.0, 3.0)).toBe("REVIEW");
    // extracted: 17.0 kg, expected 14 kg -> ~21.4% diff -> BLOCK
    expect(checkWeightAgreement(17.0, 17.0, 3.0)).toBe("BLOCK");
  });
});
