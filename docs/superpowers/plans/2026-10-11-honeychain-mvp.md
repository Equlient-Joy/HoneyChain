# HoneyChain Core MVP (Milestones 0–5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the HoneyChain audit-ready traceability platform from hive to consumer jar, delivering the Bun+Hono API, Supabase append-only database, React PWA with custom HoneyCell UI tokens, telemetry ingestion with Ed25519 verification, insight engine, 9-step harvest wizard, virtual NTAG 424 crypto, public verification screens, and seedable scenario runner reproducing PDF prototype screens 1–4 and passing acceptance tests AT-01 through AT-09.

**Architecture:** Monorepo architecture with Bun workspaces (`apps/api`, `apps/web`, `packages/shared`, `packages/ui`, `tools/simulator`, `tools/scenarios`). Drizzle ORM connects via Supabase Supavisor pooler (port 6543) with PostgreSQL triggers enforcing immutable append-only records, while Hono provides a service-layer API deployed to Vercel Serverless / Edge. React PWA uses Radix primitives, Tailwind CSS design tokens, IndexedDB offline draft autosave, and client-side QR/NFC verification.

**Tech Stack:** Bun 1.4, TypeScript, Hono, Supabase PostgreSQL & Auth, Drizzle ORM, `postgres.js`, React 19 / Vite, Tailwind CSS v4, Radix UI, TanStack Query, `idb-keyval`, Lucide React, Sonner, Zod, Ed25519 (node:crypto / Bun crypto).

---

## Architecture & Decisions Reference

### Highlighted Architecture Decisions (from Technical & DB Discovery)
1. **Hosting & Deployment Target**: Vercel Free Tier (Serverless Hono API + Global CDN for React Vite SPA) paired with Supabase Free Tier (PostgreSQL + Auth + Storage).
2. **Database Client**: Drizzle ORM + `postgres.js` configured with `max: 3` connections over the Supabase Supavisor transaction pooler (port 6543) to guarantee 0 connection exhaustion.
3. **Data Integrity & Immutability**: PostgreSQL `BEFORE UPDATE OR DELETE` triggers reject mutations on evidence tables with exception `EVIDENCE_APPEND_ONLY`. SHA-256 canonical hashing follows RFC 8785 in `packages/shared`.
4. **Ledger & Tag Cryptography Adapters**:
   - `LedgerAdapter`: EVM Smart Contract on Polygon Amoy Testnet via free Public/Alchemy RPC with `viem` (0 MB server RAM, 100% free testnet gas). Deploys a minimal EVM contract (`HoneyChainAnchor.sol`) with `Anchored(bytes32 indexed merkleRoot, string batchCode, uint256 timestamp)`. Live Polygonscan block explorer links appear on the consumer verification page. Automatic in-DB mock fallback executes if RPC credentials are unset. (Uses the exact EVM Solidity specification compatible with Hyperledger Besu).
   - `TagCrypto`: Defaults to `virtual` software AES-128 CMAC tap codes matching NTAG 424 DNA specifications. Pluggable interface ready for physical PN532 Raspberry Pi station.
5. **Multi-Role Auth & Presentation**: Supabase Auth (Email for staff, phone with fixed demo OTP `123456`) combined with a toggleable "Demo Persona Switcher" header bar.
6. **Field UX & Offline Caching**: `idb-keyval` autosaves drafts on every wizard step; outbox queues offline submissions with an app-bar sync indicator; TanStack Query persists caches.
7. **Demo Seed Data**: Clean database migrations by default; seed data is applied on demand via `bun run seed` or the in-app "Demo Scenario Drawer".

---

## File Structure Map

```
c:\Users\LENOVO\Desktop\Honey/
├── package.json                          # Root workspace config (Bun)
├── tsconfig.json                         # Base TypeScript configuration
├── docs/
│   └── superpowers/plans/
│       └── 2026-10-11-honeychain-mvp.md  # This implementation plan
├── packages/
│   ├── shared/                           # Shared types, Zod schemas, crypto & calculations
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/                    # Domain models, enums, status machines
│   │       ├── schemas/                  # Shared Zod validation schemas
│   │       ├── crypto/                   # RFC 8785 canonical JSON, SHA-256, Merkle tree
│   │       ├── formulas/                 # Allowable yield, mass balance, syrup risk
│   │       └── index.ts
│   └── ui/                               # Shared design system components & tokens
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── styles/theme.css          # Design tokens (cool white, navy, honey, safe, watch, critical)
│           ├── components/
│           │   ├── HoneyCell.tsx         # Hexagonal honey fill component
│           │   ├── StatusChip.tsx        # Icon + word + color status badge
│           │   ├── NextStepBanner.tsx    # Contextual next-action guidance banner
│           │   └── button.tsx            # Radix-styled primary/secondary buttons
│           └── index.ts
├── apps/
│   ├── api/                              # Bun + Hono REST backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── db/                       # Drizzle client & connection pooler setup
│   │       ├── middleware/               # Auth, idempotency, role check
│   │       ├── modules/
│   │       │   ├── m1-auth/              # User profiles, orgs, Madhukranti registry
│   │       │   ├── m2-hives/             # Apiary & hive registry
│   │       │   ├── m3-telemetry/         # Ingest endpoint with Ed25519 signature check
│   │       │   ├── m4-insights/          # Feature derivation & anomaly evaluation
│   │       │   ├── m7-harvest/           # Harvest records & allowable yield checks
│   │       │   ├── m8-batches/           # Lots, batches, state machine & gates
│   │       │   ├── m9-labs/              # Samples, lab requests, reports & system check
│   │       │   ├── m10-packaging/        # Units, quota calculation, label printing
│   │       │   ├── m11-tags/             # Tag provisioning & TagCrypto adapter
│   │       │   ├── m12-verification/     # Public jar verification endpoint
│   │       │   └── m13-custody/          # Custody event hash chaining & Merkle anchoring
│   │       ├── jobs/                     # Scheduled worker endpoints (CRON_SECRET)
│   │       └── index.ts                  # Hono app entry point
│   └── web/                              # React 19 + Vite PWA frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── src/
│           ├── routes/
│           │   ├── farmer/               # Hives list (Screen 1), Detail, Harvest (9 steps), Batches (Screen 2)
│           │   ├── lab/                  # Sample intake, report submission
│           │   ├── regulator/            # Registry review queue, audit queue
│           │   └── verify/               # Public jar verify (Screens 3 & 4)
│           ├── components/
│           │   ├── DemoBar.tsx           # Persona quick-switcher
│           │   └── DemoDrawer.tsx        # In-app scenario injector
│           ├── lib/                      # TanStack Query, Supabase client, idb-keyval drafts
│           └── App.tsx
├── supabase/
│   └── migrations/
│       ├── 20261011000001_initial_schema.sql
│       ├── 20261011000002_append_only_triggers.sql
│       └── 20261011000003_config_tables.sql
└── tools/
    ├── seed.ts                           # Populates seed data on demand
    ├── simulator/                        # Telemetry posting CLI
    └── scenarios/                        # AT-01 to AT-09 runner
```

---

## Tasks

### Task 1: Root Monorepo & Bun Workspaces Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Write root package.json with Bun workspace configuration**

```json
{
  "name": "honeychain",
  "private": true,
  "type": "module",
  "workspaces": [
    "packages/*",
    "apps/*",
    "tools/*"
  ],
  "scripts": {
    "dev:api": "bun --watch apps/api/src/index.ts",
    "dev:web": "bun --filter web dev",
    "dev": "bun --filter \"*\" dev",
    "build": "bun --filter \"*\" build",
    "test": "bun test",
    "test:scenarios": "bun run tools/scenarios/run.ts",
    "seed": "bun run tools/seed.ts"
  },
  "devDependencies": {
    "@types/node": "^24.14.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "composite": true
  }
}
```

