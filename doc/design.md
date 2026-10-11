# HoneyChain design.md

UI and UX rules for the coding agent. Read this with `PRD.md`. Where the two disagree on behaviour, the PRD wins. Where they disagree on look, feel or flow, this file wins.

No code is given here on purpose. Tokens are listed as tables; the agent maps them into the Tailwind theme and CSS variables.

---

## 1. Design intent

**Who uses it, and where.** Commercial beekeepers in India, standing outdoors next to a hive, in bright sun, often one-handed, on a mid-range Android phone with patchy data. They read Tamil, Hindi or English at different comfort levels. Aggregators, lab analysts and regulators use desktop as well as phone. Consumers tap a jar once, with no login.

**Primary job.** Help the person do the next correct thing, and show them clearly whether honey is safe to sell or buy.

**Personality.** Calm, practical, trustworthy. A field notebook that also happens to be an audit trail. Never playful with safety or status messages.

**The one memorable element: the honey cell.** A hexagon that fills with honey. It is used for exactly three things and nothing else:

1. Harvest readiness on a hive (fills as the supers approach harvest weight).
2. Each verification check on the consumer page (fills when verified, shows an icon so it is not colour-only).
3. The evidence checklist on a batch (one cell per evidence layer).

Everything else is quiet and disciplined. If a screen does not need a honey cell, it does not get one.

**Visual direction (and what it avoids).** Cool white surfaces, a deep navy primary that matches the SIH PDF prototype, honey yellow reserved for the cell fill, and plain status colours. It avoids the cream-and-terracotta look, dark mode with one neon accent, identical rounded cards with soft shadows, all-caps eyebrow labels, and decorative gradients.

---

## 2. Principles

| # | Rule | What it means in practice |
|---|---|---|
| 1 | One screen, one job | Each screen has one primary action, placed at the bottom within thumb reach, labelled with a verb |
| 2 | Always say what to do next | Hive, harvest and batch screens show a **Next step** banner computed from state (see section 7.1) |
| 3 | Plain words | UI vocabulary comes from the glossary in section 10. No jargon such as Merkle, SUN, mass balance. |
| 4 | Five things or fewer | A card shows at most five pieces of information. Extra detail opens on tap. |
| 5 | Never rely on memory | Icons always have text labels. Steps show the step name and position. Previous answers are shown on review screens. |
| 6 | Never lose the user's work | Drafts autosave on every step, offline entries queue, back never discards. |
| 7 | Be honest about certainty | Say 'possible swarm', not 'swarm'. Say 'last updated 12 min ago'. Show manual versus sensor evidence. |
| 8 | Guide failure | Every error says what happened and how to fix it, with a button for the fix. |
| 9 | Fast feels certain | Respond to taps within 100 ms (pressed state, optimistic update, skeleton). |
| 10 | Works in the field | High contrast, large type, 48 px targets, offline first, graceful when NFC or camera is unavailable. |

**Do not**

- Do not hide primary navigation in a hamburger menu.
- Do not use placeholder text as the only label.
- Do not use colour alone for status.
- Do not use carousels for important information.
- Do not use gesture-only actions (swipe to delete, long press). Always offer a visible button.
- Do not stack modals. Use a bottom sheet for secondary actions and a dialog only for confirmations.
- Do not show a numeric trust score to consumers.
- Do not use toasts for errors that need action. Use an inline message with a button.
- Do not use all caps, tracked-out labels, middle-dot meta strings, or an arrow on every button.

---

## 3. Technology choices

Vite 8 on Bun with React and TypeScript. **At setup, verify that each plugin below supports Vite 8; if one lags, pin the closest working version and note it in `DECISIONS.md`.**

