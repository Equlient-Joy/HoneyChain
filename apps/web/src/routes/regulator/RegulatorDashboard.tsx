import React, { useState, useEffect } from "react";
import { StatusChip } from "@honeychain/ui";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  Layers,
  FileCheck,
  X,
  Flame,
  Search,
} from "lucide-react";

export interface PendingOrganization {
  org_id: string;
  name: string;
  org_name: string;
  type: string;
  district: string;
  state: string;
  madhukranti_no: string;
  registry_status: "pending" | "verified" | "rejected" | string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | string;
  submitted_at: string;
  hives_count: number;
  reason?: string;
  verified_at?: string;
}

export interface AuditBatchRecord {
  batch_id: string;
  public_code: string;
  risk_score: number;
  factors: string[];
  status: string;
  kg_net: number;
  owner_org: string;
  flagged_at: string;
  recall_reason?: string;
  recalled_at?: string;
}

const SEED_REGISTRY_QUEUE: PendingOrganization[] = [
  {
    org_id: "org-salem-nc",
    name: "Salem Non-Compliant Beekeeper",
    org_name: "Salem Non-Compliant Beekeeper",
    type: "farmer",
    district: "Salem",
    state: "Tamil Nadu",
    madhukranti_no: "MK-TN-2026-9041",
    registry_status: "pending",
    status: "PENDING_VERIFICATION",
    submitted_at: "2026-10-05T08:30:00Z",
    hives_count: 12,
  },
  {
    org_id: "org-madurai-02",
    name: "Madurai Valley Beekeepers",
    org_name: "Madurai Valley Beekeepers",
    type: "society_fpo",
    district: "Madurai",
    state: "Tamil Nadu",
    madhukranti_no: "MK-TN-2026-8812",
    registry_status: "pending",
    status: "PENDING_VERIFICATION",
    submitted_at: "2026-10-08T11:20:00Z",
    hives_count: 45,
  },
];

const SEED_AUDIT_QUEUE: AuditBatchRecord[] = [
  {
    batch_id: "batch-hc-0421",
    public_code: "HC-0421",
    risk_score: 12,
    factors: [],
    status: "TEST_PASSED",
    kg_net: 10.0,
    owner_org: "Kanchipuram Natural Apiaries FPO",
    flagged_at: "2026-09-15T10:00:00Z",
  },
  {
    batch_id: "batch-hc-0999",
    public_code: "HC-0999",
    risk_score: 88,
    factors: ["tamper_event", "hash_mismatch"],
    status: "ON_HOLD",
    kg_net: 15.0,
    owner_org: "Salem Honey Traders",
    flagged_at: "2026-10-10T14:22:00Z",
  },
];

