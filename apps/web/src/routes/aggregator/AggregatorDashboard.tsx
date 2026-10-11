import React, { useState, useEffect } from "react";
import { StatusChip } from "@honeychain/ui";
import {
  Package,
  Layers,
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Search,
  Calculator,
  ShieldCheck,
  X,
  FileText,
  Calendar,
  Building,
} from "lucide-react";

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
  seal_verified?: boolean;
  decision?: "ACCEPTED" | "REJECTED";
  notes?: string;
  intake_at?: string;
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
    explorer_url: "https://amoy.polygonscan.com/tx/0x8f2d5a9b7e3c1a4d6f8e0b2c4a6e8d0f1a3b5c7e9d1f3b5a7c9e1d3f5b7a9c1e",
    created_at: "2026-09-15T10:00:00Z",
  },
];

export const AggregatorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"lots" | "batches">("lots");
  const [lots, setLots] = useState<LotRecord[]>(SEED_LOTS);
  const [batches, setBatches] = useState<BatchRecord[]>(SEED_BATCHES);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Intake Modal state
  const [selectedLot, setSelectedLot] = useState<LotRecord | null>(null);
  const [receivedWeight, setReceivedWeight] = useState<string>("");
  const [refractometerMoisture, setRefractometerMoisture] = useState<string>("");
  const [sealIntact, setSealIntact] = useState<boolean>(true);
  const [intakeNotes, setIntakeNotes] = useState<string>("");
  const [processingIntake, setProcessingIntake] = useState<boolean>(false);

  // Tag Quota Calculator state
  const [calcNetKg, setCalcNetKg] = useState<number>(10.0);
  const [calcUnitSizeG, setCalcUnitSizeG] = useState<number>(500);
  const [calcLossPct, setCalcLossPct] = useState<number>(2.0);

  const calculatedQuota = Math.floor(
    (calcNetKg * (1 - calcLossPct / 100)) / (calcUnitSizeG / 1000)
  );
  const calculatedUsableKg = (calcNetKg * (1 - calcLossPct / 100)).toFixed(2);
  const calculatedSlopKg = (calcNetKg * (calcLossPct / 100)).toFixed(2);

  const fetchLotsAndBatches = async () => {
    setLoading(true);
    try {
      const [lotsRes, batchesRes] = await Promise.all([
        fetch("/api/v1/lots").catch(() => null),
        fetch("/api/v1/batches").catch(() => null),
      ]);

      if (lotsRes && lotsRes.ok) {
        const lotsData = await lotsRes.json();
        if (Array.isArray(lotsData)) setLots(lotsData);
      }
      if (batchesRes && batchesRes.ok) {
        const batchesData = await batchesRes.json();
        if (Array.isArray(batchesData)) setBatches(batchesData);
      }
    } catch (e) {
      console.warn("Failed fetching aggregator data, using offline state:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotsAndBatches();
  }, []);

  const openIntakeModal = (lot: LotRecord) => {
    setSelectedLot(lot);
    setReceivedWeight(String(lot.received_weight_kg ?? lot.kg_declared));
    setRefractometerMoisture(String(lot.received_moisture_pct ?? lot.moisture_pct));
    setSealIntact(lot.seal_verified ?? true);
    setIntakeNotes(lot.notes ?? "");
  };

  const handleIntakeSubmit = async (decision: "ACCEPTED" | "REJECTED") => {
    if (!selectedLot) return;
    setProcessingIntake(true);

    const payload = {
      decision,
      received_weight_kg: parseFloat(receivedWeight) || selectedLot.kg_declared,
      moisture_pct: parseFloat(refractometerMoisture) || selectedLot.moisture_pct,
      seal_verified: sealIntact,
      notes: intakeNotes.trim(),
    };

    try {
      const res = await fetch(`/api/v1/lots/${selectedLot.id}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setLots((prev) =>
          prev.map((l) =>
            l.id === selectedLot.id
              ? {
                  ...l,
                  status: decision,
                  decision,
                  received_weight_kg: payload.received_weight_kg,
                  received_moisture_pct: payload.moisture_pct,
                  seal_verified: payload.seal_verified,
                  notes: payload.notes,
                }
              : l
          )
        );
        setToastMsg({
          text: `Lot ${selectedLot.id} marked as ${decision}. Custody receipt recorded!`,
          type: "success",
        });
      } else {
        // Fallback local update
        setLots((prev) =>
          prev.map((l) =>
            l.id === selectedLot.id
              ? { ...l, status: decision, decision, ...payload }
              : l
          )
        );
        setToastMsg({
          text: `Lot ${selectedLot.id} updated locally as ${decision}.`,
          type: "success",
        });
      }
    } catch {
      setLots((prev) =>
        prev.map((l) =>
          l.id === selectedLot.id
            ? { ...l, status: decision, decision, ...payload }
            : l
        )
      );
      setToastMsg({
        text: `Lot ${selectedLot.id} updated locally as ${decision}.`,
        type: "success",
      });
    } finally {
      setProcessingIntake(false);
      setSelectedLot(null);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xs ${
            toastMsg.type === "success"
              ? "bg-[#E1F1E8] border-[#1E7B4C] text-[#1E7B4C]"
              : "bg-[#FBE3E0] border-[#B3261E] text-[#B3261E]"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#D5DBD3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#1E4B7A] uppercase tracking-wider">
            Aggregator Intake Hub
          </div>
          <h2 className="text-xl font-bold text-[#1C2430] mt-0.5">
            Tamil Nadu State Honey Aggregator Coop
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            FSSAI Lic: 10020042001188 • Digital Custody Transfer & Refractometer Quality Inspection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLotsAndBatches}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-[#1E4B7A] hover:bg-gray-100 rounded-xl transition border border-[#D5DBD3]"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="px-3 py-1.5 bg-[#E6EDF5] text-[#1E4B7A] rounded-xl text-xs font-bold border border-[#1E4B7A]/20">
            NTAG 424 Encrypted Custody
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#D5DBD3] gap-2">
        <button
          onClick={() => setActiveTab("lots")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "lots"
              ? "border-[#1E4B7A] text-[#1E4B7A]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Lot Intake Queue</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#E6EDF5] text-[#1E4B7A]">
            {lots.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "batches"
              ? "border-[#1E4B7A] text-[#1E4B7A]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Batches Workbench & Tag Calculator</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-gray-100 text-gray-700">
            {batches.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Lot Intake Queue */}
      {activeTab === "lots" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1C2430]">Incoming Apiary Harvest Lots</h3>
              <p className="text-xs text-gray-500">
                Inspect physical container seals, weigh lot drums, and log refractometer moisture before acceptance.
              </p>
            </div>
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#D5DBD3] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F4] border-b border-[#D5DBD3] text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lot ID</th>
                  <th className="py-3 px-4">Farmer FPO / Apiary</th>
                  <th className="py-3 px-4">Harvest Date</th>
                  <th className="py-3 px-4">Declared Weight</th>
                  <th className="py-3 px-4">Moisture %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Intake Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lots.map((lot) => {
                  const isAccepted = lot.status === "ACCEPTED";
                  const isRejected = lot.status === "REJECTED";
                  const chipStatus = isAccepted ? "safe" : isRejected ? "critical" : "info";

                  return (
                    <tr key={lot.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E4B7A]">
                        {lot.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {lot.farmer_org_name || lot.apiary}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {lot.harvest_date}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1C2430]">
                        {`${lot.kg_declared} kg`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        {lot.moisture_pct}%
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusChip status={chipStatus} label={lot.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openIntakeModal(lot)}
                          className="px-3.5 py-1.5 bg-[#1E4B7A] text-white font-bold rounded-xl text-xs hover:bg-[#163A5F] transition"
                        >
                          {lot.status === "READY" ? "Inspect & Intake" : "Review Intake"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 768px) */}
          <div className="md:hidden space-y-3">
            {lots.map((lot) => {
              const isAccepted = lot.status === "ACCEPTED";
              const isRejected = lot.status === "REJECTED";
              const chipStatus = isAccepted ? "safe" : isRejected ? "critical" : "info";

              return (
                <div
                  key={lot.id}
                  className="bg-white p-4 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#1E4B7A] text-sm">{lot.id}</span>
                    <StatusChip status={chipStatus} label={lot.status} />
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <Building className="w-3.5 h-3.5 text-gray-400" />
                      <span>{lot.farmer_org_name || lot.apiary}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Harvested {lot.harvest_date}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#F5F7F4] rounded-xl text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Declared Weight</span>
                      <span className="font-bold text-[#1C2430]">{lot.kg_declared} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Moisture</span>
                      <span className="font-bold text-[#1C2430]">{lot.moisture_pct}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openIntakeModal(lot)}
                    className="w-full py-2.5 bg-[#1E4B7A] text-white font-bold rounded-xl text-xs hover:bg-[#163A5F] transition"
                  >
                    {lot.status === "READY" ? "Inspect & Intake Lot" : "Review Intake Details"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Batches Workbench & Tag Calculator */}
      {activeTab === "batches" && (
        <div className="space-y-6">
          {/* Batches Table / Cards */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#1C2430]">Active Packaging Batches</h3>

            {/* Desktop Batches Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-[#D5DBD3] shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F4] border-b border-[#D5DBD3] text-gray-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Batch Code</th>
                    <th className="py-3 px-4">Net Mass</th>
                    <th className="py-3 px-4">Units Issued</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Blockchain Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batches.map((b) => (
                    <tr key={b.batch_id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E4B7A] text-sm">
                        {b.public_code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1C2430]">
                        {b.kg_net} kg
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        {b.units_issued ?? 19} jars
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium text-gray-600">
                        {b.destination}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusChip
                          status={b.status === "TEST_PASSED" ? "safe" : "info"}
                          label={b.status}
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        {b.explorer_url ? (
                          <a
                            href={b.explorer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#1E4B7A] font-bold hover:underline text-xs"
                          >
                            <span>Polygonscan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">Local Genesis</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Batches Cards */}
            <div className="md:hidden space-y-3">
              {batches.map((b) => (
                <div
                  key={b.batch_id}
                  className="bg-white p-4 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#1E4B7A] text-base">{b.public_code}</span>
                    <StatusChip
                      status={b.status === "TEST_PASSED" ? "safe" : "info"}
                      label={b.status}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-[#F5F7F4] rounded-xl">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Net Mass</span>
                      <span className="font-bold text-[#1C2430]">{b.kg_net} kg</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Units Issued</span>
                      <span className="font-bold text-[#1C2430]">{b.units_issued ?? 19} jars</span>
                    </div>
                  </div>

                  {b.explorer_url && (
                    <a
                      href={b.explorer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-[#E6EDF5] text-[#1E4B7A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>View Polygon Amoy Anchor</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Tag Quota Calculator */}
          <div className="bg-white p-6 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#1E4B7A]">
              <Calculator className="w-5 h-5" />
              <h3 className="text-base font-bold text-[#1C2430]">
                Interactive Tag Quota & Handling Allowance Calculator
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Enforce anti-cloning quotas under FR10.2: exactly prevents over-issuing NFC jar tags to stop dilution fraud.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Batch Net Honey (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={calcNetKg}
                  onChange={(e) => setCalcNetKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Jar Unit Size (grams)
                </label>
                <select
                  value={calcUnitSizeG}
                  onChange={(e) => setCalcUnitSizeG(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                >
                  <option value={250}>250g Jar</option>
                  <option value={500}>500g Jar (Standard)</option>
                  <option value={1000}>1000g (1 kg Tub)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Handling / Slop Loss (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={calcLossPct}
                  onChange={(e) => setCalcLossPct(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                />
              </div>
            </div>

            {/* Computation Result Cards */}
            <div className="p-4 bg-gradient-to-r from-[#E6EDF5] to-white rounded-xl border border-[#1E4B7A]/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Allowable Tag Quota
                </span>
                <div className="text-3xl font-black text-[#1E4B7A] mt-0.5">
                  {calculatedQuota} <span className="text-xs font-bold">tags</span>
                </div>
                <span className="text-[10px] text-gray-500">Max tamper-evident NFC units</span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Usable Honey Mass
                </span>
                <div className="text-2xl font-black text-[#1E7B4C] mt-0.5">
                  {calculatedUsableKg} <span className="text-xs font-bold">kg</span>
                </div>
                <span className="text-[10px] text-gray-500">Net honey in retail jars</span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Tare & Tank Slop Loss
                </span>
                <div className="text-2xl font-black text-gray-700 mt-0.5">
                  {calculatedSlopKg} <span className="text-xs font-bold">kg</span>
                </div>
                <span className="text-[10px] text-gray-500">{calcLossPct}% extraction loss</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intake Action Modal */}
      {selectedLot && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#D5DBD3] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E4B7A]">
                  Quality Inspection
                </span>
                <h3 className="text-base font-bold text-[#1C2430]">
                  Intake Inspection for Lot {selectedLot.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLot(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lot Summary */}
            <div className="p-3 bg-[#F5F7F4] rounded-xl grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 block">Origin Apiary</span>
                <span className="font-bold text-[#1C2430]">{selectedLot.farmer_org_name || selectedLot.apiary}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Declared Harvest Weight</span>
                <span className="font-bold text-[#1C2430]">{selectedLot.kg_declared} kg</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Received Weight Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Received Scale Weight (kg) *
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    step="0.1"
                    value={receivedWeight}
                    onChange={(e) => setReceivedWeight(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                  />
                </div>
              </div>

              {/* Refractometer Moisture Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Refractometer Moisture (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={refractometerMoisture}
                  onChange={(e) => setRefractometerMoisture(e.target.value)}
                  required
                  placeholder="e.g. 17.8"
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                />
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  FSSAI standard requirement: ≤ 20.0% moisture content.
                </span>
              </div>

              {/* Seal Verification Checkbox */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs font-bold text-[#1C2430] block">
                    Tamper-Evident Seal Verification
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Physical container lid security seals intact with matching QR UID.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sealIntact}
                    onChange={(e) => setSealIntact(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E7B4C]"></div>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Inspection Notes (Optional)
                </label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  placeholder="Clear amber color, aroma nominal"
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                />
              </div>

              {/* Decision Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={processingIntake}
                  onClick={() => handleIntakeSubmit("REJECTED")}
                  className="px-4 py-2.5 bg-white border border-[#B3261E] text-[#B3261E] font-bold rounded-xl text-xs hover:bg-red-50 transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Lot</span>
                </button>

                <button
                  type="button"
                  disabled={processingIntake}
                  onClick={() => handleIntakeSubmit("ACCEPTED")}
                  className="px-5 py-2.5 bg-[#1E7B4C] text-white font-bold rounded-xl text-xs hover:bg-[#16633D] transition flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Lot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
