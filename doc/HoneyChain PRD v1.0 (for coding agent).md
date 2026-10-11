# HoneyChain: Product Requirements Document

Version 1.0 | 11 Oct 2026 | Team Iconics (Team ID 189024) | Problem statement SIH26021 | Audience: coding agent

## 0. Rules for the coding agent

1. Build in the milestone order in section 12. After each milestone, run its acceptance scenarios (section 11) against seed data. Do not start the next milestone until they pass.
2. Anything that looks like a regulation, threshold or tolerance is **config**, stored in config tables with the defaults in Appendix A. Never hard-code it. Regulatory values are marked 'verify before launch'.
3. Three risky dependencies sit behind interfaces so they can be swapped: `LedgerAdapter` (besu or mock), `TagCrypto` (ntag424 or virtual), `RegistryVerifier` (mock now, Madhukranti later).
4. Where this PRD is ambiguous, take the default in section 13 and log the choice in `DECISIONS.md`.
5. Hardware is out of scope (the problem statement category is Software). Telemetry arrives through the ingestion API, and a simulator ships with the app.
6. The consumer UI shows verification status checklists only. It never shows a numeric trust score.
7. Evidence records are append-only. A correction is a new record pointing at the old one (`supersedes_id`).
8. Keep modules small, use boring well-known libraries, and add no infrastructure beyond section 4. Note any new dependency in the README.
9. Deliverables: running app, seed script, scenario runner (executes section 11), README with setup steps written for a newcomer, `.env.example`, `DECISIONS.md`.
10. Never log secrets. The master tag key and ledger keys live only in server environment variables.

## 1. Product summary

**One line:** HoneyChain gives beekeepers, aggregators, labs and regulators one audit-ready record of honey from hive to jar, and gives consumers a one-tap check that a jar is genuine.

**Problems (from the SIH PDF):** unverifiable origin; post-harvest adulteration and substitution; no Indian reference data; limited lab capacity; syrup feeding; low beekeeper income.

**Goals**

- G1: Evidence chain Hive > Batch > Lab > Jar > Consumer, every step a signed, hashed event.
- G2: Detect syrup feeding with mass balance, a feeder lock and quarantine rules.
- G3: Tamper-evident NFC verification plus QR lookup, with honest trust labels.
- G4: Support farmer-led and aggregator-led flows on one backend.
- G5: Reference Honey Station mode and an open reference dataset.
- G6: Low-cost adoption: few cheap sentinel-hive sensors plus manual evidence for the rest.

**Non-goals:** selling or building hardware; payments; live FSSAI or Madhukranti integration (adapters only); proving purity in software (labs do that); numeric consumer trust scores; native mobile apps.

**Personas**

| Persona | Needs | Device |
| --- | --- | --- |
| Beekeeper / farmer (commercial) | Hive status, harvest wizard, batch, lab tracking, market | Phone, Tamil/Hindi/English |
| Aggregator | Intake, pooling, lab requests, packaging, tagging | Desktop and phone |
| Lab analyst | Receive samples, enter signed reports | Desktop |
| Regulator / KVK officer | Witness harvests, verify registry, audit, recall, review flags | Desktop and phone |
| Station manager (ICAR, KVK, university) | Reference station setup, dataset export | Desktop |
| Retailer | Checkpoint scan before sale | Phone or Pi station |
| Consumer | Tap or scan a jar | Phone, no login |

**Demo success criteria:** the 10 scenarios in section 11 pass; the four PDF prototype screens reproduce from seed data; the farmer flow runs end to end in under 10 minutes; a cloned tag is rejected live.

## 2. Cross-check against the SIH PDF (Real\_Project\_Honey.pdf)

Tags: **Aligned**, **Extended** (beyond the PDF), **Deviation** (differs on purpose), **Gap added** (missing from earlier planning, now included), **Fix deck** (the PDF should change).

### 2.1 Content mapping

| PDF page | What the PDF says | PRD handling | Tag |
| --- | --- | --- | --- |
| 1 | SIH26021, category Software, theme Agriculture, FoodTech and Rural Development | Software-only build. Hardware replaced by simulator plus ingestion API. | Aligned |
| 2 problems | Unverifiable origin; adulteration and substitution; no reference data; limited lab capacity; syrup feeding | Origin M2/M8/M12. Substitution: tag quota M10, seals M9, retest M14. Reference data M16. Lab capacity: risk-ranked testing M15. Syrup: mass balance, feeder lock M4/M6/M7. | Aligned |
| 2 solution | QR authenticity; Hive>Batch>Lab>Jar>Consumer; moisture/FSSAI reports linked to batch; verified marketplace | M12; M8 to M13; M9; Market Lite M17 | Aligned. Marketplace was **Gap added**. |
| 2 wow | Reference stations; anti-substitution; Indian reference dataset; beekeeping management | M16; M10/M14; M16; M2 to M7 | Aligned |
| 2 result | Each sample bound to its feed and hive record, lab tested, linked to jar by tamper-evident NFC | Acceptance test AT-01. Needs a **feed lot and feed sample** entity. | Extended |
| 3 stack | ESP32, LoRa, Raspberry Pi gateway, FastAPI, PostgreSQL, Hyperledger Besu, NTAG 424 DNA TagTamper, React, Flutter | Bun API, React PWA, Supabase Postgres, Besu via LedgerAdapter, NTAG 424 DNA, Pi as NFC station. ESP32, LoRa and gateway not built. | Deviation D1 to D3 |
| 3 workflow | 12 steps; every step is a signed event, DB record, hash anchored | Section 2.2, M13 | Aligned |
| 3 apps | Beekeeper app, lab/regulator dashboard, consumer page | Plus aggregator console and station UI; lab and regulator get separate role views | Extended |
| 4 | Four prototype screens | Section 2.3 | Aligned with fixes |
| 5 | Station zones A (3 natural), B (2 controlled feeding, research only), C (3 crop field), D (2 optional transition); 10 colonies; control and sample room (weigh and split, NFC vials, recorded feed samples, 4 C cold storage); host institution and off-site lab; plug into Madhukranti and NBHM | M16 station mode, hive modes, feed samples, storage events, adapters | Aligned / Extended |
| 6 | Gated entrances and rotation, field tunnels, heat stress logging, layered evidence, risk-ranked testing, open data standard, B2G | Heat alerts M5; layered evidence and risk ranking M15; open data standard M16; physical measures are not software | Aligned. Risk ranking and layered evidence were **Gap added**. |
| 7 | Regulators, beekeepers (no hardware cost), exporters, institutions, consumers (verification status, no inflated scores) | Sentinel plus manual evidence levels; consumer page shows status only | Aligned |
| 7 stats | 70% adulteration, 10,000+ crore pollination, FPO margins | Not product requirements | Fix deck |
| 8 | Eight ICAR references | Source list for threshold config | Aligned |

### 2.2 The PDF's 12-step workflow mapped to modules

| Step | PDF | Module | Note |
| --- | --- | --- | --- |
| 1 | Register hive, apiary | M2 |  |
| 2 | Feed + scales (feed mass, weight) | M3, M6 | Feeder scale only on research hives |
| 3 | Harvest (witnessed weight) | M7 | Witness is an OTP-confirmed person |
| 4 | Split samples (retained + lab) | M9 |  |
| 5 | Seal and tag (NFC vial, log) | M9, M11 |  |
| 6 | Lab test (signed result) | M9 |  |
| 7 | Mass balance (no extra kg) | M4 and M10 | Runs at harvest (allowable yield) and at packaging (tag quota) |
| 8 | Ledger anchor (Merkle roots) | M13 | Continuous background job, not one step |
| 9 | Package (NFC on jar) | M10, M11 |  |
| 10 | Distribute (scan each hop) | M14 |  |
| 11 | Consumer tap (server check) | M12 |  |
| 12 | Audit (retest, recall) | M14 | Uses the retained sample |

