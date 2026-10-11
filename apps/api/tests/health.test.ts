import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("API Health Endpoint", () => {
  it("should return status ok and environment info", async () => {
    const res = await app.request("/api/v1/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.version).toBe("1.0.0");
    expect(json.service).toBe("honeychain-api");
    expect(json.timestamp).toBeDefined();
  });
});
