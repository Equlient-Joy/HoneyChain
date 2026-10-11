import { Hono } from "hono";
import crypto from "node:crypto";

export interface HiveReading {
  timestamp: string;
  weight_kg: number;
  brood_temp_c: number;
  brood_rh_pct: number;
  ambient_temp_c: number;
  ambient_rh_pct: number;
}

export interface HiveRecord {
  id: string;
  hive_code: string;
  apiary_id?: string;
  apiary_name: string;
  species: string;
  box_type: string;
  frame_count: number;
  current_weight_kg: number;
  weight: number;
  gain_today_kg: number;
  gain_today: string;
  fill_pct: number;
  status: "Healthy" | "Watch" | "Critical" | string;
  alert: string | null;
  harvest_ready: boolean;
  allowable_yield_kg: number | null;
  created_at: string;
  readings_24h?: HiveReading[];
}

function generate24hReadings(currentWeight: number, gainToday: number, isAnomaly = false): HiveReading[] {
  const readings: HiveReading[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 3600 * 1000).toISOString();
    const progress = (24 - i) / 24;
    const weight = Number((currentWeight - gainToday * (1 - progress)).toFixed(2));
    readings.push({
      timestamp: time,
      weight_kg: weight,
      brood_temp_c: Number((34.8 + Math.sin(i * 0.5) * 0.4).toFixed(1)),
      brood_rh_pct: Number((58.0 + Math.cos(i * 0.5) * 2.0).toFixed(1)),
      ambient_temp_c: Number((28.5 + Math.sin(i * 0.4) * 4.0).toFixed(1)),
      ambient_rh_pct: Number((65.0 - Math.sin(i * 0.4) * 5.0).toFixed(1)),
    });
  }
  return readings;
}

export const SEED_HIVES: HiveRecord[] = [
  {
    id: "hive-012",
    hive_code: "HV-012",
    apiary_id: "apiary-kanchipuram",
    apiary_name: "Kanchipuram Apiary",
    species: "Indian (Cerana)",
    box_type: "ISI_A",
    frame_count: 8,
    current_weight_kg: 28.8,
    weight: 28.8,
    gain_today_kg: 1.8,
    gain_today: "+1.8 kg",
    fill_pct: 62,
    status: "Healthy",
    alert: null,
    harvest_ready: true,
    allowable_yield_kg: 14.0,
    created_at: "2026-08-01T06:00:00Z",
    readings_24h: generate24hReadings(28.8, 1.8),
  },
  {
    id: "hive-009",
    hive_code: "HV-009",
    apiary_id: "apiary-kanchipuram",
    apiary_name: "Kanchipuram Apiary",
    species: "Italian (Mellifera)",
    box_type: "Langstroth",
    frame_count: 10,
    current_weight_kg: 24.5,
    weight: 24.5,
    gain_today_kg: 1.1,
    gain_today: "+1.1 kg",
    fill_pct: 40,
    status: "Healthy",
    alert: null,
    harvest_ready: false,
    allowable_yield_kg: null,
    created_at: "2026-08-01T06:00:00Z",
    readings_24h: generate24hReadings(24.5, 1.1),
  },
  {
    id: "hive-007",
    hive_code: "HV-007",
    apiary_id: "apiary-kanchipuram",
    apiary_name: "Kanchipuram Apiary",
    species: "Indian (Cerana)",
    box_type: "ISI_A",
    frame_count: 8,
    current_weight_kg: 16.2,
    weight: 16.2,
    gain_today_kg: 0.2,
    gain_today: "+0.2 kg",
    fill_pct: 15,
    status: "Watch",
    alert: "Mite risk detected. Check sticky board today.",
    harvest_ready: false,
    allowable_yield_kg: null,
    created_at: "2026-08-01T06:00:00Z",
    readings_24h: generate24hReadings(16.2, 0.2, true),
  },
  {
    id: "hive-003",
    hive_code: "HV-003",
    apiary_id: "apiary-kanchipuram",
    apiary_name: "Kanchipuram Apiary",
    species: "Indian (Cerana)",
    box_type: "ISI_A",
    frame_count: 8,
    current_weight_kg: 21.0,
    weight: 21.0,
    gain_today_kg: 0.9,
    gain_today: "+0.9 kg",
    fill_pct: 35,
    status: "Healthy",
    alert: null,
    harvest_ready: false,
    allowable_yield_kg: null,
    created_at: "2026-08-01T06:00:00Z",
    readings_24h: generate24hReadings(21.0, 0.9),
  },
];

export let hivesStore: HiveRecord[] = [];

export function initHivesStore(): void {
  hivesStore = SEED_HIVES.map((h) => ({
    ...h,
    readings_24h: generate24hReadings(h.current_weight_kg, h.gain_today_kg),
  }));
}

// Initialize seed data
initHivesStore();

export const hivesRoutes = new Hono();

// GET /hives
hivesRoutes.get("/hives", (c) => {
  return c.json(hivesStore, 200);
});

// GET /hives/:id
hivesRoutes.get("/hives/:id", (c) => {
  const id = c.req.param("id");
  const hive = hivesStore.find(
    (h) => h.id === id || h.hive_code.toUpperCase() === id.toUpperCase()
  );

  if (!hive) {
    return c.json(
      {
        error: "HIVE_NOT_FOUND",
        message: `Hive with ID or code '${id}' not found.`,
      },
      404
    );
  }

  // Ensure readings_24h are present
  const hiveWithReadings: HiveRecord = {
    ...hive,
    readings_24h: hive.readings_24h || generate24hReadings(hive.current_weight_kg, hive.gain_today_kg),
  };

  return c.json(hiveWithReadings, 200);
});

// POST /hives
hivesRoutes.post("/hives", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "VALIDATION_ERROR", message: "Invalid JSON payload" }, 400);
  }

  const hiveCode = typeof body?.hive_code === "string" ? body.hive_code.trim() : "";
  if (!hiveCode) {
    return c.json(
      {
        error: "VALIDATION_ERROR",
        message: "hive_code is required.",
      },
      400
    );
  }

  const existing = hivesStore.find(
    (h) => h.hive_code.toUpperCase() === hiveCode.toUpperCase()
  );
  if (existing) {
    return c.json(
      {
        error: "DUPLICATE_HIVE",
        message: `Hive with code '${hiveCode}' already exists.`,
      },
      400
    );
  }

  const species = body.species || "Indian (Cerana)";
  const boxType = body.box_type || "ISI_A";
  const frameCount = Number(body.frame_count) || 8;
  const currentWeight = 15.0;

  const newHive: HiveRecord = {
    id: `hive-${crypto.randomUUID().slice(0, 8)}`,
    hive_code: hiveCode,
    apiary_id: body.apiary_id || "apiary-kanchipuram",
    apiary_name: "Kanchipuram Apiary",
    species,
    box_type: boxType,
    frame_count: frameCount,
    current_weight_kg: currentWeight,
    weight: currentWeight,
    gain_today_kg: 0.0,
    gain_today: "+0.0 kg",
    fill_pct: 0,
    status: "Healthy",
    alert: null,
    harvest_ready: false,
    allowable_yield_kg: null,
    created_at: new Date().toISOString(),
    readings_24h: generate24hReadings(currentWeight, 0),
  };

  hivesStore.push(newHive);

  return c.json(newHive, 201);
});