### 2.3 Prototype screens that must be reproducible

| Screen | Required content (seed data in section 11) |
| --- | --- |
| 1. My hives | Hive cards with status dot and net 24 h gain (+1.8 kg, +1.1 kg, +0.9 kg) or alert label (Mite risk); an alert banner 'mite risk in Hive #7, inspect'; bottom navigation Hives, Batches, Market |
| 2. Create batch | Batch ID `HC-0421`, apiary Kanchipuram, lab report 'Attached', QR code, text 'Hash 9f3a...c21e stored on ledger', Print QR label button |
| 3. Scan result OK | 'Authentic honey'; batch, origin Kanchipuram TN, harvested 14 Sep 2026, moisture 17.8% (pass); four check rows: Hive, Lab report, Jar sealed, Store shelf, each verified |
| 4. Scan result X | 'Tampered or fake'; batch `HC-0999`; status 'Hash mismatch'; failed stage name; text 'This jar cannot be verified. Do not buy. Report it.'; Report to FSSAI button |

Row meanings: **Hive** = evidence level of source hive; **Lab report** = report linked and system-verified; **Jar sealed** = tag tamper status; **Store shelf** = latest retail checkpoint scan.

### 2.4 Deviations and deck fixes

- **D1** Backend is Bun with Hono, not FastAPI (team decision). **D2** React PWA, no Flutter. **D3** ESP32, LoRa and gateway are not built; the ingestion API accepts what the gateway would send.
- **D4** The PDF implies a hash on the tag. In this PRD the tag holds a public pointer plus a chip-signed tap code, and the hash lives on the server and is anchored in Merkle roots. The UI still shows the hash prefix, as in screen 2. Reason: a static hash on a tag can be copied to a blank tag.
- **D5** Madhukranti is a mock adapter. No public verification API was confirmed.
- **D6** 'Report to FSSAI' creates a case and a pre-filled complaint document. There is no live FSSAI submission.
- **F1** Screen 4 says 'Failed at Step 3 (lab)', but lab testing is step 6 in the 12-step workflow. Show a named stage instead.
- **F2** 'Eradicating 70% adulteration crisis' is unsourced and overclaims. Reword and cite.
- **F3** Typos: 'adultration', 'trad margins', 'STARTEGIES', 'FEASABILITY'; slide 4 text carries page number 6.
- **F4** 'No hardware cost' for beekeepers holds only with the sentinel-plus-manual model. Say so on slide 7.
- **F5** Check the ICAR reference links resolve (they mix icar.gov.in and icar.org.in).
- **F6** Slide 3 must match the stack actually built.
- **F7** The PDF says QR-based authenticity and NFC tap. State that NFC is the cryptographic check and QR is record lookup, or reviewers will point out QR codes can be copied.

## 3. Scope and priorities

| Module | Priority |
| --- | --- |
| M1 Auth, organisations, registry and licence gates | P0 |
| M2 Apiary and hive registry | P0 |
| M3 Telemetry ingestion, manual weigh-ins, simulator | P0 |
| M4 Insight engine | P0 |
| M5 Alerts | P0 (in-app); SMS/WhatsApp mock P2 |
| M6 Feeding, equipment, forage events | P0 |
| M7 Harvest wizard | P0 |
| M8 Lots and batches: single-origin, both flows | P0; blended batches P1 |
| M9 Samples, labs, reports | P0 |
| M10 Packaging, units, labels | P0 |
| M11 Tags: virtual tag P0; real NFC and Pi station P1 | P0 / P1 |
| M12 Verification and consumer page | P0 |
| M13 Custody events and hash chain: DB hash chain P0; Besu anchoring P1 | P0 / P1 |
| M14 Checkpoints, recall, audit and retest, public reports | P1 |
| M15 Risk-ranked testing and evidence layers | P1 |
| M16 Reference station mode and dataset export | P1 (public dataset API P2) |
| M17 Market Lite | P1 |
| i18n: English P0, Tamil P1, Hindi P2; mite image model P2; Madhukranti/NBHM live API P2 | as listed |

## 4. Architecture

**Components**

- `web`: React, Vite, TypeScript, Tailwind, installable PWA. Role-based routes. Mobile first.
- `api`: Bun with Hono, TypeScript. REST JSON. Verifies Supabase JWTs. Uses the service role for ingestion, public verify and jobs.
- `db`: Supabase Postgres, Auth (phone OTP and email), Storage (photos, report PDFs). Row-level security scoped by organisation.
- `jobs`: scheduled workers (same codebase): insight evaluation every 15 min, daily features nightly, offline-node detection, report-validity expiry, anchoring.
- `ledger`: Hyperledger Besu dev node in Docker, behind `LedgerAdapter`. A `mock` adapter writes anchors to the DB so everything runs without Docker.
- `station`: Python script on a Raspberry Pi with a PN532 module. Thin client: NFC read/write only. All keys and decisions stay on the API.
- `simulator`: Bun script that posts realistic signed telemetry (section 7, M3).
- External: Open-Meteo for weather (P2), a QR library, a PDF label generator.

**Suggested repository layout:** `apps/web`, `apps/api` (with `modules/` folders named M1 to M17), `apps/station`, `packages/shared` (types, validation schemas, canonical hashing), `tools/simulator`, `tools/scenarios` (acceptance runner), `config/` (seeded defaults), `supabase/migrations`, `docs/`.

**Data flow:** simulator or gateway > ingestion API > `telemetry_logs` > jobs compute features and insights > alerts > web. Manual events and the harvest wizard write evidence records > each write also creates a custody event with a chained hash > anchoring job batches pending hashes into a Merkle root > LedgerAdapter > `anchors`.

## 5. Roles and permissions

| Capability | Farmer | Aggregator | Lab | Regulator / KVK | Station mgr | Admin | Public |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Own hives, telemetry, events | Y | - | - | read | Y (station hives) | Y | - |
| Record harvest | Y | - | - | witness | Y | - | - |
| Create lot / batch | Y (own) | Y | - | - | Y | - | - |
| Intake a farmer lot | - | Y | - | - | - | - | - |
| Request lab test | Y | Y | - | - | Y | - | - |
| Submit lab report | - | - | Y | - | - | - | - |
| Package, provision tags | Y if FSSAI no. | Y if FSSAI no. | - | - | Y | - | - |
| Checkpoint scan | Y | Y | Y | Y | Y | - | - |
| Recall or hold a batch | own | own | - | Y | - | Y | - |
| Run audit / retest | - | - | - | Y | - | Y | - |
| Verify registry | - | - | - | Y | - | Y | - |
| Reference dataset | consent only | - | - | read | Y | Y | P2 |
| Verify a jar | Y | Y | Y | Y | Y | Y | Y |

## 6. Domain model (key tables and fields; the agent writes the SQL)

All tables: `id` (uuid), `created_at`, `org_id` where relevant. Evidence tables are append-only (no update or delete; enforce with database rules). Use `supersedes_id` for corrections.

