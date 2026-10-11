import React from "react";

export type Persona = "farmer" | "aggregator" | "lab" | "regulator" | "consumer";

interface DemoBarProps {
  currentPersona: Persona;
  onSwitch: (persona: Persona) => void;
}

export const DemoBar: React.FC<DemoBarProps> = ({ currentPersona, onSwitch }) => {
  return (
    <div className="bg-[#1C2430] text-white text-xs px-3 py-1.5 flex items-center justify-between border-b border-gray-700 sticky top-0 z-50">
      <span className="font-semibold text-[#F2A900]">DEMO PERSONA:</span>
      <div className="flex gap-1.5 overflow-x-auto">
        {(["farmer", "aggregator", "lab", "regulator", "consumer"] as Persona[]).map((p) => (
          <button
            key={p}
            onClick={() => onSwitch(p)}
            className={`px-2 py-0.5 rounded capitalize transition ${
              currentPersona === p ? "bg-[#1E4B7A] text-white font-bold" : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
