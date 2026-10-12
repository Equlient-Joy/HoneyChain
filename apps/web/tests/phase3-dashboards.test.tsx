import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, SEED_ACCOUNTS } from "../src/context/AuthContext";
import { Signup } from "../src/routes/auth/Signup";
import { HivesList } from "../src/routes/farmer/HivesList";
import { AggregatorDashboard } from "../src/routes/aggregator/AggregatorDashboard";
import { VerifyJar } from "../src/routes/verify/VerifyJar";
import { App, AppRoutes } from "../src/App";

describe("Phase 3: Real Responsive Role Dashboards & Live Integration", () => {
  it("should render Signup view with split-screen layout, role selector and form inputs", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/signup"]}>
        <AuthProvider initialUser={null} initialToken={null}>
          <Signup />
        </AuthProvider>
      </MemoryRouter>
    );

    // Form inputs and titles
    expect(html).toContain("Create your account");
    expect(html).toContain("Select Your Role");
    expect(html).toContain("Beekeeper / Apiary");
    expect(html).toContain("Aggregator / Coop Packer");
    expect(html).not.toContain("Accredited Lab");
    expect(html).not.toContain("Regulator / FSSAI / KVK");
    expect(html).toContain("Full Name");
    expect(html).toContain("Mobile Phone");
    expect(html).toContain("Password");
    expect(html).toContain("Organization / Apiary / Facility Name");
    expect(html).toContain("District");
    expect(html).toContain("Create HoneyChain Account");
    // Link back to login
    expect(html).toContain("Sign in here");
    expect(html).toContain("/login");
  });

  it("should render HivesList with KPI cards, responsive grid, HoneyCell and Add Hive modal trigger", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/hives"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token-farmer">
          <HivesList />
        </AuthProvider>
      </MemoryRouter>
    );

    // KPI Cards
    expect(html).toContain("Total Active Hives");
    expect(html).toContain("Daily Yield Gain");
    expect(html).toContain("Forage Flow Status");
    expect(html).toContain("High Nectar Flow");
    expect(html).toContain("Active Alerts");

    // Dynamic Harvest Banner and Fraud Prevention Shields
    expect(html).toContain("Hive #12 Extraction Ready");
    expect(html).toContain("Yield Ratio Validator");
    expect(html).toContain("Moisture Adulteration Guard");
    expect(html).toContain("Cryptographic Weight Attestation");

    // Grid and items
    expect(html).toContain("grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6");
    expect(html).toContain("Hive #12");
    expect(html).toContain("Hive #9");
    expect(html).toContain("Hive #3");
    expect(html).toContain("+1.2 kg");

    // Add hive action
    expect(html).toContain("Add Hive");

    // Nominal state: 0 active alerts, no fake warning banners
    expect(html).toContain("All colonies healthy &amp; nominal");
    expect(html).not.toContain("Hive #7 - Mite risk detected");
    expect(html).not.toContain("(!) Quarantine: Batch HC-0421 Locked");
  });

  it("should dynamically render active alerts and forage flows based on live hive telemetry", () => {
    // Test with flagged hives (Watch / Critical) and maintenance flow (<0.3kg)
    const flaggedHives = [
      {
        id: "hive-007",
        code: "Hive #7",
        rawCode: "HV-007",
        gain: "+0.1 kg",
        gainKg: 0.1,
        status: "Watch",
        fill: 20,
        species: "Indian (Cerana)",
        weight: 18.0,
        alert: "Mite risk detected. Check sticky board today.",
        harvest_ready: false,
      },
      {
        id: "hive-005",
        code: "Hive #5",
        rawCode: "HV-005",
        gain: "+0.2 kg",
        gainKg: 0.2,
        status: "Critical",
        fill: 15,
        species: "Italian (Mellifera)",
        weight: 16.5,
        alert: "Sudden weight drop detected (possible swarm event).",
        harvest_ready: false,
      },
    ];

    const htmlFlagged = renderToString(
      <MemoryRouter initialEntries={["/farmer/hives"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token-farmer">
          <HivesList initialHives={flaggedHives} />
        </AuthProvider>
      </MemoryRouter>
    );

    // Dynamic alerts rendered
    expect(htmlFlagged).toContain("(!) Watch: Hive #7 - Mite risk detected. Check sticky board today.");
    expect(htmlFlagged).toContain("(!) Critical: Hive #5 - Sudden weight drop detected (possible swarm event).");
    expect(htmlFlagged).toContain("Inspect flagged colonies");

    // Forage Flow: Avg gain = 0.15 kg (< 0.3 kg) -> Maintenance Flow
    expect(htmlFlagged).toContain("Maintenance Flow");
    expect(htmlFlagged).toContain("Colonies consuming reserves");

    // Harvest readiness: no hive ready -> Production Phase
    expect(htmlFlagged).toContain("Apiary in Production Phase");
    expect(htmlFlagged).toContain("Honey supers actively ripening. All colonies currently below extraction weight.");
    expect(htmlFlagged).not.toContain("Start Harvest");

    // Test moderate forage flow (between 0.3 and 1.0 kg)
    const moderateHives = [
      {
        id: "hive-001",
        code: "Hive #1",
        rawCode: "HV-001",
        gain: "+0.6 kg",
        gainKg: 0.6,
        status: "Healthy",
        fill: 45,
        species: "Indian (Cerana)",
        harvest_ready: false,
      },
    ];

    const htmlModerate = renderToString(
      <MemoryRouter initialEntries={["/farmer/hives"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token-farmer">
          <HivesList initialHives={moderateHives} />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(htmlModerate).toContain("Moderate Nectar Flow");
    expect(htmlModerate).toContain("Steady comb filling");
    expect(htmlModerate).toContain("All colonies healthy &amp; nominal");
  });

  it("should render AggregatorDashboard with lot intake queue and tag quota calculator", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/aggregator"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.aggregator.profile} initialToken="mock-token-aggregator">
          <AggregatorDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Aggregator Intake Hub");
    expect(html).toContain("Tamil Nadu State Honey Aggregator Coop");
    expect(html).toContain("Lot Intake Queue");
    expect(html).toContain("Batches Workbench &amp; Tag Calculator");
    expect(html).toContain("lot-0421");
    expect(html).toContain("14 kg");
    expect(html).toContain("Inspect &amp; Intake");
  });

  it("should render VerifyJar with search bar, genuine checks, and tampered view toggles", () => {
    const genuineHtml = renderToString(
      <MemoryRouter initialEntries={["/verify?code=HC-0421"]}>
        <VerifyJar />
      </MemoryRouter>
    );

    expect(genuineHtml).toContain("Enter Jar Code or Tap NFC");
    expect(genuineHtml).toContain("(✓) Authentic honey");
    expect(genuineHtml).toContain("HC-0421");
    expect(genuineHtml).toContain("Hive checked");
    expect(genuineHtml).toContain("Lab report checked");
    expect(genuineHtml).toContain("Jar seal intact");
    expect(genuineHtml).toContain("Store shelf");
    expect(genuineHtml).toContain("Polygonscan");

    const fakeHtml = renderToString(
      <MemoryRouter initialEntries={["/verify?code=HC-0999"]}>
        <VerifyJar />
      </MemoryRouter>
    );

    expect(fakeHtml).toContain("(✗) Tampered or fake");
    expect(fakeHtml).toContain("Failed stage: Jar seal broken");
    expect(fakeHtml).toContain("This jar cannot be verified. Do not buy. Report it.");
    expect(fakeHtml).toContain("Report to FSSAI");
  });

  it("should render App and AppRoutes with full route tree mounted", () => {
    expect(typeof App).toBe("function");
    const appHtml = renderToString(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider initialUser={null} initialToken={null}>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(appHtml).toContain("HoneyChain");
    expect(appHtml).toContain("Sign In to Portal");
  });
});
