import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, SEED_ACCOUNTS } from "../src/context/AuthContext";
import {
  HarvestWizard,
  defaultFormData,
  DEFAULT_HIVES,
} from "../src/routes/farmer/HarvestWizard";

describe("HarvestWizard: Dynamic 9-Step Harvest Extraction & Syrup Fraud Prevention (Task 3)", () => {
  it("should have clean defaultFormData with no hardcoded prefilled static data", () => {
    expect(defaultFormData.hiveId).toBe("");
    expect(defaultFormData.supersRemoved).toBe(1);
    expect(defaultFormData.framesRemoved).toBe(8);
    expect(defaultFormData.weightBeforeKg).toBe(0);
    expect(defaultFormData.weightAfterKg).toBe(0);
    expect(defaultFormData.combTareKg).toBe(2.5);
    expect(defaultFormData.extractedHoneyKg).toBe(0);
    expect(defaultFormData.moisturePct).toBe(18.0);
    expect(defaultFormData.conditionsChecked).toEqual([true, true, true, true, true]);
    expect(defaultFormData.photos).toEqual([]);
    expect(defaultFormData.sampleTagId).toBe("");
    expect(defaultFormData.sampleScanned).toBe(false);
    expect(defaultFormData.witnessName).toBe("");
    expect(defaultFormData.witnessOtp).toBe("");
    expect(defaultFormData.farmerSigned).toBe(false);
  });

  it("Step 1: should render Ready check with selected hive code, species, weight gain, and 5-condition checklist", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard initialData={{ step: 1 }} />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Readiness Verification");
    expect(html).toContain("Hive #12 Weight Gain");
    expect(html).toContain("Indian (Cerana)");
    expect(html).toContain("5 Checklist Conditions");
    expect(html).toContain("target gain achieved (10.0 kg threshold)");
    expect(html).toContain("Honey supers not quarantined");
    expect(html).toContain("Honey comb cap ratio &gt;= 75%");
    expect(html).toContain("Ambient weather dry");
    expect(html).toContain("Active nectar flow");
  });

  it("Live Hive Integration: should select hive matching URL query parameter ?hive=HV-009", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest?hive=HV-009"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard initialData={{ step: 1 }} />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Hive #9 Weight Gain");
    expect(html).toContain("Italian (Mellifera)");
    expect(html).toContain("+1.1 kg");
  });

  it("Step 2: should render hive selector dropdown and calculate comb tare with supers removed adjustment", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 2,
              hiveId: "Hive #12",
              supersRemoved: 2,
              combTareKg: 5.0,
              framesRemoved: 16,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Choose Hive &amp; Supers");
    expect(html).toContain("Select Apiary Hive");
    expect(html).toContain("Hive #12 (HV-012)");
    expect(html).toContain("Hive #9 (HV-009)");
    expect(html).toContain("Hive #7 (HV-007)");
    expect(html).toContain("Hive #3 (HV-003)");
    expect(html).toContain("2 supers removed");
    expect(html).toContain("Comb Tare: 5.0 kg");
  });

  it("Step 3: should render gross weight input and Fetch Live Scale Weight button", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 3,
              weightBeforeKg: 58.0,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Weigh Before Removal");
    expect(html).toContain("Live Scale Reading (Stable)");
    expect(html).toContain("58.0");
    expect(html).toContain("Fetch Live Scale Weight");
    expect(html).toContain("Gross Weight (kg)");
  });

  it("Step 4: should calculate real-time mass loss from weight before and weight after", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 4,
              weightBeforeKg: 58.0,
              weightAfterKg: 41.0,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Weigh After Removal");
    expect(html).toContain("Post-Removal Hive Weight");
    expect(html).toContain("41.0");
    expect(html).toContain("Removed Super Mass:");
    expect(html).toContain("17.0 kg");
    expect(html).toContain("Real-time mass loss verified: -17.0 kg super mass removed.");
  });

  it("Step 5: should render harvest photo gallery with upload and simulation triggers", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 5,
              photos: ["data:image/svg+xml;utf8,<svg>photo1</svg>"],
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Harvest Photos");
    expect(html).toContain("Photo 1");
    expect(html).toContain("+ Add Photo");
    expect(html).toContain("Upload from Device");
    expect(html).toContain("Simulate Capture");
    expect(html).toContain("1 photo(s) uploaded with GPS and timestamp tags.");
  });

  it("Step 6: should display FSSAI Moisture Compliant shield when moisture <= 20.0%", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 6,
              extractedHoneyKg: 14.0,
              moisturePct: 18.2,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Measure Honey &amp; Moisture");
    expect(html).toContain("Extracted Honey (kg)");
    expect(html).toContain("Refractometer Moisture (%)");
    expect(html).toContain("Within Limit (18.2%)");
    expect(html).toContain("FSSAI Moisture Compliant: Natural ripened honey within allowable limits.");
    expect(html).not.toContain("Adulteration Alert");
  });

  it("Step 6: should display Adulteration Alert when moisture exceeds 20.0%", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 6,
              extractedHoneyKg: 14.0,
              moisturePct: 22.4,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Adulteration Alert: Moisture content 22.4% exceeds FSSAI standard (max 20.0%). Fermentation risk high. Comb must be adequately ripened before extraction.");
    expect(html).toContain("Exceeds Limit (22.4%)");
  });

  it("Step 7: should display Green Banner when declared honey is within allowable physical yield", () => {
    // 58kg - 41kg = 17kg removed mass. Comb tare: 2.5kg. Allowable yield: 14.5kg. Declared: 14.0kg.
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 7,
              weightBeforeKg: 58.0,
              weightAfterKg: 41.0,
              combTareKg: 2.5,
              extractedHoneyKg: 14.0,
              moisturePct: 18.0,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Allowable Yield Check");
    expect(html).toContain("17.0 kg");
    expect(html).toContain("Allowable Honey Yield:");
    expect(html).toContain("14.5 kg");
    expect(html).toContain("Declared Honey Yield:");
    expect(html).toContain("14.0 kg");
    expect(html).toContain("Yield Agreement Verified: Declared honey corresponds accurately to scale weight loss.");
    expect(html).not.toContain("FRAUD BLOCKED: Sugar Syrup Feeding Suspected!");
  });

  it("Step 7: should block submission and render Red Blocker banner when declared honey exceeds allowable yield by >10%", () => {
    // 58kg - 41kg = 17kg. Comb tare: 2.5kg. Allowable: 14.5kg. Allowable * 1.1 = 15.95kg. Declared: 19.5kg (> 15.95kg)
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 7,
              weightBeforeKg: 58.0,
              weightAfterKg: 41.0,
              combTareKg: 2.5,
              extractedHoneyKg: 19.5,
              moisturePct: 18.0,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("FRAUD BLOCKED: Sugar Syrup Feeding Suspected!");
    expect(html).toContain(
      "Declared honey (19.5 kg) exceeds allowable physical hive yield (14.5 kg) by more than 10%. Submission blocked under PRD Section 8.1."
    );
    expect(html).toContain("Blocked: Syrup Fraud Detected");
    expect(html).toContain("disabled");
  });

  it("Step 8: should render retained reference sample with NFC tag scan button", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 8,
              sampleTagId: "HC-SMP-4821",
              sampleScanned: true,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Retained Reference Sample");
    expect(html).toContain("NFC Tag Bound &amp; Sealed");
    expect(html).toContain("HC-SMP-4821");
    expect(html).toContain("Re-scan Tag");
    expect(html).toContain("50 g (Reference)");
    expect(html).toContain("24 Months");
  });

  it("Step 9: should dynamically render authenticated farmer name from AuthContext in digital sign-off", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard
            initialData={{
              step: 9,
              extractedHoneyKg: 14.0,
              witnessName: "KVK Extension Officer Kumar",
              witnessOtp: "654321",
              farmerSigned: true,
            }}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Witness &amp; Sign");
    expect(html).toContain("KVK Extension Officer Kumar");
    expect(html).toContain("654321");
    // SEED_ACCOUNTS.farmer has profile name 'Murugan K'
    expect(html).toContain("Farmer Murugan K certifies that 14.0 kg extracted honey from Hive #12 meets all traceability and moisture standards without artificial feeding.");
    expect(html).toContain("Tamper-proof Cryptographic Receipt");
  });

  it("Responsive footer: should have max-w-2xl container", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/harvest"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token">
          <HarvestWizard initialData={{ step: 1 }} />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("fixed bottom-0 left-0 right-0 max-w-2xl mx-auto");
    expect(html).not.toContain("max-w-md mx-auto bg-white border-t");
  });
});
