import { Hono } from "hono";

export const packagingRoutes = new Hono();

packagingRoutes.get("/batches/:id/quota", (c) => {
  const kgNet = parseFloat(c.req.query("kg_net") || "0");
  const unitSizeG = parseFloat(c.req.query("unit_size_g") || "500");
  const loss = parseFloat(c.req.query("handling_loss") || "0.02");

  const unitSizeKg = unitSizeG / 1000;
  const maxUnits = Math.floor((kgNet * (1 - loss)) / unitSizeKg);

  return c.json({ kg_net: kgNet, unit_size_g: unitSizeG, max_units: maxUnits });
});

packagingRoutes.post("/batches/:id/units", async (c) => {
  const body = await c.req.json();
  const kgNet = body.kg_net || 0;
  const unitSizeG = body.unit_size_g || 500;
  const loss = body.handling_loss || 0.02;

  const unitSizeKg = unitSizeG / 1000;
  const maxAllowed = Math.floor((kgNet * (1 - loss)) / unitSizeKg);

  if (body.quantity_requested > maxAllowed) {
    return c.json({
      error: "QUOTA_EXCEEDED",
      message: `Requested ${body.quantity_requested} units exceeds batch quota of ${maxAllowed}.`,
      max_allowed: maxAllowed
    }, 400);
  }

  // Issue units up to requested
  const units = Array.from({ length: body.quantity_requested }).map((_, i) => ({
    serial: i + 1,
    public_code: `HC-0421-${String(i + 1).padStart(4, "0")}`,
    size_g: unitSizeG,
    status: "ISSUED"
  }));

  return c.json({
    status: "SUCCESS",
    units_issued: units.length,
    units
  }, 201);
});
