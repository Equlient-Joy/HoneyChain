import { Hono } from "hono";

export const verificationRoutes = new Hono();

verificationRoutes.get("/public/verify", (c) => {
  const code = c.req.query("code") || "";
  const mode = c.req.query("mode") || "qr";

  if (code.startsWith("HC-0999")) {
    return c.json({
      result: "TAMPER_OPEN",
      batch_code: "HC-0999",
      failed_stage: "Jar seal broken",
      can_buy: false,
      message: "This jar cannot be verified. Do not buy. Report it."
    });
  }

  const txHash = "0x7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456";

  return c.json({
    result: mode === "nfc" ? "VERIFIED" : "RECORD_ONLY",
    batch_code: "HC-0421",
    origin_district: "Kanchipuram, TN",
    harvest_date: "2026-09-14",
    moisture_pct: 17.8,
    moisture_pass: true,
    fingerprint: "9f3a8b2c1d4e5f60c21e",
    anchored: true,
    tx_hash: txHash,
    explorer_url: `https://amoy.polygonscan.com/tx/${txHash}`,
    checks: {
      hive: "VERIFIED",
      lab_report: "VERIFIED",
      jar_sealed: "VERIFIED",
      store_shelf: "VERIFIED"
    },
    assurance_label: mode === "nfc" ? "Verified by tapping the jar." : "Record found. Tap the jar to confirm it is genuine."
  });
});
