import React, { useState, useEffect } from "react";
import { StatusChip } from "@honeychain/ui";
import {
  FileText,
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  X,
  Scan,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";

export interface LabRequestRecord {
  id: string;
  batch_id: string;
  batch_code: string;
  sample_id: string;
  panel: "domestic" | "export" | string;
  status: string;
  moisture: number | null;
  moisture_pct: number | null;
  verdict: string;
  lab_verdict?: string;
  system_verdict?: string;
  created_at: string;
  sucrose_pct?: number;
  hmf_mg_kg?: number;
}

const SEED_REQUESTS: LabRequestRecord[] = [
  {
    id: "req-1",
    batch_id: "batch-hc-0421",
    batch_code: "HC-0421",
    sample_id: "SMP-0421",
    panel: "domestic",
    status: "TEST_PASSED",
    moisture: 17.8,
    moisture_pct: 17.8,
    verdict: "PASS",
    lab_verdict: "PASS",
    system_verdict: "PASS",
    created_at: "2026-09-15T12:00:00Z",
    sucrose_pct: 3.2,
    hmf_mg_kg: 24,
  },
  {
    id: "req-2",
    batch_id: "batch-hc-0422",
    batch_code: "HC-0422",
    sample_id: "SMP-0422",
    panel: "export",
    status: "SEALED",
    moisture: null,
    moisture_pct: null,
    verdict: "pending",
    created_at: "2026-10-02T09:00:00Z",
  },
];

export const LabPortal: React.FC = () => {
  const [requests, setRequests] = useState<LabRequestRecord[]>(SEED_REQUESTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "warning" | "error" } | null>(null);

  // Sample Intake Modal state
  const [intakeItem, setIntakeItem] = useState<LabRequestRecord | null>(null);
  const [vialTagUid, setVialTagUid] = useState<string>("04:A1:B2:C3:D4:E5:F6");
  const [sealBroken, setSealBroken] = useState<boolean>(false);
  const [processingIntake, setProcessingIntake] = useState<boolean>(false);

  // Report Entry Modal state
  const [reportItem, setReportItem] = useState<LabRequestRecord | null>(null);
  const [moistureValue, setMoistureValue] = useState<string>("17.8");
  const [sucroseValue, setSucroseValue] = useState<string>("3.2");
  const [hmfValue, setHmfValue] = useState<string>("24.0");
  const [labVerdict, setLabVerdict] = useState<"PASS" | "FAIL">("PASS");
  const [processingReport, setProcessingReport] = useState<boolean>(false);

  const fetchLabRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lab-requests");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRequests(data);
      }
    } catch (e) {
      console.warn("Could not reach /api/v1/lab-requests, using seed state:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabRequests();
  }, []);

  const openIntakeModal = (item: LabRequestRecord) => {
    setIntakeItem(item);
    setVialTagUid(`04:E2:${item.sample_id.replace(/[^0-9]/g, "") || "42"}:9A:F1:C0`);
    setSealBroken(false);
  };

  const openReportModal = (item: LabRequestRecord) => {
    setReportItem(item);
    setMoistureValue(String(item.moisture_pct ?? 17.8));
    setSucroseValue("3.2");
    setHmfValue("24.0");
    setLabVerdict(item.lab_verdict === "FAIL" ? "FAIL" : "PASS");
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeItem) return;
    setProcessingIntake(true);

    const payload = {
      seal_broken: sealBroken,
      tag_uid: vialTagUid,
    };

    try {
      const res = await fetch(`/api/v1/lab-requests/${intakeItem.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const nextStatus = data.sample_status || (sealBroken ? "COMPROMISED" : "AT_LAB");
        setRequests((prev) =>
          prev.map((r) => (r.id === intakeItem.id ? { ...r, status: nextStatus } : r))
        );

        if (sealBroken) {
          setToastMsg({
            text: `Vial tamper seal was broken! Sample ${intakeItem.sample_id} flagged COMPROMISED. Batch locked ON_HOLD.`,
            type: "error",
          });
        } else {
          setToastMsg({
            text: `Sample ${intakeItem.sample_id} received intact. Status updated to AT_LAB.`,
            type: "success",
          });
        }
      } else {
        // Fallback update
        const nextStatus = sealBroken ? "COMPROMISED" : "AT_LAB";
        setRequests((prev) =>
          prev.map((r) => (r.id === intakeItem.id ? { ...r, status: nextStatus } : r))
        );
        setToastMsg({
          text: `Sample ${intakeItem.sample_id} status updated locally to ${nextStatus}.`,
          type: sealBroken ? "error" : "success",
        });
      }
    } catch {
      const nextStatus = sealBroken ? "COMPROMISED" : "AT_LAB";
      setRequests((prev) =>
        prev.map((r) => (r.id === intakeItem.id ? { ...r, status: nextStatus } : r))
      );
      setToastMsg({
        text: `Sample ${intakeItem.sample_id} status updated locally to ${nextStatus}.`,
        type: sealBroken ? "error" : "success",
      });
    } finally {
      setProcessingIntake(false);
      setIntakeItem(null);
      setTimeout(() => setToastMsg(null), 6000);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportItem) return;
    setProcessingReport(true);

    const moisture = parseFloat(moistureValue) || 17.8;
    const sucrose = parseFloat(sucroseValue) || 3.2;
    const hmf = parseFloat(hmfValue) || 24.0;

    // FSSAI standard check (<= 20.0%)
    const systemVerdict = moisture <= 20.0 ? "PASS" : "FAIL";
    const verdictMismatch = systemVerdict !== labVerdict;
    const computedStatus = verdictMismatch
      ? "ON_HOLD"
      : systemVerdict === "PASS"
      ? "TEST_PASSED"
      : "TEST_FAILED";

    const payload = {
      values: {
        moisture_pct: moisture,
        sucrose_pct: sucrose,
        hmf_mg_kg: hmf,
      },
      lab_verdict: labVerdict,
    };

    try {
      const res = await fetch(`/api/v1/lab-requests/${reportItem.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reportItem.id
              ? {
                  ...r,
                  moisture_pct: moisture,
                  moisture: moisture,
                  sucrose_pct: sucrose,
                  hmf_mg_kg: hmf,
                  lab_verdict: data.lab_verdict || labVerdict,
                  system_verdict: data.system_verdict || systemVerdict,
                  verdict: data.lab_verdict || labVerdict,
                  status: data.status || computedStatus,
                }
              : r
          )
        );

        if (data.needs_review || verdictMismatch) {
          setToastMsg({
            text: `⚠️ Verdict Mismatch! Lab logged ${labVerdict} but System computed ${systemVerdict}. Batch placed ON_HOLD for compliance review.`,
            type: "warning",
          });
        } else {
          setToastMsg({
            text: `Test report signed! Batch ${reportItem.batch_code} passed all quality benchmarks (${computedStatus}).`,
            type: "success",
          });
        }
      } else {
        // Fallback update
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reportItem.id
              ? {
                  ...r,
                  moisture_pct: moisture,
                  lab_verdict: labVerdict,
                  system_verdict: systemVerdict,
                  status: computedStatus,
                }
              : r
          )
        );
        setToastMsg({
          text: verdictMismatch
            ? `⚠️ Verdict Mismatch logged! Sample placed ON_HOLD.`
            : `Test report logged locally (${computedStatus}).`,
          type: verdictMismatch ? "warning" : "success",
        });
      }
    } catch {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reportItem.id
            ? {
                ...r,
                moisture_pct: moisture,
                lab_verdict: labVerdict,
                system_verdict: systemVerdict,
                status: computedStatus,
              }
            : r
        )
      );
      setToastMsg({
        text: `Test report updated locally.`,
        type: "success",
      });
    } finally {
      setProcessingReport(false);
      setReportItem(null);
      setTimeout(() => setToastMsg(null), 6000);
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
              : toastMsg.type === "warning"
              ? "bg-[#FCEBD7] border-[#A94F00] text-[#A94F00]"
              : "bg-[#FBE3E0] border-[#B3261E] text-[#B3261E]"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toastMsg.type === "warning" && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {toastMsg.type === "error" && <XCircle className="w-4 h-4 shrink-0" />}
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
          <div className="text-xs font-bold text-[#1E7B4C] uppercase tracking-wider flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4" />
            <span>FSSAI / NABL Testing Portal</span>
          </div>
          <h2 className="text-xl font-bold text-[#1C2430] mt-0.5">
            National Honey Quality Testing Lab
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            NABL ISO/IEC 17025 Accredited • C4 Sugar EA-IRMS, Moisture Refractometry & HMF Spectrophotometry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLabRequests}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-[#1E4B7A] hover:bg-gray-100 rounded-xl transition border border-[#D5DBD3]"
            title="Refresh testing requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="px-3 py-1.5 bg-[#E1F1E8] text-[#1E7B4C] rounded-xl text-xs font-bold border border-[#1E7B4C]/20">
            NABL ISO/IEC 17025 Certified
          </span>
        </div>
      </div>

      {/* Testing Requests Inbox */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1C2430]">Testing Requests Inbox</h3>
            <p className="text-xs text-gray-500">
              Receive sealed tamper-evident duplicate vials, check NTAG 424 loop continuity, and sign laboratory certificates.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {requests.length} Requests
          </span>
        </div>

        {/* Desktop Table (>= 768px) */}
        <div className="hidden md:block bg-white rounded-2xl border border-[#D5DBD3] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7F4] border-b border-[#D5DBD3] text-gray-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Sample UID</th>
                <th className="py-3 px-4">Batch Public Code</th>
                <th className="py-3 px-4">Panel Standard</th>
                <th className="py-3 px-4">Moisture</th>
                <th className="py-3 px-4">Verdict (Lab / System)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => {
                const isPassed = r.status === "TEST_PASSED";
                const isSealed = r.status === "SEALED";
                const isAtLab = r.status === "AT_LAB";
                const isCompromised = r.status === "COMPROMISED";
                const isOnHold = r.status === "ON_HOLD";
                const chipStatus = isPassed
                  ? "safe"
                  : isCompromised || isOnHold
                  ? "critical"
                  : isAtLab
                  ? "watch"
                  : "info";

                return (
                  <tr key={r.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E4B7A]">
                      {r.sample_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1C2430]">
                      {r.batch_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {r.panel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700">
                      {r.moisture_pct !== null && r.moisture_pct !== undefined
                        ? `${r.moisture_pct}%`
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.lab_verdict ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              r.lab_verdict === "PASS" ? "text-[#1E7B4C]" : "text-[#B3261E]"
                            }`}
                          >
                            {r.lab_verdict}
                          </span>
                          {r.system_verdict && (
                            <span className="text-gray-400 text-[10px]">
                              (Sys: {r.system_verdict})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusChip status={chipStatus} label={r.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isSealed && (
                          <button
                            onClick={() => openIntakeModal(r)}
                            className="px-3 py-1.5 bg-[#1E4B7A] text-white font-bold rounded-xl text-xs hover:bg-[#163A5F] transition flex items-center gap-1"
                          >
                            <Scan className="w-3.5 h-3.5" />
                            <span>Intake Vial</span>
                          </button>
                        )}

                        {(isAtLab || isSealed) && (
                          <button
                            onClick={() => openReportModal(r)}
                            className="px-3 py-1.5 bg-[#1E7B4C] text-white font-bold rounded-xl text-xs hover:bg-[#16633D] transition flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Enter Report</span>
                          </button>
                        )}

                        {isPassed && (
                          <button
                            onClick={() => openReportModal(r)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition"
                          >
                            View Certificate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (< 768px) */}
        <div className="md:hidden space-y-3">
          {requests.map((r) => {
            const isPassed = r.status === "TEST_PASSED";
            const isSealed = r.status === "SEALED";
            const isAtLab = r.status === "AT_LAB";
            const isCompromised = r.status === "COMPROMISED";
            const isOnHold = r.status === "ON_HOLD";
            const chipStatus = isPassed
              ? "safe"
              : isCompromised || isOnHold
              ? "critical"
              : isAtLab
              ? "watch"
              : "info";

            return (
              <div
                key={r.id}
                className="bg-white p-4 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-[#1E4B7A] text-sm">{r.sample_id}</span>
                    <span className="text-gray-400 text-xs ml-2">Batch {r.batch_code}</span>
                  </div>
                  <StatusChip status={chipStatus} label={r.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-[#F5F7F4] rounded-xl">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Testing Panel</span>
                    <span className="font-bold text-[#1C2430] capitalize">{r.panel}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Moisture Test</span>
                    <span className="font-bold text-[#1C2430]">
                      {r.moisture_pct !== null && r.moisture_pct !== undefined
                        ? `${r.moisture_pct}%`
                        : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {isSealed && (
                    <button
                      onClick={() => openIntakeModal(r)}
                      className="flex-1 py-2 bg-[#1E4B7A] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>Intake Vial</span>
                    </button>
                  )}

                  <button
                    onClick={() => openReportModal(r)}
                    className="flex-1 py-2 bg-[#1E7B4C] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isPassed ? "Certificate" : "Enter Test"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sample Intake Modal */}
      {intakeItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#D5DBD3] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E4B7A]">
                  Sample Custody Receipt
                </span>
                <h3 className="text-base font-bold text-[#1C2430]">
                  Intake Sample {intakeItem.sample_id}
                </h3>
              </div>
              <button
                onClick={() => setIntakeItem(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  NTAG 424 DNA Vial Tag UID *
                </label>
                <div className="relative">
                  <Scan className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={vialTagUid}
                    onChange={(e) => setVialTagUid(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                  />
                </div>
              </div>

              {/* Tamper Loop Broken Toggle */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C2430]">
                    Vial Cap Tamper Seal Condition
                  </span>
                  <button
                    type="button"
                    onClick={() => setSealBroken(!sealBroken)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      sealBroken
                        ? "bg-[#FBE3E0] text-[#B3261E] border border-[#B3261E]"
                        : "bg-[#E1F1E8] text-[#1E7B4C] border border-[#1E7B4C]"
                    }`}
                  >
                    {sealBroken ? "BROKEN / TAMPERED" : "SEAL INTACT"}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  {sealBroken
                    ? "Warning: Marking as broken will permanently flag this sample COMPROMISED and lock batch HC-0422 ON_HOLD."
                    : "Tamper loop conductor is intact. Sample safe to transfer to lab custody."}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIntakeItem(null)}
                  className="px-4 py-2 border border-[#D5DBD3] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingIntake}
                  className="px-4 py-2 bg-[#1E4B7A] text-white rounded-xl text-xs font-bold hover:bg-[#163A5F] transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{processingIntake ? "Receiving..." : "Confirm Sample Receipt"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Entry Modal */}
      {reportItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#D5DBD3] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E7B4C]">
                  NABL Laboratory Certificate Entry
                </span>
                <h3 className="text-base font-bold text-[#1C2430]">
                  Enter Analysis Report: Batch {reportItem.batch_code}
                </h3>
              </div>
              <button
                onClick={() => setReportItem(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Moisture % */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Moisture (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="35"
                    value={moistureValue}
                    onChange={(e) => setMoistureValue(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E7B4C]"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Max 20.0%</span>
                </div>

                {/* Sucrose % */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Sucrose (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={sucroseValue}
                    onChange={(e) => setSucroseValue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E7B4C]"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Max 5.0%</span>
                </div>

                {/* HMF mg/kg */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    HMF (mg/kg)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="150"
                    value={hmfValue}
                    onChange={(e) => setHmfValue(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E7B4C]"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Max 80 mg/kg</span>
                </div>
              </div>

              {/* Lab Verdict Radio */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Laboratory Analyst Verdict *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLabVerdict("PASS")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      labVerdict === "PASS"
                        ? "bg-[#E1F1E8] border-[#1E7B4C] text-[#1E7B4C] ring-2 ring-[#1E7B4C]"
                        : "bg-white border-[#D5DBD3] text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PASS (Compliant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLabVerdict("FAIL")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      labVerdict === "FAIL"
                        ? "bg-[#FBE3E0] border-[#B3261E] text-[#B3261E] ring-2 ring-[#B3261E]"
                        : "bg-white border-[#D5DBD3] text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>FAIL (Non-Compliant)</span>
                  </button>
                </div>
              </div>

              {/* Real-time System Verification Computation Banner */}
              {(() => {
                const numMoisture = parseFloat(moistureValue) || 0;
                const sysCheck = numMoisture <= 20.0 ? "PASS" : "FAIL";
                const isMismatch = sysCheck !== labVerdict;

                return (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      isMismatch
                        ? "bg-[#FCEBD7] border-[#A94F00] text-[#A94F00]"
                        : "bg-[#E6EDF5] border-[#1E4B7A]/20 text-[#1E4B7A]"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {isMismatch ? (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        System Computation: {sysCheck} (Moisture: {numMoisture}%{" "}
                        {numMoisture <= 20.0 ? "≤ 20%" : "> 20%"})
                      </span>
                    </div>
                    {isMismatch && (
                      <p className="text-[11px] text-[#A94F00]/90">
                        Notice: Lab verdict ({labVerdict}) conflicts with system standard rule ({sysCheck})!
                        Submitting this report will place the batch ON_HOLD for compliance review.
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReportItem(null)}
                  className="px-4 py-2 border border-[#D5DBD3] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingReport}
                  className="px-5 py-2 bg-[#1E7B4C] text-white rounded-xl text-xs font-bold hover:bg-[#16633D] transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>{processingReport ? "Submitting..." : "Sign & Submit Report"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
