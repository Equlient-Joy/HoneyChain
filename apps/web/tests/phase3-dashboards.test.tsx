import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, SEED_ACCOUNTS } from "../src/context/AuthContext";
import { Signup } from "../src/routes/auth/Signup";
import { HivesList } from "../src/routes/farmer/HivesList";
import { AggregatorDashboard } from "../src/routes/aggregator/AggregatorDashboard";
import { LabPortal } from "../src/routes/lab/LabPortal";
import { RegulatorDashboard } from "../src/routes/regulator/RegulatorDashboard";
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
    expect(html).toContain("Beekeeper / Farmer");
    expect(html).toContain("Aggregator / FPO Hub");
    expect(html).toContain("Accredited Lab");
    expect(html).toContain("Regulator / FSSAI / KVK");
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
    expect(html).toContain("Strong Spring Flow");
    expect(html).toContain("Active Alerts");

    // Grid and items
    expect(html).toContain("grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6");
    expect(html).toContain("Hive #12");
    expect(html).toContain("Hive #9");
    expect(html).toContain("Hive #3");
    expect(html).toContain("+1.2 kg");

    // Add hive action
    expect(html).toContain("Add Hive");
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

  it("should render LabPortal with testing requests inbox and sample UID badges", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/lab"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.lab.profile} initialToken="mock-token-lab">
          <LabPortal />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("FSSAI / NABL Testing Portal");
    expect(html).toContain("National Honey Quality Testing Lab");
    expect(html).toContain("Testing Requests Inbox");
    expect(html).toContain("SMP-0421");
    expect(html).toContain("SMP-0422");
    expect(html).toContain("HC-0421");
    expect(html).toContain("HC-0422");
    expect(html).toContain("Intake Vial");
    expect(html).toContain("Enter Report");
  });

  it("should render RegulatorDashboard with Madhukranti review queue and audit queue", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/regulator"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.regulator.profile} initialToken="mock-token-regulator">
          <RegulatorDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Madhukranti &amp; Traceability Enforcement Dashboard");
    expect(html).toContain("Madhukranti Review Queue");
    expect(html).toContain("Audit &amp; Recall Queue");
    expect(html).toContain("Salem Non-Compliant Beekeeper");
    expect(html).toContain("MK-TN-2026-9041");
    expect(html).toContain("Verify &amp; Approve");
    expect(html).toContain("Reject");
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
