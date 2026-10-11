import React from "react";

export type StatusVariant = "safe" | "watch" | "critical" | "info";

export interface StatusChipProps {
  status: StatusVariant;
  label: string;
  icon?: React.ReactNode;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, icon }) => {
  const colorClasses = {
    safe: "bg-[#E1F1E8] text-[#1E7B4C] border-[#1E7B4C]",
    watch: "bg-[#FCEBD7] text-[#A94F00] border-[#A94F00]",
    critical: "bg-[#FBE3E0] text-[#B3261E] border-[#B3261E]",
    info: "bg-[#E8ECF2] text-[#4A5A73] border-[#4A5A73]"
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};
