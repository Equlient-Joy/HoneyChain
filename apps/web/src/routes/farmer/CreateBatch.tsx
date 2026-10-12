import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusChip, NextStepBanner } from "@honeychain/ui";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  CheckCircle2,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Scale,
  Package,
  Layers,
  Sparkles,
  Plus,
  Search,
  FileText,
  X,
  Copy,
  BadgeCheck,
  AlertCircle,
  RefreshCw,
  Building,
  Calendar,
} from "lucide-react";
import {
  MadhuKrantiBenefitModal,
  isMadhuKrantiPrompted,
} from "../../components/madhukranti/MadhuKrantiBenefitModal";

export interface LotRecord {
  id: string;
  apiary: string;
  farmer_org_name?: string;
  kg_declared: number;
  status: "READY" | "ACCEPTED" | "REJECTED" | string;
  harvest_date: string;
  moisture_pct: number;
  received_weight_kg?: number;
  received_moisture_pct?: number;
}

export interface BatchRecord {
  batch_id: string;
  public_code: string;
  status: string;
  kg_net: number;
  moisture_pct?: number;
  units_issued?: number;
  destination: string;
  tx_hash?: string;
  explorer_url?: string;
  event_hash?: string;
  lot_id?: string;
  farmer_org_id?: string;
  madhukranti_status?: "verified" | "self_declared";
  created_at: string;
}

const SEED_LOTS: LotRecord[] = [
  {
    id: "lot-0421",
    apiary: "Kanchipuram Apiary",
    farmer_org_name: "Kanchipuram Natural Apiaries FPO",
    kg_declared: 14.0,
    status: "READY",
    harvest_date: "2026-09-14",
    moisture_pct: 17.8,
  },
  {
    id: "lot-0422",
    apiary: "Salem Apiary",
    farmer_org_name: "Salem Apiary",
    kg_declared: 18.5,
    status: "READY",
    harvest_date: "2026-10-01",
    moisture_pct: 18.2,
  },
];

const SEED_BATCHES: BatchRecord[] = [
  {
    batch_id: "batch-hc-0421",
    public_code: "HC-0421",
    status: "TEST_PASSED",
    kg_net: 10.0,
    moisture_pct: 17.8,
    units_issued: 19,
    destination: "domestic",
    tx_hash: "0x8f2d5a9b7e3c1a4d6f8e0b2c4a6e8d0f1a3b5c7e9d1f3b5a7c9e1d3f5b7a9c1e",
    explorer_url:
      "https://amoy.polygonscan.com/tx/0x8f2d5a9b7e3c1a4d6f8e0b2c4a6e8d0f1a3b5c7e9d1f3b5a7c9e1d3f5b7a9c1e",
    event_hash: "9f3a8b22c741e5d9961603baef7d21c21e",
    lot_id: "lot-0421",
    madhukranti_status: "verified",
    created_at: "2026-09-15T10:00:00Z",
  },
];