| Purpose | Choice | Why |
|---|---|---|
| Styling | Tailwind CSS v4 with design tokens as CSS variables | Fast for an agent to use consistently; tokens live in one place |
| Component base | shadcn/ui pattern on Radix UI primitives (components copied into `packages/ui`, then restyled to these tokens) | Accessible by default; we own the code |
| Bottom sheets | Vaul (drawer built on Radix) | Native-feeling sheets on mobile |
| Toasts | Sonner | Simple, accessible, supports an Undo action |
| Icons | Lucide React | Clear, consistent strokes |
| Animation | Motion (`motion/react`) | Layout and presence animation with reduced-motion support |
| Forms | React Hook Form with Zod | Shared validation schemas with the API |
| Server data | TanStack Query with persisted cache | Offline-friendly, stale-while-revalidate |
| Routing | React Router | Standard, route-level code splitting |
| i18n | i18next with react-i18next, and `Intl` for numbers and dates | Plurals and locale formats |
| Charts | Recharts (lazy-loaded) | Quick to build; add a text summary for accessibility |
| PWA | vite-plugin-pwa (Workbox) | Install, offline shell, background sync where supported |
| Local drafts | idb-keyval | Tiny IndexedDB wrapper for wizard drafts and queued events |
| Image handling | browser-image-compression | Compress photos before upload |
| QR scanning | A React QR scanner library (for example `@yudiel/react-qr-scanner`) | In-app scan with camera |
| QR generation | `qrcode` | Labels and batch pages |
| Fonts | Fontsource packages, self-hosted and subset | Offline, no third-party requests |

**Platform APIs.** Use feature detection for all of these and always provide a fallback.

- Web NFC (Android Chrome only). Fallback order: QR scan, then manual code entry. iPhones read the tag URL natively when tapped, so the consumer flow works without in-app NFC.
- Camera photos via a file input with capture, plus geolocation for geotags.
- Screen Wake Lock during the weigh steps of the harvest wizard.
- `navigator.vibrate` for a short confirmation where supported.

---

## 4. Design tokens

### 4.1 Colour

| Token | Hex | Use |
|---|---|---|
| `bg` Veil | `#F5F7F4` | App background |
| `surface` | `#FFFFFF` | Cards, sheets, inputs |
| `line` | `#D5DBD3` | Borders and dividers |
| `ink` | `#1C2430` | Body text |
| `ink-muted` | `#556070` | Secondary text (5.8:1 on bg) |
| `primary` Hive navy | `#1E4B7A` | Primary buttons, app bar, links |
| `primary-pressed` | `#163A5F` | Pressed state |
| `primary-soft` | `#E6EDF5` | Selected rows, soft backgrounds |
| `honey` | `#F2A900` | **Cell fill only.** Never text, never a status. |
| `honey-edge` | `#8A5A00` | Cell outline and any text on honey |
| `safe` | `#1E7B4C` | Healthy, verified, passed |
| `safe-soft` | `#E1F1E8` | Safe backgrounds |
| `watch` | `#A94F00` | Needs attention soon |
| `watch-soft` | `#FCEBD7` | Watch backgrounds |
| `critical` | `#B3261E` | Act now, tampered, failed |
| `critical-soft` | `#FBE3E0` | Critical backgrounds |
| `info` | `#4A5A73` | Neutral information |
| `info-soft` | `#E8ECF2` | Info backgrounds |

Rules: body text at least 4.5:1, large text and UI parts at least 3:1. Honey is never used for a warning, because honey yellow and caution would be confused outdoors. Primary buttons are navy with white text. Reproduce the SIH PDF prototype's navy headers, green 'Authentic honey' and red 'Tampered or fake' results with these tokens.

### 4.2 Status vocabulary (colour + shape + word, always together)

| Status | Icon | Word | Colour |
|---|---|---|---|
| Healthy / verified / passed | Circle with check | Healthy, Verified, Passed | safe |
| Watch | Triangle with exclamation | Watch | watch |
| Critical / tampered / failed | Octagon with exclamation | Act now, Seal broken, Failed | critical |
| Info / waiting | Circle with i, or clock | Info, Waiting | info |

### 4.3 Typography