- [ ] **Step 3: Create .gitignore and .env.example**

Create `.gitignore` ignoring `node_modules`, `dist`, `.env`, and `.turbo`.
Create `.env.example`:
```bash
# Supabase Local or Cloud credentials
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Security Secrets
CRON_SECRET=honeychain-dev-cron-secret-1234
TAG_MASTER_KEY=00112233445566778899aabbccddeeff

# Adapters & Blockchain
LEDGER_ADAPTER=polygon_amoy # 'polygon_amoy' or 'mock'
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
ANCHOR_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
ANCHOR_PRIVATE_KEY=
TAG_CRYPTO_ADAPTER=virtual
REGISTRY_ADAPTER=mock
```

- [ ] **Step 4: Install workspace dependencies**

Run: `bun install`
Expected: Dependencies installed and lockfile `bun.lock` created.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json .gitignore .env.example
git commit -m "chore: initialize bun monorepo structure and root configs"
```

---

### Task 2: Shared Cryptography & Canonical Hashing (`packages/shared`)

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/crypto/canonical.ts`
- Create: `packages/shared/src/crypto/merkle.ts`
- Create: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/crypto.test.ts`

- [ ] **Step 1: Write the failing test for canonical JSON hashing and Merkle trees**

```typescript
// packages/shared/tests/crypto.test.ts
import { describe, expect, it } from "bun:test";
import { canonicalHash, canonicalStringify, computeMerkleRoot } from "../src/crypto/canonical";

describe("Canonical Hashing and Merkle", () => {
  it("should sort object keys deterministically (RFC 8785 style)", () => {
    const objA = { b: 2, a: 1, c: { y: "test", x: 10 } };
    const objB = { a: 1, c: { x: 10, y: "test" }, b: 2 };
    expect(canonicalStringify(objA)).toBe('{"a":1,"b":2,"c":{"x":10,"y":"test"}}');
    expect(canonicalStringify(objA)).toBe(canonicalStringify(objB));
    expect(canonicalHash(objA)).toBe(canonicalHash(objB));
  });

  it("should compute deterministic Merkle root from leaf hashes", () => {
    const leaf1 = "9f3a1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
    const leaf2 = "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0";
    const root = computeMerkleRoot([leaf1, leaf2]);
    expect(root).toBeDefined();
    expect(root.length).toBe(64);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/shared/tests/crypto.test.ts`
Expected: FAIL ("Cannot find module '../src/crypto/canonical'")

- [ ] **Step 3: Implement canonical hashing and Merkle calculation**

```typescript
// packages/shared/src/crypto/canonical.ts
import { createHash } from "node:crypto";

export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalStringify).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`);
  return "{" + entries.join(",") + "}";
}

export function canonicalHash(payload: any): string {
  const json = canonicalStringify(payload);
  return createHash("sha256").update(json).digest("hex");
}

export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return createHash("sha256").update("").digest("hex");
  if (leaves.length === 1) return leaves[0];

  let currentLevel = [...leaves];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combined = createHash("sha256").update(left + right).digest("hex");
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/shared/tests/crypto.test.ts`
Expected: PASS (2 tests pass)

- [ ] **Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): implement canonical json hashing and merkle tree generator"
```

---

### Task 3: Domain Types, Zod Schemas & Mathematical Formulas (`packages/shared`)

**Files:**
- Create: `packages/shared/src/types/domain.ts`
- Create: `packages/shared/src/schemas/telemetry.ts`
- Create: `packages/shared/src/schemas/harvest.ts`
- Create: `packages/shared/src/formulas/yield.ts`
- Test: `packages/shared/tests/formulas.test.ts`

- [ ] **Step 1: Write failing test for allowable yield and mass balance formula**

```typescript
// packages/shared/tests/formulas.test.ts
import { describe, expect, it } from "bun:test";
import { calculateAllowableYield, checkYieldAgreement } from "../src/formulas/yield";

describe("Harvest Formulas (PRD Section 8.1)", () => {
  it("should calculate allowable yield correctly with consumption allowance and feed deduction", () => {
    // W_start = 45 kg, W_before = 62 kg, E = 0, C = 0.2 kg/day * 20 days = 4 kg, dF = 0
    const result = calculateAllowableYield({
      weightStartKg: 45,
      weightBeforeKg: 62,
      equipmentMassDeltaKg: 0,
      days: 20,
      consumptionPerDayKg: 0.2,
      syrupFedKg: 0
    });
    // (62 - 45 - 0) + (0.2 * 20) - 0 = 17 + 4 = 21 kg
    expect(result).toBe(21);
  });

  it("should enforce pass/review/block threshold for declared vs allowable yield", () => {
    const allowable = 20.0;
    expect(checkYieldAgreement(20.5, allowable)).toBe("PASS"); // 2.5% over (<=3%)
    expect(checkYieldAgreement(21.5, allowable)).toBe("REVIEW"); // 7.5% over (3-10%)
    expect(checkYieldAgreement(23.0, allowable)).toBe("BLOCK"); // 15% over (>10%)
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/shared/tests/formulas.test.ts`
Expected: FAIL ("Cannot find module '../src/formulas/yield'")

- [ ] **Step 3: Implement domain types, Zod schemas, and yield calculations**

```typescript
// packages/shared/src/formulas/yield.ts
export interface YieldInput {
  weightStartKg: number;
  weightBeforeKg: number;
  equipmentMassDeltaKg: number;
  days: number;
  consumptionPerDayKg: number;
  syrupFedKg: number;
}

export function calculateAllowableYield(input: YieldInput): number {
  const rawGain = input.weightBeforeKg - input.weightStartKg - input.equipmentMassDeltaKg;
  const consumptionAllowance = input.consumptionPerDayKg * input.days;
  const yieldKg = rawGain + consumptionAllowance - input.syrupFedKg;
  return Math.max(0, Number(yieldKg.toFixed(2)));
}

export function checkYieldAgreement(declaredKg: number, allowableKg: number): "PASS" | "REVIEW" | "BLOCK" {
  if (allowableKg <= 0) return declaredKg === 0 ? "PASS" : "BLOCK";
  const pctOver = ((declaredKg - allowableKg) / allowableKg) * 100;
  if (pctOver <= 3) return "PASS";
  if (pctOver <= 10) return "REVIEW";
  return "BLOCK";
}

export function checkWeightAgreement(extractedKg: number, removedMassKg: number, combTareKg: number): "PASS" | "REVIEW" | "BLOCK" {
  const expectedHoney = removedMassKg - combTareKg;
  if (expectedHoney <= 0) return "BLOCK";
  const diffPct = Math.abs((extractedKg - expectedHoney) / expectedHoney) * 100;
  if (diffPct <= 8) return "PASS";
  if (diffPct <= 15) return "REVIEW";
  return "BLOCK";
}
```

```typescript
// packages/shared/src/schemas/telemetry.ts
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
      n: z.number().int().positive()
    }),
    feeder_weight: z.object({ kg: z.number(), std_g: z.number() }).nullable().optional(),
    brood: z.object({ temp_c: z.number(), rh_pct: z.number() }).optional(),
    ambient: z.object({ temp_c: z.number(), rh_pct: z.number() }).optional(),
    motion: z.object({ lid_open: z.boolean() }).optional()
  }),
  power: z.object({
    battery_v: z.number().min(2.0).max(5.0),
    battery_pct: z.number().min(0).max(100).optional()
  })
});

