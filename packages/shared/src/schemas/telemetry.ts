import { z } from "zod";

export const TelemetryReadingSchema = z.object({
  hive_code: z.string().regex(/^HV-\d{3,}$/),
  node_id: z.string().min(1),
  seq: z.number().int().nonnegative(),
  sampled_at: z.string().datetime(),
  mode: z.enum(["scheduled", "burst", "event"]),
  sensors: z.object({
    hive_weight: z.object({
      kg: z.number().min(0).max(150),
      std_g: z.number().min(0),
      n: z.number().int().positive(),
      platform_temp_c: z.number().optional(),
      temp_compensated: z.boolean().optional()
    }),
    feeder_weight: z.object({ kg: z.number(), std_g: z.number() }).nullable().optional(),
    brood: z.object({ temp_c: z.number(), rh_pct: z.number() }).optional(),
    ambient: z.object({ temp_c: z.number(), rh_pct: z.number(), pressure_hpa: z.number().optional() }).optional(),
    motion: z.object({ lid_open: z.boolean().optional(), tilt_deg: z.number().optional(), moved: z.boolean().optional() }).optional()
  }),
  power: z.object({
    battery_v: z.number().min(2.0).max(5.0),
    battery_pct: z.number().min(0).max(100).optional(),
    solar_v: z.number().optional()
  }),
  quality_flags: z.array(z.string()).optional()
});

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const IngestionPayloadSchema = z.object({
  schema_version: z.literal("1.0"),
  message_id: z.string().regex(uuidRegex, { message: "Invalid UUID format" }),
  gateway_id: z.string().regex(/^GW-[a-zA-Z0-9]+$/),
  apiary_id: z.string().regex(uuidRegex, { message: "Invalid UUID format" }),
  sent_at: z.string().datetime(),

  readings: z.array(TelemetryReadingSchema).min(1).max(64),
  signature: z.object({
    alg: z.literal("ed25519"),
    key_id: z.string(),
    value: z.string() // base64
  })
});

export type TelemetryReading = z.infer<typeof TelemetryReadingSchema>;
export type IngestionPayload = z.infer<typeof IngestionPayloadSchema>;