**Family:** Atkinson Hyperlegible Next for Latin text and numerals, with Noto Sans Tamil and Noto Sans Devanagari for those scripts, then the system font. One family plus script companions; no separate display face.

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| kpi | 44 / 48 | 600, tabular numbers | The one big number on a card (for example +1.8 kg) |
| h1 | 28 / 34 | 700 | Screen title |
| h2 | 22 / 28 | 600 | Section title |
| h3 | 18 / 24 | 600 | Card title |
| body | 16 / 24 (Tamil and Hindi 16 / 28) | 400 | Default text |
| body-strong | 16 / 24 | 600 | Emphasis |
| caption | 14 / 20 | 400 | Secondary text. Never below 14. |
| button | 17 / 24 | 600 | Button labels |

Rules: sentence case everywhere; no letter-spacing on Indic scripts; no italics in Tamil or Hindi; tabular lining numerals for weights, temperatures and codes; keep lines under 70 characters; units are written with a space (1.8 kg, 39 °C).

### 4.4 Space, shape, depth, motion

| Area | Tokens |
|---|---|
| Spacing | 4, 8, 12, 16, 20, 24, 32, 48, 64. Screen padding 16 on mobile, 24 above 768. Card padding 16. Gap between list items 12. Gap between sections 24. |
| Radius | Controls 12; cards 16; bottom sheets 24 on top corners; chips fully round; honey cell is a hexagon |
| Depth | Cards use a 1 px `line` border, no shadow. Only sheets, dialogs and the sticky action bar have a soft shadow or top border. Scrim is navy at 40%. |
| Motion durations | 100 ms for taps, 200 ms for small changes, 300 ms for sheets and step changes |
| Motion easing | Ease-out entering, ease-in exiting. Sheets use a light spring. |
| Icons | Lucide, 24 px, 2 px stroke; 20 px inside chips |

**Motion rules.** Motion answers a user action (open a sheet, change a step, confirm a save). Non-user-triggered motion is allowed in one place only: the honey cell fills when harvest readiness first reaches 100%. No entrance animations on every section, no hover effects as decoration. Respect `prefers-reduced-motion` by replacing movement with an instant change or a simple fade.

---

## 5. Layout and navigation

### 5.1 Breakpoints and grid

| Width | Layout |
|---|---|
| 360 to 639 | Single column. This is the design target. Test at 360 × 800. |
| 640 to 1023 | Single column up to 560 wide, centred, or two columns for lists |
| 1024 and up | Sidebar navigation plus content, 12 columns, content max 1200 |

Respect safe-area insets at the top and bottom. Content scrolls; the app bar and the bottom bar do not.

### 5.2 Screen anatomy (mobile)

1. **App bar (56 px):** back or logo, title, alerts bell with a count, language and profile.
2. **Content:** scrollable, 16 px padding.
3. **Sticky bottom bar (72 px plus safe area):** holds either the bottom navigation or the primary action, never both. Wizard screens hide the navigation and show only Back and the primary action.

### 5.3 Navigation by role

| Role | Mobile | Desktop |
|---|---|---|
| Farmer | Bottom tabs, four: Hives, Harvest, Batches, Market. Alerts bell in the app bar. | Same tabs in a sidebar |
| Aggregator | Bottom tabs: Intake, Batches, Labs, Packaging, Market | Sidebar |
| Lab | Requests, Reports | Sidebar |
| Regulator or KVK | Review, Audit queue, Cases, Batches | Sidebar |
| Station manager | Zones, Feed and samples, Dataset | Sidebar |
| Station device | Three large buttons: Provision, Verify, Checkpoint | Same |
| Consumer | No navigation. One page. | Same |

Rules: at most five tabs; tab labels always visible; the active tab uses the primary colour with an icon change and a text weight change, not colour alone. A tab with something waiting shows a count, not a dot.

### 5.4 Wireframes (mobile, 360 wide)

**Hives list**

