import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, SEED_ACCOUNTS } from "../src/context/AuthContext";
import { IdPortal } from "../src/routes/portal/IdPortal";

describe("Unified ID Portal & Smart UI Router (Task 3)", () => {
  it("should render ID entry portal with Beekeeper and Aggregator quick options", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider initialUser={null} initialToken={null}>
          <IdPortal />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("HoneyChain ID Portal");
    expect(html).toContain("Enter your Beekeeper or Aggregator ID");
    expect(html).toContain("BK-001");
    expect(html).toContain("AG-001");
    expect(html).toContain("Public Consumer Verification");
  });

  it("should prefill input when id query parameter is present", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/?id=BK-001"]}>
        <AuthProvider initialUser={null} initialToken={null}>
          <IdPortal />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain('value="BK-001"');
  });

  it("should resolve BK-001 and AG-001 using loginWithId in AuthContext", async () => {
    let authContextVal: any = null;
    const TestConsumer = () => {
      const auth = (React as any).useContext(
        require("../src/context/AuthContext").AuthContext
      );
      authContextVal = auth;
      return null;
    };

    renderToString(
      <AuthProvider initialUser={null} initialToken={null}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(typeof authContextVal.loginWithId).toBe("function");

    const resFarmer = await authContextVal.loginWithId("BK-001");
    expect(resFarmer.success).toBe(true);
    expect(resFarmer.targetUi).toBe("/farmer/hives");

    const resAgg = await authContextVal.loginWithId("ag-001");
    expect(resAgg.success).toBe(true);
    expect(resAgg.targetUi).toBe("/aggregator");
  });
});

