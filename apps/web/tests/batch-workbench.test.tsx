import { describe, expect, it, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  MadhuKrantiBenefitModal,
  MADHUKRANTI_STORAGE_KEY,
} from "../src/components/madhukranti/MadhuKrantiBenefitModal";
import { CreateBatch } from "../src/routes/farmer/CreateBatch";

describe("Batch Packaging Workbench & Madhu Kranti Flow (Task 4)", () => {
  beforeEach(() => {
    // Reset simulated storage if window is available
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(MADHUKRANTI_STORAGE_KEY);
    }
  });

  describe("MadhuKrantiBenefitModal", () => {
    it("should render modal with all 4 benefit cards, advisory badge, and action buttons when open and unprompted", () => {
      const html = renderToString(
        <MadhuKrantiBenefitModal
          isOpen={true}
          onClose={() => {}}
          onProceed={() => {}}
        />
      );

      // Header and subtitle
      expect(html).toContain("National Madhu Kranti Portal Registration");
      expect(html).toContain("One-time Advisory");
      expect(html).toContain(
        "Before creating your batch, explore the benefits of official registry under the"
      );
      expect(html).toContain("National Beekeeping &amp; Honey Mission (NBHM)");

      // 4 Benefit cards
      expect(html).toContain("NBHM Financial Subsidies");
      expect(html).toContain("Up to 80% subsidy on bee boxes, supers, and solar extraction units.");

      expect(html).toContain("Official Digital Beekeeper ID");
      expect(html).toContain("QR-linked FSSAI recognition and fast-track lab certification.");

      expect(html).toContain("Premium Minimum Support Price");
      expect(html).toContain("Direct purchase eligibility through government FPOs and Nafed.");

      expect(html).toContain("Global Export Traceability");
      expect(html).toContain("Verified country of origin and exemption from ad-hoc quarantine holds.");

      // Two action buttons
      expect(html).toContain("Register on Madhu Kranti (External)");
      expect(html).toContain("Continue without Registering (Self-Declared)");
    });

    it("should not render when isOpen is false", () => {
      const html = renderToString(
        <MadhuKrantiBenefitModal
          isOpen={false}
          onClose={() => {}}
          onProceed={() => {}}
        />
      );

      expect(html).toBe("");
    });
  });

  describe("CreateBatch Workbench", () => {
    it("should render batch formulation workbench with live lots, quota calculation, and ledger preview", () => {
      const html = renderToString(
        <MemoryRouter initialEntries={["/farmer/batches/new"]}>
          <CreateBatch />
        </MemoryRouter>
      );

      // Header and Tabs
      expect(html).toContain("Batch Packaging Workbench");
      expect(html).toContain("Create New Batch");
      expect(html).toContain("Apiary Batches Ledger");

      // Batch Formulation Form
      expect(html).toContain("Batch Formulation &amp; Quota Parameters");
      expect(html).toContain("Source Harvest Lot");
      expect(html).toContain("lot-0421");
      expect(html).toContain("Kanchipuram Apiary");
      expect(html).toContain("Net Batch Honey Weight (kg)");

      // Destination Selector
      expect(html).toContain("Domestic Market (FSSAI)");
      expect(html).toContain("Export (EU / US FDA)");

      // Packaging Unit Size
      expect(html).toContain("250 g");
      expect(html).toContain("500 g");
      expect(html).toContain("1000 g");

      // Real-time Tag & Jar Quota calculation (for 14kg default, 500g jar: Math.floor(14 * 0.98 / 0.5) = 27 jars)
      expect(html).toContain("Tag Allocation Quota: 27 jars (2% handling allowance enforced)");
      expect(html).toContain("Issuable Tags:");

      // Action button
      expect(html).toContain("Anchor Batch &amp; Issue QR Codes");

      // Ledger Seal Preview Card
      expect(html).toContain("Batch Label Preview");
      expect(html).toContain("Ledger Sealed");
      expect(html).toContain("Origin");
      expect(html).toContain("Print QR Label for this Batch");
      expect(html).toContain("Test Consumer Verification Screen");
    });
  });
});