```
+------------------------------------+
| HoneyChain              (bell 2) EN|
+------------------------------------+
| Registration: waiting for check    |  <- banner, dismissible once verified
+------------------------------------+
| Needs attention                    |
| +--------------------------------+ |
| | (!) Watch   Hive #7            | |
| | Mite risk. Check the board.    | |
| | [ Open ]                       | |
| +--------------------------------+ |
| All hives                          |
| +--------------------------------+ |
| | (ok) Healthy  Hive #12  Indian | |
| | +1.8 kg today      [hex 62%]   | |
| +--------------------------------+ |
| | (ok) Healthy  Hive #9          | |
| | +1.1 kg today      [hex 40%]   | |
| +--------------------------------+ |
+------------------------------------+
| Hives | Harvest | Batches | Market |
+------------------------------------+
```

**Hive detail**

```
+------------------------------------+
| <  Hive #12                        |
+------------------------------------+
| Next step: Harvest is 3 days away. |
| [ See harvest checklist ]          |
+------------------------------------+
|  +1.8 kg      [hex 62%]   34.5 °C  |
|  Gain today   Harvest     Inside   |
+------------------------------------+
| Weight, last 24 hours  (chart)     |
| Last updated 12 min ago            |
+------------------------------------+
| Alerts (0)                         |
| History                            |
+------------------------------------+
|        [ + Log something ]         |  <- opens quick-log sheet
+------------------------------------+
```

**Wizard step (harvest)**

```
+------------------------------------+
| <  Record harvest         Step 5/9 |
| ===========-------                 |
+------------------------------------+
| Measure the honey                  |
| Weigh the extracted honey and      |
| read the moisture on your          |
| refractometer.                     |
|                                    |
| Honey weight   [ 14.2 ] kg         |
| Moisture       [ 17.8 ] %          |
| [ Add photo of the reading ]       |
+------------------------------------+
| [ Back ]     [ Next: Check amounts ]|
+------------------------------------+
```

**Consumer verify result**

```
+------------------------------------+
|            (ok) Authentic honey    |  <- full-width banner, large
+------------------------------------+
| Batch HC-0421                      |
| Origin: Kanchipuram, TN            |
| Harvested: 14 Sep 2026             |
| Moisture: 17.8% (pass)             |
+------------------------------------+
| [hex ok] Hive checked              |
| [hex ok] Lab report checked        |
| [hex ok] Jar seal intact           |
| [hex ok] Last shop scan            |
+------------------------------------+
| Verified by tapping the jar.       |
| Fingerprint 9f3a...c21e            |
| [ View lab report ]                |
| [ Report this jar ]                |
+------------------------------------+
```

---

## 6. Component catalogue

All components live in `packages/ui`, use tokens only (no hard-coded colours), and ship with the states in section 9.

| Component | Rules |
|---|---|
| Button | Primary (navy), secondary (outlined navy), danger (critical). Height 48 default, 56 for the main action in a bottom bar. Label is a verb. One primary button per screen. Disabled buttons explain why in helper text. |
| Status chip | Icon, word and colour together. Used for hive, batch, lab and registry status. |
| Honey cell | Hexagon with the fill level, plus an icon when used as a check. Accessible name states the value ('Harvest readiness 62 percent'). |
| KPI tile | One big number, one label, optional trend arrow with the word up or down. |
| Hive card | Status chip, hive number and species, gain today, mini sparkline, honey cell. Whole card is the tap target. |
| Alert card | Severity icon and word, plain title, 'What we saw', up to three numbered steps, buttons Done, Remind me in 2 hours, Need help. |
| Next-step banner | One sentence plus one button. Always at the top of hive, batch and lot screens. |
| Wizard shell | Step title, step count, progress bar, autosave indicator, Back, primary button named for the next step. |
| Bottom sheet | Handle, title, content, one primary action. Closes with a visible Close button, not only a swipe. |
| Quick-log sheet | Five large options with icons: Weigh-in, Inspection, Feeding, Supers on or off, Flowers in bloom. |
| Stable-weight capture | Live reading, a state line (Reading, Hold still, Stable), and a Use this weight button that only enables when stable. |
| Photo capture | Prompt text that says exactly what to photograph, retake and remove, upload progress, compress before upload. |
| Tag scan panel | Modes NFC, QR, Type the code. Shows animation and text; states in 7.4. |
| Timeline | Vertical list of events with icon, plain sentence, actor, time. Latest first, collapsible on the consumer page. |
| Verify result | Banner plus four honey-cell rows, facts, fingerprint, report link, report button. |
| Empty state | One sentence on what belongs here, one button to create the first one. |
| Error state | What happened, how to fix it, a button to retry or fix. |
| Sync indicator | In the app bar: synced, sending (count), failed (count, tap to retry). |
| Confirm dialog | Used only for hold, recall, reject and delete-draft. Names the action on the button ('Recall batch'). |
| Language switcher | Always reachable from the app bar; shows each language in its own script. |
| Data table (desktop) | Sticky header, 48 px rows, sortable, filter chips, status chips, row click opens detail. Below 768 px each row becomes a card. |

