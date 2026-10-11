import React from "react";

export interface HoneyCellProps {
  fillPct: number; // 0 to 100
  label: string;
  size?: number; // default 48
  showIcon?: "check" | "alert" | "none";
}

export const HoneyCell: React.FC<HoneyCellProps> = ({
  fillPct,
  label,
  size = 48,
  showIcon = "none"
}) => {
  const clampedPct = Math.min(100, Math.max(0, fillPct));
  const fillHeight = (clampedPct / 100) * 44;
  const clipId = `hex-clip-${label.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div
      role="img"
      aria-label={`${label} ${clampedPct} percent`}
      className="relative inline-flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 50 50" className="overflow-visible">
        <defs>
          <clipPath id={clipId}>
            <polygon points="25,2 47,14 47,38 25,50 3,38 3,14" />
          </clipPath>
        </defs>

        {/* Outline Hexagon */}
        <polygon
          points="25,2 47,14 47,38 25,50 3,38 3,14"
          fill="none"
          stroke="var(--color-honey-edge, #8A5A00)"
          strokeWidth="2.5"
        />

        {/* Honey Fill clipped to hexagon */}
        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y={50 - fillHeight}
            width="50"
            height={fillHeight}
            fill="var(--color-honey, #F2A900)"
          />
        </g>
      </svg>

      {showIcon === "check" && clampedPct >= 100 && (
        <span className="absolute inset-0 flex items-center justify-center font-bold text-sm text-[var(--color-safe,#1E7B4C)]">
          ✓
        </span>
      )}
    </div>
  );
};
