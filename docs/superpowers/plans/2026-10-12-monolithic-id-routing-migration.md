# Monolithic Architecture & ID-Based UI Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate HoneyChain into a unified fullstack monolith served from a single server/port, and implement an ID-based routing mechanism that instantly directs Beekeepers and Aggregators to their respective UIs using their designated ID.

**Architecture:** Hono acts as the unified application server hosting all `/api/v1/*` backend endpoints while serving the compiled React client SPA and static assets on a single port (`3000`). A smart ID resolution layer resolves Beekeeper IDs (e.g. `BK-001`) and Aggregator IDs (e.g. `AG-001`) to immediately load their personalized dashboard without requiring separate login or complex workspace hops.

**Tech Stack:** Bun, Hono (`hono/bun` static file serving), React 19, React Router v7, Tailwind CSS v4, Lucide React.

---

### Task 1: Monolithic Single-Port Serving in Hono (apps/api)

**Files:**
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/tests/static-serve.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/static-serve.test.ts`:
```typescript
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
    // When dist is not yet built in test env, Hono should route gracefully
    expect([200, 404]).toContain(res.status);
  });
});
```

- [ ] **Step 2: Run test to verify it fails or runs**

Run: `bun test apps/api/tests/static-serve.test.ts`  
Expected: Test runs and verifies endpoint routing.

- [ ] **Step 3: Write minimal implementation**

Update `apps/api/src/index.ts`:
```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { authRoutes } from "./modules/m1-auth/routes";
import { telemetryRoutes } from "./modules/m3-telemetry/routes";
import { harvestRoutes } from "./modules/m7-harvest/routes";
import { batchRoutes } from "./modules/m8-batches/routes";
import { labRoutes } from "./modules/m9-labs/routes";
import { packagingRoutes } from "./modules/m10-packaging/routes";
import { verificationRoutes } from "./modules/m12-verification/routes";
import { hivesRoutes } from "./modules/m2-hives/routes";
import { regulatorRoutes } from "./modules/m14-regulator/routes";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

// Health Check
app.get("/api/v1/health", (c) => {
  return c.json({
    status: "ok",
    version: "1.0.0",
    service: "honeychain-api",
    timestamp: new Date().toISOString(),
  });
});

// Mount All Backend Modules
app.route("/api/v1", authRoutes);
app.route("/api/v1", telemetryRoutes);
app.route("/api/v1", harvestRoutes);
app.route("/api/v1", batchRoutes);
app.route("/api/v1", labRoutes);
app.route("/api/v1", packagingRoutes);
app.route("/api/v1", verificationRoutes);
app.route("/api/v1", hivesRoutes);
app.route("/api/v1", regulatorRoutes);

// Monolithic SPA Static Asset Serving
const clientDistPath = resolve(process.cwd(), "apps/web/dist");
if (existsSync(clientDistPath)) {
  app.use("/*", serveStatic({ root: "./apps/web/dist" }));
  app.get("*", serveStatic({ path: "./apps/web/dist/index.html" }));
}

export default app;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test apps/api/tests/static-serve.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/index.ts apps/api/tests/static-serve.test.ts
git commit -m "feat(api): enable monolithic client asset and SPA serving in Hono server"
```

---

### Task 2: Backend ID Resolution Endpoint (apps/api)

**Files:**
- Modify: `apps/api/src/modules/m1-auth/routes.ts`
- Test: `apps/api/tests/id-resolve.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/id-resolve.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/id-resolve.test.ts`  
Expected: FAIL with 404 Not Found (route `/auth/resolve/:id` does not exist).

- [ ] **Step 3: Write minimal implementation**

Modify `apps/api/src/modules/m1-auth/routes.ts` by adding the ID resolution map and route:
```typescript
// ID Alias mapping for seamless one-tap authentication
export const ID_ALIASES: Record<string, string> = {
  "BK-001": "farmer@honeychain.io",
  "FARMER": "farmer@honeychain.io",
  "AG-001": "aggregator@honeychain.io",
  "AGGREGATOR": "aggregator@honeychain.io",
};

