export interface ReadinessInput {
  superGainKg: number;
  targetGainKg: number;
  flowPastPeak: boolean;
  nightLossBelowThreshold: boolean;
  superRhBelow60: boolean;
  cappedHoneyPct: number;
  quarantined: boolean;
}

export function evaluateHarvestReadiness(input: ReadinessInput) {
  if (input.quarantined) {
    return { isReady: false, readinessPct: 0, reason: "Supers are on hold (quarantined)" };
  }
  const conditions = [
    input.superGainKg >= input.targetGainKg,
    input.flowPastPeak && input.nightLossBelowThreshold,
    input.superRhBelow60,
    input.cappedHoneyPct >= 80,
    !input.quarantined
  ];
  const passedCount = conditions.filter(Boolean).length;
  const readinessPct = Math.round((passedCount / 5) * 100);
  return {
    isReady: passedCount === 5,
    readinessPct,
    conditions: {
      targetGainPassed: conditions[0],
      curingPassed: conditions[1],
      rhPassed: conditions[2],
      cappedPassed: conditions[3],
      unquarantined: conditions[4]
    }
  };
}