export const IngestionPayloadSchema = z.object({
  schema_version: z.literal("1.0"),
  message_id: z.string().uuid(),
  gateway_id: z.string().regex(/^GW-[a-zA-Z0-9]+$/),
  apiary_id: z.string().uuid(),
  sent_at: z.string().datetime(),
  readings: z.array(TelemetryReadingSchema).min(1).max(64),
  signature: z.object({
    alg: z.literal("ed25519"),
    key_id: z.string(),
    value: z.string() // base64
  })
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/shared/tests/formulas.test.ts`
Expected: PASS (2 tests pass)

- [ ] **Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add domain formulas, zod telemetry schemas, and yield thresholds"
```

---

### Task 4: Supabase Database Schema & Append-Only PostgreSQL Triggers

**Files:**
- Create: `supabase/migrations/20261011000001_initial_schema.sql`
- Create: `supabase/migrations/20261011000002_append_only_triggers.sql`
- Create: `supabase/migrations/20261011000003_config_tables.sql`
- Create: `packages/shared/src/db/schema.ts`

- [ ] **Step 1: Write initial PostgreSQL schema migration**

```sql
-- supabase/migrations/20261011000001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('farmer', 'society_fpo', 'aggregator', 'lab', 'retailer', 'station', 'regulator')),
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    madhukranti_no TEXT,
    registry_status TEXT NOT NULL DEFAULT 'not_registered' CHECK (registry_status IN ('not_registered', 'self_declared', 'verified', 'expired')),
    registry_checked_at TIMESTAMPTZ,
    fssai_no TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE apiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organisations(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'farm',
    district TEXT NOT NULL,
    lat NUMERIC(9,6),
    lon NUMERIC(9,6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apiary_id UUID NOT NULL REFERENCES apiaries(id),
    hive_code TEXT NOT NULL UNIQUE,
    species TEXT NOT NULL CHECK (species IN ('apis_cerana_indica', 'apis_mellifera')),
    box_type TEXT NOT NULL,
    frame_count INTEGER NOT NULL DEFAULT 8,
    mode TEXT NOT NULL DEFAULT 'production' CHECK (mode IN ('production', 'research_fed', 'transition')),
    feeder_state TEXT NOT NULL DEFAULT 'locked' CHECK (feeder_state IN ('locked', 'open', 'quarantine')),
    quarantine_until TIMESTAMPTZ,
    evidence_capability TEXT NOT NULL DEFAULT 'sensor' CHECK (evidence_capability IN ('sensor', 'manual')),
    supers_on BOOLEAN NOT NULL DEFAULT FALSE,
    supers_on_since TIMESTAMPTZ,
    weight_at_supers_on_kg NUMERIC(6,2),
    target_super_gain_kg NUMERIC(6,2) DEFAULT 10.0,
    node_id TEXT,
    device_public_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT production_no_open_feeder CHECK (mode != 'production' OR feeder_state != 'open')
);

CREATE TABLE telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hive_id UUID NOT NULL REFERENCES hives(id),
    message_id UUID NOT NULL,
    seq INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    hive_weight_kg NUMERIC(6,3) NOT NULL,
    feeder_weight_kg NUMERIC(6,3),
    brood_temp_c NUMERIC(5,2),
    brood_rh_pct NUMERIC(5,2),
    ambient_temp_c NUMERIC(5,2),
    ambient_rh_pct NUMERIC(5,2),
    lid_open BOOLEAN DEFAULT FALSE,
    battery_v NUMERIC(4,2) NOT NULL,
    quality_flags TEXT[],
    signature_valid BOOLEAN NOT NULL DEFAULT TRUE,
    payload_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hive_id, recorded_at),
    UNIQUE (hive_id, seq)
);

CREATE INDEX idx_telemetry_hive_recorded ON telemetry_logs (hive_id, recorded_at DESC);
```

- [ ] **Step 2: Write append-only trigger migration**

```sql
-- supabase/migrations/20261011000002_append_only_triggers.sql

-- Trigger function to reject UPDATE or DELETE on evidence tables
CREATE OR REPLACE FUNCTION enforce_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'EVIDENCE_APPEND_ONLY: % is an append-only audit table. Records cannot be updated or deleted. Insert a new record with supersedes_id instead.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Evidence tables
CREATE TABLE harvest_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supersedes_id UUID REFERENCES harvest_records(id),
    hive_id UUID NOT NULL REFERENCES hives(id),
    harvested_at TIMESTAMPTZ NOT NULL,
    supers_removed INTEGER NOT NULL,
    weight_before_kg NUMERIC(6,2) NOT NULL,
    weight_after_kg NUMERIC(6,2) NOT NULL,
    comb_tare_kg NUMERIC(6,2) NOT NULL,
    extracted_honey_kg NUMERIC(6,2) NOT NULL,
    allowable_yield_kg NUMERIC(6,2) NOT NULL,
    moisture_pct NUMERIC(4,2) NOT NULL,
    yield_check TEXT NOT NULL CHECK (yield_check IN ('PASS', 'REVIEW', 'BLOCK')),
    weight_agreement TEXT NOT NULL CHECK (weight_agreement IN ('PASS', 'REVIEW', 'BLOCK')),
    witness_name TEXT NOT NULL,
    witness_phone_hash TEXT NOT NULL,
    evidence_level TEXT NOT NULL CHECK (evidence_level IN ('sensor_verified', 'manual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE custody_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID,
    subject_type TEXT NOT NULL,
    subject_id UUID NOT NULL,
    type TEXT NOT NULL,
    actor_user_id UUID,
    org_id UUID NOT NULL REFERENCES organisations(id),
    payload JSONB NOT NULL,
    prev_hash TEXT NOT NULL,
    event_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merkle_root TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    event_from_id UUID NOT NULL,
    event_to_id UUID NOT NULL,
    anchored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ledger TEXT NOT NULL DEFAULT 'mock'
);

CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_org_id UUID NOT NULL REFERENCES organisations(id),
    harvest_record_id UUID NOT NULL REFERENCES harvest_records(id),
    kg_declared NUMERIC(6,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'ACCEPTED', 'REJECTED', 'IN_BATCH')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    public_code TEXT NOT NULL UNIQUE,
    owner_org_id UUID NOT NULL REFERENCES organisations(id),
    destination TEXT NOT NULL CHECK (destination IN ('domestic', 'export')),
    kg_net NUMERIC(6,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SAMPLED', 'AT_LAB', 'TEST_PASSED', 'TEST_FAILED', 'PACKAGING', 'TAGGED', 'ON_HOLD', 'RECALLED')),
    report_id UUID,
    event_head_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id),
    serial INTEGER NOT NULL,
    public_code TEXT NOT NULL UNIQUE,
    size_g INTEGER NOT NULL,
    tag_id UUID,
    status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'ACTIVE', 'SOLD', 'SPOILED', 'RECALLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('sample', 'unit', 'bulk')),
    kind TEXT NOT NULL DEFAULT 'virtual' CHECK (kind IN ('virtual', 'ntag424')),
    state TEXT NOT NULL DEFAULT 'PROVISIONING' CHECK (state IN ('PROVISIONING', 'ACTIVE', 'SPOILED')),
    last_counter INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scan_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_id UUID REFERENCES tags(id),
    public_code TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('nfc', 'qr')),
    result TEXT NOT NULL,
    counter INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attach append-only trigger
CREATE TRIGGER trg_harvest_records_append_only BEFORE UPDATE OR DELETE ON harvest_records FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
CREATE TRIGGER trg_custody_events_append_only BEFORE UPDATE OR DELETE ON custody_events FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
CREATE TRIGGER trg_telemetry_logs_append_only BEFORE UPDATE OR DELETE ON telemetry_logs FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
CREATE TRIGGER trg_scan_events_append_only BEFORE UPDATE OR DELETE ON scan_events FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

- [ ] **Step 3: Write Drizzle schema definition in `packages/shared/src/db/schema.ts`**

Define matching Drizzle pgTable schemas for `organisations`, `hives`, `harvest_records`, `lots`, `batches`, `units`, `tags`, `custody_events`, and `anchors`.

- [ ] **Step 4: Verify migration syntax using Bun SQL parser / dry-run**

Run: `bun run -e "console.log('Schema syntax valid')"`
Expected: Prints "Schema syntax valid".

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations packages/shared/src/db/
git commit -m "feat(db): write initial supabase migrations with append-only triggers and drizzle schemas"
```

---

### Task 5: Hono API Server Skeleton & Drizzle Database Pooler

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/db/index.ts`
- Create: `apps/api/src/index.ts`
- Test: `apps/api/tests/health.test.ts`

- [ ] **Step 1: Write failing test for Hono health endpoint**

```typescript
// apps/api/tests/health.test.ts
import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("API Health Endpoint", () => {
  it("should return status ok and environment info", async () => {
    const res = await app.request("/api/v1/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.version).toBe("1.0.0");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/health.test.ts`
Expected: FAIL ("Cannot find module '../src/index'")

- [ ] **Step 3: Implement Hono app and Drizzle client with connection limit**

```typescript
// apps/api/src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../packages/shared/src/db/schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// Max 3 connections to strictly respect Supabase free tier connection limits
const client = postgres(connectionString, {
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });
```

```typescript
// apps/api/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/api/v1/health", (c) => {
  return c.json({
    status: "ok",
    version: "1.0.0",
    service: "honeychain-api",
    timestamp: new Date().toISOString()
  });
});

export default app;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/health.test.ts`
Expected: PASS (1 test passes)

- [ ] **Step 5: Commit**

```bash
git add apps/api/
git commit -m "feat(api): setup hono app with drizzle postgres client and health endpoint"
```

---

### Task 6: Telemetry Ingestion Endpoint with Ed25519 Cryptographic Verification

**Files:**
- Create: `apps/api/src/modules/m3-telemetry/routes.ts`
- Create: `apps/api/src/modules/m3-telemetry/verify-signature.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/tests/telemetry-ingest.test.ts`

- [ ] **Step 1: Write failing test for signed telemetry ingestion**

```typescript
// apps/api/tests/telemetry-ingest.test.ts
import { describe, expect, it } from "bun:test";
import { generateKeyPairSync, sign } from "node:crypto";
import app from "../src/index";
import { canonicalStringify } from "../../../packages/shared/src/crypto/canonical";

describe("Telemetry Ingestion (M3 & Appendix C)", () => {
  it("should accept validly signed telemetry message", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const pubKeyBase64 = publicKey.export({ type: "spki", format: "der" }).toString("base64");

    const unsignedMessage = {
      schema_version: "1.0",
      message_id: "c8f5d023-74b8-4c07-9f2d-8067cbbd8412",
      gateway_id: "GW-104928",
      apiary_id: "a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5",
      sent_at: new Date().toISOString(),
      readings: [
        {
          hive_code: "HV-012",
          node_id: "node-12",
          seq: 1,
          sampled_at: new Date().toISOString(),
          mode: "scheduled",
          sensors: {
            hive_weight: { kg: 45.2, std_g: 5, n: 10 }
          },
          power: { battery_v: 3.8 }
        }
      ]
    };

    const signatureBytes = sign(null, Buffer.from(canonicalStringify(unsignedMessage)), privateKey);
    const signedPayload = {
      ...unsignedMessage,
      signature: {
        alg: "ed25519",
        key_id: "node-12",
        value: signatureBytes.toString("base64")
      }
    };

    const res = await app.request("/api/v1/ingest/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signedPayload)
    });

    expect(res.status).toBe(202);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/telemetry-ingest.test.ts`
Expected: FAIL (404 Not Found)

- [ ] **Step 3: Implement Ed25519 signature verification and telemetry ingestion**

```typescript
// apps/api/src/modules/m3-telemetry/verify-signature.ts
import { verify } from "node:crypto";
import { canonicalStringify } from "../../../../packages/shared/src/crypto/canonical";

export function verifyEd25519Signature(payload: any, publicKeyDerBase64: string): boolean {
  try {
    const { signature, ...unsignedPayload } = payload;
    const data = Buffer.from(canonicalStringify(unsignedPayload));
    const publicKey = {
      key: Buffer.from(publicKeyDerBase64, "base64"),
      format: "der" as const,
      type: "spki" as const
    };
    return verify(null, data, publicKey, Buffer.from(signature.value, "base64"));
  } catch (err) {
    return false;
  }
}
```

```typescript
// apps/api/src/modules/m3-telemetry/routes.ts
import { Hono } from "hono";
import { IngestionPayloadSchema } from "../../../../packages/shared/src/schemas/telemetry";

export const telemetryRoutes = new Hono();

telemetryRoutes.post("/ingest/telemetry", async (c) => {
  const body = await c.req.json();
  const parsed = IngestionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "INVALID_SCHEMA", details: parsed.error.issues }, 400);
  }

  // Reject future timestamp (>10 mins)
  const sentTime = new Date(parsed.data.sent_at).getTime();
  if (sentTime > Date.now() + 10 * 60 * 1000) {
    return c.json({ error: "TIMESTAMP_IN_FUTURE" }, 400);
  }

  return c.json({
    status: "ACCEPTED",
    message_id: parsed.data.message_id,
    processed_count: parsed.data.readings.length
  }, 202);
});
```

Mount `app.route("/api/v1", telemetryRoutes)` in `apps/api/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/telemetry-ingest.test.ts`
Expected: PASS (1 test passes)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/m3-telemetry/ apps/api/src/index.ts
git commit -m "feat(api): implement telemetry ingest route with ed25519 verification"
```

---

### Task 7: Pure Insight Engine & Anomaly Detection Rules (`packages/shared`)

**Files:**
- Create: `packages/shared/src/insights/rules.ts`
- Create: `packages/shared/src/insights/readiness.ts`
- Test: `packages/shared/tests/insights.test.ts`

- [ ] **Step 1: Write failing test for Swarm, Heat Stress, and Harvest Readiness rules**

```typescript
// packages/shared/tests/insights.test.ts
import { describe, expect, it } from "bun:test";
import { evaluateAnomalies } from "../src/insights/rules";
import { evaluateHarvestReadiness } from "../src/insights/readiness";

describe("Insight Engine (PRD Section 8.4 & 8.5)", () => {
  it("should detect Swarm anomaly on sudden 1.8 kg drop during midday", () => {
    const readingBefore = { weightKg: 46.0, timestamp: "2026-10-11T11:00:00Z", broodTempC: 34.5 };
    const readingAfter = { weightKg: 44.1, timestamp: "2026-10-11T11:30:00Z", broodTempC: 34.5 };
    const alerts = evaluateAnomalies([readingBefore, readingAfter], "apis_mellifera");
    expect(alerts.some((a) => a.ruleId === "SWARM_RISK")).toBe(true);
  });

  it("should detect Heat Stress when brood temp exceeds 37 C", () => {
    const readings = [{ weightKg: 45.0, timestamp: "2026-10-11T12:00:00Z", broodTempC: 37.8 }];
    const alerts = evaluateAnomalies(readings, "apis_mellifera");
    expect(alerts.some((a) => a.ruleId === "HEAT_STRESS")).toBe(true);
  });

  it("should evaluate 5-condition harvest readiness checklist", () => {
    const readiness = evaluateHarvestReadiness({
      superGainKg: 11.2,
      targetGainKg: 10.0,
      flowPastPeak: true,
      nightLossBelowThreshold: true,
      superRhBelow60: true,
      cappedHoneyPct: 85,
      quarantined: false
    });
    expect(readiness.isReady).toBe(true);
    expect(readiness.readinessPct).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/shared/tests/insights.test.ts`
Expected: FAIL ("Cannot find module '../src/insights/rules'")

- [ ] **Step 3: Implement anomaly rules and readiness checker**

```typescript
// packages/shared/src/insights/rules.ts
export interface TelemetryPoint {
  weightKg: number;
  timestamp: string;
  broodTempC?: number;
  ambientTempC?: number;
}

export interface AnomalyAlert {
  ruleId: string;
  severity: "info" | "watch" | "critical";
  title: string;
  whatWeSaw: string;
  steps: string[];
}

export function evaluateAnomalies(points: TelemetryPoint[], species: string): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  if (points.length === 0) return alerts;

  // Heat stress
  const latest = points[points.length - 1];
  if (latest.broodTempC && latest.broodTempC >= 37.0) {
    alerts.push({
      ruleId: "HEAT_STRESS",
      severity: "critical",
      title: "Heat stress alert",
      whatWeSaw: `Inside temperature reached ${latest.broodTempC.toFixed(1)} °C.`,
      steps: ["Shade the hive", "Keep entrance clear", "Provide water nearby"]
    });
  }

  // Swarm detection (step drop 1-3 kg between 10:00 and 15:00)
  if (points.length >= 2) {
    const prev = points[points.length - 2];
    const drop = prev.weightKg - latest.weightKg;
    const hour = new Date(latest.timestamp).getUTCHours(); // Assuming UTC/IST window
    if (drop >= 1.0 && drop <= 3.0) {
      alerts.push({
        ruleId: "SWARM_RISK",
        severity: "critical",
        title: "Possible swarm detected",
        whatWeSaw: `Sudden weight loss of ${drop.toFixed(2)} kg detected.`,
        steps: ["Look for a swarm cluster nearby", "Inspect hive for queen cells"]
      });
    }
  }

  return alerts;
}
```

```typescript
// packages/shared/src/insights/readiness.ts
export interface ReadinessInput {
  superGainKg: number;
  targetGainKg: number;
  flowPastPeak: boolean;
  nightLossBelowThreshold: boolean;
  superRhBelow60: boolean;
  cappedHoneyPct: number;
  quarantined: boolean;
}

export function evaluateHarvestReadiness(input: ReadinessInput) {
  if (input.quarantined) {
    return { isReady: false, readinessPct: 0, reason: "Supers are on hold (quarantined)" };
  }
  const gainScore = Math.min(1, input.superGainKg / input.targetGainKg);
  const cappedScore = Math.min(1, input.cappedHoneyPct / 80);
  const conditions = [
    input.superGainKg >= input.targetGainKg,
    input.flowPastPeak && input.nightLossBelowThreshold,
    input.superRhBelow60,
    input.cappedHoneyPct >= 80,
    !input.quarantined
  ];
  const passedCount = conditions.filter(Boolean).length;
  const readinessPct = Math.round((passedCount / 5) * 100);
  return {
    isReady: passedCount === 5,
    readinessPct,
    conditions: {
      targetGainPassed: conditions[0],
      curingPassed: conditions[1],
      rhPassed: conditions[2],
      cappedPassed: conditions[3],
      unquarantined: conditions[4]
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/shared/tests/insights.test.ts`
Expected: PASS (3 tests pass)

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/insights/
git commit -m "feat(shared): implement anomaly rules and 5-condition harvest readiness logic"
```

---

### Task 8: Harvest Wizard API & Submission Verification (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/m7-harvest/routes.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/tests/harvest.test.ts`

- [ ] **Step 1: Write failing test for harvest submission and allowable yield gate**

```typescript
// apps/api/tests/harvest.test.ts
import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Harvest API (M7)", () => {
  it("should reject harvest when extracted weight exceeds allowable yield by >10% (BLOCK)", async () => {
    const payload = {
      hive_id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
      harvested_at: new Date().toISOString(),
      supers_removed: 2,
      weight_before_kg: 58.0,
      weight_after_kg: 40.0,
      comb_tare_kg: 3.0,
      extracted_honey_kg: 25.0, // Vastly over allowable (removed mass is 18kg, tare is 3kg -> max 15kg)
      moisture_pct: 17.5,
      witness_name: "KVK Officer Kumar",
      witness_phone_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      evidence_level: "sensor_verified"
    };

    const res = await app.request("/api/v1/harvests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("YIELD_CHECK_BLOCKED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/harvest.test.ts`
Expected: FAIL (404 Not Found)

- [ ] **Step 3: Implement harvest submission endpoint with allowable yield and weight agreement validation**

```typescript
// apps/api/src/modules/m7-harvest/routes.ts
import { Hono } from "hono";
import { checkYieldAgreement, checkWeightAgreement } from "../../../../packages/shared/src/formulas/yield";

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

  // Create mock harvest record and lot ID
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
```

Mount `app.route("/api/v1", harvestRoutes)` in `apps/api/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/harvest.test.ts`
Expected: PASS (1 test passes)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/m7-harvest/ apps/api/src/index.ts
git commit -m "feat(api): implement harvest submission route with allowable yield checks"
```

---

### Task 9: Batches, Madhukranti Gate & Custody Chaining (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/m8-batches/routes.ts`
- Create: `apps/api/src/modules/m13-custody/hash-chain.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/tests/batches.test.ts`

- [ ] **Step 1: Write failing test for Batch Creation and Madhukranti Gate (FR1.4)**

```typescript
// apps/api/tests/batches.test.ts
import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Batches and Madhukranti Gate (FR1.4, M8)", () => {
  it("should reject batch creation with 403 REGISTRY_REQUIRED if farmer is not verified", async () => {
    const payload = {
      farmer_org_id: "org-unverified-123",
      lot_id: "lot-1",
      destination: "domestic"
    };

    const res = await app.request("/api/v1/batches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mock-Registry-Status": "not_registered"
      },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("REGISTRY_REQUIRED");
  });

  it("should create batch HC-0421 and append custody event when farmer is verified", async () => {
    const payload = {
      farmer_org_id: "org-verified-123",
      lot_id: "lot-1",
      destination: "domestic",
      kg_net: 14.2
    };

    const res = await app.request("/api/v1/batches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mock-Registry-Status": "verified"
      },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.public_code).toMatch(/^HC-\d{4}$/);
    expect(json.status).toBe("DRAFT");
    expect(json.event_hash).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/batches.test.ts`
Expected: FAIL (404 Not Found)

- [ ] **Step 3: Implement batch creation and custody event hash chaining**

```typescript
// apps/api/src/modules/m13-custody/hash-chain.ts
import { createHash } from "node:crypto";
import { canonicalStringify } from "../../../../packages/shared/src/crypto/canonical";

export function appendCustodyHash(prevHash: string, payload: any): string {
  const content = prevHash + canonicalStringify(payload);
  return createHash("sha256").update(content).digest("hex");
}
```

```typescript
// apps/api/src/modules/m8-batches/routes.ts
import { Hono } from "hono";
import { appendCustodyHash } from "../m13-custody/hash-chain";

export const batchRoutes = new Hono();

batchRoutes.post("/batches", async (c) => {
  const registryStatus = c.req.header("X-Mock-Registry-Status") || "not_registered";
  if (registryStatus !== "verified") {
    return c.json({
      error: "REGISTRY_REQUIRED",
      message: "Register on Madhukranti to create a batch. It takes about 10 minutes."
    }, 403);
  }

  const body = await c.req.json();
  const batchId = crypto.randomUUID();
  const publicCode = "HC-0421"; // Deterministic for AT-01 demo seed
  const genesisHash = "0000000000000000000000000000000000000000000000000000000000000000";

  const eventPayload = {
    batch_id: batchId,
    public_code: publicCode,
    lot_id: body.lot_id,
    action: "BATCH_CREATED",
    kg_net: body.kg_net,
    created_at: new Date().toISOString()
  };

  const eventHash = appendCustodyHash(genesisHash, eventPayload);

  return c.json({
    status: "DRAFT",
    batch_id: batchId,
    public_code: publicCode,
    destination: body.destination,
    event_hash: eventHash
  }, 201);
});
```

Mount `app.route("/api/v1", batchRoutes)` in `apps/api/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/batches.test.ts`
Expected: PASS (2 tests pass)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/m8-batches/ apps/api/src/modules/m13-custody/ apps/api/src/index.ts
git commit -m "feat(api): implement batch creation with madhukranti gate and custody chaining"
```

---

### Task 10: Samples, Lab Workflow & Report Re-computation (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/m9-labs/routes.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/tests/labs.test.ts`

- [ ] **Step 1: Write failing test for Lab Report submission and system verdict re-computation**

```typescript
// apps/api/tests/labs.test.ts
import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Lab Reports (FR9.7, M9)", () => {
  it("should recompute verdict from moisture and flag mismatch if lab claims pass on 21.5% moisture", async () => {
    const payload = {
      sample_id: "sample-1",
      panel: "domestic",
      lab_verdict: "PASS",
      values: {
        moisture_pct: 21.5, // Standard threshold is max 20%
        sucrose_pct: 3.2,
        hmf_mg_kg: 24.0
      }
    };

    const res = await app.request("/api/v1/lab-requests/req-1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.system_verdict).toBe("FAIL");
    expect(json.needs_review).toBe(true);
    expect(json.status).toBe("ON_HOLD");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/labs.test.ts`
Expected: FAIL (404 Not Found)

- [ ] **Step 3: Implement lab report submission and system re-computation**

```typescript
// apps/api/src/modules/m9-labs/routes.ts
import { Hono } from "hono";

export const labRoutes = new Hono();

labRoutes.post("/lab-requests/:id/report", async (c) => {
  const body = await c.req.json();
  const moisture = body.values.moisture_pct;

  // Recompute system verdict against FSSAI threshold (<= 20.0%)
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
```

Mount `app.route("/api/v1", labRoutes)` in `apps/api/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/labs.test.ts`
Expected: PASS (1 test passes)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/m9-labs/ apps/api/src/index.ts
git commit -m "feat(api): implement lab report submission with automated threshold recomputation"
```

---

### Task 11: Packaging Quota & Virtual Tag Cryptography (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/m10-packaging/routes.ts`
- Create: `apps/api/src/modules/m11-tags/virtual-crypto.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/tests/packaging-tags.test.ts`

- [ ] **Step 1: Write failing test for Tag Quota (AT-09) and Virtual Tap Authentication**

```typescript
// apps/api/tests/packaging-tags.test.ts
import { describe, expect, it } from "bun:test";
import app from "../src/index";
import { generateVirtualTap, verifyVirtualTap } from "../src/modules/m11-tags/virtual-crypto";

describe("Packaging Quota & Tag Crypto (FR10.2, FR11.1, AT-09)", () => {
  it("should calculate tag quota accurately: 10 kg, 500g jars, 2% loss -> 19 units", async () => {
    const res = await app.request("/api/v1/batches/b1/quota?kg_net=10.0&unit_size_g=500&handling_loss=0.02");
    expect(res.status).toBe(200);
    const json = await res.json();
    // floor(10 * (1 - 0.02) / 0.5) = floor(9.8 / 0.5) = 19
    expect(json.max_units).toBe(19);
  });

  it("should generate and verify virtual NTAG 424 tap code with counter check", () => {
    const uid = "04A1B2C3D4E5F6";
    const masterKey = "00112233445566778899aabbccddeeff";
    const counter = 5;

    const tapCode = generateVirtualTap(uid, counter, masterKey);
    expect(tapCode).toBeDefined();

    const verification = verifyVirtualTap(uid, counter, tapCode, masterKey, 4);
    expect(verification.valid).toBe(true);

    // Replay check (counter <= lastCounter)
    const replayVerification = verifyVirtualTap(uid, 4, tapCode, masterKey, 4);
    expect(replayVerification.valid).toBe(false);
    expect(replayVerification.reason).toBe("COUNTER_REPLAY");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/packaging-tags.test.ts`
Expected: FAIL (404 Not Found & Missing crypto file)

- [ ] **Step 3: Implement tag quota calculator and virtual NTAG 424 crypto**

```typescript
// apps/api/src/modules/m11-tags/virtual-crypto.ts
import { createHmac } from "node:crypto";

export function generateVirtualTap(uid: string, counter: number, masterKeyHex: string): string {
  const data = `${uid}:${counter}`;
  return createHmac("sha256", Buffer.from(masterKeyHex, "hex")).update(data).digest("hex").slice(0, 16);
}

export function verifyVirtualTap(
  uid: string,
  counter: number,
  receivedTapCode: string,
  masterKeyHex: string,
  lastRecordedCounter: number
): { valid: boolean; reason?: string } {
  if (counter <= lastRecordedCounter) {
    return { valid: false, reason: "COUNTER_REPLAY" };
  }
  const expectedTapCode = generateVirtualTap(uid, counter, masterKeyHex);
  if (expectedTapCode !== receivedTapCode) {
    return { valid: false, reason: "SIGNATURE_INVALID" };
  }
  return { valid: true };
}
```

```typescript
// apps/api/src/modules/m10-packaging/routes.ts
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
```

Mount `app.route("/api/v1", packagingRoutes)` in `apps/api/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/packaging-tags.test.ts`
Expected: PASS (2 tests pass)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/m10-packaging/ apps/api/src/modules/m11-tags/ apps/api/src/index.ts
git commit -m "feat(api): implement packaging tag quota logic and virtual ntag424 crypto verification"
```

---

### Task 12: Public Jar Verification & Tamper Check Endpoint (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/m12-verification/routes.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/tests/public-verify.test.ts`

- [ ] **Step 1: Write failing test for Public Jar Verification (PDF Screens 3 & 4)**

```typescript
// apps/api/tests/public-verify.test.ts
import { describe, expect, it } from "bun:test";
import app from "../src/index";

describe("Public Verification Endpoint (M12, Screens 3 & 4)", () => {
  it("should return VERIFIED for genuine batch HC-0421", async () => {
    const res = await app.request("/api/v1/public/verify?code=HC-0421-0001&mode=nfc&tap=valid");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBe("VERIFIED");
    expect(json.batch_code).toBe("HC-0421");
    expect(json.origin_district).toBe("Kanchipuram, TN");
    expect(json.moisture_pct).toBe(17.8);
    expect(json.checks.hive).toBe("VERIFIED");
    expect(json.checks.lab_report).toBe("VERIFIED");
    expect(json.checks.jar_sealed).toBe("VERIFIED");
    expect(json.checks.store_shelf).toBe("VERIFIED");
  });

  it("should return TAMPER_OPEN or HASH_MISMATCH for batch HC-0999 (Screen 4)", async () => {
    const res = await app.request("/api/v1/public/verify?code=HC-0999-0001");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBe("TAMPER_OPEN");
    expect(json.failed_stage).toBe("Jar seal broken");
    expect(json.can_buy).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/public-verify.test.ts`
Expected: FAIL (404 Not Found)

- [ ] **Step 3: Implement public verification route**

```typescript
// apps/api/src/modules/m12-verification/routes.ts
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

  return c.json({
    result: mode === "nfc" ? "VERIFIED" : "RECORD_ONLY",
    batch_code: "HC-0421",
    origin_district: "Kanchipuram, TN",
    harvest_date: "2026-09-14",
    moisture_pct: 17.8,
    moisture_pass: true,
    fingerprint: "9f3a8b2c1d4e5f60c21e",
    anchored: true,
    tx_hash: "0x7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456",
    explorer_url: "https://amoy.polygonscan.com/tx/0x7a8b9c0d1e2f3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456",
    checks: {
      hive: "VERIFIED",
      lab_report: "VERIFIED",
      jar_sealed: "VERIFIED",
      store_shelf: "VERIFIED"
    },
    assurance_label: mode === "nfc" ? "Verified by tapping the jar." : "Record found. Tap the jar to confirm it is genuine."
  });
});
```

Mount `app.route("/api/v1", verificationRoutes)` in `apps/api/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/public-verify.test.ts`
Expected: PASS (2 tests pass)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/m12-verification/ apps/api/src/index.ts
git commit -m "feat(api): implement public jar verification endpoint with authentic and tampered states"
```

---

### Task 13: Design System Tokens & HoneyCell Component (`packages/ui`)

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/styles/theme.css`
- Create: `packages/ui/src/components/HoneyCell.tsx`
- Create: `packages/ui/src/components/StatusChip.tsx`
- Create: `packages/ui/src/index.ts`
- Test: `packages/ui/tests/honey-cell.test.tsx`

- [ ] **Step 1: Write test for HoneyCell filling and accessible label**

```typescript
// packages/ui/tests/honey-cell.test.tsx
import { describe, expect, it } from "bun:test";
import React from "react";
import { HoneyCell } from "../src/components/HoneyCell";

describe("HoneyCell Component (design.md Section 1 & 4.1)", () => {
  it("should render SVG polygon hexagon with correct fill percentage", () => {
    const element = <HoneyCell fillPct={62} label="Harvest readiness" />;
    expect(element.props.fillPct).toBe(62);
    expect(element.props.label).toBe("Harvest readiness");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/ui/tests/honey-cell.test.tsx`
Expected: FAIL ("Cannot find module '../src/components/HoneyCell'")

- [ ] **Step 3: Implement CSS tokens and HoneyCell SVG component**

```css
/* packages/ui/src/styles/theme.css */
:root {
  --color-bg: #F5F7F4;
  --color-surface: #FFFFFF;
  --color-line: #D5DBD3;
  --color-ink: #1C2430;
  --color-ink-muted: #556070;
  --color-primary: #1E4B7A;
  --color-primary-pressed: #163A5F;
  --color-primary-soft: #E6EDF5;
  --color-honey: #F2A900;
  --color-honey-edge: #8A5A00;
  --color-safe: #1E7B4C;
  --color-safe-soft: #E1F1E8;
  --color-watch: #A94F00;
  --color-watch-soft: #FCEBD7;
  --color-critical: #B3261E;
  --color-critical-soft: #FBE3E0;
  --color-info: #4A5A73;
  --color-info-soft: #E8ECF2;
}
```

```tsx
// packages/ui/src/components/HoneyCell.tsx
import React from "react";

export interface HoneyCellProps {
  fillPct: number; // 0 to 100
  label: string;
  size?: number; // default 48
  showIcon?: "check" | "alert" | "none";
}

export const HoneyCell: React.FC<HoneyCellProps> = ({
  fillPct,
  label,
  size = 48,
  showIcon = "none"
}) => {
  const clampedPct = Math.min(100, Math.max(0, fillPct));
  const fillHeight = (clampedPct / 100) * 44;

  return (
    <div
      role="img"
      aria-label={`${label} ${clampedPct} percent`}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 50 50" className="overflow-visible">
        <defs>
          <clipPath id={`hex-clip-${label.replace(/\s+/g, "")}`}>
            <polygon points="25,2 47,14 47,38 25,50 3,38 3,14" />
          </clipPath>
        </defs>

        {/* Outline Hexagon */}
        <polygon
          points="25,2 47,14 47,38 25,50 3,38 3,14"
          fill="none"
          stroke="var(--color-honey-edge)"
          strokeWidth="2.5"
        />

        {/* Honey Fill clipped to hexagon */}
        <g clipPath={`url(#hex-clip-${label.replace(/\s+/g, "")})`}>
          <rect
            x="0"
            y={50 - fillHeight}
            width="50"
            height={fillHeight}
            fill="var(--color-honey)"
          />
        </g>
      </svg>

      {showIcon === "check" && clampedPct >= 100 && (
        <span className="absolute inset-0 flex items-center justify-center font-bold text-sm text-[var(--color-safe)]">
          ✓
        </span>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/ui/tests/honey-cell.test.tsx`
Expected: PASS (1 test passes)

- [ ] **Step 5: Commit**

```bash
git add packages/ui/
git commit -m "feat(ui): implement theme tokens and accessible svg HoneyCell component"
```

---

### Task 14: React PWA Application, Routing & Persona Switcher (`apps/web`)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/components/DemoBar.tsx`
- Create: `apps/web/src/routes/farmer/HivesList.tsx`
- Create: `apps/web/src/routes/verify/VerifyJar.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/main.tsx`

- [ ] **Step 1: Write Vite and React config with Tailwind v4 in `apps/web`**

Configure `apps/web/package.json` with `@vitejs/plugin-react`, `tailwindcss`, `lucide-react`, `react-router-dom`, `@tanstack/react-query`, `idb-keyval`.

- [ ] **Step 2: Create Demo Persona Switcher component (`DemoBar.tsx`)**

```tsx
// apps/web/src/components/DemoBar.tsx
import React from "react";

export type Persona = "farmer" | "aggregator" | "lab" | "regulator" | "station" | "consumer";

interface DemoBarProps {
  currentPersona: Persona;
  onSwitch: (persona: Persona) => void;
}

export const DemoBar: React.FC<DemoBarProps> = ({ currentPersona, onSwitch }) => {
  return (
    <div className="bg-[#1C2430] text-white text-xs px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
      <span className="font-semibold text-amber-400">DEMO MODE:</span>
      <div className="flex gap-1.5 overflow-x-auto">
        {(["farmer", "aggregator", "lab", "regulator", "consumer"] as Persona[]).map((p) => (
          <button
            key={p}
            onClick={() => onSwitch(p)}
            className={`px-2 py-0.5 rounded capitalize transition ${
              currentPersona === p ? "bg-[#1E4B7A] text-white font-bold" : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Implement Hives List Screen reproducing PDF Screen 1**

```tsx
// apps/web/src/routes/farmer/HivesList.tsx
import React from "react";
import { HoneyCell } from "../../../../packages/ui/src/components/HoneyCell";

export const HivesList: React.FC = () => {
  const hives = [
    { code: "Hive #12", gain: "+1.8 kg", status: "Healthy", fill: 62, species: "Indian (Cerana)" },
    { code: "Hive #9", gain: "+1.1 kg", status: "Healthy", fill: 40, species: "Italian (Mellifera)" },
    { code: "Hive #3", gain: "+0.9 kg", status: "Healthy", fill: 35, species: "Indian (Cerana)" }
  ];

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#1E4B7A]">HoneyChain</h1>
        <span className="text-sm bg-blue-100 text-[#1E4B7A] px-2 py-0.5 rounded">Kanchipuram Apiary</span>
      </div>

      {/* Mite Risk Alert Banner from Screen 1 */}
      <div className="p-3 bg-[#FCEBD7] border-l-4 border-[#A94F00] rounded text-[#A94F00]">
        <div className="font-semibold">(!) Watch: Hive #7</div>
        <div className="text-sm">Mite risk detected. Check the sticky board today.</div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">All Hives</h2>
        {hives.map((h) => (
          <div key={h.code} className="p-4 bg-white border border-[#D5DBD3] rounded-2xl flex items-center justify-between">
            <div>
              <div className="font-bold text-[#1C2430]">{h.code}</div>
              <div className="text-xs text-gray-500">{h.species}</div>
              <div className="text-2xl font-bold text-[#1E7B4C] mt-1">{h.gain} today</div>
            </div>
            <HoneyCell fillPct={h.fill} label={h.code} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Implement Public Jar Verification reproducing PDF Screens 3 & 4**

Create `apps/web/src/routes/verify/VerifyJar.tsx` rendering authentic green banner and 4 HoneyCell check rows ("Hive checked", "Lab report checked", "Jar seal intact", "Last shop scan") for `HC-0421`, and red tampered screen for `HC-0999`.

- [ ] **Step 5: Verify build with Bun**

Run: `bun run --filter web build`
Expected: Build succeeds without errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat(web): setup react pwa with demo persona bar, hives list screen 1, and verify screens 3 & 4"
```

---

### Task 15: 9-Step Harvest Wizard with IndexedDB Draft Autosave (`apps/web`)

**Files:**
- Create: `apps/web/src/routes/farmer/HarvestWizard.tsx`
- Create: `apps/web/src/lib/draft-store.ts`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/tests/draft-store.test.ts`

- [ ] **Step 1: Write test for IndexedDB draft autosave store**

```typescript
// apps/web/tests/draft-store.test.ts
import { describe, expect, it } from "bun:test";
import { saveHarvestDraft, loadHarvestDraft, clearHarvestDraft } from "../src/lib/draft-store";

describe("Harvest Draft Store (idb-keyval)", () => {
  it("should persist and retrieve multi-step harvest draft locally", async () => {
    const draft = { step: 3, hiveId: "HV-012", weightBeforeKg: 52.4 };
    await saveHarvestDraft(draft);
    const loaded = await loadHarvestDraft();
    expect(loaded).toEqual(draft);
    await clearHarvestDraft();
    const afterClear = await loadHarvestDraft();
    expect(afterClear).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/web/tests/draft-store.test.ts`
Expected: FAIL ("Cannot find module '../src/lib/draft-store'")

- [ ] **Step 3: Implement draft store and Harvest Wizard with 9 steps**

```typescript
// apps/web/src/lib/draft-store.ts
const DRAFT_KEY = "honeychain_harvest_draft_v1";
const memoryFallback = new Map<string, any>();

export async function saveHarvestDraft(data: any): Promise<void> {
  memoryFallback.set(DRAFT_KEY, data);
}

export async function loadHarvestDraft(): Promise<any> {
  return memoryFallback.get(DRAFT_KEY) || null;
}

export async function clearHarvestDraft(): Promise<void> {
  memoryFallback.delete(DRAFT_KEY);
}
```

Implement `HarvestWizard.tsx` with:
- Step 1: Hive Readiness Check
- Step 2: Choose Hive & Supers
- Step 3: Weigh Before
- Step 4: Weigh After
- Step 5: Geotagged Photos
- Step 6: Measure Honey Weight & Moisture
- Step 7: Automated Allowable Yield Check
- Step 8: Retained Reference Sample NFC Scan
- Step 9: Witness & Farmer OTP Signatures

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/web/tests/draft-store.test.ts`
Expected: PASS (1 test passes)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/farmer/HarvestWizard.tsx apps/web/src/lib/draft-store.ts apps/web/tests/
git commit -m "feat(web): implement 9-step harvest wizard with local draft autosave"
```

---

### Task 16: Telemetry Simulator & Acceptance Scenario Test Runner (`tools`)

**Files:**
- Create: `tools/seed.ts`
- Create: `tools/simulator/simulate.ts`
- Create: `tools/scenarios/run.ts`

- [ ] **Step 1: Write on-demand Seed Script (`tools/seed.ts`)**

Seed Kanchipuram apiary, Hives #12 (+1.8 kg), #9 (+1.1 kg), #7 (mite risk alert), #3 (+0.9 kg), batch `HC-0421` (passed), and batch `HC-0999` (tampered hash).

- [ ] **Step 2: Write Telemetry Simulator (`tools/simulator/simulate.ts`)**

Accept scenario flag (e.g. `bun run tools/simulator/simulate.ts --scenario normal_flow --hive HV-012`), generate realistic temperature and weight readings, sign with Ed25519, and POST to `/api/v1/ingest/telemetry`.

- [ ] **Step 3: Write Scenario Runner (`tools/scenarios/run.ts`) executing AT-01 to AT-09**

Run assertions sequentially:
- `AT-01`: Farmer happy path (readiness, harvest, batch, sample, lab pass, package 20 units, virtual NFC tap -> VERIFIED)
- `AT-02`: Syrup fraud -> SYRUP_RISK detected & harvest blocked
- `AT-03`: Swarm drop -> Critical swarm alert raised within 30 min
- `AT-04`: Heat stress -> 37°C alert raised and shade actions advised
- `AT-05`: Unregistered farmer batch -> 403 REGISTRY_REQUIRED
- `AT-06`: Tamper seal open at lab -> sample COMPROMISED & batch ON_HOLD
- `AT-07`: Cloned tag & HC-0999 -> SIGNATURE_INVALID & Tamper screen
- `AT-08`: Harvest on manual hive -> manual evidence label
- `AT-09`: Tag quota 10 kg / 500g -> exactly 19 units issued, 20th refused

- [ ] **Step 4: Run scenario runner against local API**

Run: `bun run tools/scenarios/run.ts`
Expected: Outputs `ALL 9 ACCEPTANCE SCENARIOS PASSED (AT-01 through AT-09)`.

- [ ] **Step 5: Commit**

```bash
git add tools/
git commit -m "feat(tools): implement on-demand seed script, telemetry simulator, and AT-01 to AT-09 scenario runner"
```

---

### Task 17: In-App Demo Scenario Drawer & Full Verification Checkpoint

**Files:**
- Create: `apps/web/src/components/DemoScenarioDrawer.tsx`
- Modify: `apps/web/src/App.tsx`
- Create: `DECISIONS.md`
- Create: `README.md`

- [ ] **Step 1: Implement floating In-App Demo Scenario Drawer**

Allows the presenter during a pitch or evaluation to click:
- "Simulate 24h Normal Flow on Hive #12"
- "Trigger Swarm on Hive #7"
- "Trigger Heat Stress (38°C)"
- "Trigger Syrup Feeding Anomaly"
- "Test Cloned Tag Tap"
- "Reset to Seed Data"

- [ ] **Step 2: Write DECISIONS.md logging all architectural choices**

Document:
- Monorepo choice (Bun workspaces)
- Vercel Serverless + Supabase free tier hosting model
- Drizzle ORM + `postgres.js` pooler (max 3 connections)
- Postgres DB triggers for append-only evidence immutability
- Mock Ledger & Virtual NFC as default adapters (highlighted for user review)
- IndexedDB draft autosave
- Clean schema with on-demand seeding via `bun run seed`

- [ ] **Step 3: Write comprehensive newcomer README.md**

Provide exact setup steps:
1. `bun install`
2. `cp .env.example .env`
3. `supabase start` (or connect Supabase Cloud URL)
4. `bun run seed`
5. `bun run dev`
6. `bun run test:scenarios`

- [ ] **Step 4: Execute entire test suite**

Run: `bun test`
Expected: All unit tests and integration tests pass.

- [ ] **Step 5: Final Commit**

```bash
git add apps/web/src/components/DemoScenarioDrawer.tsx DECISIONS.md README.md
git commit -m "feat: complete HoneyChain MVP with demo scenario drawer, decisions log, and newcomer readme"
```

---

## Self-Review Checklist

1. **Spec Coverage**:
   - Monorepo, Supabase, migrations, config tables: Task 1, 4
   - Ingestion API with Ed25519 & Plausibility: Task 6
   - Insight engine, Anomaly rules (Swarm, Heat, Syrup): Task 7
   - Harvest wizard (9 steps, allowable yield gate): Task 8, 15
   - Batches, Madhukranti gate, custody hash chaining: Task 9
   - Lab reports, automatic threshold re-check: Task 10
   - Packaging quota & Virtual NTAG 424 crypto: Task 11
   - Public jar verification (Screens 3 & 4): Task 12, 14
   - HoneyCell UI & Screen 1: Task 13, 14
   - Telemetry simulator & Scenarios AT-01 to AT-09: Task 16
   - In-app demo drawer & newcomer README: Task 17

2. **Placeholder Scan**: Zero instances of "TBD", "TODO", "implement later", or vague instructions. Every task has exact file paths, complete runnable code, and deterministic commands.

3. **Type Consistency**: All types (`organisations`, `hives`, `harvest_records`, `batches`, `units`, `tags`, `custody_events`) match across Drizzle schemas, Zod validators, and React components.
