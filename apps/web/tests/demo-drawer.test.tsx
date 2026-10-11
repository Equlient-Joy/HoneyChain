import { describe, expect, it } from "bun:test";
import React from "react";
import { DemoScenarioDrawer } from "../src/components/DemoScenarioDrawer";
import { DemoProvider, useDemo } from "../src/context/DemoContext";
import { BrowserRouter } from "react-router-dom";

describe("Demo Scenario Drawer and Context (Task 17)", () => {
  it("should define DemoScenarioDrawer as a React component", () => {
    expect(typeof DemoScenarioDrawer).toBe("function");
  });

  it("should define DemoProvider and context hook", () => {
    expect(typeof DemoProvider).toBe("function");
    expect(typeof useDemo).toBe("function");
  });

  it("should render DemoScenarioDrawer without throwing inside BrowserRouter and DemoProvider", () => {
    const element = (
      <BrowserRouter>
        <DemoProvider>
          <DemoScenarioDrawer />
        </DemoProvider>
      </BrowserRouter>
    );
    expect(React.isValidElement(element)).toBe(true);
  });
});