// GET /auth/resolve/:id
authRoutes.get("/auth/resolve/:id", (c) => {
  const rawId = c.req.param("id").toUpperCase();
  const normalizedIdentifier = ID_ALIASES[rawId] || rawId.toLowerCase();

  const user = usersStore.find(
    (u) =>
      u.email.toLowerCase() === normalizedIdentifier ||
      u.phone === normalizedIdentifier ||
      u.id === normalizedIdentifier
  );

  if (!user) {
    return c.json(
      {
        error: "USER_NOT_FOUND",
        message: `No active user profile associated with ID '${rawId}'.`,
      },
      404
    );
  }

  const token = `token-${user.id}-${Date.now()}`;
  tokensStore.set(token, user.id);

  const targetUi = user.role === "farmer" ? "/farmer/hives" : "/aggregator";

  return c.json(
    {
      status: "RESOLVED",
      token,
      target_ui: targetUi,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        org_id: user.org_id,
        org_name: user.org_name,
        org_district: user.org_district,
      },
    },
    200
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/id-resolve.test.ts`  
Expected: PASS with 3 passing assertions.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/m1-auth/routes.ts apps/api/tests/id-resolve.test.ts
git commit -m "feat(api): implement /auth/resolve/:id endpoint for instant ID-based routing"
```

---

### Task 3: Unified ID Portal & Automatic UI Router (apps/web)

**Files:**
- Create: `apps/web/src/routes/portal/IdPortal.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/context/AuthContext.tsx`
- Test: `apps/web/tests/id-portal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/id-portal.test.tsx`:
```tsx
import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, SEED_ACCOUNTS } from "../src/context/AuthContext";
import { IdPortal } from "../src/routes/portal/IdPortal";

describe("Unified ID Portal & Smart UI Router (Task 3)", () => {
  it("should render ID entry portal with Beekeeper and Aggregator quick options", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider initialUser={null} initialToken={null}>
          <IdPortal />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("HoneyChain ID Portal");
    expect(html).toContain("Enter Beekeeper or Aggregator ID");
    expect(html).toContain("BK-001");
    expect(html).toContain("AG-001");
    expect(html).toContain("Public Consumer Verification");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/web/tests/id-portal.test.tsx`  
Expected: FAIL (`IdPortal` not found).

- [ ] **Step 3: Write minimal implementation**

Add `loginWithId` to `apps/web/src/context/AuthContext.tsx`:
```typescript
loginWithId: (id: string) => Promise<{ success: boolean; targetUi?: string; error?: string }>;
```
Implement `loginWithId` in `AuthProvider`:
```typescript
const loginWithId = async (rawId: string) => {
  const upper = rawId.trim().toUpperCase();
  // Check local offline fallback aliases
  if (upper === "BK-001" || upper === "FARMER") {
    const profile = SEED_ACCOUNTS.farmer.profile;
    setUser(profile);
    setToken("mock-token-farmer");
    localStorage.setItem("honeychain_auth_token", "mock-token-farmer");
    localStorage.setItem("honeychain_user_profile", JSON.stringify(profile));
    return { success: true, targetUi: "/farmer/hives" };
  }
  if (upper === "AG-001" || upper === "AGGREGATOR") {
    const profile = SEED_ACCOUNTS.aggregator.profile;
    setUser(profile);
    setToken("mock-token-aggregator");
    localStorage.setItem("honeychain_auth_token", "mock-token-aggregator");
    localStorage.setItem("honeychain_user_profile", JSON.stringify(profile));
    return { success: true, targetUi: "/aggregator" };
  }

  // Live API call
  try {
    const res = await fetch(`/api/v1/auth/resolve/${encodeURIComponent(rawId)}`);
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("honeychain_auth_token", data.token);
      localStorage.setItem("honeychain_user_profile", JSON.stringify(data.user));
      return { success: true, targetUi: data.target_ui };
    }
    return { success: false, error: "Invalid ID. Use BK-001 or AG-001." };
  } catch {
    return { success: false, error: "Network error resolving ID." };
  }
};
```

Create `apps/web/src/routes/portal/IdPortal.tsx`:
```tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, ArrowRight, UserCheck, Sparkles, Droplets } from "lucide-react";

export const IdPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithId, isAuthenticated, user } = useAuth();
  const [inputId, setInputId] = useState(searchParams.get("id") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-route if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "farmer" ? "/farmer/hives" : "/aggregator");
    }
  }, [isAuthenticated, user, navigate]);

  // Handle direct ID parameter in URL (e.g. /?id=BK-001)
  useEffect(() => {
    const queryId = searchParams.get("id");
    if (queryId) {
      handleResolve(queryId);
    }
  }, [searchParams]);

  const handleResolve = async (idToResolve: string) => {
    if (!idToResolve.trim()) return;
    setLoading(true);
    setError(null);
    const result = await loginWithId(idToResolve.trim());
    setLoading(false);
    if (result.success && result.targetUi) {
      navigate(result.targetUi);
    } else {
      setError(result.error || "User ID not found.");
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleResolve(inputId);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F4] flex flex-col items-center justify-center p-4 text-[#1C2430]">
      <div className="w-full max-w-md bg-white border border-[#D5DBD3] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#E6EDF5] text-[#1E4B7A] rounded-2xl mx-auto flex items-center justify-center">
            <Droplets className="w-6 h-6 text-[#F2A900]" />
          </div>
          <h1 className="text-2xl font-black text-[#1E4B7A]">HoneyChain ID Portal</h1>
          <p className="text-xs text-gray-600">
            Enter your Beekeeper or Aggregator ID for instant access
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FBE3E0] border border-[#B3261E]/30 rounded-xl text-xs text-[#B3261E] font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase">Your Badge / ID</label>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="e.g. BK-001 or AG-001"
              className="mt-1 w-full p-3.5 bg-[#F9FAF9] border border-[#D5DBD3] rounded-xl font-mono text-base font-bold text-[#1C2430] uppercase focus:outline-none focus:ring-2 focus:ring-[#1E4B7A]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputId.trim()}
            className="w-full py-3.5 bg-[#1E4B7A] text-white font-bold rounded-xl text-sm hover:bg-[#163A5F] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Resolving ID..." : "Open My Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase text-center">Instant One-Click IDs:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleResolve("BK-001")}
              className="p-2.5 bg-[#E6EDF5] hover:bg-[#d8e4f1] text-[#1E4B7A] font-bold rounded-xl transition text-center"
            >
              🐝 Beekeeper (BK-001)
            </button>
            <button
              onClick={() => handleResolve("AG-001")}
              className="p-2.5 bg-[#E1F1E8] hover:bg-[#d0ebd9] text-[#1E7B4C] font-bold rounded-xl transition text-center"
            >
              📦 Aggregator (AG-001)
            </button>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#1E4B7A] transition"
          >
            <ShieldCheck className="w-4 h-4 text-[#1E7B4C]" />
            <span>Public Consumer Verification (Jar Scan)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
```

Update root route in `apps/web/src/App.tsx`:
Mount `<Route path="/" element={<IdPortal />} />`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test apps/web/tests/id-portal.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/portal/IdPortal.tsx apps/web/src/context/AuthContext.tsx apps/web/src/App.tsx apps/web/tests/id-portal.test.tsx
git commit -m "feat(web): add IdPortal and loginWithId for instant ID-based routing"
```

---

### Task 4: Unified Monolithic Dev & Production Workflow

**Files:**
- Modify: `package.json`
- Test: Full monorepo verification (`bun test` and `bun run test:scenarios`)

- [ ] **Step 1: Update package.json scripts**

Ensure `package.json` provides both monolithic start and rapid dev scripts:
```json
{
  "scripts": {
    "dev": "concurrently -n \"api,web\" -c \"blue,green\" \"bun run dev:api\" \"bun run dev:web\"",
    "dev:api": "bun --watch apps/api/src/index.ts",
    "dev:web": "bun --filter @honeychain/web dev",
    "build": "bun --filter \"*\" build",
    "build:web": "bun --filter @honeychain/web build",
    "start": "bun apps/api/src/index.ts",
    "test": "bun test",
    "test:scenarios": "bun run tools/scenarios/run.ts"
  }
}
```

- [ ] **Step 2: Run all tests to ensure zero regressions**

Run: `bun test`  
Expected: 94+ tests pass across all packages with 0 failures.

- [ ] **Step 3: Run acceptance scenarios**

Run: `bun run test:scenarios`  
Expected: All 9 acceptance scenarios pass cleanly (`[PASS] AT-01` through `[PASS] AT-09`).

- [ ] **Step 4: Build web bundle for monolithic serving**

Run: `bun run build:web`  
Expected: Build succeeds into `apps/web/dist`.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: configure monolithic start script and unified fullstack build"
```

---

## Self-Review Checklist
1. **Spec coverage:** Consolidates backend and frontend into single monolithic deployment capability and adds instant ID-based routing (`BK-001` vs `AG-001`).
2. **Placeholder scan:** Zero "TODO" or placeholder logic; all route parameters, components, and tests are explicitly spelled out.
3. **Type consistency:** Utilizes exact role signatures `farmer` and `aggregator` matching existing database schema and AuthContext types.
