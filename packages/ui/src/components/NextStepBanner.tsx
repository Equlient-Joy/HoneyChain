import React from "react";

export interface NextStepBannerProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const NextStepBanner: React.FC<NextStepBannerProps> = ({ title, actionLabel, onAction }) => {
  return (
    <div className="bg-[#E6EDF5] border-l-4 border-[#1E4B7A] p-3 rounded-r-xl flex items-center justify-between">
      <div className="text-sm font-medium text-[#1E4B7A]">
        <span className="font-bold">Next step: </span>
        {title}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="ml-3 px-3 py-1 bg-[#1E4B7A] text-white text-xs font-semibold rounded-lg hover:bg-[#163A5F] transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
