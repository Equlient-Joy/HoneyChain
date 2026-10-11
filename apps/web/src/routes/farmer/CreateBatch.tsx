import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusChip, NextStepBanner } from "@honeychain/ui";
import { ArrowLeft, Printer, CheckCircle, QrCode, ExternalLink, ShieldCheck } from "lucide-react";

export const CreateBatch: React.FC = () => {
  const navigate = useNavigate();
  const [isPrinted, setIsPrinted] = useState(false);

  const batch = {
    id: "HC-0421",
    apiary: "Kanchipuram TN",
    harvestDate: "14 Sep 2026",
    weightKg: 10.0,
    moisturePct: 17.8,
    labReport: "Attached",
    hash: "9f3a8b22c741e5d9961603baef7d21c21e",
    shortHash: "9f3a...c21e"
  };

  const handlePrint = () => {
    setIsPrinted(true);
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col text-[#1C2430]">
      {/* Top Bar */}
      <header className="p-4 bg-white border border-[#D5DBD3] rounded-2xl flex items-center justify-between mb-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-[#1E4B7A]">Batch Created</h1>
        </div>
        <StatusChip status="safe" label="Ready to Label" />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4 pb-20">
        <NextStepBanner
          title="Print QR label and attach to jar packaging"
          actionLabel="View Verify"
          onAction={() => navigate(`/verify?code=${batch.id}`)}
        />

        {/* Batch Details Card */}
        <div className="p-5 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-start border-b border-gray-100 pb-3">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch ID</span>
              <div className="text-2xl font-black text-[#1E4B7A] tracking-tight">{batch.id}</div>
            </div>
            <span className="px-2.5 py-1 bg-[#E1F1E8] text-[#1E7B4C] text-xs font-bold rounded-full border border-[#1E7B4C]/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Ledger Sealed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-500 font-medium">Apiary</div>
              <div className="font-semibold text-[#1C2430]">{batch.apiary}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Harvest Date</div>
              <div className="font-semibold text-[#1C2430]">{batch.harvestDate}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Net Weight</div>
              <div className="font-semibold text-[#1C2430]">{batch.weightKg} kg (20 jars)</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Lab Report</div>
              <div className="font-semibold text-[#1E7B4C] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {batch.labReport} (17.8%)
              </div>
            </div>
          </div>

          {/* QR Code Preview Box */}
          <div className="bg-[#F5F7F4] border-2 border-dashed border-[#D5DBD3] rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="bg-white p-3 rounded-lg border border-[#D5DBD3] shadow-xs">
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                className="w-32 h-32"
                aria-label={`QR Code for Batch ${batch.id}`}
              >
                {/* Simplified SVG QR Code Pattern */}
                <rect width="140" height="140" fill="#FFFFFF" />
                {/* Corner top-left finder */}
                <rect x="10" y="10" width="35" height="35" fill="#1C2430" />
                <rect x="15" y="15" width="25" height="25" fill="#FFFFFF" />
                <rect x="20" y="20" width="15" height="15" fill="#1C2430" />
                {/* Corner top-right finder */}
                <rect x="95" y="10" width="35" height="35" fill="#1C2430" />
                <rect x="100" y="15" width="25" height="25" fill="#FFFFFF" />
                <rect x="105" y="20" width="15" height="15" fill="#1C2430" />
                {/* Corner bottom-left finder */}
                <rect x="10" y="95" width="35" height="35" fill="#1C2430" />
                <rect x="15" y="100" width="25" height="25" fill="#FFFFFF" />
                <rect x="20" y="105" width="15" height="15" fill="#1C2430" />
                {/* Honeycomb Center Icon */}
                <circle cx="70" cy="70" r="14" fill="#F2A900" />
                <text x="70" y="74" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1C2430">HC</text>
                {/* Random decorative QR data blocks */}
                <rect x="52" y="16" width="6" height="6" fill="#1C2430" />
                <rect x="62" y="22" width="6" height="6" fill="#1C2430" />
                <rect x="74" y="14" width="6" height="6" fill="#1C2430" />
                <rect x="82" y="28" width="6" height="6" fill="#1C2430" />
                <rect x="16" y="52" width="6" height="6" fill="#1C2430" />
                <rect x="28" y="64" width="6" height="6" fill="#1C2430" />
                <rect x="40" y="54" width="6" height="6" fill="#1C2430" />
                <rect x="50" y="44" width="6" height="6" fill="#1C2430" />
                <rect x="92" y="52" width="6" height="6" fill="#1C2430" />
                <rect x="104" y="62" width="6" height="6" fill="#1C2430" />
                <rect x="116" y="50" width="6" height="6" fill="#1C2430" />
                <rect x="52" y="94" width="6" height="6" fill="#1C2430" />
                <rect x="64" y="86" width="6" height="6" fill="#1C2430" />
                <rect x="76" y="98" width="6" height="6" fill="#1C2430" />
                <rect x="96" y="102" width="6" height="6" fill="#1C2430" />
                <rect x="110" y="92" width="6" height="6" fill="#1C2430" />
                <rect x="118" y="114" width="6" height="6" fill="#1C2430" />
              </svg>
            </div>
            <div className="font-mono text-xs font-bold text-[#1E4B7A]">{batch.id}</div>
            <p className="text-xs text-gray-500 max-w-xs">
              Consumer scans resolve to public tamper-evident provenance record.
            </p>
          </div>

          {/* Ledger Hash info matching Screen 2 requirements */}
          <div className="bg-[#E6EDF5]/60 p-3 rounded-xl border border-[#1E4B7A]/15 text-center">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-[#1C2430]">Hash {batch.shortHash} stored on ledger</span>
            </p>
            <p className="text-[11px] font-mono text-gray-500 mt-0.5 break-all">
              sha256: {batch.hash}
            </p>
          </div>
        </div>

        {/* Action Button: Print QR Label */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handlePrint}
            className="w-full py-3.5 bg-[#1E4B7A] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#163A5F] active:bg-[#122e4d] shadow-sm transition"
          >
            <Printer className="w-5 h-5" />
            <span>Print QR Label</span>
          </button>

          {isPrinted && (
            <div className="text-xs text-center text-[#1E7B4C] font-semibold flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" />
              QR label sent to printer successfully
            </div>
          )}

          <div className="text-center">
            <Link
              to={`/verify?code=${batch.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4B7A] hover:underline"
            >
              <span>Test consumer verify screen for this batch</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
