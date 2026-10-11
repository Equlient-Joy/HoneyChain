import React from "react";
import { Link } from "react-router-dom";
import { HoneyCell, StatusChip } from "@honeychain/ui";
import { Layers, Droplets, Package, Store, AlertTriangle } from "lucide-react";
import { useDemo } from "../../context/DemoContext";

export const HivesList: React.FC = () => {
  const { hives, alerts, syrupQuarantineActive } = useDemo();

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-[#F5F7F4] text-[#1C2430]">
      {/* Top Header */}
      <header className="p-4 bg-white border-b border-[#D5DBD3] flex items-center justify-between sticky top-[33px] z-40">
        <div>
          <h1 className="text-xl font-bold text-[#1E4B7A] tracking-tight">HoneyChain</h1>
          <p className="text-xs text-gray-500 font-medium">Audit-Ready Traceability</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-[#E6EDF5] text-[#1E4B7A] px-2.5 py-1 rounded-full border border-[#1E4B7A]/20">
            Kanchipuram TN
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-4 pb-24">
        {/* Active Alert Banners (Mite Risk, Swarm Anomaly, Heat Stress, Syrup Anomaly) */}
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`p-3.5 rounded-xl shadow-xs flex items-start gap-2.5 border-l-4 ${
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
                  className={`text-xs mt-0.5 ${
                    a.severity === "critical" ? "text-[#B3261E]/90" : "text-[#A94F00]/90"
                  }`}
                >
                  {a.description}
                </div>
              </div>
            </div>
          ))}

          {syrupQuarantineActive && (
            <div className="p-3.5 bg-[#FBE3E0] border-l-4 border-[#B3261E] rounded-xl text-[#B3261E] shadow-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#B3261E]" />
              <div>
                <div className="font-bold text-sm">(!) Quarantine: Batch HC-0421 Locked</div>
                <div className="text-xs text-[#B3261E]/90 mt-0.5">
                  Syrup fraud risk flagged by yield ratio validator. Custody transfers frozen until lab clearance.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action shortcut banner */}
        <div className="bg-[#E6EDF5] p-3 rounded-xl border border-[#1E4B7A]/20 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#1E4B7A] uppercase tracking-wider">Ready for Harvest</div>
            <div className="text-sm font-bold text-[#1C2430]">Batch HC-0421 Pending</div>
          </div>
          <Link
            to="/farmer/batches/new"
            className="px-3 py-1.5 bg-[#1E4B7A] text-white text-xs font-semibold rounded-lg hover:bg-[#163A5F] transition"
          >
            Create Batch
          </Link>
        </div>

        {/* Hives List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">All Hives (3 active)</h2>
            <span className="text-xs text-gray-500">Live scale weight</span>
          </div>

          {hives.map((h) => (
            <div
              key={h.code}
              className="p-4 bg-white border border-[#D5DBD3] rounded-2xl flex items-center justify-between shadow-xs hover:border-[#1E4B7A]/40 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-[#1C2430]">{h.code}</span>
                  <StatusChip
                    status={h.status === "Healthy" ? "safe" : h.status === "Critical" ? "critical" : "warning"}
                    label={h.status}
                  />
                </div>
                <div className="text-xs text-gray-500 font-medium">{h.species}</div>
                <div
                  className={`text-xl font-bold mt-0.5 ${
                    h.status === "Critical" ? "text-[#B3261E]" : "text-[#1E7B4C]"
                  }`}
                >
                  {h.gain} today
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <HoneyCell fillPct={h.fill} label={h.code} size={52} />
                <span className="text-[11px] font-semibold text-gray-500">{h.fill}% full</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation matching Screen 1 */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#D5DBD3] px-3 py-2 flex justify-around items-center z-40"
      >
        <Link
          to="/"
          className="flex flex-col items-center gap-1 text-[#1E4B7A] font-bold text-xs"
        >
          <Layers className="w-5 h-5 text-[#1E4B7A]" />
          <span>Hives</span>
        </Link>
        <Link
          to="/farmer/harvest"
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#1E4B7A] font-medium text-xs transition"
        >
          <Droplets className="w-5 h-5" />
          <span>Harvest</span>
        </Link>
        <Link
          to="/farmer/batches/new"
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#1E4B7A] font-medium text-xs transition"
        >
          <Package className="w-5 h-5" />
          <span>Batches</span>
        </Link>
        <Link
          to="/farmer/market"
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#1E4B7A] font-medium text-xs transition"
        >
          <Store className="w-5 h-5" />
          <span>Market</span>
        </Link>
      </nav>
    </div>
  );
};