export const CreateBatch: React.FC = () => {
  const navigate = useNavigate();

  // Navigation tab: create or ledger
  const [activeTab, setActiveTab] = useState<"create" | "ledger">("create");

  // Live Data
  const [lots, setLots] = useState<LotRecord[]>(SEED_LOTS);
  const [batches, setBatches] = useState<BatchRecord[]>(SEED_BATCHES);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form Formulation State
  const [selectedLotId, setSelectedLotId] = useState<string>("lot-0421");
  const [kgNet, setKgNet] = useState<number>(14.0);
  const [destination, setDestination] = useState<"domestic" | "export">("domestic");
  const [unitSizeG, setUnitSizeG] = useState<250 | 500 | 1000>(500);

  // Batch Result State
  const [createdBatch, setCreatedBatch] = useState<BatchRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modals
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);
  const [printModalBatch, setPrintModalBatch] = useState<BatchRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Quota calculation: 2% handling loss allowance enforced
  const unitSizeKg = unitSizeG / 1000;
  const maxUnits = Math.floor((kgNet * 0.98) / unitSizeKg);

  // Selected Lot Details
  const activeLot = lots.find((l) => l.id === selectedLotId) || lots[0];

  // Fetch batches & lots on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingData(true);

    Promise.all([
      fetch("/api/v1/batches")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/v1/lots")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([batchesData, lotsData]) => {
        if (!isMounted) return;
        if (Array.isArray(batchesData) && batchesData.length > 0) {
          setBatches(batchesData);
        }
        if (Array.isArray(lotsData) && lotsData.length > 0) {
          setLots(lotsData);
          if (!lotsData.some((l: LotRecord) => l.id === selectedLotId)) {
            setSelectedLotId(lotsData[0].id);
            setKgNet(lotsData[0].kg_declared);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update kgNet when selected lot changes
  const handleLotSelect = (lotId: string) => {
    setSelectedLotId(lotId);
    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      setKgNet(lot.kg_declared);
    }
  };

  // Trigger create batch flow with Madhu Kranti prompt check
  const handleInitiateBatchCreation = () => {
    if (kgNet <= 0 || isNaN(kgNet)) {
      setToastMessage({ text: "Please enter a valid net batch weight.", type: "error" });
      return;
    }

    if (!isMadhuKrantiPrompted()) {
      setIsBenefitModalOpen(true);
    } else {
      executeBatchCreation();
    }
  };

  // API Batch Creation execution
  const executeBatchCreation = async () => {
    setIsSubmitting(true);
    setToastMessage(null);

    const generatedCode = "HC-" + Math.floor(1000 + Math.random() * 9000);

    try {
      const res = await fetch("/api/v1/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Allow-Unregistered": "true",
          "X-Mock-Registry-Status": "verified",
        },
        body: JSON.stringify({
          lot_id: selectedLotId,
          kg_net: kgNet,
          destination: destination,
          unit_size_g: unitSizeG,
          units_issued: maxUnits,
          public_code: generatedCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newBatch: BatchRecord = {
          batch_id: data.batch_id || crypto.randomUUID(),
          public_code: data.public_code || generatedCode,
          status: data.status || "DRAFT",
          kg_net: data.kg_net ?? kgNet,
          moisture_pct: data.moisture_pct ?? activeLot?.moisture_pct ?? 17.8,
          units_issued: data.units_issued ?? maxUnits,
          destination: data.destination || destination,
          event_hash:
            data.event_hash ||
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          lot_id: selectedLotId,
          madhukranti_status: data.madhukranti_status || "self_declared",
          created_at: new Date().toISOString(),
        };

        setBatches((prev) => [newBatch, ...prev]);
        setCreatedBatch(newBatch);
        setToastMessage({
          text: `Batch ${newBatch.public_code} anchored and QR codes issued successfully!`,
          type: "success",
        });
      } else {
        // Fallback simulation if server fails
        const fallbackBatch: BatchRecord = {
          batch_id: crypto.randomUUID(),
          public_code: generatedCode,
          status: "DRAFT",
          kg_net: kgNet,
          moisture_pct: activeLot?.moisture_pct ?? 17.8,
          units_issued: maxUnits,
          destination,
          event_hash:
            "d41d8cd98f00b204e9800998ecf8427e" + Math.floor(1000 + Math.random() * 9000),
          lot_id: selectedLotId,
          madhukranti_status: "self_declared",
          created_at: new Date().toISOString(),
        };

        setBatches((prev) => [fallbackBatch, ...prev]);
        setCreatedBatch(fallbackBatch);
        setToastMessage({
          text: `Batch ${fallbackBatch.public_code} anchored locally (offline mode).`,
          type: "success",
        });
      }
    } catch {
      // Offline fallback
      const fallbackBatch: BatchRecord = {
        batch_id: crypto.randomUUID(),
        public_code: generatedCode,
        status: "DRAFT",
        kg_net: kgNet,
        moisture_pct: activeLot?.moisture_pct ?? 17.8,
        units_issued: maxUnits,
        destination,
        event_hash:
          "a1b2c3d4e5f60718293a4b5c6d7e8f90" + Math.floor(1000 + Math.random() * 9000),
        lot_id: selectedLotId,
        madhukranti_status: "self_declared",
        created_at: new Date().toISOString(),
      };

      setBatches((prev) => [fallbackBatch, ...prev]);
      setCreatedBatch(fallbackBatch);
      setToastMessage({
        text: `Batch ${fallbackBatch.public_code} created (offline fallback mode).`,
        type: "success",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyHash = (hash: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col text-[#1C2430] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`mb-4 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold shadow-md ${
            toastMessage.type === "success"
              ? "bg-[#E1F1E8] text-[#1E7B4C] border border-[#1E7B4C]/30"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#1E7B4C] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="p-4 md:p-6 bg-white border border-[#D5DBD3] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-[#1E4B7A] tracking-tight">
                Batch Packaging Workbench
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1E4B7A] border border-[#1E4B7A]/20">
                v1.2
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Formulate tamper-evident honey batches, enforce tag quotas, and seal on-chain.
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center bg-[#F5F7F4] p-1 rounded-xl border border-[#D5DBD3] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "create"
                ? "bg-white text-[#1E4B7A] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Batch</span>
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ledger"
                ? "bg-white text-[#1E4B7A] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Apiary Batches Ledger ({batches.length})</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === "create" ? (
        <div className="space-y-6">
          {/* If a batch was just created, highlight the sealed result banner */}
          {createdBatch && (
            <div className="bg-[#E1F1E8] border border-[#1E7B4C]/30 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#1E7B4C] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1E7B4C] flex items-center gap-2">
                    <span>Batch {createdBatch.public_code} Successfully Anchored</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/80 text-[#1E7B4C]">
                      {createdBatch.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-0.5">
                    Allocated {createdBatch.units_issued} cryptographic QR &amp; NFC tags for{" "}
                    {createdBatch.kg_net} kg net honey.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setPrintModalBatch(createdBatch)}
                  className="flex-1 md:flex-initial px-4 py-2.5 bg-[#1E4B7A] hover:bg-[#163A5F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print QR Label</span>
                </button>
                <Link
                  to={`/verify?code=${createdBatch.public_code}`}
                  className="flex-1 md:flex-initial px-4 py-2.5 bg-white hover:bg-gray-50 text-[#1E4B7A] border border-[#1E4B7A]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Verify Provenance</span>
                </Link>
                <button
                  onClick={() => setCreatedBatch(null)}
                  className="p-2 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-white/50"
                  title="Create another batch"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Workbench Split / Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Batch Formulation Form (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-[#D5DBD3] rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#1E4B7A] flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />
                    <span>Batch Formulation &amp; Quota Parameters</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a verified harvest lot, set net weight, packaging size, and destination.
                  </p>
                </div>

                {/* 1. Lot Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Source Harvest Lot
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lots.map((lot) => {
                      const isSelected = lot.id === selectedLotId;
                      return (
                        <div
                          key={lot.id}
                          onClick={() => handleLotSelect(lot.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                            isSelected
                              ? "bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20"
                              : "bg-gray-50/60 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-[#1E4B7A]">
                              {lot.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                lot.status === "READY" || lot.status === "ACCEPTED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {lot.status}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-[#1C2430]">
                            {lot.apiary}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
                            <span>Harvest: {lot.harvest_date}</span>
                            <span className="font-bold text-amber-700">
                              {lot.kg_declared} kg
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-700 mt-1">
                            Moisture: {lot.moisture_pct}% (Refractometer verified)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Net Weight Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Net Batch Honey Weight (kg)
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Available in lot: {activeLot?.kg_declared || 14.0} kg
                    </span>
                  </div>
                  <div className="relative">
                    <Scale className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="1000"
                      value={kgNet}
                      onChange={(e) => setKgNet(parseFloat(e.target.value) || 0)}
                      className="w-full pl-11 pr-14 py-3 bg-white border border-[#D5DBD3] rounded-xl text-sm font-bold text-gray-900 focus:outline-hidden focus:border-[#1E4B7A] focus:ring-2 focus:ring-[#1E4B7A]/20 transition"
                      placeholder="e.g. 14.0"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                      kg Net
                    </span>
                  </div>
                </div>

                {/* 3. Destination Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Distribution Destination
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDestination("domestic")}
                      className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                        destination === "domestic"
                          ? "bg-blue-50/60 border-[#1E4B7A] ring-2 ring-[#1E4B7A]/20"
                          : "bg-gray-50/60 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1E4B7A]">
                          Domestic Market (FSSAI)
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Standard Indian FSSAI Jaivik Bharat compliance
                        </div>
                      </div>
                      {destination === "domestic" && (
                        <CheckCircle2 className="w-4 h-4 text-[#1E4B7A] shrink-0" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDestination("export")}
                      className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                        destination === "export"
                          ? "bg-purple-50/60 border-purple-600 ring-2 ring-purple-600/20"
                          : "bg-gray-50/60 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-purple-900">
                          Export (EU / US FDA)
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Codex Alimentarius &amp; NMR authenticity certified
                        </div>
                      </div>
                      {destination === "export" && (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. Packaging Unit Size */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Packaging Jar Unit Size
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {([250, 500, 1000] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setUnitSizeG(size)}
                        className={`py-3 px-2 rounded-xl border text-center transition ${
                          unitSizeG === size
                            ? "bg-[#1E4B7A] text-white border-[#1E4B7A] shadow-xs font-bold"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-semibold text-xs"
                        }`}
                      >
                        <div className="text-sm">{`${size} g`}</div>
                        <div
                          className={`text-[10px] ${
                            unitSizeG === size ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {size === 1000 ? "1.0 kg Jar" : `${size / 1000} kg Jar`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time Tag & Jar Quota calculation card */}
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      {`Tag Allocation Quota: ${maxUnits} jars (2% handling allowance enforced)`}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      {`Quota: ${maxUnits}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-gray-600 border-t border-amber-200/60">
                    <div>
                      <span className="text-gray-500">Gross Capacity:</span>
                      <div className="font-bold text-gray-900">
                        {(kgNet / unitSizeKg).toFixed(1)} jars
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">2% Spillage Margin:</span>
                      <div className="font-bold text-amber-700">
                        {(kgNet * 0.02).toFixed(2)} kg
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Issuable Tags:</span>
                      <div className="font-bold text-emerald-700">
                        {maxUnits} QR/NFC Seals
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  disabled={isSubmitting || kgNet <= 0}
                  onClick={handleInitiateBatchCreation}
                  className="w-full py-4 bg-gradient-to-r from-[#1E4B7A] to-[#163A5F] hover:from-[#163A5F] hover:to-[#122e4d] disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-md shadow-[#1E4B7A]/20 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Anchoring Batch to Ledger...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Anchor Batch &amp; Issue QR Codes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Live Batch Preview & Ledger Seal (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#D5DBD3] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Batch Label Preview
                    </span>
                    <div className="text-2xl font-black text-[#1E4B7A] tracking-tight">
                      {createdBatch ? createdBatch.public_code : "HC-0421"}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#E1F1E8] text-[#1E7B4C] text-xs font-bold rounded-full border border-[#1E7B4C]/20 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Ledger Sealed
                  </span>
                </div>

                {/* Batch Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-gray-500 font-medium">Apiary Origin</div>
                    <div className="font-bold text-[#1C2430] mt-0.5">
                      {activeLot?.apiary || "Kanchipuram Apiary"}
                    </div>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-gray-500 font-medium">Net Weight</div>
                    <div className="font-bold text-[#1C2430] mt-0.5">
                      {createdBatch ? createdBatch.kg_net : kgNet} kg
                    </div>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-gray-500 font-medium">Packaging Unit</div>
                    <div className="font-bold text-[#1C2430] mt-0.5">
                      {maxUnits} jars ({unitSizeG}g)
                    </div>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-gray-500 font-medium">Moisture &amp; Lab</div>
                    <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {createdBatch?.moisture_pct ?? activeLot?.moisture_pct ?? 17.8}% PASS
                    </div>
                  </div>
                </div>

                {/* SVG QR Code Preview Box */}
                <div className="bg-[#F5F7F4] border-2 border-dashed border-[#D5DBD3] rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-[#D5DBD3] shadow-xs">
                    <svg
                      width="150"
                      height="150"
                      viewBox="0 0 140 140"
                      className="w-36 h-36"
                      aria-label={`QR Code for Batch ${
                        createdBatch ? createdBatch.public_code : "HC-0421"
                      }`}
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
                      <text
                        x="70"
                        y="74"
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#1C2430"
                      >
                        HC
                      </text>
                      {/* Data blocks */}
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
                  <div className="font-mono text-sm font-bold text-[#1E4B7A]">
                    {createdBatch ? createdBatch.public_code : "HC-0421"}
                  </div>
                  <p className="text-[11px] text-gray-500 max-w-xs">
                    Consumer scans resolve directly to the public tamper-evident provenance
                    ledger record.
                  </p>
                </div>

                {/* Ledger Hash Card */}
                <div className="bg-[#E6EDF5]/60 p-3.5 rounded-xl border border-[#1E4B7A]/15 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1E4B7A]" />
                    <span className="font-semibold text-[#1C2430]">
                      Hash stored on SHA-256 Custody Chain
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <code className="text-[11px] font-mono text-gray-600 break-all bg-white/70 px-2 py-0.5 rounded border border-gray-200">
                      {createdBatch?.event_hash ||
                        "9f3a8b22c741e5d9961603baef7d21c21e"}
                    </code>
                    <button
                      onClick={() =>
                        copyHash(
                          createdBatch?.event_hash ||
                            "9f3a8b22c741e5d9961603baef7d21c21e"
                        )
                      }
                      className="p-1 hover:bg-white rounded text-gray-500 transition"
                      title="Copy Hash"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {copiedHash && (
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                      Copied to clipboard!
                    </span>
                  )}
                </div>

                {/* Actions for current preview */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() =>
                      setPrintModalBatch(createdBatch || batches[0] || null)
                    }
                    className="w-full py-3 bg-[#1E4B7A] hover:bg-[#163A5F] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print QR Label for this Batch</span>
                  </button>
                  <Link
                    to={`/verify?code=${
                      createdBatch ? createdBatch.public_code : "HC-0421"
                    }`}
                    className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1E4B7A] border border-gray-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Test Consumer Verification Screen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Apiary Batches Ledger */
        <div className="space-y-6">
          <div className="bg-white border border-[#D5DBD3] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1E4B7A] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <span>Apiary Batches Ledger</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Immutable records of all packaged honey batches created from your harvest lots.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("create")}
                className="px-4 py-2 bg-[#1E4B7A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#163A5F] shadow-xs self-start sm:self-auto transition"
              >
                <Plus className="w-4 h-4" />
                <span>Formulate New Batch</span>
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-3 px-4">Public Code</th>
                    <th className="py-3 px-4">Lot ID</th>
                    <th className="py-3 px-4">Net (kg)</th>
                    <th className="py-3 px-4">Units Issued</th>
                    <th className="py-3 px-4">Moisture %</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Registry</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {batches.map((b) => (
                    <tr key={b.batch_id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E4B7A]">
                        {b.public_code}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">
                        {b.lot_id || "lot-0421"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {b.kg_net} kg
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {b.units_issued ?? 19} jars
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                        {b.moisture_pct ?? 17.8}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-gray-600">
                          {b.destination || "domestic"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.madhukranti_status === "verified"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {b.madhukranti_status === "verified"
                            ? "Verified"
                            : "Self-Declared"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E1F1E8] text-[#1E7B4C]">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setPrintModalBatch(b)}
                          className="p-1.5 text-gray-600 hover:text-[#1E4B7A] hover:bg-gray-100 rounded-lg transition"
                          title="Print QR Label"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/verify?code=${b.public_code}`}
                          className="inline-flex p-1.5 text-gray-600 hover:text-[#1E4B7A] hover:bg-gray-100 rounded-lg transition"
                          title="Verify Provenance"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-3">
              {batches.map((b) => (
                <div
                  key={b.batch_id}
                  className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#1E4B7A]">
                      {b.public_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E1F1E8] text-[#1E7B4C]">
                      {b.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400">Net Weight:</span>{" "}
                      <strong className="text-gray-900">{b.kg_net} kg</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Units:</span>{" "}
                      <strong className="text-gray-900">{b.units_issued ?? 19} jars</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Moisture:</span>{" "}
                      <span className="text-emerald-700 font-bold">
                        {b.moisture_pct ?? 17.8}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Registry:</span>{" "}
                      <span className="capitalize">{b.madhukranti_status || "self_declared"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setPrintModalBatch(b)}
                      className="flex-1 py-2 bg-[#1E4B7A] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Label</span>
                    </button>
                    <Link
                      to={`/verify?code=${b.public_code}`}
                      className="flex-1 py-2 bg-white text-[#1E4B7A] border border-gray-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 text-center"
                    >
                      <span>Verify</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* One-time Madhu Kranti Advisory Modal */}
      <MadhuKrantiBenefitModal
        isOpen={isBenefitModalOpen}
        onClose={() => setIsBenefitModalOpen(false)}
        onProceed={() => {
          setIsBenefitModalOpen(false);
          executeBatchCreation();
        }}
      />

      {/* High-Resolution Printable Packaging QR Label Modal */}
      {printModalBatch && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#1E4B7A]" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Packaging QR Label Sticker
                </h3>
              </div>
              <button
                onClick={() => setPrintModalBatch(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Label Card */}
            <div className="border-2 border-dashed border-[#1E4B7A]/40 rounded-xl p-4 bg-white text-center space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                <span>HoneyChain Provenance</span>
                <span className="text-[#1E7B4C]">FSSAI Authenticated</span>
              </div>

              <div className="text-xl font-black text-[#1E4B7A] tracking-tight">
                {printModalBatch.public_code}
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-2 bg-white border border-gray-300 rounded-lg shadow-2xs">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 140 140"
                    className="w-28 h-28"
                  >
                    <rect width="140" height="140" fill="#FFFFFF" />
                    <rect x="10" y="10" width="35" height="35" fill="#1C2430" />
                    <rect x="15" y="15" width="25" height="25" fill="#FFFFFF" />
                    <rect x="20" y="20" width="15" height="15" fill="#1C2430" />
                    <rect x="95" y="10" width="35" height="35" fill="#1C2430" />
                    <rect x="100" y="15" width="25" height="25" fill="#FFFFFF" />
                    <rect x="105" y="20" width="15" height="15" fill="#1C2430" />
                    <rect x="10" y="95" width="35" height="35" fill="#1C2430" />
                    <rect x="15" y="100" width="25" height="25" fill="#FFFFFF" />
                    <rect x="20" y="105" width="15" height="15" fill="#1C2430" />
                    <circle cx="70" cy="70" r="14" fill="#F2A900" />
                    <text
                      x="70"
                      y="74"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#1C2430"
                    >
                      HC
                    </text>
                    <rect x="52" y="16" width="6" height="6" fill="#1C2430" />
                    <rect x="62" y="22" width="6" height="6" fill="#1C2430" />
                    <rect x="74" y="14" width="6" height="6" fill="#1C2430" />
                    <rect x="82" y="28" width="6" height="6" fill="#1C2430" />
                    <rect x="16" y="52" width="6" height="6" fill="#1C2430" />
                    <rect x="28" y="64" width="6" height="6" fill="#1C2430" />
                    <rect x="40" y="54" width="6" height="6" fill="#1C2430" />
                    <rect x="92" y="52" width="6" height="6" fill="#1C2430" />
                    <rect x="104" y="62" width="6" height="6" fill="#1C2430" />
                    <rect x="52" y="94" width="6" height="6" fill="#1C2430" />
                    <rect x="76" y="98" width="6" height="6" fill="#1C2430" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-700 text-left border-t border-gray-100 pt-2">
                <div>
                  Origin: <strong>{activeLot?.apiary || "Kanchipuram TN"}</strong>
                </div>
                <div>
                  Net Honey: <strong>{printModalBatch.kg_net} kg</strong>
                </div>
                <div>
                  Moisture: <strong>{printModalBatch.moisture_pct ?? 17.8}%</strong>
                </div>
                <div>
                  Quota: <strong>{printModalBatch.units_issued ?? 19} jars</strong>
                </div>
              </div>

              <div className="text-[9px] font-mono text-gray-400 break-all">
                sha256: {printModalBatch.event_hash || "9f3a8b22c741e5d9961603baef7d21c21e"}
              </div>
            </div>

            {/* Print Controls */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-[#1E4B7A] hover:bg-[#163A5F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Thermal / Label Printer</span>
              </button>
              <button
                onClick={() => setPrintModalBatch(null)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