| Table | Key fields |
| --- | --- |
| `organisations` | type (farmer, society\_fpo, aggregator, lab, retailer, station, regulator), name, state, district, language, madhukranti\_no, registry\_status (not\_registered, self\_declared, verified, expired), registry\_checked\_at, fssai\_no, iec\_no, apeda\_no |
| `users` | auth id, org\_id, role, phone or email, language |
| `apiaries` | org\_id, name, type (farm, station), district, lat, lon, zone\_config |
| `hives` | apiary\_id, hive\_code (HV-###), species (apis\_cerana\_indica, apis\_mellifera), box\_type, frame\_count, mode (production, research\_fed, transition), zone (A to D), forage\_type (natural, crop\_field, controlled\_feed), evidence\_capability (sensor, manual), feeder\_state (locked, open, quarantine), quarantine\_until, supers\_on, supers\_on\_since, weight\_at\_supers\_on\_kg, target\_super\_gain\_kg, node\_id, device\_public\_key, status. Rule: production hives can never have feeder\_state open. |
| `telemetry_logs` | hive\_id, message\_id, seq, recorded\_at, hive\_weight\_kg and std, feeder\_weight\_kg, brood temp and RH, ambient temp and RH and pressure, lid\_open, battery\_v, quality\_flags, signature\_valid, payload\_hash. Unique (hive\_id, recorded\_at) and (hive\_id, seq). |
| `manual_weights` | hive\_id, weighed\_at, kg, method, photo, recorded\_by |
| `daily_features` | hive\_id, date, w\_dawn, w\_dusk, w\_next\_dawn, g\_day, l\_night, net24, flow\_state, completeness\_pct |
| `equipment_events` | hive\_id, type (super\_on, super\_off, frames\_added, moved), count, mass\_kg, at |
| `feed_lots` | feed\_type, sugar\_fraction, supplier, lot\_no, receipt\_photo, sample\_retained (bool), sample\_tag\_id |
| `feeding_logs` | hive\_id, fed\_at, source (auto, manual), feed\_lot\_id, purpose, mass\_added, mass\_consumed, sugar\_consumed (generated), supers\_on, quarantine\_until |
| `forage_logs` | hive\_id or apiary\_id, flora\_or\_crop, bloom\_start, bloom\_end, pollen\_sample\_ref, note |
| `inspections` | hive\_id, at, mite\_count\_per\_100\_bees or sticky\_board\_count, photo, queen\_seen, brood\_pattern, notes, checklist (sacbrood, wax moth) |
| `insights` | hive\_id, type, severity, confidence, evidence (JSON), explanation, raised\_at |
| `alerts` | hive\_id, kind, severity, title, what\_we\_saw, steps\[\], raised\_at, acknowledged\_at, resolved\_at, dedupe\_key |
| `harvest_records` | hive\_id, harvested\_at, supers\_removed, weights before and after, comb\_tare, extracted\_honey\_kg, allowable\_yield\_kg, syrup\_deducted\_kg, yield\_check, weight\_agreement, moisture\_pct, moisture\_check, capped\_pct, photos, witness (name, phone hash, verified\_at), evidence\_level (sensor\_verified, manual), override\_reason |
| `lots` | farmer\_org\_id, current\_holder\_org\_id, harvest\_record\_id, kg\_declared, kg\_received, status (READY, ACCEPTED, REJECTED, IN\_BATCH), intake\_moisture, intake\_seal\_status |
| `batches` | public\_code (HC-####), owner\_org\_id, workflow\_template, destination (domestic, export), kg\_net, status, report\_id, event\_head\_hash |
| `batch_composition` | batch\_id, lot\_id, kg |
| `samples` | batch\_id, kind (lab, retained, feed), tag\_id, mass\_g, storage\_location, status (SEALED, IN\_TRANSIT, AT\_LAB, COMPROMISED, ARCHIVED) |
| `labs` | org\_id, accreditation\_no, panels\[\], location, active |
| `lab_requests` | sample\_id, lab\_id, panel, type (initial, audit), status |
| `lab_reports` | sample\_id, lab\_id, panel, values (JSON), pdf\_hash, verdict\_lab, verdict\_system, issued\_at, valid\_until |
| `units` | batch\_id, serial, public\_code (HC-####-####), size\_g, tag\_id, status (ISSUED, ACTIVE, SOLD, SPOILED, RECALLED) |
| `tags` | uid, role (sample, unit, bulk), kind (ntag424, virtual), state (PROVISIONING, ACTIVE, SPOILED), last\_counter, provisioned\_by\_station |
| `scan_events` | tag\_id or code, mode (nfc, qr), result, counter, ip\_region, at |
| `custody_events` | subject\_type, subject\_id, batch\_id, type, actor\_user\_id, org\_id, tag\_id, location, payload, prev\_hash, event\_hash |
| `anchors` | merkle\_root, tx\_hash, event\_from, event\_to, anchored\_at, ledger (besu, mock) |
| `risk_scores` | batch\_id, score, factors (JSON), computed\_at |
| `audit_cases` | batch\_id, opened\_by, reason, retest\_request\_id, result (match, deviation), status |
| `public_reports` | code, reason, photo, contact (optional), status, assigned\_to |
| `listings`, `inquiries` | batch\_id, price\_per\_kg (optional), kg\_available, status; inquiry thread |
| `stations` | org\_id, public\_key, name, active (NFC station devices) |
| `config_*` | panels, thresholds, species parameters, gate levels per state, alert text (en, ta, hi) |

## 7. Functional requirements

Priority follows section 3. AC means acceptance criteria.

### M1 Auth, organisations, registry and licence gates

| ID | Requirement | AC |
| --- | --- | --- |
| FR1.1 | Phone OTP login for farmers, email login for other roles (Supabase Auth). Dev mode uses a fixed OTP. | Seeded user of each role can log in |
| FR1.2 | Organisation profile: type, location, language, Madhukranti number, FSSAI number, optional IEC and APEDA numbers | Invalid formats rejected |
| FR1.3 | `RegistryVerifier` interface with a mock. Farmer enters number and uploads the certificate; regulator or admin verifies in a review queue. Statuses: not\_registered, self\_declared, verified, expired. | Unverified farmer sees a banner on every screen; verification clears it |
| FR1.4 | Registry gate at batch creation. If status is not verified and the state's gate level is required, return 403 `REGISTRY_REQUIRED` with a register link and a three-step how-to. Gate level recommended only warns. | Blocked, then allowed after verification |
| FR1.5 | Gate level per state lives in config | Config change alters behaviour without redeploy |
| FR1.6 | FSSAI gate at packaging and tag provisioning: 403 `FSSAI_REQUIRED` without an FSSAI number | Blocked until saved |
| FR1.7 | Row-level security by organisation. Labs see only requests addressed to them. Public verify runs through the API only. | Cross-org reads return nothing |

### M2 Apiary and hive registry

- **FR2.1** Register an apiary with phone GPS and district.
- **FR2.2** Register a hive: auto `hive_code`, species, box type, frames, mode, zone, evidence capability (sensor or manual).
- **FR2.3** Device binding: create a device record with a public key for a sensor node. The simulator uses a seeded key.
- **FR2.4** A production hive can never have `feeder_state` open (database constraint plus API 409).
- **FR2.5** Station apiary: zones A to D, colony cap (default 10), per-zone forage type; zone D hives use mode transition.
- **FR2.6** Species parameter sets (config) are chosen from the hive's species.

### M3 Telemetry ingestion, manual weigh-ins, simulator

| ID | Requirement | AC |
| --- | --- | --- |
| FR3.1 | `POST /ingest/telemetry` takes the Appendix C message. Verify the signature, reject duplicate `message_id`, non-increasing `seq` and timestamps over 10 minutes in the future. Store the raw message and the parsed rows. Return 202 with a per-reading result. | Replay of the same message is rejected |
| FR3.2 | Plausibility checks (ranges, stuck values: 12 identical readings with zero std). Flagged readings are stored but excluded from decisions. | Fault scenario produces flags and no false alerts |
| FR3.3 | Optional temperature compensation from `platform_temp_c` with a per-hive coefficient (default 0) | Coefficient config applies |
| FR3.4 | Offline job: no data for 3 h from a sensor hive raises 'Sensor offline'. Text must say this does not mean the colony is in trouble. | Offline scenario raises exactly one alert |
| FR3.5 | Manual weigh-in form for manual hives (kg, method, photo). Stored in `manual_weights` and marked lower evidence. | Weekly series appears on the hive page |
| FR3.6 | Simulator: deterministic seed; scenarios normal\_flow\_day (both species), dearth, swarm, abscond, heat\_stress, syrup\_feeding, tamper\_lid\_open, sensor\_fault, offline; time-lapse mode; posts through the real ingestion API with valid signatures; CLI to load a scenario on a hive | Each scenario runs from one command |

### M4 Insight engine

| ID | Requirement | AC |
| --- | --- | --- |
| FR4.1 | Daily features per hive (nightly, plus rolling for today): formulas in section 8 | Values match simulator expectations |
| FR4.2 | Flow state: strong, waning, dearth | Normal flow scenario reaches each state in order |
| FR4.3 | Harvest readiness checklist with five conditions, each pass or fail with an explanation | All five pass only in the ready fixture |
| FR4.4 | Mass balance and syrup signature (section 8). A SYRUP\_RISK result sets feeder\_state to quarantine for affected supers. | syrup\_feeding scenario flags within 6 hours |
| FR4.5 | Anomaly rules: swarm, abscond, colony failure, queen suspicion, heat stress, chill, tamper (section 8 table) | Each scenario yields the expected insight and no others |
| FR4.6 | Each insight stores rule ID, severity, confidence, evidence points, plain-language explanation | Visible in the hive detail timeline |
| FR4.7 | Species-specific parameters. Cerana hives show an absconding, sacbrood and wax-moth checklist, not a Varroa score. | UI differs by species |
| FR4.8 | Rules are pure functions of the time series and config, each with simulator fixtures | Scenario runner passes |

### M5 Alerts

- **FR5.1** Alerts come from insights using the Appendix B catalog: plain title, what we saw, at most three action steps, severity.
- **FR5.2** Dedupe by `dedupe_key`; 6 h cooldown; auto-resolve when the condition clears.
- **FR5.3** Actions: Done, Remind me in 2 h, Need help (messages the linked KVK or regulator contact).
- **FR5.4** Critical alerts unacknowledged for 4 h notify the escalation contact.
- **FR5.5** In-app list and badge (P0). Push, SMS and WhatsApp as mock adapters (P2).
- **FR5.6** Alert text from config in English (P0) and Tamil (P1). Severity uses colour, icon and word together.

### M6 Feeding, equipment and forage events

| ID | Requirement | AC |
| --- | --- | --- |
| FR6.1 | Feed event form: feed lot, purpose, mass, supers on or off. On a **locked production hive**, only purpose emergency\_survival is accepted; it logs the event, quarantines all supers on the hive for the clean period, raises a critical alert, and adds a risk factor. Reason: blocking the entry would encourage hiding it. | Emergency feed on hive #3 quarantines its supers and excludes them from harvest |
| FR6.2 | On research hives, feeder-scale drops auto-create a feeding log with source auto; the farmer confirms the feed lot | Auto log appears within one cycle |
| FR6.3 | Feed lot register: type, sugar fraction, supplier, lot number, receipt photo. A **feed sample** can be retained as a `samples` row of kind feed with its own tag. | Harvest record can trace back to feed lots used |
| FR6.4 | Equipment events (supers on or off with count and mass, frames added, hive moved). The harvest wizard cannot compute allowable yield without `supers_on_since`. | Wizard shows a clear message |
| FR6.5 | Forage log: flora or crop, bloom window. At a station, also sowing date and pollen sample reference. | Appears in the dataset export |
| FR6.6 | Feeder lock state machine (section 8). Release after the clean period or when affected supers are removed. | State transitions logged as custody events |

### M7 Harvest wizard

| Step | What happens |
| --- | --- |
| 0 Gate | Show readiness checklist, allowable yield, and any quarantined supers (excluded) |
| 1 Select | Hive, supers and frames removed |
| 2 Weigh before | Sensor hives: device captures `W_before` when weight is stable (within 10 g for 60 s). Manual hives: enter weight with photo. |
| 3 Weigh after | Same, giving `W_after` and removed mass |
| 4 Photos | At least three geotagged, timestamped photos; store file hashes |
| 5 Extract and measure | Extracted honey kg (photo of scale), container tare, refractometer moisture with photo and honey temperature, frame tare default editable |
| 6 Auto checks | Allowable yield, three-way weight agreement, moisture limit, quarantine exclusion. Result per check: pass, review, block. |
| 7 Retained vial | Shown as the sample step in M9 (tag scan comes from a phone or the station) |
| 8 Witness and sign | Witness phone OTP and farmer OTP |
| 9 Submit | Create `harvest_record`, a lot (status READY) and a custody event |

- **FR7.1** Block result stops the wizard; the farmer can submit for review, which creates a task for the regulator or KVK. Review result continues but flags the record for audit.
- **FR7.2** `evidence_level` is sensor\_verified only when the hive is sensor-capable, data completeness over the supers-on window is at least 90%, and both weights were captured by the device. Otherwise manual.
- **FR7.3** Drafts persist locally per step and sync later. Submission is idempotent.
- **AC** AT-01, AT-02 and AT-08 in section 11 pass.

### M8 Lots and batches (both flows)

| ID | Requirement | AC |
| --- | --- | --- |
| FR8.1 | One lot is created per harvest record | Lot appears after harvest |
| FR8.2 | `workflow_templates` config: farmer\_direct, aggregator\_single\_origin, aggregator\_blended. Each lists steps, allowed roles per step and optional steps. Every write endpoint checks it. | Wrong role gets 403 with the step name |
| FR8.3 | **Flow A:** farmer creates a batch from own READY lots, picks destination (domestic or export). Several own lots count as blended and need a new test. Registry gate applies. | Create Batch screen matches PDF screen 2 |
| FR8.4 | **Flow B intake:** farmer sends a lot to an aggregator; aggregator confirms receipt with received weight, refractometer moisture and seal scan. Auto-compare to declared weight (tolerance in config). Accept or reject; custody moves to the aggregator. | Out-of-tolerance weight forces review |
| FR8.5 | Pre-tested lot: farmer may attach a report from an earlier test. Reuse is allowed only if the sample UID matches a sample of that lot, the lot is not blended, the report is within validity, and the retained seal is intact. Otherwise re-test. | Each failing condition blocks reuse with its reason |
| FR8.6 | Blended batch (P1): composition rows; lot-level reports no longer certify; new sample required; output kg cannot exceed input kg minus loss | Over-allocation rejected |
| FR8.7 | Public codes: batch `HC-####`, unit `HC-####-####`, unique and sequential | No duplicates under concurrent creation |
| FR8.8 | A batch's QR resolves immediately to the verify page, showing 'not yet certified' until a passing report exists | QR before test shows that state |

### M9 Samples, labs, reports

| ID | Requirement | AC |
| --- | --- | --- |
| FR9.1 | Draw two samples per batch in one session (lab and retained). Record mass, photo, tag UID; reject UIDs already used. | Duplicate UID rejected |
| FR9.2 | Panels in config: domestic (FSSAI honey standard panel) and export (domestic plus NMR). An export report satisfies domestic sale; a domestic report does not satisfy export. Verify current regulation before launch. | Export batch with domestic report is blocked at certification |
| FR9.3 | Lab directory with accreditation numbers and panels. User picks a matching lab; a `lab_request` is created. | Lab sees the request in its inbox |
| FR9.4 | Custody events for sealed, handed to courier, received at lab, opened. Lab scans the tag on receipt. | Timeline shows each hop |
| FR9.5 | Tamper open or invalid tag at receipt sets sample COMPROMISED and batch ON\_HOLD for review | AT-06 passes |
| FR9.6 | Lab report form with structured values per panel, PDF upload, OTP confirmation, PDF hash stored | Hash stored and shown |
| FR9.7 | System recomputes the verdict from values and thresholds. If it differs from the lab's verdict, the report goes to review and the batch stays uncertified. | Mismatch fixture triggers review |
| FR9.8 | Report validity window (config). Expiry sets the batch to needing retest before new sales. | Expiry job works |
| FR9.9 | Retained sample archived with storage location (including 4 C cold storage); any opening is a custody event | Opening logs an event |

### M10 Packaging, units, labels

- **FR10.1** Packaging requires batch status TEST\_PASSED and an FSSAI number on the packing organisation.
- **FR10.2** Tag quota: floor of batch net kg times (1 minus handling loss) divided by unit size. Provisioning beyond quota is refused.
- **FR10.3** Create units with serials and public codes; generate a printable label (PDF) with QR and human-readable code.
- **FR10.4** Reconciliation view: issued, active, sold, spoiled, in stock. A mismatch raises a flag.
- **FR10.5** Bulk (drum) units use the same flow with a bulk tag role.
- **AC** AT-01 and AT-09 pass.

### M11 Tags and the Pi station

| ID | Requirement | AC |
| --- | --- | --- |
| FR11.1 | `TagCrypto` interface with two implementations: ntag424 (real chip, per-tag key derived from a server master key and the UID, signed tap code with counter) and virtual (software chip, same verification maths, labelled 'demo tag' in the UI) | Same verify endpoint works for both |
| FR11.2 | Provisioning sequence: read UID; server checks UID unused and records the UID mapping first; derive per-tag key; write URL template with tap authentication and counter enabled; change keys and set read-only; read back; server verifies first tap; mark ACTIVE. Any failed step marks the tag SPOILED. | Failed run leaves a SPOILED tag and no ACTIVE one |
| FR11.3 | Tag content is a URL with the public code plus the chip's signed tap data. No mutable data on the tag. | Status change needs no rewrite |
| FR11.4 | Station API (authenticated by station key): provision start, provision confirm, provision spoil, verify tap, checkpoint scan | Station does no business logic |
| FR11.5 | Station has three modes: Provision, Verify, Checkpoint. Python script with a small local screen or web page. | Each mode works against the API |
| FR11.6 | Fallbacks: provisioning with an Android NFC tool if the PN532 cannot complete the lock step; manual code lookup if offline | Documented in README |

### M12 Verification and consumer page

- **FR12.1** One public endpoint resolves a tap or a code into a result: `VERIFIED`, `RECORD_ONLY` (QR, no tap proof), `TAMPER_OPEN`, `SIGNATURE_INVALID`, `COUNTER_REPLAY`, `UNKNOWN_TAG`, `BATCH_HELD`, `RECALLED`, `REPORT_EXPIRED`.
- **FR12.2** Every verification writes a `scan_events` row. Flag anomalies: counter jumps far ahead; one tag scanned from distant regions in a short time.
- **FR12.3** Consumer page shows: result banner, batch code, district-level origin, harvest date, moisture with pass label, four check rows (Hive, Lab report, Jar sealed, Store shelf), lab name and report link, hop-level timeline, hash prefix and anchor status, and a Report this jar button. Farmer names only with consent. No numeric trust score.
- **FR12.4** The assurance label differs: NFC tap shows 'Verified'; QR shows 'Record found. Tap the jar to confirm it is genuine.'
- **FR12.5** The tamper screen shows the named failed stage (not a step number) and a Report to FSSAI button that creates a public report case (FR14.4).
- **FR12.6** Rate-limit by IP; no login; pages work on slow networks.

### M13 Custody events and anchoring

- **FR13.1** Every evidence write creates a custody event: subject, type, actor, org, location, canonical payload. `event_hash` is SHA-256 of the previous event hash plus the canonical payload (sorted keys). Chain is per batch; pre-batch events chain per lot or hive.
- **FR13.2** Events are append-only, enforced in the database.
- **FR13.3** Anchoring job (default every 10 minutes): collect un-anchored hashes, build a Merkle tree, call `LedgerAdapter.anchor(root, timestamp)`, store `anchors`, keep per-event proof paths.
- **FR13.4** `GET` proof endpoint returns the Merkle path and anchor reference for any event.
- **FR13.5** Adapters: besu (single contract storing roots, local Docker node) and mock (DB). Selected by environment.
- **FR13.6** Verify page shows 'anchored' only after the anchor transaction is confirmed. A hash that fails its proof returns 'Hash mismatch'.

### M14 Checkpoints, recall, audit and retest, public reports (P1)

- **FR14.1** Checkpoint scan (phone or station) logs received, dispatched or sold, with operator and location. Latest retail scan feeds the 'Store shelf' row.
- **FR14.2** Recall: owner or regulator marks a batch RECALLED with reason. All units become RECALLED, verify shows it, and every organisation that held the batch (from custody events) gets an in-app notice.
- **FR14.3** Audit and retest: regulator opens an audit case, requests a retest of the retained sample (lab request of type audit), and compares key values to the original within configured tolerance. Deviation holds the batch and raises risk.
- **FR14.4** Public report: consumer submits code, reason, optional photo and contact. Case goes to the regulator queue with a generated pre-filled complaint text. No live submission to FSSAI.

### M15 Risk-ranked testing and evidence layers (P1)

- **FR15.1** Evidence layers per batch, shown as a checklist: L1 device data, L2 witness, L3 geotagged photos, L4 refractometer, L5 lab report, L6 verified tag. Missing layers are shown, not scored.
- **FR15.2** Internal risk score (0 to 100) for regulators and aggregators only. Weighted factors in config: manual evidence level, yield in review band, emergency feeding event, tamper event, blended batch, new farmer, lab mismatch, scan anomalies, prior failures, expired registry.
- **FR15.3** Audit queue sorted by risk score, with the factors shown. Used to prioritise retests when lab capacity is limited.

### M16 Reference station mode and dataset (P1)

- **FR16.1** Station organisations manage zones A to D, colonies, feed samples, forage and crop logs, pollen sample references and sample storage.
- **FR16.2** Dataset export (CSV and JSON with a data dictionary): station ID, species, zone, forage context, daily features, feeding events (flagged), sample IDs, lab values. Only reference-station data and farmers who gave consent.
- **FR16.3** Dataset records carry provenance links to batch, sample and report IDs. Anonymise farmer identity.
- **FR16.4** Adapter stubs for Madhukranti and NBHM export formats (P2).

### M17 Market Lite (P1)

- **FR17.1** A farmer or aggregator can list a TEST\_PASSED batch: kg available, destination, optional price per kg, verification summary.
- **FR17.2** Buyers (aggregators, exporters, retailers) browse listings and send inquiries; a simple message thread per inquiry.
- **FR17.3** No payments. Listing status: draft, open, closed. A listing closes automatically if the batch is held or recalled.
- **FR17.4** The Market tab appears in the bottom navigation, as in PDF screen 1.

### Screens by role

| Role | Screens |
| --- | --- |
| Farmer (bottom nav Hives, Batches, Market, plus Alerts and Harvest) | Hive list, hive detail (24 h chart, brood temp, allowable yield, harvest progress, feeder lock), alerts, harvest wizard, lot list, create batch, sample and lab tracker, packaging, registry prompt |
| Aggregator | Intake queue, lot to batch workbench, lab request tracker, packaging and tagging, listings |
| Lab | Request inbox, receive sample (scan), report form |
| Regulator / KVK | Registry review, witness tasks, risk-ranked audit queue, recall, public report cases, batch timeline |
| Station manager | Zones, colonies, feed lots and samples, dataset export |
| Station device | Provision, Verify, Checkpoint |
| Public | Verify page |

## 8. Business rules and formulas

All numbers are config defaults (Appendix A).

### 8.1 Allowable yield and mass balance

Terms (kg): `W_start` hive weight right after empty supers were added; `W_before` weight just before harvest; `E` equipment mass added or removed in the window (from equipment events); `C` consumption allowance (per day times days); `dF` total syrup mass that left the feeder since supers went on.

**Allowable yield = max(0, (W\_before - W\_start - E) + C x days - dF)**

Subtracting all of `dF` is deliberately conservative.

| Check | Pass | Review | Block |
| --- | --- | --- | --- |
| Declared extracted kg vs allowable | at most 3% over | 3% to 10% over | over 10% |
| Weight agreement: (removed mass - comb tare) vs declared | within 8% | 8% to 15% | beyond 15% |
| Moisture | at most 18.5% | 18.5% to 20% (warn) | over 20% (verify regulation) |

Manual hives use manual weigh-ins for `W_start` and `W_before`, and use the wider manual tolerances (Appendix A). Result is always labelled manual evidence.

### 8.2 Syrup signature (any two of three)

- Pearson correlation above 0.8 between hive gain rate and feeder loss rate over a rolling 6 h window, lag 0 to 2 h.
- Hive gain at night, in rain or in low-forage hours, with no morning foraging dip.
- Feeder activity with no daytime nectar curve and no night evaporation loss.

Result SYRUP\_RISK quarantines the supers on that hive.

### 8.3 Feeder lock state machine

| State | Meaning | Entry | Exit |
| --- | --- | --- | --- |
| locked | Production hive, no feeding expected | Default for production | Never open; goes to quarantine on emergency feed or syrup signature |
| open | Research hive, feeding allowed, supers off | Research hive setup | Feeding with supers on, or supers added within the clean period, goes to quarantine |
| quarantine | Supers excluded from harvest and batches | Triggers above | After the clean period (default 14 days) with no further feeding, or when affected supers are removed (equipment event) |

### 8.4 Daily features and harvest readiness

- Dawn and dusk anchors are computed from apiary latitude, longitude and date (no light sensor). `W_dawn`, `W_dusk`, `W_next_dawn` are the median reading within 30 minutes of each anchor.
- `G_day = W_dusk - W_dawn`; `L_night = W_dusk - W_next_dawn`; `Net24 = W_next_dawn - W_dawn` (the headline number).
- Flow states: strong (Net24 above threshold for 3 days), waning (positive but falling for 3 days), dearth (Net24 near zero for 5 days).
- Harvest ready needs all five: (1) super gain at least target (frames x kg per frame x fill factor); (2) flow past peak and night loss below 0.15 kg for 2 to 3 nights; (3) super RH below 60% and steady (only for hives with a super sensor, otherwise marked not assessed); (4) capped-honey photo at least 80%; (5) super not quarantined.
- Do not publish a moisture estimate from weight. The refractometer reading is the evidence.

### 8.5 Anomaly rules

Step detector: flag when the absolute weight change over 30 minutes exceeds the larger of the species step threshold and 8 times the burst std, holding for 2 consecutive readings.

| Rule | Trigger | Excludes | Severity |
| --- | --- | --- | --- |
| Swarm | Step drop of 1 to 3 kg (mellifera) between 10:00 and 15:00, warm and dry, no recovery in 4 h | Lid or motion event, logged harvest or inspection | Critical |
| Abscond (mostly cerana) | Step drop above the cerana threshold, then brood temp within 3 C of ambient inside 1 to 3 h | Same | Critical |
| Tamper or theft | Large drop or sharp step with lid\_open true, or any drop at an odd hour with no logged event | Logged harvest | Critical |
| Colony failure | Brood temp below 30 C for 6 h with ambient above 30 C, or no morning dip and no daytime gain for 5 days in flow | Sensor fault flags | Critical |
| Queen suspicion | Brood temp 24 h std above 2 C for 3 days with drift toward ambient. Text must say: inspect for eggs. | Heat or cold events | Warning |
| Heat stress | Brood temp above 37 C for 30 min (amber from 36.5) with high ambient | None | Critical |
| Chill | Brood temp below 32 C with ambient below 15 C | None | Warning |
| Syrup risk | Section 8.2, or emergency feed on a locked hive | None | Critical |

Insights are suspicion, never diagnosis. Every text says what to inspect.

### 8.6 Quotas and tolerances

- Tag quota = floor( batch net kg x (1 - handling loss) / unit size in kg ). Provisioning past quota is refused.
- Blended batch: output kg at most the sum of input kg minus loss.
- Delivery weight tolerance at intake: plus or minus 3% of declared.
- Reconciliation: units sold + in stock + spoiled = units issued.

### 8.7 Batch status machine

`DRAFT > SAMPLED > SAMPLE_IN_TRANSIT > AT_LAB > TEST_PASSED > PACKAGING > TAGGED > IN_DISTRIBUTION > SOLD_OUT`

Side states: `TEST_FAILED` (cannot be sold), `ON_HOLD` (reversible after review), `RECALLED` (final), `REJECTED` (aggregator intake). Lot states: `READY > ACCEPTED or REJECTED > IN_BATCH`. Every transition writes a custody event and is checked against the workflow template.

### 8.8 Species parameters (config)

| Parameter | A. mellifera | A. cerana indica |
| --- | --- | --- |
| Brood temp band | 33 to 36 C | 32 to 35 C |
| Strong flow Net24 | above +0.5 kg | above +0.15 kg |
| Step threshold | 0.8 kg | 0.4 kg |
| Consumption allowance C | 0.2 kg per day | 0.08 kg per day |
| Frame honey capacity | Deep Langstroth 3 kg, medium 2 kg | Newton frame 1.25 kg |
| Health module | Varroa mite trend, deformed wing suspicion | Absconding, sacbrood, wax moth checklist |

## 9. API

**Conventions:** base path `/api/v1`; JSON; UTC ISO timestamps; uuid ids; Supabase JWT bearer auth, except device ingestion (device signature), station endpoints (station key) and public verify (none). Error shape: code, message, details. Every POST that creates evidence accepts an `Idempotency-Key` header. List endpoints use cursor pagination. Role checks consult the workflow template.

| Area | Endpoints |
| --- | --- |
| Account | `GET /me`; `PUT /org`; `POST /org/registry` (submit number and certificate); `POST /admin/registry/:orgId/verify` |
| Hives | `POST /apiaries`; `POST /hives`; `GET /hives`; `GET /hives/:id`; `GET /hives/:id/series`; `POST /hives/:id/manual-weights`; `POST /hives/:id/equipment-events`; `POST /hives/:id/feeding-logs`; `POST /hives/:id/inspections`; `POST /feed-lots`; `POST /forage-logs` |
| Telemetry | `POST /ingest/telemetry` |
| Alerts | `GET /alerts`; `POST /alerts/:id/ack`, `/snooze`, `/help` |
| Harvest | `GET /hives/:id/harvest-readiness`; `POST /harvest-drafts`; `POST /harvests`; `GET /harvests/:id` |
| Lots, batches | `GET /lots`; `POST /lots/:id/deliver`; `POST /lots/:id/intake`; `POST /lots/:id/attach-report`; `POST /batches`; `GET /batches/:id`; `GET /batches/:id/timeline`; `POST /batches/:id/composition` |
| Samples, labs | `POST /batches/:id/samples`; `GET /labs`; `POST /lab-requests`; `POST /lab-requests/:id/receive`; `POST /lab-requests/:id/report` |
| Packaging | `GET /batches/:id/quota`; `POST /batches/:id/units`; `GET /units/:id/label.pdf` |
| Station | `POST /station/provision/start`, `/confirm`, `/spoil`; `POST /station/verify`; `POST /station/checkpoint` |
| Public | `GET /public/verify` (code or tap parameters); `POST /public/reports` |
| Anchoring | `GET /events/:id/proof`; `GET /batches/:id/anchors` |
| Governance | `POST /batches/:id/hold`, `/release`, `/recall`; `POST /audit-cases`; `GET /audit-queue`; `GET /public-reports`; `PUT /public-reports/:id` |
| Market | `GET /listings`; `POST /listings`; `POST /listings/:id/inquiries`; `GET /inquiries/:id/messages` |
| Reference and config | `GET /station/dataset` (csv or json); admin read and write of config tables |

## 10. Non-functional requirements

- **Security:** signed device messages (Ed25519), per-tag derived keys with the master key server-side only, row-level security, rate limits on public endpoints, no secrets in logs, photo and PDF uploads type- and size-checked.
- **Integrity:** evidence tables are append-only; corrections via `supersedes_id`; chained event hashes; Merkle anchoring.
- **Privacy:** consumer page shows district-level origin and no farmer name without consent; witness phone numbers stored hashed; dataset exports anonymised.
- **Offline and low bandwidth:** harvest wizard and event forms keep local drafts and sync later; images compressed before upload; consumer page kept light.
- **Performance:** hive list under 2 s for 50 hives; ingestion handles 100 hives at a 15-minute cadence without queueing.
- **i18n and accessibility:** string files per language; colour never the only signal; large touch targets; voice readout of alert steps is P2.
- **Observability:** structured logs with request IDs; a simple admin page showing job status (insight run, anchor run).
- **Testing:** the scenario runner (section 11) is the primary check. Keep unit tests to the pure rule functions plus the hashing and tag verification code.

## 11. Acceptance scenarios and seed data

**Seed data:** verified farmer org with apiary Kanchipuram and hives #12 (+1.8 kg), #9 (+1.1 kg), #7 (mite risk inspection data), #3 (+0.9 kg), matching PDF screen 1; an unregistered farmer; an aggregator with an FSSAI number; a demo lab with an accreditation number; a regulator user; a station org with research hives B1 and B2; complete batch `HC-0421` (harvested 14 Sep 2026, moisture 17.8%, passed report, tagged units); batch `HC-0999` with a deliberately mismatched hash.

| ID | Scenario | Expected |
| --- | --- | --- |
| AT-01 | Farmer happy path: simulator normal flow on hive #12, readiness reached, harvest, batch, two samples, lab pass, package 20 units, provision virtual tags, verify one | VERIFIED with four check rows; the result links hive, harvest, sample, report and unit; hash chain valid |
| AT-02 | Syrup fraud: research hive plus syrup\_feeding scenario; farmer declares more honey than allowed | SYRUP\_RISK within 6 h; supers quarantined; harvest Block; no lot created for the excess |
| AT-03 | Swarm scenario on a strong mellifera hive | Critical swarm alert within 30 min of the step, with inspect-for-queen-cells steps; no tamper alert |
| AT-04 | Heat stress scenario | Heat alert with 39 C wording and shade steps; auto-resolves after cooling |
| AT-05 | Unregistered farmer creates a batch | 403 REGISTRY\_REQUIRED with link; admin verifies; retry succeeds |
| AT-06 | Lab scans a vial whose tamper loop is open | Sample COMPROMISED, batch ON\_HOLD, certification blocked |
| AT-07 | Cloned tag, replayed counter, and HC-0999 | SIGNATURE\_INVALID, COUNTER\_REPLAY, and the tamper screen with 'Hash mismatch' and a named stage |
| AT-08 | Harvest on a manual hive | Evidence manual; wider tolerance applied; consumer page shows the manual label |
| AT-09 | Quota: 10 kg batch, 500 g jars, 2% loss | 19 units issued; the 20th provisioning refused |
| AT-10 | Aggregator flow: two lots, one pre-tested; intake with a 5% weight deviation | Deviation forces review; valid report reused only on the unblended pre-tested lot; blended batch requires a new sample (P1) |
| AT-11 (P1) | Recall a batch | Verify shows recalled; holders notified; listing closes |
| AT-12 (P1) | Audit retest of the retained sample deviates | Batch ON\_HOLD; risk score rises; case recorded |

## 12. Milestones

| # | Scope | Exit check |
| --- | --- | --- |
| 0 | Repo, Supabase project, env files, migrations runner, config tables seeded, README for newcomers | App boots; seed script runs |
| 1 | M1, M2, row-level security, seed data, hive list screen | Seeded users log in; PDF screen 1 shows |
| 2 | M3, M4, M5 and hive detail screens with the simulator | AT-03, AT-04 |
| 3 | M6, M7 (harvest wizard, manual and sensor paths) | AT-02, AT-08 |
| 4 | M8 (Flow A), M9 (samples, labs, reports), lab portal | AT-05, AT-06 |
| 5 | M10, M11 (virtual tags), M12, M13 (DB hash chain, mock anchor), consumer page | AT-01, AT-07, AT-09; PDF screens 2, 3, 4 |
| 6 | Aggregator flow: intake, report reuse, blended batches | AT-10 |
| 7 | Real NFC: Pi station, NTAG 424 DNA provisioning and verify | Provision, tap and clone rejection on hardware, or documented fallback |
| 8 | Besu anchoring through `LedgerAdapter` | Proof endpoint verifies against the chain |
| 9 | M14, M15, M16, M17 | AT-11, AT-12; dataset export; Market tab |
| 10 | Tamil strings, demo script, deck alignment fixes (section 2.4) | Full demo runs from a clean database in one command |

Hand each milestone to the coding agent as a separate task. Do not combine milestones.

## 13. Assumptions, open questions and risks

### Assumptions (defaults the agent may rely on; log in DECISIONS.md)

- **A1** One lot per harvest record. **A2** Several lots from one farmer in one batch count as blended and need a new test.
- **A3** Emergency feeding on a locked hive is logged, not blocked, and quarantines the supers.
- **A4** Madhukranti gate is hard at batch creation and soft elsewhere; gate level is per state.
- **A5** Report validity default 90 days. **A6** Export panel covers domestic; the reverse does not hold.
- **A7** No payments in Market Lite. **A8** Consumer page shows district-level origin only.
- **A9** Ledger defaults to the mock adapter; Besu is optional. **A10** English first, Tamil second.
- **A11** 'Report to FSSAI' creates a case and complaint text only.
- **A12** One tag per jar; one tag per drum for bulk. **A13** Virtual tags are built first; real NTAG 424 DNA is a swap behind `TagCrypto`.

### Open questions for the team

1. Is blending in the demo, or single-origin only first? (Single-origin is simpler.)
2. Does the Madhukranti hard gate apply only above a hive-count threshold?
3. Which export market and panel will the demo show?
4. Can NTAG 424 DNA tags and a PN532 module be sourced early enough to test the lock step?
5. Who is the demo witness: a KVK officer, an FPO member, or a role-played regulator user?
6. Will a real lab or a role-played lab appear in the demo?

### Risks

| Risk | Mitigation |
| --- | --- |
| PN532 cannot complete NTAG 424 DNA authentication and lock | Provision with an Android NFC tool; Pi does reads; virtual tags for the demo |
| No real telemetry | Simulator through the real ingestion API; label demo data clearly |
| Regulatory thresholds change | Config tables with effective dates; verify before launch |
| Labs will not use a portal | Lab portal is optional; a hackathon role-played lab; later API |
| Overclaiming in the deck | Apply fixes F1 to F7 |
| Scope too large | Follow priorities in section 3; P0 first |

## Appendix A. Config defaults

| Parameter | Default | Note |
| --- | --- | --- |
| Moisture warn / fail | 18.5% / 20% | Verify the current FSSAI standard |
| Yield tolerance pass / review | 3% / 10% |  |
| Weight agreement pass / review | 8% / 15% |  |
| Manual-evidence tolerances pass / review | 8% / 15% | Wider because scale readings are manual |
| Clean period after feeding | 14 days |  |
| Handling loss for tag quota | 2% |  |
| Intake weight tolerance | plus or minus 3% |  |
| Report validity | 90 days |  |
| Offline threshold | 3 h |  |
| Ingest future-timestamp limit | 10 min |  |
| Anchoring interval | 10 min |  |
| Alert cooldown / escalation | 6 h / 4 h |  |
| Retained sample minimum | 100 g | Lab config overrides |
| Heat stress | brood above 37 C for 30 min; amber from 36.5 C |  |
| Chill | brood below 32 C with ambient below 15 C |  |
| Colony failure | brood below 30 C for 6 h with ambient above 30 C |  |
| Queen suspicion | 24 h brood temp std above 2 C for 3 days |  |
| Dearth | Net24 between -0.2 and +0.1 kg for 5 days |  |
| Night loss for curing done | below 0.15 kg for 2 to 3 nights |  |
| Capped honey for harvest | at least 80% |  |
| Fill factor for target super gain | 0.8 |  |
| Tag counter anomaly | jump above 20 within 1 h |  |
| Risk score factors (weights) | manual evidence 15; yield review 15; emergency feed 20; tamper event 20; blended 10; new farmer 5; lab mismatch 25; scan anomaly 15; prior failure 15; expired registry 10 | Cap score at 100 |

## Appendix B. Alert catalog

| ID | Trigger | Severity | Title | What to do (max 3 steps) |
| --- | --- | --- | --- | --- |
| AL-01 | Heat stress | Critical | Heat stress: Hive #n | Shade the hive; keep the entrance clear; put water nearby; do not open the hive at midday |
| AL-02 | Mite trend or count over threshold (mellifera) | Warning | Mite risk: Hive #n | Check the sticky board today; do an alcohol wash on about 300 bees; tap Need help for a treatment guide |
| AL-03 | Swarm rule | Critical | Possible swarm: Hive #n | Look for a cluster nearby; hive it if found; inspect for queen cells |
| AL-04 | Abscond rule | Critical | Colony may have left: Hive #n | Inspect for brood and stores; check for wax moth; record the result |
| AL-05 | Syrup risk or emergency feed on locked hive | Critical | Feeding detected: Hive #n | Stop feeding if possible; log what happened; supers on this hive are now quarantined |
| AL-06 | Lid opened or hive moved with no logged event | Warning | Hive opened or moved: Hive #n | Confirm if it was you; if not, check the apiary |
| AL-07 | Harvest readiness all pass | Info | Harvest ready: Hive #n | Start a harvest event |
| AL-08 | Sensor offline | Warning | Sensor offline: Hive #n | Check battery and solar; this does not mean the colony is in trouble |
| AL-09 | Battery low | Info | Battery low: Hive #n | Check the panel and clean it |
| AL-10 | Colony failure rule | Critical | Colony may be failing: Hive #n | Inspect for brood, queen and stores; check ventilation and shade |
| AL-11 | Chill rule | Warning | Cold risk: Hive #n | Reduce entrance; check cluster size |
| AL-12 | Queen suspicion | Warning | Queen check needed: Hive #n | Inspect for eggs and young brood; consider requeening |

## Appendix C. Telemetry message fields (gateway to ingestion API)

Strict validation: reject unknown fields. Signature is Ed25519 over the canonical JSON of every field except the signature.

| Level | Field | Type | Notes |
| --- | --- | --- | --- |
| Message | schema\_version | const '1.0' |  |
| Message | message\_id | uuid | Idempotency key |
| Message | gateway\_id | string | Pattern GW-xxxxxx |
| Message | apiary\_id | uuid |  |
| Message | sent\_at | date-time |  |
| Message | firmware | string, optional |  |
| Message | gateway\_health | object, optional | uplink, buffered\_messages, cpu\_temp\_c, gps (lat, lon, fix\_age\_s) |
| Message | readings | array of 1 to 64 |  |
| Message | signature | object | alg 'ed25519', key\_id, value (base64) |
| Reading | hive\_code | string | Pattern HV-### |
| Reading | node\_id | string |  |
| Reading | seq | integer | Monotonic per node |
| Reading | sampled\_at | date-time |  |
| Reading | mode | enum | scheduled, burst, event |
| Reading | sensors.hive\_weight | object | kg (0 to 150), std\_g, n, platform\_temp\_c (optional), temp\_compensated (optional) |
| Reading | sensors.feeder\_weight | object or null | kg (0 to 30), std\_g; research hives only |
| Reading | sensors.brood | object, optional | temp\_c, rh\_pct |
| Reading | sensors.super | object, optional | temp\_c, rh\_pct |
| Reading | sensors.ambient | object, optional | temp\_c, rh\_pct, pressure\_hpa, rain\_mm, lux |
| Reading | sensors.motion | object, optional | lid\_open, tilt\_deg, moved |
| Reading | power | object | battery\_v (2.5 to 4.5), battery\_pct, solar\_v |
| Reading | link | object, optional | rssi\_dbm, snr\_db |
| Reading | quality\_flags | array, optional | adc\_saturated, sensor\_missing, high\_noise, wind\_suspected, clock\_unsynced, cal\_stale |

Only `hive_weight`, `power.battery_v`, identity fields and the signature are required. Every other sensor block is optional; when absent, the related insight is switched off, not failed.
