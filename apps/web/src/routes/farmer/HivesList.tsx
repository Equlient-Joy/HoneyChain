import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HoneyCell, StatusChip } from "@honeychain/ui";
import { AlertTriangle, Plus, ChevronRight } from "lucide-react";

export interface HiveItem {
  code: string;
  gain: string;
  status: "Healthy" | "Attention" | "Critical";
  fill: number;
  species: string;
}

export interface HiveAlert {
  id: string;
  type: "mite" | "swarm" | "heat" | "syrup";
  title: string;
  description: string;
  severity: "warning" | "critical";
}

const defaultHives: HiveItem[] = [
  { code: "Hive #12", gain: "+1.2 kg", status: "Healthy", fill: 58, species: "Indian (Cerana)" },
  { code: "Hive #9", gain: "+1.1 kg", status: "Healthy", fill: 40, species: "Italian (Mellifera)" },
  { code: "Hive #3", gain: "+0.9 kg", status: "Healthy", fill: 35, species: "Indian (Cerana)" },
];

const defaultAlerts: HiveAlert[] = [
  {
    id: "mite-alert",
    type: "mite",
    title: "(!) Watch: Hive #7 - Mite risk detected. Check the sticky board today.",
    description: "Sensor telemetry detected abnormal vibration pattern.",
    severity: "warning",
  },
];

export const HivesList: React.FC = () => {
  const [hives] = useState<HiveItem[]>(defaultHives);
  const [alerts] = useState<HiveAlert[]>(defaultAlerts);
  const [syrupQuarantineActive] = useState(false);

  return (
    <div className="space-y-6">
      {/* Active Alert Banners (Mite Risk, Swarm Anomaly, Heat Stress, Syrup Anomaly) */}
      {alerts.length > 0 || syrupQuarantineActive ? (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-2xl shadow-xs flex items-start gap-3 border-l-4 ${
                a.severity === "critical"
                  ? "bg-[#FBE3E0] border-[#B3261E] text-[#B3261E]"
                  : "bg-[#FCEBD7] border-[#A94F00] text-[#A94F00]"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  a.severity === "critical" ? "text-[#B3261E]" : "text-[#A94F00]"
                }`}
              />
              <div>
                <div className="font-bold text-sm">{a.title}</div>
                <div
                  className={`text-xs mt-1 ${
                    a.severity === "critical" ? "text-[#B3261E]/90" : "text-[#A94F00]/90"
                  }`}
                >
                  {a.description}
                </div>
              </div>
            </div>
          ))}

          {syrupQuarantineActive && (
            <div className="p-4 bg-[#FBE3E0] border-l-4 border-[#B3261E] rounded-2xl text-[#B3261E] shadow-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#B3261E]" />
              <div>
                <div className="font-bold text-sm">(!) Quarantine: Batch HC-0421 Locked</div>
                <div className="text-xs text-[#B3261E]/90 mt-1">
                  Syrup fraud risk flagged by yield ratio validator. Custody transfers frozen until lab clearance.
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Action shortcut banner */}
      <div className="bg-gradient-to-r from-[#E6EDF5] to-white p-5 rounded-2xl border border-[#1E4B7A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs font-bold text-[#1E4B7A] uppercase tracking-wider">
            Ready for Harvest
          </div>
          <div className="text-base font-bold text-[#1C2430] mt-0.5">
            Batch HC-0421 Extraction Ready
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Apiary yields meet minimum capping and moisture criteria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/farmer/harvest"
            className="px-4 py-2 bg-white text-[#1E4B7A] border border-[#1E4B7A]/30 text-xs font-bold rounded-xl hover:bg-[#E6EDF5] transition"
          >
            Start Harvest
          </Link>
          <Link
            to="/farmer/batches/new"
            className="px-4 py-2 bg-[#1E4B7A] text-white text-xs font-bold rounded-xl hover:bg-[#163A5F] transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Batch</span>
          </Link>
        </div>
      </div>

      {/* Hives List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1C2430] uppercase tracking-wider">
              Active Apiary Hives ({hives.length} active)
            </h2>
            <p className="text-xs text-gray-500">Live scale weight telemetry & comb fill status</p>
          </div>
          <span className="text-xs font-semibold text-[#1E7B4C] bg-[#E1F1E8] px-2.5 py-1 rounded-full border border-[#1E7B4C]/20">
            Realtime LoRaWAN Sync
          </span>
        </div>

        {/* Responsive Grid for Hives on Desktop and Tablet */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hives.map((h) => (
            <div
              key={h.code}
              className="p-5 bg-white border border-[#D5DBD3] rounded-2xl flex items-center justify-between shadow-xs hover:border-[#1E4B7A]/40 transition hover:shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#1C2430]">{h.code}</span>
                  <StatusChip
                    status={
                      h.status === "Healthy"
                        ? "safe"
                        : h.status === "Critical"
                        ? "critical"
                        : "warning"
                    }
                    label={h.status}
                  />
                </div>
                <div className="text-xs text-gray-500 font-medium">{h.species}</div>
                <div
                  className={`text-xl font-black mt-1 ${
                    h.status === "Critical" ? "text-[#B3261E]" : "text-[#1E7B4C]"
                  }`}
                >
                  {h.gain} today
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <HoneyCell fillPct={h.fill} label={h.code} size={58} />
                <span className="text-xs font-bold text-gray-600">{h.fill}% full</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