---

## 7. UX patterns

### 7.1 Guidance system

- **Next-step banner** on every stateful screen. The text comes from the state machine (for example batch status `TEST_PASSED` shows 'Pack this batch' with a Pack button).
- **Setup checklist** on the Hives screen for new users: Add your first hive, Add a weigh-in, Register on Madhukranti. Each item opens the right flow and ticks itself. Hidden when complete.
- **Contextual help** is a question-mark button that opens a bottom sheet with two or three sentences and, where useful, a picture. Help text lives in the string files.
- **First-run tips**: at most three, dismissible, never blocking, shown once.
- **Why, not just what.** Every field in the harvest wizard has one line of helper text explaining why it is asked.
- **Choose with pictures.** Species, box type and unit size use large picture cards with a one-line explanation, not dropdowns.

### 7.2 Wizards and forms

1. One group of questions per screen. Title says what, helper text says why.
2. Progress shows 'Step 5 of 9' and the step name. Back is always available and keeps data.
3. Autosave after every step, with a quiet 'Saved' indicator. Offline drafts persist locally.
4. Validate inline when a field loses focus; show an error summary at the top on submit. Error text says how to fix ('Enter a weight between 0.1 and 60 kg').
5. Primary button is named for the next step ('Next: Check amounts'). The last step is a **Check and confirm** screen with Edit links, then a success screen.
6. Success screens say what was saved in the same words as the action ('Harvest recorded'), then offer the next step.
7. Use numeric keypads for numbers, a phone keypad for phone numbers, and sensible autocomplete.
8. Never ask for something the system already knows.

### 7.3 Corrections and undo

Evidence records cannot be edited after submission. Before submission, users can edit freely. Right after a quick-log save, a toast offers **Undo** for 10 seconds, as long as the entry has not synced. After submission, the entry shows **Correct this entry**, which creates a correction record and says so in plain words.

### 7.4 NFC, QR and photos

NFC panel states:

| State | Copy | Extras |
|---|---|---|
| Ready | 'Hold the top of your phone against the tag.' | Animated phone-and-tag illustration |
| Reading | 'Reading. Keep still.' | Spinner |
| Success | 'Tag read.' | Short vibration, cell fills, auto-advance after 1 s |
| Tag not recognised | 'This isn't a HoneyChain tag.' | Buttons: Try again, Scan QR instead |
| Seal broken | 'The seal on this tag is broken.' | Critical styling; explains what happens next |
| Read error | 'Couldn't read the tag. Hold your phone flat against the cap and keep still.' | Try again |
| Not supported | 'This phone can't read tags.' | Switch to QR or Type the code, never a dead end |

Photo capture always tells the person what to capture ('Take a photo of the capped frames. Keep the whole frame in view.'), shows a thumbnail, and allows retake.

### 7.5 Offline and sync

- A calm banner says 'You're offline. Your entries are saved and will send when you're back online.'
- Every list shows 'Last updated 12 min ago' where data can be stale, especially telemetry.
- Queued entries show a clock icon; failed ones show a warning and a Send again button.
- Photos upload in the background with a visible progress count.
- Install prompt appears after the second visit, never during a task.

