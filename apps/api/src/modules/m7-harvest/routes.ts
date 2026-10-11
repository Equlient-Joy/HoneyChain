import { Hono } from "hono";
import { checkYieldAgreement, checkWeightAgreement } from "@honeychain/shared";

export const harvestRoutes = new Hono();

harvestRoutes.post("/harvests", async (c) => {
  const body = await c.req.json();
  const removedMass = body.weight_before_kg - body.weight_after_kg;
  const allowableYield = Math.max(0, removedMass - body.comb_tare_kg);

  const yieldCheck = checkYieldAgreement(body.extracted_honey_kg, allowableYield);
  const weightAgreement = checkWeightAgreement(body.extracted_honey_kg, removedMass, body.comb_tare_kg);

  if (yieldCheck === "BLOCK") {
    return c.json({
      error: "YIELD_CHECK_BLOCKED",
      message: "Declared honey weight exceeds allowable yield by more than 10%."
    }, 400);
  }

  const harvestId = crypto.randomUUID();
  const lotId = crypto.randomUUID();

  return c.json({
    status: "CREATED",
    harvest_record_id: harvestId,
    lot_id: lotId,
    yield_check: yieldCheck,
    weight_agreement: weightAgreement,
    evidence_level: body.evidence_level
  }, 201);
});
