import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface HiveItem {
  code: string;
  gain: string;
  status: "Healthy" | "Attention" | "Critical";
  fill: number;
  species: string;
}

export interface DemoAlert {
  id: string;
  type: "mite" | "swarm" | "heat" | "syrup";
  title: string;
  description: string;
  severity: "warning" | "critical";
}

export interface DemoContextValue {
  hives: HiveItem[];
  alerts: DemoAlert[];
  syrupQuarantineActive: boolean;
  toastMessage: string | null;
  activeScenarioId: string | null;
  simulateNormalFlow: () => void;
  triggerSwarmAnomaly: () => void;
  triggerHeatStress: () => void;
  triggerSyrupAnomaly: () => void;
  testClonedTagTap: () => void;
  resetToSeedData: () => void;
  setToastMessage: (msg: string | null) => void;
}

const defaultHives: HiveItem[] = [
  { code: "Hive #12", gain: "+1.2 kg", status: "Healthy", fill: 58, species: "Indian (Cerana)" },
  { code: "Hive #9", gain: "+1.1 kg", status: "Healthy", fill: 40, species: "Italian (Mellifera)" },
  { code: "Hive #3", gain: "+0.9 kg", status: "Healthy", fill: 35, species: "Indian (Cerana)" }
];

const defaultAlerts: DemoAlert[] = [
  {
    id: "mite-alert",
    type: "mite",
    title: "(!) Watch: Hive #7 - Mite risk detected. Check the sticky board today.",
    description: "Sensor telemetry detected abnormal vibration pattern.",
    severity: "warning"
  }
];

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [hives, setHives] = useState<HiveItem[]>(defaultHives);
  const [alerts, setAlerts] = useState<DemoAlert[]>(defaultAlerts);
  const [syrupQuarantineActive, setSyrupQuarantineActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const simulateNormalFlow = useCallback(() => {
    setHives((prev) =>
      prev.map((h) =>
        h.code === "Hive #12"
          ? { ...h, gain: "+1.8 kg", fill: 68, status: "Healthy" }
          : h
      )
    );
    setActiveScenarioId("normal-flow");
    showToast("Simulated 24h Normal Flow: Hive #12 gain updated to +1.8 kg (+0.6 kg today)");
  }, [showToast]);

  const triggerSwarmAnomaly = useCallback(() => {
    setAlerts((prev) => {
      const filtered = prev.filter((a) => a.id !== "swarm-alert");
      return [
        {
          id: "swarm-alert",
          type: "swarm",
          title: "(!) CRITICAL: Hive #7 - Swarm anomaly detected (-1.8 kg sudden drop).",
          description: "Rapid midday weight loss indicates swarm departure. Immediate apiary inspection required.",
          severity: "critical"
        },
        ...filtered
      ];
    });
    setActiveScenarioId("swarm-anomaly");
    showToast("Triggered Swarm Anomaly: Critical alert banner displayed for Hive #7");
  }, [showToast]);

  const triggerHeatStress = useCallback(() => {
    setAlerts((prev) => {
      const filtered = prev.filter((a) => a.id !== "heat-alert");
      return [
        {
          id: "heat-alert",
          type: "heat",
          title: "(!) CRITICAL: Hive #12 - Brood chamber heat stress alert (38.0 °C).",
          description: "Brood temperature exceeds 37.0 °C threshold. Fanning failure risk; provide immediate shade & water.",
          severity: "critical"
        },
        ...filtered
      ];
    });
    setActiveScenarioId("heat-stress");
    showToast("Triggered Heat Stress (38 °C): Critical heat alert banner displayed");
  }, [showToast]);

  const triggerSyrupAnomaly = useCallback(() => {
    setSyrupQuarantineActive(true);
    setAlerts((prev) => {
      const filtered = prev.filter((a) => a.id !== "syrup-alert");
      return [
        {
          id: "syrup-alert",
          type: "syrup",
          title: "(!) QUARANTINE: Hive #9 - Syrup feeding anomaly detected.",
          description: "Allowable yield check failed (194% vs 110% max threshold). Batch quarantined pending C4 EA-IRMS testing.",
          severity: "critical"
        },
        ...filtered
      ];
    });
    setActiveScenarioId("syrup-anomaly");
    showToast("Triggered Syrup Feeding Anomaly: Yield check failed, lot quarantined");
  }, [showToast]);

  const testClonedTagTap = useCallback(() => {
    setActiveScenarioId("cloned-tag");
    showToast("Opening /verify?mode=nfc&tap=invalid (Testing Virtual NTAG 424 Replay)");
    navigate("/verify?mode=nfc&tap=invalid");
  }, [navigate, showToast]);

  const resetToSeedData = useCallback(() => {
    setHives(defaultHives);
    setAlerts(defaultAlerts);
    setSyrupQuarantineActive(false);
    setActiveScenarioId("reset");
    showToast("Reset to Seed Data: Restored default apiary state & baseline values");
  }, [showToast]);

  const value: DemoContextValue = {
    hives,
    alerts,
    syrupQuarantineActive,
    toastMessage,
    activeScenarioId,
    simulateNormalFlow,
    triggerSwarmAnomaly,
    triggerHeatStress,
    triggerSyrupAnomaly,
    testClonedTagTap,
    resetToSeedData,
    setToastMessage
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = (): DemoContextValue => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