### 7.6 Notifications

Ask for notification permission only after the first hive is added, with a plain reason ('Get an alert when a hive needs attention'). Critical alerts are never delivered only by colour or sound; they always show in the app list.

### 7.7 Dangerous actions

Hold, recall, reject and delete-draft use a confirm dialog that names the consequence ('Recall batch HC-0421? Every jar will show as recalled.'), requires a reason where the PRD says so, and has the danger button on the right with a clearly labelled Cancel.

---

## 8. Task flows

Each flow lists the screens in order. Guidance text is in the string files.

**F1. First launch and registration**
1. Language: three large buttons in their own scripts (தமிழ், हिन्दी, English).
2. Phone number, then OTP (auto-read where supported).
3. Farm name and district; a button fills the location.
4. Madhukranti card with three buttons: I'm registered (enter number and photo of the certificate), How to register (sheet with three steps and a link), Later.
5. Land on Hives with the setup checklist.
Guidance: a banner stays until verified. Registration never blocks hive monitoring. It only blocks batch creation, with a clear message and a Register button.

**F2. Add a hive**
Species picture cards (with 'Not sure?' help), box type picture cards, frame count stepper, location filled automatically, then 'Does this hive have a sensor?' Yes: scan or type the device code. No: 'We'll remind you to weigh it weekly.' Finish on the new hive card with the next step 'Add your first weigh-in'.

**F3. Check a hive and handle an alert**
Hives list is sorted with 'Needs attention' first. Tap a card to open detail. An alert card explains in plain words, with up to three steps. Done closes it with a toast 'Marked done'. Need help sends a message to the linked KVK or regulator contact and says so.

**F4. Quick log**
Log something opens the sheet with five options. Each is one to three fields, then Save. Toast: 'Saved to Hive #12', with Undo. Feeding on a locked hive shows an explanation: 'Feeding this hive puts its honey on hold. You can still record it.'

**F5. Record harvest (nine steps)**
1. Ready check: readiness checklist, expected honey amount, any supers on hold.
2. Choose the hive, supers and frames.
3. Weigh before: stable-weight capture, or manual entry with photo.
4. Weigh after: same.
5. Photos: at least three, with guidance on each.
6. Measure: honey weight and refractometer reading with a photo.
7. Amount check: three checks shown as cells with Pass, Review or Stop. Plain explanations. Stop offers 'Send for review'.
8. Sample vial: seal and scan the reference sample tag (NFC panel).
9. Witness and sign: witness phone OTP, then farmer OTP, then the Check and confirm screen.
Success: 'Harvest recorded.' Next: 'Create a batch'.

**F6. Create a batch**
Pick harvests (cards showing kg and moisture), choose where you will sell (Domestic or Export, each with one line on the test it needs and what it usually costs and how long it takes, from config), registry check, review, Create batch. Lands on the batch screen with the next step 'Seal your samples'.

**F7. Samples and lab**
The batch screen is a four-step tracker: Seal samples, Send to lab, Wait for result, Pack. Seal: fill two vials, scan each tag, weigh, photograph. Choose lab from a list showing distance, accreditation and test type. Send: record courier or hand-over. Wait: a timeline. Result passed: green banner 'Test passed. You can pack this batch.' Result failed: red banner in plain words with options (ask for re-test, contact your KVK).

**F8. Package and tag**
Choose unit size; the count field shows the maximum allowed and explains it ('You can pack up to 19 jars from this batch.'). Print labels, then attach tags with the station or a phone. A progress line reads '12 of 19 jars tagged'. A failed tag says 'Use the next tag' and never blocks. Done: '19 jars ready to sell', with a button to list them in Market.

**F9. Aggregator intake**
Deliveries queue, then open one: confirm weight (difference shown against what the farmer declared), refractometer reading, scan the seal, Accept or Reject (reason required). Then choose single-origin or pool into a batch. Out-of-range weight explains the difference and requires a note.

