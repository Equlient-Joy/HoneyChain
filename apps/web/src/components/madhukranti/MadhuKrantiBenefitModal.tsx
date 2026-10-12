import React from "react";
import {
  ExternalLink,
  X,
  Coins,
  ShieldCheck,
  TrendingUp,
  Globe,
  Sparkles,
} from "lucide-react";

export interface MadhuKrantiBenefitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const MADHUKRANTI_STORAGE_KEY = "honeychain_madhukranti_prompted";

export const isMadhuKrantiPrompted = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MADHUKRANTI_STORAGE_KEY) === "true";
};

export const markMadhuKrantiPrompted = (): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(MADHUKRANTI_STORAGE_KEY, "true");
  }
};

export const MadhuKrantiBenefitModal: React.FC<MadhuKrantiBenefitModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  if (!isOpen) return null;

  // If already prompted in localStorage, do not render modal
  if (typeof window !== "undefined" && localStorage.getItem(MADHUKRANTI_STORAGE_KEY) === "true") {
    return null;
  }

  const handleClose = () => {
    markMadhuKrantiPrompted();
    onClose();
  };

  const handleRegister = () => {
    if (typeof window !== "undefined") {
      window.open("https://madhukranti.in", "_blank");
    }
    markMadhuKrantiPrompted();
    onProceed();
  };

  const handleContinueWithout = () => {
    markMadhuKrantiPrompted();
    onProceed();
  };

  const benefits = [
    {
      icon: Coins,
      iconColor: "text-amber-600 bg-amber-50 border-amber-200",
      title: "NBHM Financial Subsidies",
      description: "Up to 80% subsidy on bee boxes, supers, and solar extraction units.",
    },
    {
      icon: ShieldCheck,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      title: "Official Digital Beekeeper ID",
      description: "QR-linked FSSAI recognition and fast-track lab certification.",
    },
    {
      icon: TrendingUp,
      iconColor: "text-blue-600 bg-blue-50 border-blue-200",
      title: "Premium Minimum Support Price",
      description: "Direct purchase eligibility through government FPOs and Nafed.",
    },
    {
      icon: Globe,
      iconColor: "text-purple-600 bg-purple-50 border-purple-200",
      title: "Global Export Traceability",
      description: "Verified country of origin and exemption from ad-hoc quarantine holds.",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="madhukranti-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Top decorative gradient banner */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />

        {/* Modal Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Honey / Honeycomb Icon */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-white shrink-0">
                <svg
                  className="w-6 h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    id="madhukranti-modal-title"
                    className="text-lg md:text-xl font-bold text-gray-900 tracking-tight"
                  >
                    National Madhu Kranti Portal Registration
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    One-time Advisory
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              aria-label="Close advisory"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Before creating your batch, explore the benefits of official registry under the{" "}
            <strong className="text-gray-900">National Beekeeping &amp; Honey Mission (NBHM)</strong>:
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="px-6 py-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="p-3.5 bg-gray-50/80 hover:bg-amber-50/40 rounded-xl border border-gray-200/80 transition flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg border shrink-0 ${b.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 leading-snug">
                    {b.title}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    {b.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-4 bg-gray-50/60 border-t border-gray-100 mt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleContinueWithout}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl shadow-2xs transition order-2 sm:order-1"
          >
            Continue without Registering (Self-Declared)
          </button>

          <button
            type="button"
            onClick={handleRegister}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-xl shadow-md shadow-amber-700/20 transition flex items-center justify-center gap-1.5 order-1 sm:order-2"
          >
            <span>Register on Madhu Kranti (External)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
