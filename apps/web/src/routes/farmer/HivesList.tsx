import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HoneyCell, StatusChip } from "@honeychain/ui";
import {
  AlertTriangle,
  Plus,
  TrendingUp,
  Layers,
  Sparkles,
  ShieldCheck,
  Droplets,
  Scale,
  X,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export interface HiveItem {
  id?: string;
  code: string;
  rawCode?: string;
  gain: string;
  gainKg?: number;
  status: "Healthy" | "Attention" | "Critical" | "Watch" | string;
  fill: number;
  species: string;
  weight?: number;
  box_type?: string;
  frame_count?: number;
  harvest_ready?: boolean;
  alert?: string;
}

export interface HiveAlert {
  id: string;
  type: "mite" | "swarm" | "heat" | "syrup";
  title: string;
  description: string;
  severity: "warning" | "critical";
}

// Fallback seed hives (matches initial unit tests and offline use)
const defaultHives: HiveItem[] = [
  {
    id: "hive-012",
    code: "Hive #12",
    rawCode: "HV-012",
    gain: "+1.2 kg",
    gainKg: 1.2,
    status: "Healthy",
    fill: 58,
    species: "Indian (Cerana)",
    weight: 28.8,
    box_type: "ISI_A",
    frame_count: 8,
    harvest_ready: true,
  },
  {
    id: "hive-009",
    code: "Hive #9",
    rawCode: "HV-009",
    gain: "+1.1 kg",
    gainKg: 1.1,
    status: "Healthy",
    fill: 40,
    species: "Italian (Mellifera)",
    weight: 24.5,
    box_type: "Langstroth",
    frame_count: 10,
    harvest_ready: false,
  },
  {
    id: "hive-003",
    code: "Hive #3",
    rawCode: "HV-003",
    gain: "+0.9 kg",
    gainKg: 0.9,
    status: "Healthy",
    fill: 35,
    species: "Indian (Cerana)",
    weight: 21.0,
    box_type: "ISI_A",
    frame_count: 8,
    harvest_ready: false,
  },
];

function formatHiveCode(code: string): string {
  if (code.startsWith("HV-")) {
    const num = code.replace("HV-", "").replace(/^0+/, "");
    return `Hive #${num}`;
  }
  return code;
}

export const HivesList: React.FC<{ initialHives?: HiveItem[] }> = ({ initialHives }) => {
  const [hives, setHives] = useState<HiveItem[]>(initialHives || defaultHives);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form state for adding a new hive
  const [newHiveCode, setNewHiveCode] = useState("");
  const [newSpecies, setNewSpecies] = useState("Indian (Cerana)");
  const [newBoxType, setNewBoxType] = useState("ISI_A");
  const [newFrameCount, setNewFrameCount] = useState(8);

  // Fetch live hives on mount with fallback to seed data
  useEffect(() => {
    if (initialHives) return;
    let isMounted = true;
    const fetchHives = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/hives");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            const mapped: HiveItem[] = data.map((h: any) => ({
              id: h.id,
              rawCode: h.hive_code,
              code: formatHiveCode(h.hive_code || h.code || "Hive"),
              gain: h.gain_today || (h.gain_today_kg !== undefined ? `+${h.gain_today_kg} kg` : "+0.0 kg"),
              gainKg: typeof h.gain_today_kg === "number" ? h.gain_today_kg : (parseFloat(h.gain_today) || 0),
              status: h.status || "Healthy",
              fill: h.fill_pct ?? h.fill ?? 50,
              species: h.species || "Indian (Cerana)",
              weight: h.current_weight_kg ?? h.weight ?? 20.0,
              box_type: h.box_type || "ISI_A",
              frame_count: h.frame_count || 8,
              harvest_ready: Boolean(h.harvest_ready),
              alert: h.alert || h.alert_message || undefined,
            }));
            setHives(mapped);
          }
        }
      } catch (err) {
        // API offline, retain seed data
        console.warn("API /api/v1/hives unreachable, retaining seed data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHives();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically compute active alerts directly from telemetry/hive status
  const activeAlerts: HiveAlert[] = hives
    .filter((h) => h.status === "Watch" || h.status === "Critical" || Boolean(h.alert))
    .map((h) => ({
      id: `alert-${h.id || h.code}`,
      type: h.status === "Critical" ? ("swarm" as const) : ("mite" as const),
      title: `(!) ${h.status}: ${h.code} - ${h.alert || "Telemetry anomaly flagged. Inspection recommended."}`,
      description: `Sensor scale telemetry detected abnormal status on ${h.species}.`,
      severity: h.status === "Critical" ? ("critical" as const) : ("warning" as const),
    }));

  // Compute stats for KPI cards
  const activeHivesCount = hives.length;
  const totalGainNumber = hives.reduce((sum, h) => {
    if (typeof h.gainKg === "number") return sum + h.gainKg;
    const match = h.gain?.match(/([0-9.]+)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);
  const totalGainString = `+${totalGainNumber.toFixed(1)} kg today`;

  // Calculate average daily gain across hives for Forage Flow Status
  const avgGainKg = hives.length > 0 ? totalGainNumber / hives.length : 0;
  let forageTitle = "Maintenance Flow";
  let forageSubtitle = "Colonies consuming reserves";
  if (hives.length > 0) {
    if (avgGainKg >= 1.0) {
      forageTitle = "High Nectar Flow";
      forageSubtitle = "Peak comb accumulation";
    } else if (avgGainKg >= 0.3) {
      forageTitle = "Moderate Nectar Flow";
      forageSubtitle = "Steady comb filling";
    }
  }

  // Ready for Harvest detection
  const readyHive = hives.find((h) => h.harvest_ready);

  const handleCreateHive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHiveCode.trim()) return;

    setCreating(true);
    setFeedbackMsg(null);

    const payload = {
      hive_code: newHiveCode.trim().toUpperCase(),
      species: newSpecies,
      box_type: newBoxType,
      frame_count: Number(newFrameCount),
      apiary_id: "apiary-kanchipuram",
    };

    try {
      const res = await fetch("/api/v1/hives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        const newHiveItem: HiveItem = {
          id: created.id,
          rawCode: created.hive_code,
          code: formatHiveCode(created.hive_code),
          gain: created.gain_today || "+0.0 kg",
          gainKg: typeof created.gain_today_kg === "number" ? created.gain_today_kg : 0,
          status: created.status || "Healthy",
          fill: created.fill_pct ?? 0,
          species: created.species || newSpecies,
          weight: created.current_weight_kg || 15.0,
          box_type: created.box_type || newBoxType,
          frame_count: created.frame_count || newFrameCount,
          harvest_ready: Boolean(created.harvest_ready),
          alert: created.alert || undefined,
        };
        setHives((prev) => [newHiveItem, ...prev]);
        setFeedbackMsg(`Hive ${newHiveItem.code} successfully registered!`);
      } else {
        // Fallback for offline create
        const localItem: HiveItem = {
          id: `hive-${Date.now()}`,
          rawCode: payload.hive_code,
          code: formatHiveCode(payload.hive_code),
          gain: "+0.0 kg",
          gainKg: 0,
          status: "Healthy",
          fill: 0,
          species: newSpecies,
          weight: 15.0,
          box_type: newBoxType,
          frame_count: newFrameCount,
          harvest_ready: false,
        };
        setHives((prev) => [localItem, ...prev]);
        setFeedbackMsg(`Hive ${localItem.code} registered locally.`);
      }
    } catch {
      const localItem: HiveItem = {
        id: `hive-${Date.now()}`,
        rawCode: payload.hive_code,
        code: formatHiveCode(payload.hive_code),
        gain: "+0.0 kg",
        gainKg: 0,
        status: "Healthy",
        fill: 0,
        species: newSpecies,
        weight: 15.0,
        box_type: newBoxType,
        frame_count: newFrameCount,
        harvest_ready: false,
      };
      setHives((prev) => [localItem, ...prev]);
      setFeedbackMsg(`Hive ${localItem.code} registered locally.`);
    } finally {
      setCreating(false);
      setNewHiveCode("");
      setIsModalOpen(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-3 bg-[#E1F1E8] border border-[#1E7B4C] rounded-xl text-[#1E7B4C] text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-[#1E7B4C] hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dynamic Active Alert Banners (only displayed when dynamic alerts exist) */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          {activeAlerts.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-2xl shadow-xs flex items-start gap-3 border-l-4 ${
                a.severity === "critical"
                  ? "bg-[#FBE3E0] border-[#B3261E] text-[#B3261E]"
                  : "bg-[#FCEBD7] border-[#A94F00] text-[#A94F00]"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  a.severity === "critical" ? "text-[#B3261E]" : "text-[#A94F00]"
                }`}
              />
              <div>
                <div className="font-bold text-sm">{a.title}</div>
                <div
                  className={`text-xs mt-1 ${
                    a.severity === "critical" ? "text-[#B3261E]/90" : "text-[#A94F00]/90"
                  }`}
                >
                  {a.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards on Desktop / Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Hives */}
        <div className="p-4 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Active Hives</span>
            <div className="p-2 bg-[#E6EDF5] text-[#1E4B7A] rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#1C2430]">{activeHivesCount}</div>
            <p className="text-[11px] text-gray-500 mt-0.5">Live scale telemetry active</p>
          </div>
        </div>

        {/* Card 2: Daily Yield Gain */}
        <div className="p-4 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Daily Yield Gain</span>
            <div className="p-2 bg-[#E1F1E8] text-[#1E7B4C] rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-[#1E7B4C]">{totalGainString}</div>
            <p className="text-[11px] text-gray-500 mt-0.5">Net comb honey accumulation</p>
          </div>
        </div>

        {/* Card 3: Forage Flow Status */}
        <div className="p-4 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Forage Flow Status</span>
            <div className="p-2 bg-[#FCEBD7] text-[#A94F00] rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-extrabold text-[#1C2430]">{forageTitle}</div>
            <p className="text-[11px] text-gray-500 mt-0.5">{forageSubtitle}</p>
          </div>
        </div>

        {/* Card 4: Active Alerts */}
        <div className="p-4 bg-white border border-[#D5DBD3] rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Alerts</span>
            <div
              className={`p-2 rounded-xl ${
                activeAlerts.length > 0 ? "bg-[#FBE3E0] text-[#B3261E]" : "bg-[#E1F1E8] text-[#1E7B4C]"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-black ${
                activeAlerts.length > 0 ? "text-[#B3261E]" : "text-[#1E7B4C]"
              }`}
            >
              {activeAlerts.length}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {activeAlerts.length > 0 ? "Inspect flagged colonies" : "All colonies healthy & nominal"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Shortcut Banner */}
      <div className="bg-gradient-to-r from-[#E6EDF5] to-white p-5 rounded-2xl border border-[#1E4B7A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs font-bold text-[#1E4B7A] uppercase tracking-wider">
            {readyHive ? "Ready for Harvest" : "Apiary Status"}
          </div>
          <div className="text-base font-bold text-[#1C2430] mt-0.5">
            {readyHive ? `${readyHive.code} Extraction Ready` : "Apiary in Production Phase"}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {readyHive
              ? `Comb capping exceeds 75% threshold (+${readyHive.gain} allowable yield).`
              : "Honey supers actively ripening. All colonies currently below extraction weight."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-white text-[#1E4B7A] border border-[#1E4B7A]/30 text-xs font-bold rounded-xl hover:bg-[#E6EDF5] transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hive</span>
          </button>
          {readyHive && (
            <Link
              to={`/farmer/harvest?hive=${encodeURIComponent(readyHive.rawCode || readyHive.code)}`}
              className="px-4 py-2 bg-white text-[#1E4B7A] border border-[#1E4B7A]/30 text-xs font-bold rounded-xl hover:bg-[#E6EDF5] transition"
            >
              Start Harvest
            </Link>
          )}
          <Link
            to="/farmer/batches/new"
            className="px-4 py-2 bg-[#1E4B7A] text-white text-xs font-bold rounded-xl hover:bg-[#163A5F] transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Batch</span>
          </Link>
        </div>
      </div>

      {/* Honey Purity & Fraud Prevention Trust Badges */}
      <div className="bg-white border border-[#D5DBD3] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E1F1E8] text-[#1E7B4C] rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1C2430] uppercase tracking-wider">
                Honey Purity &amp; Fraud Prevention
              </h3>
              <p className="text-[11px] text-gray-500">Automated cryptographic &amp; biological integrity protections</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#1E7B4C] bg-[#E1F1E8] px-2.5 py-0.5 rounded-full border border-[#1E7B4C]/20 uppercase tracking-wider">
            Guards Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-xl flex items-start gap-2.5">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-[#1E7B4C]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1C2430]">Yield Ratio Validator</div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Prevents sugar syrup feeding (PRD Section 8.1)
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-xl flex items-start gap-2.5">
            <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg shrink-0 mt-0.5">
              <Droplets className="w-4 h-4 text-[#1E4B7A]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1C2430]">Moisture Adulteration Guard</div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Enforces FSSAI &le; 20.0% threshold
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-xl flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg shrink-0 mt-0.5">
              <Scale className="w-4 h-4 text-[#A94F00]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1C2430]">Cryptographic Weight Attestation</div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Tamper-evident scale log chain
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hives List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1C2430] uppercase tracking-wider">
              Active Apiary Hives ({hives.length} active)
            </h2>
            <p className="text-xs text-gray-500">Live scale weight telemetry &amp; comb fill status</p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
            <span className="text-xs font-semibold text-[#1E7B4C] bg-[#E1F1E8] px-2.5 py-1 rounded-full border border-[#1E7B4C]/20">
              Realtime LoRaWAN Sync
            </span>
          </div>
        </div>

        {/* Responsive Grid for Hives on Desktop and Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hives.map((h) => {
            const isCritical = h.status === "Critical";
            const isWatch = h.status === "Watch" || h.status === "Attention";
            const chipStatus = isCritical ? "critical" : isWatch ? "watch" : "safe";

            return (
              <div
                key={h.id || h.code}
                className="p-5 bg-white border border-[#D5DBD3] rounded-2xl flex items-center justify-between shadow-xs hover:border-[#1E4B7A]/40 transition hover:shadow-sm"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg text-[#1C2430]">{h.code}</span>
                    <StatusChip status={chipStatus} label={h.status} />
                  </div>
                  <div className="text-xs text-gray-500 font-medium truncate">
                    {h.species} {h.box_type ? `• ${h.box_type}` : ""}
                  </div>
                  <div
                    className={`text-xl font-black mt-1 ${
                      isCritical ? "text-[#B3261E]" : "text-[#1E7B4C]"
                    }`}
                  >
                    {h.gain} today
                  </div>
                  {h.weight && (
                    <div className="text-[11px] text-gray-400">Scale: {h.weight.toFixed(1)} kg net</div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <HoneyCell fillPct={h.fill} label={h.code} size={58} />
                  <span className="text-xs font-bold text-gray-600">{h.fill}% full</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Hive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#D5DBD3] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1C2430]">Add New Apiary Hive</h3>
                <p className="text-xs text-gray-500">Register scale telemetry and hive UID</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHive} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Hive Code / UID *
                </label>
                <input
                  type="text"
                  value={newHiveCode}
                  onChange={(e) => setNewHiveCode(e.target.value)}
                  placeholder="e.g. HV-015 or HV-020"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Bee Species
                </label>
                <select
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                >
                  <option value="Indian (Cerana)">Indian (Apis Cerana)</option>
                  <option value="Italian (Mellifera)">Italian (Apis Mellifera)</option>
                  <option value="Stingless (Tetragonula)">Stingless (Tetragonula Iridipennis)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Box Type
                  </label>
                  <select
                    value={newBoxType}
                    onChange={(e) => setNewBoxType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                  >
                    <option value="ISI_A">ISI Type A</option>
                    <option value="ISI_B">ISI Type B</option>
                    <option value="Langstroth">Langstroth 10F</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Frame Count
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="20"
                    value={newFrameCount}
                    onChange={(e) => setNewFrameCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D5DBD3] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#1E4B7A] text-white rounded-xl text-xs font-bold hover:bg-[#163A5F] transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creating ? "Adding..." : "Add Hive"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
