import { Hono } from "hono";

export const labRoutes = new Hono();

labRoutes.post("/lab-requests/:id/receive", async (c) => {
  const body = await c.req.json();
  if (body.seal_broken) {
    return c.json({
      status: "RECEIVED",
      sample_status: "COMPROMISED",
      batch_status: "ON_HOLD",
      message: "Sample tamper seal detected as broken on receipt."
    }, 200);
  }

  return c.json({
    status: "RECEIVED",
    sample_status: "AT_LAB",
    batch_status: "AT_LAB"
  }, 200);
});

labRoutes.post("/lab-requests/:id/report", async (c) => {
  const body = await c.req.json();
  const moisture = body.values.moisture_pct;

  // Recompute system verdict against FSSAI honey standard threshold (<= 20.0%)
  const systemVerdict = moisture <= 20.0 ? "PASS" : "FAIL";
  const verdictMismatch = systemVerdict !== body.lab_verdict;

  return c.json({
    report_id: crypto.randomUUID(),
    lab_verdict: body.lab_verdict,
    system_verdict: systemVerdict,
    needs_review: verdictMismatch,
    status: verdictMismatch ? "ON_HOLD" : systemVerdict === "PASS" ? "TEST_PASSED" : "TEST_FAILED"
  }, 200);
});