**F10. Lab**
Inbox, scan the sample tag on receipt (seal state shown), results form with the test values for the panel, upload the PDF, confirm with OTP. If the system disagrees with the lab verdict, the lab sees 'This report needs review' with the reason.

**F11. Consumer verify**
Tap or scan opens the result page with no login. The language switcher is at the top. Result states are in section 11 and in the PRD (FR12.1). After the result, Report this jar is offered.

**F12. Report a jar**
Reason chips, optional photo, optional contact. Confirmation shows a reference number and what happens next in two sentences.

**F13. Market**
Choose a passed batch, add quantity and optional price, Publish. Buyers see a listing card with the verification summary. Inquiries appear in an inbox with a simple thread.

**F14. Regulator**
Registry queue (approve or reject with note), audit queue sorted by risk with the reasons shown, recall flow with reason and confirm, public report cases with a pre-filled complaint text.

---

## 9. Screen states (every screen defines all of these)

| State | Rule |
|---|---|
| Loading | Skeleton shapes that match the content; no spinners over empty screens. After 5 s, add 'Still loading. Check your connection.' |
| Empty | One sentence on what belongs here, one button to create it |
| Error | What happened, how to fix it, a retry or fix button |
| Offline | Banner, cached data with last-updated time, queued actions marked |
| Partial or stale data | Show what we have and the age of it; never blank the screen |
| No permission | Say which role can do this and who to ask |
| Session expired | Return to sign-in and then back to the same screen with drafts intact |
| Success | Name what was saved and offer the next step |

---

## 10. Content and microcopy

**Voice.** Plain verbs, sentence case, short sentences, calm. Errors do not apologise or joke, and are never vague. Name things the way the user does. Keep an action's name identical across button, toast and history (Record harvest, Harvest recorded).

**Glossary: system term to screen label**

| System term | Screen label |
|---|---|
| Mass balance, allowable yield | Honey amount check, expected honey |
| Feeder lock | No-feeding lock |
| Quarantine | On hold (feeding) |
| Custody event | History |
| Hash | Fingerprint |
| Anchor | Permanent record |
| Tamper open | Seal broken |
| Lot | Harvest lot |
| Evidence level sensor / manual | Recorded by sensor / Recorded by hand |
| Registry | Madhukranti registration |
| Panel | Test type |
| NMR | Advanced purity test (NMR) |
| Retained sample | Reference sample (kept for re-testing) |
| Provision a tag | Prepare tag |
| Checkpoint | Scan on arrival or before sale |

**Sample strings**

| Situation | Copy |
|---|---|
| Registry gate | 'Register on Madhukranti to create a batch. It takes about 10 minutes. Your hive data stays safe while you finish.' |
| Heat alert title | 'Hive #4 is too hot' |
| Heat alert detail | 'The inside temperature has been 39 °C for 40 minutes.' |
| Mite alert title | 'Check Hive #7 for mites' |
| Empty hives | 'No hives yet. Add your first hive to start tracking weight and temperature.' |
| Offline | 'You're offline. Your entries are saved and will send when you're back online.' |
| Sync failed | '3 entries didn't send. Check your connection, then tap Send again.' |
| Amount check stop | 'This is more honey than the hive's weight gain explains. Check the weights, or send it for review.' |
| Sensor offline | 'No data from Hive #5 for 3 hours. Check the battery and panel. This doesn't mean the bees are in trouble.' |
| Verify, genuine | 'Authentic honey' |
| Verify, QR only | 'Record found. Tap the jar with your phone to confirm it is genuine.' |
| Verify, tampered | 'Seal broken. Do not buy this jar.' |
| Save success | 'Saved to Hive #12' |

**Translation and layout rules**

- All text lives in string files with keys; never concatenate sentence fragments; use ICU plurals.
- Tamil and Hindi text can be 30 to 40% longer. Buttons wrap to two lines with a minimum height; action labels are never truncated.
- Safety and alert text in Tamil and Hindi is written or reviewed by a fluent person. Do not ship machine translation for alerts or regulatory messages without review.
- Format numbers, dates and units with `Intl` for the active locale. Show dates like '14 Sep 2026' and times in India Standard Time, stored in UTC.
- Ship a long-string pseudo-locale for testing so the agent can check layouts without Tamil text.

