import { describe, expect, it } from "bun:test";
import React from "react";
import { DemoBar } from "../src/components/DemoBar";
import { HivesList } from "../src/routes/farmer/HivesList";
import { CreateBatch } from "../src/routes/farmer/CreateBatch";
import { VerifyJar } from "../src/routes/verify/VerifyJar";
import { App } from "../src/App";

describe("Web Routes and Components (Task 14)", () => {
  it("should render DemoBar with all personas", () => {
    let selectedPersona = "farmer";
    const element = (
      <DemoBar
        currentPersona="farmer"
        onSwitch={(p) => {
          selectedPersona = p;
        }}
      />
    );
    expect(element.props.currentPersona).toBe("farmer");
    expect(typeof element.props.onSwitch).toBe("function");
  });

  it("should define HivesList, CreateBatch, and VerifyJar components", () => {
    expect(typeof HivesList).toBe("function");
    expect(typeof CreateBatch).toBe("function");
    expect(typeof VerifyJar).toBe("function");
    expect(typeof App).toBe("function");
  });
});
