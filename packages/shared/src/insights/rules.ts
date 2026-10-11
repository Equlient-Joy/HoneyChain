export interface TelemetryPoint {
  weightKg: number;
  timestamp: string;
  broodTempC?: number;
  ambientTempC?: number;
}

export interface AnomalyAlert {
  ruleId: string;
  severity: "info" | "watch" | "critical";
  title: string;
  whatWeSaw: string;
  steps: string[];
}

export function evaluateAnomalies(points: TelemetryPoint[], species: string): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  if (points.length === 0) return alerts;

  // Heat stress
  const latest = points[points.length - 1];
  if (latest.broodTempC && latest.broodTempC >= 37.0) {
    alerts.push({
      ruleId: "HEAT_STRESS",
      severity: "critical",
      title: "Heat stress alert",
      whatWeSaw: `Inside temperature reached ${latest.broodTempC.toFixed(1)} °C.`,
      steps: ["Shade the hive", "Keep entrance clear", "Provide water nearby"]
    });
  }

  // Swarm detection (step drop 1-3 kg between 10:00 and 15:00)
  if (points.length >= 2) {
    const prev = points[points.length - 2];
    const drop = prev.weightKg - latest.weightKg;
    if (drop >= 1.0 && drop <= 3.0) {
      alerts.push({
        ruleId: "SWARM_RISK",
        severity: "critical",
        title: "Possible swarm detected",
        whatWeSaw: `Sudden weight loss of ${drop.toFixed(2)} kg detected.`,
        steps: ["Look for a swarm cluster nearby", "Inspect hive for queen cells"]
      });
    }
  }

  return alerts;
}
