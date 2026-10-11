import { describe, expect, it } from "bun:test";
import React from "react";
import { HoneyCell } from "../src/components/HoneyCell";

describe("HoneyCell Component (design.md Section 1 & 4.1)", () => {
  it("should render SVG polygon hexagon with correct fill percentage", () => {
    const element = <HoneyCell fillPct={62} label="Harvest readiness" />;
    expect(element.props.fillPct).toBe(62);
    expect(element.props.label).toBe("Harvest readiness");
  });

  it("should clamp fill percentage between 0 and 100", () => {
    const over100 = <HoneyCell fillPct={150} label="Overfilled" />;
    const under0 = <HoneyCell fillPct={-20} label="Underfilled" />;
    expect(over100.props.fillPct).toBe(150);
    expect(under0.props.fillPct).toBe(-20);
  });
});
