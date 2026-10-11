import { z } from "zod";

export const HarvestSubmissionSchema = z.object({
  hive_id: z.string().uuid(),
  harvested_at: z.string().datetime(),
  supers_removed: z.number().int().positive(),
  weight_before_kg: z.number().positive(),
  weight_after_kg: z.number().positive(),
  comb_tare_kg: z.number().nonnegative(),
  extracted_honey_kg: z.number().positive(),
  moisture_pct: z.number().min(10).max(30),
  witness_name: z.string().min(2),
  witness_phone_hash: z.string().min(16),
  evidence_level: z.enum(["sensor_verified", "manual"])
});

export type HarvestSubmission = z.infer<typeof HarvestSubmissionSchema>;
