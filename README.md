# 🍯 HoneyChain

> **Audit-Ready Honey Traceability & Apiary Intelligence Platform (Hive → Batch → Lab → Jar → Consumer)**  
> Built for Smart India Hackathon (**SIH26021**) | Problem Category: Software | Theme: Agriculture, FoodTech & Rural Development

[![CI](https://github.com/Equlient-Joy/HoneyChain/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Equlient-Joy/HoneyChain)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.4+-black.svg?logo=bun)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![Hono](https://img.shields.io/badge/Hono-v4-E36002.svg?logo=hono)](https://hono.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase)](https://supabase.com)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy_Testnet-8247E5.svg?logo=polygon)](https://polygon.technology)

---

## 📌 Executive Summary

**HoneyChain** gives beekeepers, aggregators, labs, and regulators a single tamper-evident audit record of honey from hive to jar, and gives consumers a one-tap cryptographic check that a jar is genuine.

### The Problems Solved
1. **Unverifiable Origin**: Honey blended and repackaged across regions with zero field provenance.
2. **Post-Harvest Adulteration & Substitution**: Sugar syrup feeding and synthetic inverted sugar diluting genuine honey.
3. **Syrup Feeding**: Undetected feeding during active honey flow periods.
4. **Limited Lab Capacity**: Bottlenecks in expensive testing labs without risk-ranked screening.
5. **Low Beekeeper Margins**: Authentic farmers underpaid due to competition with cheap adulterated syrups.

---

## ⚡ Key Capabilities

- **Immutable Evidence Chain (Hive → Batch → Lab → Jar → Consumer)**: Every step is recorded as an RFC 8785 canonical JSON-hashed custody event.
- **Append-Only PostgreSQL Audit Trail**: Database-level triggers strictly reject `UPDATE` and `DELETE` on evidence tables with `EVIDENCE_APPEND_ONLY` exceptions.
- **On-Chain EVM Anchoring**: Batched Merkle roots anchored to the **Polygon Amoy Testnet** (EVM-compatible, matching Hyperledger Besu smart contract specifications), providing live clickable [Polygonscan](https://amoy.polygonscan.com) transaction verification links.
- **Ed25519 Telemetry Ingestion**: Secure ingestion endpoint verifying hardware/simulator sensor readings (brood temperature, humidity, hive weight, battery voltage).
- **Automated Insight Engine**: Pure functional anomaly detectors for:
  - 🐝 **Swarm Detection**: Midday step-drops (1–3 kg).
  - 🔥 **Heat Stress**: Brood temperature exceeding 37 °C with shade action guidance.
  - 🍯 **Syrup Risk & Quarantine**: Correlated feeder weight drops quarantining supers.
  - ✅ **5-Condition Harvest Readiness**: Evaluates super gain, curing loss, humidity, capping ratio (≥80%), and quarantine status.
- **9-Step Harvest Wizard**: Validates allowable yield mass-balance, weight agreement, and local IndexedDB (`idb-keyval`) autosave for outdoor offline resilience.
- **Tamper-Evident NTAG 424 DNA Verification**: Cryptographic AES-128 CMAC tap codes with monotonic counter replay protection (`virtual` and physical PN532 Raspberry Pi adapters).
- **Public Consumer Jar Verification**: Transparent 4-check verification checklist (**Hive Checked**, **Lab Report Checked**, **Jar Sealed**, **Last Shop Scan**) without inflated or misleading numeric trust scores.

---

## 🏗️ Repository Architecture

HoneyChain is structured as a high-performance **Bun Monorepo**:

```
HoneyChain/
├── apps/
│   ├── api/                   # Bun + Hono REST backend (deployable to Vercel Serverless / Edge)
│   │   ├── src/db/            # Drizzle ORM client with Supavisor pooler (max 3 connections)
│   │   └── src/modules/       # Feature modules: M1 Auth, M3 Telemetry, M7 Harvest, M8 Batches,
│   │                          #                  M9 Labs, M10 Packaging, M11 Tags, M12 Verify
│   └── web/                   # React 19 + Vite PWA (mobile-first, outdoor high-contrast)
│       └── src/routes/        # Role-based dashboards: Farmer, Aggregator, Lab, Regulator, Verify
├── packages/
│   ├── shared/                # Shared TypeScript models, Zod validation schemas, RFC 8785 canonical
│   │                          # hashing, Merkle tree generator, and allowable yield math
│   └── ui/                    # Shared design system: Tailwind CSS tokens, accessible SVG HoneyCell
├── supabase/
│   └── migrations/            # Version-controlled PostgreSQL schemas & append-only triggers
└── tools/
    ├── seed.ts                # On-demand seed data (Kanchipuram apiary, Batches HC-0421, HC-0999)
    ├── simulator/             # CLI telemetry emulator with anomaly scenarios
    └── scenarios/             # Acceptance test runner executing AT-01 through AT-09
```

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.4.0 or newer)
- [Node.js](https://nodejs.org) (v20+ recommended)
- [Git](https://git-scm.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) or a free [Supabase Cloud](https://supabase.com) project

### 1. Clone & Install
```bash
git clone https://github.com/Equlient-Joy/HoneyChain.git
cd HoneyChain
bun install
```

### 2. Configure Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials and optional Polygon Amoy RPC:
```ini
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Cryptographic Master Secrets
TAG_MASTER_KEY=00112233445566778899aabbccddeeff
CRON_SECRET=honeychain-dev-cron-secret-1234

# Blockchain Ledger Adapter
LEDGER_ADAPTER=polygon_amoy
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
```

### 3. Apply Database Migrations
Using Supabase local development:
```bash
supabase start
```
Or apply the SQL scripts in `supabase/migrations/` directly to your Supabase project.

### 4. Seed Demo Data (Optional)
```bash
bun run seed
```

### 5. Start Development Servers
Start both the Hono API and React Vite PWA:
```bash
bun run dev
```
- **Web App**: `http://localhost:5173`
- **API Health**: `http://localhost:3000/api/v1/health`

---

## 🧪 Testing & Verification

Run the entire automated unit and integration test suite across the monorepo:
```bash
bun test
```

Run the end-to-end acceptance scenarios:
```bash
bun run test:scenarios
```

### Acceptance Scenarios Matrix

| ID | Scenario | Expected Outcome |
|---|---|---|
| **AT-01** | Farmer Happy Path | Flow Hive → Harvest → Batch → Lab Pass → Package 20 units → Tap verification (`VERIFIED`) |
| **AT-02** | Syrup Fraud | Sugar feeding detected; supers quarantined; harvest blocked (`YIELD_CHECK_BLOCKED`) |
| **AT-03** | Swarm Detection | Sudden 1.8 kg weight drop triggers critical Swarm alert within 30 min |
| **AT-04** | Heat Stress | Brood temperature >37 °C triggers critical alert with shade steps |
| **AT-05** | Unregistered Farmer | Batch creation returns `403 REGISTRY_REQUIRED` until Madhukranti verified |
| **AT-06** | Compromised Seal at Lab | Open vial loop sets sample `COMPROMISED` and batch `ON_HOLD` |
| **AT-07** | Cloned Tag & Tampered Batch | Replayed counter yields `COUNTER_REPLAY`; batch `HC-0999` shows `TAMPER_OPEN` |
| **AT-08** | Manual Hive Harvest | Tolerances widened; consumer page displays `manual_evidence` |
| **AT-09** | Packaging Quota Gate | 10 kg batch with 500g jars issues max 19 units; 20th tag rejected |

---

## 👥 User Roles & Personas

- **Commercial Beekeeper / Farmer**: Hive monitoring, 9-step harvest wizard, batch creation, Madhukranti registration prompt.
- **Aggregator**: Batch intake, weight deviation inspection, lot pooling, packaging workbench.
- **Lab Analyst**: Sample intake tag verification, structured report entry with automated threshold checks.
- **Regulator / KVK Officer**: Madhukranti certificate approvals, harvest witnessing, risk-ranked audit queues.
- **Station Manager**: Reference apiary zone management (Zones A–D), dataset exports.
- **Consumer**: Zero-login, instant jar check via QR or NFC tap with direct Polygonscan ledger links.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
