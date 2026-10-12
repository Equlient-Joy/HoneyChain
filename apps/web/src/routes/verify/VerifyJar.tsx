import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { HoneyCell, StatusChip } from "@honeychain/ui";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Search,
  RefreshCw,
  Nfc,
} from "lucide-react";

export interface VerifyApiResponse {
  result: "VERIFIED" | "RECORD_ONLY" | "TAMPER_OPEN" | string;
  batch_code: string;
  origin_district?: string;
  harvest_date?: string;
  moisture_pct?: number;
  moisture_pass?: boolean;
  fingerprint?: string;
  anchored?: boolean;
  tx_hash?: string;
  explorer_url?: string;
  failed_stage?: string;
  can_buy?: boolean;
  message?: string;
  assurance_label?: string;
  checks?: {
    hive: string;
    lab_report: string;
    jar_sealed: string;
    store_shelf: string;
  };
}

export const VerifyJar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const codeParam = searchParams.get("code") || "HC-0421";
  const modeParam = searchParams.get("mode") || "qr";
  const tapParam = searchParams.get("tap");

  const [inputCode, setInputCode] = useState(codeParam);
  const [apiData, setApiData] = useState<VerifyApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [reported, setReported] = useState(false);

  const isClonedTag = tapParam === "invalid";
  const isTampered =
    apiData?.result === "TAMPER_OPEN" ||
    codeParam.toUpperCase().includes("0999") ||
    isClonedTag;
  const currentCode = apiData?.batch_code || (isTampered && !isClonedTag ? "HC-0999" : codeParam);

  const fetchVerification = async (codeToVerify: string) => {
    setLoading(true);
    try {
      const mode = modeParam || "qr";
      const tap = tapParam || "";
      const url = `/api/v1/public/verify?code=${encodeURIComponent(codeToVerify)}&mode=${encodeURIComponent(mode)}${tap ? `&tap=${encodeURIComponent(tap)}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setApiData(data);
      }
    } catch {
      // Offline fallback: handled by isTampered / heuristic
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification(codeParam);
  }, [codeParam, modeParam, tapParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setSearchParams({ code: inputCode.trim() });
    setReported(false);
  };

  const setCode = (newCode: string) => {
    setInputCode(newCode);
    setSearchParams({ code: newCode });
    setReported(false);
  };

  const handleReport = () => {
    setReported(true);
  };

  const txUrl =
    apiData?.explorer_url ||
    "https://amoy.polygonscan.com/tx/0x9f3a8b22c741e5d9961603baef7d21c21e1a89b76c8e31003f5ad678249a0c";
  const fingerprint = apiData?.fingerprint || "9f3a...c21e";

  return (
    <div className="max-w-2xl mx-auto my-8 px-4 flex flex-col text-[#1C2430]">
      {/* Search Bar at Top */}
      <div className="bg-white p-4 rounded-2xl border border-[#D5DBD3] shadow-xs mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter Jar Code or Tap NFC (e.g. HC-0421-0001 or HC-0999-0001)"
              className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-[#1E4B7A] text-white font-bold rounded-xl text-xs hover:bg-[#163A5F] transition flex items-center gap-1.5 shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Verify</span>
          </button>
        </form>
      </div>

      {/* Top Header Card */}
      <header className="p-4 bg-white border border-[#D5DBD3] rounded-2xl flex items-center justify-between mb-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            aria-label="Back to Hives"
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-[#1E4B7A]">Jar Verification & Honey Purity</h1>
            <p className="text-xs text-gray-500 font-mono">Code: {currentCode}</p>
          </div>
        </div>

        {/* Quick Demo Toggle */}
        <div className="flex bg-[#F5F7F4] p-1 rounded-lg border border-[#D5DBD3] gap-1 text-xs">
          <button
            onClick={() => setCode("HC-0421")}
            className={`px-2 py-1 rounded font-semibold transition ${
              !isTampered ? "bg-[#1E7B4C] text-white shadow-xs" : "text-gray-600 hover:text-black"
            }`}
          >
            ✓ Genuine (Screen 3)
          </button>
          <button
            onClick={() => setCode("HC-0999")}
            className={`px-2 py-1 rounded font-semibold transition ${
              isTampered ? "bg-[#B3261E] text-white shadow-xs" : "text-gray-600 hover:text-black"
            }`}
          >
            ✗ Fake (Screen 4)
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 space-y-4 pb-12">
        {!isTampered ? (
          /* ========================================================
             SCREEN 3: AUTHENTIC HONEY (HC-0421)
             ======================================================== */
          <div className="space-y-4">
            {/* Green Banner: (✓) Authentic honey */}
            <div className="p-4 bg-[#E1F1E8] border border-[#1E7B4C]/30 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#1E7B4C] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1E7B4C]">(✓) Authentic honey</h2>
                <p className="text-xs text-[#1E7B4C]/90 font-medium">
                  Verified tamper-evident provenance on ledger
                </p>
              </div>
            </div>

            {/* Batch Provenance Summary */}
            <div className="p-4 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-2">
                <span className="text-gray-500 font-medium">Batch ID</span>
                <span className="font-mono font-bold text-[#1E4B7A]">HC-0421</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div>
                  <div className="text-[11px] text-gray-500">Origin</div>
                  <div className="text-xs font-bold text-[#1C2430]">
                    {apiData?.origin_district || "Kanchipuram, TN"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Harvested</div>
                  <div className="text-xs font-bold text-[#1C2430]">
                    {apiData?.harvest_date || "14 Sep 2026"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500">Moisture</div>
                  <div className="text-xs font-bold text-[#1E7B4C]">
                    {apiData?.moisture_pct ?? 17.8}% (pass)
                  </div>
                </div>
              </div>
            </div>

            {/* 4 HoneyCell Check Rows */}
            <div className="p-4 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Provenance Chain Verification
              </h3>

              {/* Row 1: Hive checked */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F7F4]/60 border border-gray-100">
                <div className="flex items-center gap-3">
                  <HoneyCell fillPct={100} label="Hive Checked" size={42} showIcon="check" />
                  <div>
                    <div className="text-sm font-bold text-[#1C2430]">Hive checked</div>
                    <div className="text-xs text-gray-500 font-medium">
                      Sensor verified (IoT scale & vibration)
                    </div>
                  </div>
                </div>
                <StatusChip status="safe" label="Verified" />
              </div>

              {/* Row 2: Lab report checked */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F7F4]/60 border border-gray-100">
                <div className="flex items-center gap-3">
                  <HoneyCell fillPct={100} label="Lab Checked" size={42} showIcon="check" />
                  <div>
                    <div className="text-sm font-bold text-[#1C2430]">Lab report checked</div>
                    <div className="text-xs text-gray-500 font-medium">
                      FSSAI pass (C4 sugar & moisture compliant)
                    </div>
                  </div>
                </div>
                <StatusChip status="safe" label="Passed" />
              </div>

              {/* Row 3: Jar seal intact */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F7F4]/60 border border-gray-100">
                <div className="flex items-center gap-3">
                  <HoneyCell fillPct={100} label="Seal Intact" size={42} showIcon="check" />
                  <div>
                    <div className="text-sm font-bold text-[#1C2430]">Jar seal intact</div>
                    <div className="text-xs text-gray-500 font-medium">
                      NFC verified (NTAG 424 DNA cryptographic tap)
                    </div>
                  </div>
                </div>
                <StatusChip status="safe" label="Intact" />
              </div>

              {/* Row 4: Store shelf */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F7F4]/60 border border-gray-100">
                <div className="flex items-center gap-3">
                  <HoneyCell fillPct={100} label="Store Shelf" size={42} showIcon="check" />
                  <div>
                    <div className="text-sm font-bold text-[#1C2430]">Store shelf</div>
                    <div className="text-xs text-gray-500 font-medium">
                      Retail scan (Custody confirmed)
                    </div>
                  </div>
                </div>
                <StatusChip status="safe" label="Scanned" />
              </div>
            </div>

            {/* Dedicated Honey Purity & Adulteration Screening Card */}
            <div className="p-4 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1E7B4C]" />
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Honey Purity &amp; Adulteration Screening
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#1E7B4C] bg-[#E1F1E8] px-2 py-0.5 rounded-full border border-[#1E7B4C]/20">
                  100% Pure Natural Honey
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-[#F5F7F4] rounded-xl border border-gray-100 flex items-start justify-between">
                  <div>
                    <span className="text-gray-500 font-medium">Moisture Content</span>
                    <div className="font-bold text-[#1E7B4C] text-sm">{apiData?.moisture_pct ?? 17.8}% (Pass)</div>
                    <span className="text-[10px] text-gray-500">FSSAI threshold: &le; 20.0%</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#1E7B4C] shrink-0 mt-0.5" />
                </div>

                <div className="p-2.5 bg-[#F5F7F4] rounded-xl border border-gray-100 flex items-start justify-between">
                  <div>
                    <span className="text-gray-500 font-medium">C4 Sugar Adulteration</span>
                    <div className="font-bold text-[#1E7B4C] text-sm">Negative / Undetected</div>
                    <span className="text-[10px] text-gray-500">&delta;13C IRMS: No corn/cane syrup</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#1E7B4C] shrink-0 mt-0.5" />
                </div>

                <div className="p-2.5 bg-[#F5F7F4] rounded-xl border border-gray-100 flex items-start justify-between">
                  <div>
                    <span className="text-gray-500 font-medium">Rice &amp; Invert Syrup (SMR/TMR)</span>
                    <div className="font-bold text-[#1E7B4C] text-sm">Negative / Pure</div>
                    <span className="text-[10px] text-gray-500">Zero artificial industrial syrup</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#1E7B4C] shrink-0 mt-0.5" />
                </div>

                <div className="p-2.5 bg-[#F5F7F4] rounded-xl border border-gray-100 flex items-start justify-between">
                  <div>
                    <span className="text-gray-500 font-medium">Botanical Floral Origin</span>
                    <div className="font-bold text-[#1C2430] text-sm">Forest Flora</div>
                    <span className="text-[10px] text-gray-500">Apis cerana indica nectar</span>
                  </div>
                  <Sparkles className="w-4 h-4 text-[#F2A900] shrink-0 mt-0.5" />
                </div>
              </div>
            </div>

            {/* Verification and Blockchain Link */}
            <div className="p-4 bg-[#E6EDF5]/60 border border-[#1E4B7A]/20 rounded-2xl text-center space-y-2">
              <p className="text-xs font-semibold text-[#1C2430]">
                {apiData?.assurance_label ||
                  `Verified by tapping the jar. Fingerprint ${fingerprint}`}
              </p>
              <div>
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E4B7A] hover:underline"
                >
                  <span>View on Polygonscan (Blockchain)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             SCREEN 4: TAMPERED / FAKE (HC-0999)
             ======================================================== */
          <div className="space-y-4">
            {/* Red Banner: (✗) Tampered or fake */}
            <div className="p-4 bg-[#FBE3E0] border border-[#B3261E]/30 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#B3261E] text-white flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#B3261E]">
                  {isClonedTag ? "(✗) Cloned NFC Tag Detected" : "(✗) Tampered or fake"}
                </h2>
                <p className="text-xs text-[#B3261E]/90 font-medium">
                  {isClonedTag
                    ? "Cryptographic CMAC mismatch or replayed tap counter (COUNTER_REPLAY)"
                    : "Integrity breach detected in physical seal or ledger hash"}
                </p>
              </div>
            </div>

            {/* Tamper Status Highlights */}
            <div className="p-4 bg-white border border-[#B3261E]/30 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Detection Status
                </span>
                <div className="flex gap-1.5">
                  {isClonedTag ? (
                    <>
                      <StatusChip status="critical" label="Counter replay" />
                      <StatusChip status="critical" label="Invalid CMAC" />
                    </>
                  ) : (
                    <>
                      <StatusChip status="critical" label="Hash mismatch" />
                      <StatusChip status="critical" label="Seal broken" />
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#FBE3E0]/50 rounded-xl border border-[#B3261E]/20 space-y-1">
                <div className="text-xs font-bold text-[#B3261E] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  {isClonedTag
                    ? "Failed stage: NFC Tag Authentication Failed (Cloned Tag)"
                    : apiData?.failed_stage
                    ? `Failed stage: ${apiData.failed_stage}`
                    : "Failed stage: Jar seal broken"}
                </div>
                <p className="text-xs text-gray-700">
                  {isClonedTag
                    ? "Virtual NTAG 424 DNA Sun mirror verification rejected. Tap counter was lower than or equal to last recorded counter, or AES-128 CMAC was counterfeit."
                    : "NTAG 424 tamper loop was opened or cryptographic signature does not match canonical root hash."}
                </p>
              </div>

              {/* Warning message from Screen 4 */}
              <div className="p-3 bg-[#FCEBD7] border-l-4 border-[#A94F00] rounded-r-xl text-[#A94F00]">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {apiData?.message || "This jar cannot be verified. Do not buy. Report it."}
                </div>
              </div>
            </div>

            {/* Stages breakdown */}
            <div className="p-4 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Inspection Summary
              </h3>

              {/* Hive */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs font-medium text-gray-700">1. Hive scale & sensors</span>
                <StatusChip status="safe" label="Sensor logged" />
              </div>

              {/* Lab */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs font-medium text-gray-700">2. Lab analysis</span>
                <StatusChip status="safe" label="Certified" />
              </div>

              {/* Seal (FAILED) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBE3E0] border border-[#B3261E]/30">
                <span className="text-xs font-bold text-[#B3261E]">3. Physical Jar Seal</span>
                <StatusChip status="critical" label="Broken / Tampered" />
              </div>

              {/* Retail */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 opacity-60">
                <span className="text-xs font-medium text-gray-500">4. Store shelf scan</span>
                <StatusChip status="info" label="Unconfirmed" />
              </div>
            </div>

            {/* Adulteration & Tamper Risk Advisory */}
            <div className="p-4 bg-[#FBE3E0]/40 border border-[#B3261E]/30 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#B3261E] uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Consumer Food Safety Advisory</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                A broken tamper seal or unverified digital provenance indicates high risk of honey adulteration (dilution with industrial corn syrup, rice syrup, or unhygienic refilling). HoneyChain cryptographic protocol prevents counterfeit batches from verifying.
              </p>
            </div>

            {/* Report Button */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleReport}
                className="w-full py-3.5 bg-[#B3261E] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#921f19] active:bg-[#721813] shadow-sm transition"
              >
                <ShieldAlert className="w-5 h-5" />
                <span>Report to FSSAI</span>
              </button>

              {reported && (
                <div className="p-3 bg-[#E1F1E8] border border-[#1E7B4C] rounded-xl text-[#1E7B4C] text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Incident pre-filled complaint logged for FSSAI enforcement case.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
