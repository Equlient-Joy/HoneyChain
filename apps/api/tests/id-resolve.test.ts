import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Backend ID Resolution (Task 2)", () => {
  it("should resolve Beekeeper ID BK-001 directly to farmer profile", async () => {
    const res = await app.request("/api/v1/auth/resolve/BK-001");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.role).toBe("farmer");
    expect(json.user.name).toBe("Murugan K");
    expect(json.target_ui).toBe("/farmer/hives");
    expect(json.token).toBeDefined();
  });

  it("should resolve Aggregator ID AG-001 directly to aggregator profile", async () => {
    const res = await app.request("/api/v1/auth/resolve/AG-001");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.role).toBe("aggregator");
    expect(json.user.name).toBe("S. Meenakshi");
    expect(json.target_ui).toBe("/aggregator");
    expect(json.token).toBeDefined();
  });

  it("should return 404 for unknown user ID", async () => {
    const res = await app.request("/api/v1/auth/resolve/UNKNOWN-999");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("USER_NOT_FOUND");
  });
});