---

## 11. Verify page result states (copy and style)

| Result | Banner | Style |
|---|---|---|
| Verified | 'Authentic honey' | safe, large, all four cells filled |
| Record only (QR) | 'Record found. Tap the jar to confirm it is genuine.' | info |
| Seal broken | 'Seal broken. Do not buy.' | critical |
| Could not be verified (invalid, replay, unknown) | 'This jar could not be verified. Do not buy. Report it.' | critical, names the failed stage in words |
| Held or recalled | 'Do not use this honey. It has been recalled.' | critical |
| Report expired | 'The test report for this batch has expired.' | watch |

Always show an assurance line: 'Verified by tapping the jar' or 'Looked up from the code on the label'.

---

## 12. Accessibility and outdoor use

- Target WCAG 2.2 AA. Contrast: text 4.5:1, UI parts 3:1. Test every status colour on its soft background.
- Touch targets at least 48 × 48 with 8 px between them. Primary actions at the bottom of the screen.
- Visible focus ring (3 px, navy, offset 2 px) on every interactive element. Full keyboard use on desktop.
- Every honey cell, chart and status has a text equivalent. Charts include a one-line summary ('Weight rose 1.8 kg since yesterday').
- Use `aria-live` for sync changes and new alerts. Errors link to their fields.
- Layouts work at 200% zoom and in landscape. Respect `prefers-reduced-motion` and the user's text size setting.
- Set the `lang` attribute per active language.
- Outdoor use: avoid pale text, thin weights and low-contrast greys. Large numbers for key readings. A high-contrast option in settings that raises text weight and border contrast.

---

## 13. Performance budgets

| Item | Target |
|---|---|
| Farmer app initial JavaScript | At most 200 KB gzipped; route-level code splitting |
| Consumer verify page | At most 80 KB gzipped; works on slow 4G |
| Largest content paint on a mid-range Android over 4G | Under 2.5 s |
| Charts, scanner, PDF viewer | Lazy-loaded only when opened |
| Fonts | Self-hosted, subset by script, swap display |
| Images | Compressed to about 1600 px, quality 0.7, before upload |
| Layout shift | None from fonts, skeletons or images |

---

## 14. Working rules and definition of done for the agent

**Structure.** Tokens in one place and mapped into the Tailwind theme. Shared components in `packages/ui`. Screens in `apps/web/routes/<role>/<feature>`. Strings in `locales/<lang>/<area>.json`. Never hard-code colours, sizes, or text.

**Per screen, before moving on, confirm:**

1. Renders at 360 × 800 with no horizontal scroll and no clipped text, including with the pseudo-locale.
2. One primary action, at the bottom, labelled with a verb.
3. All states exist: loading, empty, error, offline, success.
4. Every status uses colour, icon and word.
5. Targets are at least 48 px and the focus ring is visible.
6. Contrast passes for text and status colours.
7. All text comes from string files; no concatenated fragments.
8. Next-step banner present where the screen has a state.
9. Wizard screens autosave and Back keeps data.
10. NFC and camera features have a fallback.
11. Honey cell used only for the three allowed purposes.
12. Reduced-motion mode works.

**Keep verification light.** Use the checklist above and the PRD scenario runner. Do not add heavy visual-test tooling unless the team asks.

---

## 15. Decisions to confirm

1. Fonts: confirm exact Fontsource package names and that Tamil and Devanagari subsets load offline.
2. Tamil and Hindi translations: who reviews alert and safety text?
3. Pictures for species, box type, and photo prompts: use simple illustrations or real photos? Real photos are clearer but need sourcing.
4. Dark mode: not planned; the high-contrast option covers outdoor use. Revisit if users ask.
5. Voice readout of alert steps: planned for later, after the core flows work.
