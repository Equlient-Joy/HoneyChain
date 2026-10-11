import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  TrendingUp,
  AlertTriangle,
  Flame,
  Droplet,
  Radio,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Info
} from "lucide-react";
import { useDemo } from "../context/DemoContext";

export const DemoScenarioDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    toastMessage,
    activeScenarioId,
    simulateNormalFlow,
    triggerSwarmAnomaly,
    triggerHeatStress,
    triggerSyrupAnomaly,
    testClonedTagTap,
    resetToSeedData,
    setToastMessage
  } = useDemo();

  // Auto-dismiss floating toast after 5 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastMessage, setToastMessage]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const scenarios = [
    {
      id: "normal-flow",
      title: "Simulate 24h Normal Flow (Hive #12)",
      description: "Updates Hive #12 gain to +1.8 kg (+0.6 kg daytime foraging flow).",
      badge: "Normal Flow",
      badgeColor: "bg-[#E1F1E8] text-[#1E7B4C] border-[#1E7B4C]/20",
      icon: TrendingUp,
      iconColor: "text-[#1E7B4C] bg-[#E1F1E8]",
      action: simulateNormalFlow
    },
    {
      id: "swarm-anomaly",
      title: "Trigger Swarm Anomaly (Hive #7)",
      description: "Displays critical swarm alert banner from -1.8 kg sudden midday drop.",
      badge: "Swarm Risk",
      badgeColor: "bg-[#FBE3E0] text-[#B3261E] border-[#B3261E]/20",
      icon: AlertTriangle,
      iconColor: "text-[#B3261E] bg-[#FBE3E0]",
      action: triggerSwarmAnomaly
    },
    {
      id: "heat-stress",
      title: "Trigger Heat Stress (38 °C)",
      description: "Displays critical heat stress alert banner for 38 °C brood telemetry.",
      badge: "Heat Stress",
      badgeColor: "bg-[#FBE3E0] text-[#B3261E] border-[#B3261E]/20",
      icon: Flame,
      iconColor: "text-[#B3261E] bg-[#FBE3E0]",
      action: triggerHeatStress
    },
    {
      id: "syrup-anomaly",
      title: "Trigger Syrup Feeding Anomaly",
      description: "Simulates syrup risk quarantine with yield formula limit failure.",
      badge: "Adulteration",
      badgeColor: "bg-[#FCEBD7] text-[#A94F00] border-[#A94F00]/20",
      icon: Droplet,
      iconColor: "text-[#A94F00] bg-[#FCEBD7]",
      action: triggerSyrupAnomaly
    },
    {
      id: "cloned-tag",
      title: "Test Cloned Tag Tap",
      description: "Opens verify route with mode=nfc&tap=invalid to test virtual NTAG 424 replay.",
      badge: "Anti-Counterfeit",
      badgeColor: "bg-[#E6EDF5] text-[#1E4B7A] border-[#1E4B7A]/20",
      icon: Radio,
      iconColor: "text-[#1E4B7A] bg-[#E6EDF5]",
      action: testClonedTagTap
    },
    {
      id: "reset",
      title: "Reset to Seed Data",
      description: "Restores default seed state, baseline hive yields, and clears flags.",
      badge: "Seed Reset",
      badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
      icon: RotateCcw,
      iconColor: "text-gray-700 bg-gray-100",
      action: resetToSeedData
    }
  ];

  return (
    <>
      {/* Floating Action Button at bottom-right */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Demo Scenario Controls"
        className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 bg-[#1E4B7A] hover:bg-[#163A5F] active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-lg border border-white/20 flex items-center gap-2 cursor-pointer transition-all duration-150 hover:shadow-xl"
      >
        <span className="text-amber-300">⚡</span>
        <span>Demo Scenarios</span>
      </button>

      {/* Floating Status Toast / Feedback Banner (Visible when closed or open) */}
      {toastMessage && (
        <aside
          aria-label="Scenario Notifications"
          className="fixed bottom-28 sm:bottom-20 right-4 sm:right-6 z-50 max-w-sm bg-[#1C2430] text-white p-3.5 rounded-2xl shadow-2xl border border-gray-700 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-[#1E7B4C] shrink-0 mt-0.5" />
          <div className="flex-1 pr-1">
            <div className="text-xs font-bold text-[#F2A900]">Scenario Injected</div>
            <div className="text-xs text-gray-200 mt-0.5 leading-snug">{toastMessage}</div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white transition p-1"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Demo Scenario Controls"
          className="fixed inset-0 z-50 overflow-hidden flex justify-end"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-[#F5F7F4] text-[#1C2430] shadow-2xl flex flex-col z-10 border-l border-[#D5DBD3] h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header: Demo Scenario Controls */}
            <div className="p-4 bg-white border-b border-[#D5DBD3] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E6EDF5] text-[#1E4B7A] flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 text-[#1E4B7A]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1C2430]">Demo Scenario Controls</h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Inject anomalies, verify proofs & switch states live
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition cursor-pointer"
                aria-label="Close demo drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-Drawer Feedback Banner (if a scenario was recently triggered) */}
            {toastMessage && (
              <div className="p-3 bg-[#E1F1E8] border-b border-[#1E7B4C]/20 text-[#1E7B4C] flex items-center justify-between text-xs px-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1E7B4C]" />
                  <span className="font-semibold line-clamp-1">{toastMessage}</span>
                </div>
                <button
                  onClick={() => setToastMessage(null)}
                  className="text-[#1E7B4C] hover:opacity-75 text-xs font-bold shrink-0 ml-2"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Guidance banner */}
            <div className="px-4 py-2.5 bg-[#E6EDF5]/70 border-b border-[#1E4B7A]/10 flex items-center gap-2 text-xs text-[#1E4B7A]">
              <Info className="w-4 h-4 shrink-0 text-[#1E4B7A]" />
              <span>Click any card below to test system responses in real-time.</span>
            </div>

            {/* Action Cards List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
              {scenarios.map((s) => {
                const IconComponent = s.icon;
                const isActive = activeScenarioId === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={s.action}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        s.action();
                      }
                    }}
                    className={`p-3.5 bg-white border rounded-2xl shadow-xs transition-all cursor-pointer text-left flex flex-col gap-2 hover:border-[#1E4B7A]/50 hover:shadow-md ${
                      isActive ? "border-[#1E4B7A] ring-2 ring-[#1E4B7A]/20 bg-[#F9FBFC]" : "border-[#D5DBD3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconColor}`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#1C2430] leading-snug">{s.title}</h3>
                          <span
                            className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold border ${s.badgeColor}`}
                          >
                            {s.badge}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed pl-1">{s.description}</p>

                    <div className="pt-1 flex justify-end">
                      <span className="text-[11px] font-bold text-[#1E4B7A] hover:underline flex items-center gap-1">
                        Execute Scenario &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Reset shortcut */}
            <div className="p-3.5 bg-white border-t border-[#D5DBD3] flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Audit-Ready Harness</span>
              <button
                onClick={resetToSeedData}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