export const RegulatorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"registry" | "audit">("registry");
  const [registryQueue, setRegistryQueue] = useState<PendingOrganization[]>(SEED_REGISTRY_QUEUE);
  const [auditQueue, setAuditQueue] = useState<AuditBatchRecord[]>(SEED_AUDIT_QUEUE);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);

  // Recall Modal state
  const [recallBatch, setRecallBatch] = useState<AuditBatchRecord | null>(null);
  const [recallReason, setRecallReason] = useState<string>("Tamper loop broken and signature mismatch detected.");
  const [processingRecall, setProcessingRecall] = useState(false);

  // Reject Registry Modal state
  const [rejectOrg, setRejectOrg] = useState<PendingOrganization | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("Incomplete National Bee Board geolocation documentation.");
  const [processingVerify, setProcessingVerify] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regRes, auditRes] = await Promise.all([
        fetch("/api/v1/regulator/registry-queue").catch(() => null),
        fetch("/api/v1/regulator/audit-queue").catch(() => null),
      ]);

      if (regRes && regRes.ok) {
        const regData = await regRes.json();
        if (Array.isArray(regData)) setRegistryQueue(regData);
      }
      if (auditRes && auditRes.ok) {
        const auditData = await auditRes.json();
        if (Array.isArray(auditData)) setAuditQueue(auditData);
      }
    } catch (e) {
      console.warn("Could not reach regulator API endpoints, using seed data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyRegistry = async (orgId: string, action: "verify" | "reject", reason?: string) => {
    setProcessingVerify(true);
    const newStatus = action === "verify" ? "VERIFIED" : "REJECTED";
    const newRegistryStatus = action === "verify" ? "verified" : "rejected";

    try {
      const res = await fetch("/api/v1/regulator/registry-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, action, reason }),
      });

      if (res.ok) {
        const data = await res.json();
        setRegistryQueue((prev) =>
          prev.map((o) =>
            o.org_id === orgId
              ? {
                  ...o,
                  status: data.status || newStatus,
                  registry_status: data.registry_status || newRegistryStatus,
                  reason: data.reason || reason,
                  verified_at: data.verified_at || new Date().toISOString(),
                }
              : o
          )
        );
        setToastMsg({
          text: `Organization ${orgId} has been ${newStatus.toLowerCase()}!`,
          type: action === "verify" ? "success" : "warning",
        });
      } else {
        // Fallback local update
        setRegistryQueue((prev) =>
          prev.map((o) =>
            o.org_id === orgId
              ? {
                  ...o,
                  status: newStatus,
                  registry_status: newRegistryStatus,
                  reason,
                  verified_at: new Date().toISOString(),
                }
              : o
          )
        );
        setToastMsg({
          text: `Organization ${orgId} updated locally to ${newStatus}.`,
          type: action === "verify" ? "success" : "warning",
        });
      }
    } catch {
      setRegistryQueue((prev) =>
        prev.map((o) =>
          o.org_id === orgId
            ? {
                ...o,
                status: newStatus,
                registry_status: newRegistryStatus,
                reason,
                verified_at: new Date().toISOString(),
              }
            : o
        )
      );
      setToastMsg({
        text: `Organization ${orgId} updated locally to ${newStatus}.`,
        type: action === "verify" ? "success" : "warning",
      });
    } finally {
      setProcessingVerify(false);
      setRejectOrg(null);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleEnforceRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recallBatch) return;

    setProcessingRecall(true);
    const payload = {
      batch_id: recallBatch.batch_id,
      reason: recallReason.trim(),
    };

    try {
      const res = await fetch("/api/v1/regulator/batch-recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setAuditQueue((prev) =>
          prev.map((b) =>
            b.batch_id === recallBatch.batch_id
              ? {
                  ...b,
                  status: "RECALLED",
                  recall_reason: data.reason || payload.reason,
                  recalled_at: data.recalled_at || new Date().toISOString(),
                }
              : b
          )
        );
        setToastMsg({
          text: `🚨 Batch ${recallBatch.public_code} formally RECALLED across supply chain and consumer verify endpoints!`,
          type: "error",
        });
      } else {
        setAuditQueue((prev) =>
          prev.map((b) =>
            b.batch_id === recallBatch.batch_id
              ? {
                  ...b,
                  status: "RECALLED",
                  recall_reason: payload.reason,
                  recalled_at: new Date().toISOString(),
                }
              : b
          )
        );
        setToastMsg({
          text: `🚨 Batch ${recallBatch.public_code} marked RECALLED locally.`,
          type: "error",
        });
      }
    } catch {
      setAuditQueue((prev) =>
        prev.map((b) =>
          b.batch_id === recallBatch.batch_id
            ? {
                ...b,
                status: "RECALLED",
                recall_reason: payload.reason,
                recalled_at: new Date().toISOString(),
              }
            : b
        )
      );
      setToastMsg({
        text: `🚨 Batch ${recallBatch.public_code} marked RECALLED locally.`,
        type: "error",
      });
    } finally {
      setProcessingRecall(false);
      setRecallBatch(null);
      setTimeout(() => setToastMsg(null), 6000);
    }
  };

  const pendingRegistryCount = registryQueue.filter(
    (o) => o.status === "PENDING_VERIFICATION" || o.registry_status === "pending"
  ).length;

  const highRiskCount = auditQueue.filter((b) => b.risk_score >= 70 && b.status !== "RECALLED").length;

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
            {toastMsg.type === "error" && <ShieldAlert className="w-4 h-4 shrink-0" />}
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
          <div className="text-xs font-bold text-[#B3261E] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>FSSAI & National Honey Board Audit Directorate</span>
          </div>
          <h2 className="text-xl font-bold text-[#1C2430] mt-0.5">
            Madhukranti & Traceability Enforcement Dashboard
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Review applicant beekeeper certification, enforce product recalls on cryptographically compromised honey batches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-[#1E4B7A] hover:bg-gray-100 rounded-xl transition border border-[#D5DBD3]"
            title="Refresh queues"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="px-3 py-1.5 bg-[#FBE3E0] text-[#B3261E] rounded-xl text-xs font-bold border border-[#B3261E]/20">
            Regulator Authority Access
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D5DBD3] gap-2">
        <button
          onClick={() => setActiveTab("registry")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "registry"
              ? "border-[#1E4B7A] text-[#1E4B7A]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Madhukranti Review Queue</span>
          {pendingRegistryCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#FCEBD7] text-[#A94F00]">
              {pendingRegistryCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "audit"
              ? "border-[#B3261E] text-[#B3261E]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Audit & Recall Queue</span>
          {highRiskCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#FBE3E0] text-[#B3261E]">
              {highRiskCount} High Risk
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Madhukranti Review Queue */}
      {activeTab === "registry" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1C2430]">
                Madhukranti Beekeeper Verification Queue
              </h3>
              <p className="text-xs text-gray-500">
                Verify National Bee Board registration numbers and approve apiaries for batch creation.
              </p>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#D5DBD3] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F4] border-b border-[#D5DBD3] text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Applicant Org</th>
                  <th className="py-3 px-4">Madhukranti No</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Hives</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registryQueue.map((org) => {
                  const isPending =
                    org.status === "PENDING_VERIFICATION" || org.registry_status === "pending";
                  const isVerified =
                    org.status === "VERIFIED" || org.registry_status === "verified";
                  const isRejected =
                    org.status === "REJECTED" || org.registry_status === "rejected";
                  const chipStatus = isVerified ? "safe" : isRejected ? "critical" : "watch";

                  return (
                    <tr key={org.org_id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-[#1C2430]">
                        <div>{org.name}</div>
                        <div className="text-[11px] text-gray-400 capitalize">{org.type}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#1E4B7A]">
                        {org.madhukranti_no}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {org.district}, {org.state}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        {org.hives_count} boxes
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusChip
                          status={chipStatus}
                          label={isPending ? "Pending Review" : isVerified ? "Verified" : "Rejected"}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVerifyRegistry(org.org_id, "verify")}
                              disabled={processingVerify}
                              className="px-3.5 py-1.5 bg-[#1E7B4C] text-white font-bold rounded-xl text-xs hover:bg-[#16633D] transition flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify & Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectOrg(org)}
                              disabled={processingVerify}
                              className="px-3 py-1.5 bg-white border border-[#B3261E] text-[#B3261E] font-bold rounded-xl text-xs hover:bg-red-50 transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">
                            {isVerified ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {registryQueue.map((org) => {
              const isPending =
                org.status === "PENDING_VERIFICATION" || org.registry_status === "pending";
              const isVerified =
                org.status === "VERIFIED" || org.registry_status === "verified";
              const isRejected =
                org.status === "REJECTED" || org.registry_status === "rejected";
              const chipStatus = isVerified ? "safe" : isRejected ? "critical" : "watch";

              return (
                <div
                  key={org.org_id}
                  className="bg-white p-4 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#1C2430] text-sm block">{org.name}</span>
                      <span className="font-mono text-xs text-[#1E4B7A]">{org.madhukranti_no}</span>
                    </div>
                    <StatusChip
                      status={chipStatus}
                      label={isPending ? "Pending" : isVerified ? "Verified" : "Rejected"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-[#F5F7F4] rounded-xl">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Location</span>
                      <span className="font-semibold text-[#1C2430]">{org.district}, TN</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Registered Hives</span>
                      <span className="font-semibold text-[#1C2430]">{org.hives_count} colonies</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleVerifyRegistry(org.org_id, "verify")}
                        className="flex-1 py-2 bg-[#1E7B4C] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify</span>
                      </button>
                      <button
                        onClick={() => setRejectOrg(org)}
                        className="flex-1 py-2 bg-white border border-[#B3261E] text-[#B3261E] font-bold rounded-xl text-xs hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Audit & Recall Queue */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1C2430]">
                Cryptographic Risk Audit & Batch Recall Enforcement
              </h3>
              <p className="text-xs text-gray-500">
                Real-time risk scoring (0-100) based on NTAG 424 tamper loop breaches, yield ratio anomalies, and Merkle mismatches.
              </p>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#D5DBD3] shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F7F4] border-b border-[#D5DBD3] text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Owner FPO / Facility</th>
                  <th className="py-3 px-4">Net Mass</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Risk Factors</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Enforcement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditQueue.map((b) => {
                  const isRecalled = b.status === "RECALLED";
                  const isHighRisk = b.risk_score >= 70;
                  const isMediumRisk = b.risk_score >= 30 && b.risk_score < 70;

                  return (
                    <tr key={b.batch_id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E4B7A] text-sm">
                        {b.public_code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {b.owner_org}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1C2430]">
                        {b.kg_net} kg
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm ${
                              isHighRisk
                                ? "text-[#B3261E]"
                                : isMediumRisk
                                ? "text-[#A94F00]"
                                : "text-[#1E7B4C]"
                            }`}
                          >
                            {b.risk_score}/100
                          </span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isHighRisk
                                  ? "bg-[#B3261E]"
                                  : isMediumRisk
                                  ? "bg-[#A94F00]"
                                  : "bg-[#1E7B4C]"
                              }`}
                              style={{ width: `${b.risk_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {b.factors.length > 0 ? (
                            b.factors.map((f) => (
                              <span
                                key={f}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FBE3E0] text-[#B3261E] border border-[#B3261E]/30"
                              >
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-[11px]">None (Nominal)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusChip
                          status={isRecalled ? "critical" : isHighRisk ? "critical" : "safe"}
                          label={b.status}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isRecalled ? (
                          <button
                            onClick={() => setRecallBatch(b)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto shadow-xs ${
                              isHighRisk
                                ? "bg-[#B3261E] text-white hover:bg-[#921f19]"
                                : "bg-white border border-[#B3261E] text-[#B3261E] hover:bg-red-50"
                            }`}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Enforce Batch Recall</span>
                          </button>
                        ) : (
                          <span className="text-[#B3261E] text-xs font-bold block">
                            RECALL ENFORCED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {auditQueue.map((b) => {
              const isRecalled = b.status === "RECALLED";
              const isHighRisk = b.risk_score >= 70;

              return (
                <div
                  key={b.batch_id}
                  className="bg-white p-4 rounded-2xl border border-[#D5DBD3] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-[#1E4B7A] text-base">
                        {b.public_code}
                      </span>
                      <span className="text-gray-500 text-xs block">{b.owner_org}</span>
                    </div>
                    <StatusChip
                      status={isRecalled ? "critical" : isHighRisk ? "critical" : "safe"}
                      label={b.status}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-[#F5F7F4] rounded-xl text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Net Mass</span>
                      <span className="font-bold text-[#1C2430]">{b.kg_net} kg</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[10px] uppercase">Risk Score</span>
                      <span
                        className={`font-black text-sm ${
                          isHighRisk ? "text-[#B3261E]" : "text-[#1E7B4C]"
                        }`}
                      >
                        {b.risk_score}/100
                      </span>
                    </div>
                  </div>

                  {b.factors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {b.factors.map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FBE3E0] text-[#B3261E]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isRecalled ? (
                    <button
                      onClick={() => setRecallBatch(b)}
                      className="w-full py-2.5 bg-[#B3261E] text-white font-bold rounded-xl text-xs hover:bg-[#921f19] transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Enforce Batch Recall</span>
                    </button>
                  ) : (
                    <div className="p-2 bg-red-50 text-[#B3261E] text-xs font-bold text-center rounded-xl border border-red-200">
                      RECALL ENFORCED
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enforce Batch Recall Modal */}
      {recallBatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#D5DBD3] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3261E]">
                  Regulatory Enforcement Action
                </span>
                <h3 className="text-base font-bold text-[#1C2430]">
                  Enforce Recall: Batch {recallBatch.public_code}
                </h3>
              </div>
              <button
                onClick={() => setRecallBatch(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-[#FBE3E0]/70 rounded-xl border border-[#B3261E]/30 space-y-1">
              <div className="text-xs font-bold text-[#B3261E] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Critical Tamper & Risk Alert (Score: {recallBatch.risk_score}/100)</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Issuing this regulatory recall locks all associated retail jar NFC tags and broadcasts a public seizure alert to consumers verifying jars via the portal.
              </p>
            </div>

            <form onSubmit={handleEnforceRecall} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Regulatory Recall Reason *
                </label>
                <textarea
                  rows={3}
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#B3261E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecallBatch(null)}
                  className="px-4 py-2 border border-[#D5DBD3] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingRecall}
                  className="px-5 py-2 bg-[#B3261E] text-white rounded-xl text-xs font-bold hover:bg-[#921f19] transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{processingRecall ? "Enforcing..." : "Confirm & Execute Recall"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Registry Modal */}
      {rejectOrg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#D5DBD3] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1C2430]">
                  Reject Application: {rejectOrg.name}
                </h3>
                <p className="text-xs text-gray-500">Specify reason for National Bee Board records</p>
              </div>
              <button
                onClick={() => setRejectOrg(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#B3261E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectOrg(null)}
                  className="px-4 py-2 border border-[#D5DBD3] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyRegistry(rejectOrg.org_id, "reject", rejectReason)}
                  disabled={processingVerify}
                  className="px-4 py-2 bg-[#B3261E] text-white rounded-xl text-xs font-bold hover:bg-[#921f19] transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
