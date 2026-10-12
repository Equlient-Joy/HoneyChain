import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Monolithic Static & Client Serving (Task 1)", () => {
  it("should serve health endpoint alongside root route", async () => {
    const res = await app.request("/api/v1/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.service).toBe("honeychain-api");
  });

  it("should respond with 200 or 404 handler for SPA client routing requests", async () => {
    const res = await app.request("/");
    expect([200, 404]).toContain(res.status);
  });
});
