export interface YieldInput {
  weightStartKg: number;
  weightBeforeKg: number;
  equipmentMassDeltaKg: number;
  days: number;
  consumptionPerDayKg: number;
  syrupFedKg: number;
}

export function calculateAllowableYield(input: YieldInput): number {
  const rawGain = input.weightBeforeKg - input.weightStartKg - input.equipmentMassDeltaKg;
  const consumptionAllowance = input.consumptionPerDayKg * input.days;
  const yieldKg = rawGain + consumptionAllowance - input.syrupFedKg;
  return Math.max(0, Number(yieldKg.toFixed(2)));
}

export function checkYieldAgreement(declaredKg: number, allowableKg: number): "PASS" | "REVIEW" | "BLOCK" {
  if (allowableKg <= 0) return declaredKg === 0 ? "PASS" : "BLOCK";
  const pctOver = ((declaredKg - allowableKg) / allowableKg) * 100;
  if (pctOver <= 3) return "PASS";
  if (pctOver <= 10) return "REVIEW";
  return "BLOCK";
}

export function checkWeightAgreement(extractedKg: number, removedMassKg: number, combTareKg: number): "PASS" | "REVIEW" | "BLOCK" {
  const expectedHoney = removedMassKg - combTareKg;
  if (expectedHoney <= 0) return "BLOCK";
  const diffPct = Math.abs((extractedKg - expectedHoney) / expectedHoney) * 100;
  if (diffPct <= 8) return "PASS";
  if (diffPct <= 15) return "REVIEW";
  return "BLOCK";
}
