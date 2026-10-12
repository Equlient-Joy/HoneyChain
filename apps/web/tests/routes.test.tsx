import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  AuthProvider,
  useAuth,
  SEED_ACCOUNTS,
  verifySeedCredentials,
  createOfflineFallbackUser,
} from "../src/context/AuthContext";
import { ProtectedRoute, getRoleHomePath } from "../src/components/auth/ProtectedRoute";
import { AppLayout } from "../src/components/layout/AppLayout";
import { Login } from "../src/routes/auth/Login";
import { HivesList } from "../src/routes/farmer/HivesList";
import { CreateBatch } from "../src/routes/farmer/CreateBatch";
import { VerifyJar } from "../src/routes/verify/VerifyJar";
import { HarvestWizard } from "../src/routes/farmer/HarvestWizard";
import { App } from "../src/App";

describe("Frontend Auth Context & Responsive Dual Layout (Task B1 & B2)", () => {
  it("should define core routes, layout, and auth components", () => {
    expect(typeof AuthProvider).toBe("function");
    expect(typeof useAuth).toBe("function");
    expect(typeof ProtectedRoute).toBe("function");
    expect(typeof AppLayout).toBe("function");
    expect(typeof Login).toBe("function");
    expect(typeof HivesList).toBe("function");
    expect(typeof HarvestWizard).toBe("function");
    expect(typeof CreateBatch).toBe("function");
    expect(typeof VerifyJar).toBe("function");
    expect(typeof App).toBe("function");
  });

  it("should define SEED_ACCOUNTS for farmer and aggregator roles with Honey@123 password", () => {
    expect(SEED_ACCOUNTS.farmer).toBeDefined();
    expect(SEED_ACCOUNTS.farmer.profile.role).toBe("farmer");
    expect(SEED_ACCOUNTS.farmer.password).toBe("Honey@123");

    expect(SEED_ACCOUNTS.aggregator).toBeDefined();
    expect(SEED_ACCOUNTS.aggregator.profile.role).toBe("aggregator");
    expect(SEED_ACCOUNTS.aggregator.password).toBe("Honey@123");

    expect((SEED_ACCOUNTS as any).lab).toBeUndefined();
    expect((SEED_ACCOUNTS as any).regulator).toBeUndefined();
  });

  it("should compute correct role home paths in getRoleHomePath", () => {
    expect(getRoleHomePath("farmer")).toBe("/farmer/hives");
    expect(getRoleHomePath("aggregator")).toBe("/aggregator");
    expect(getRoleHomePath("station")).toBe("/farmer/hives");
  });

  it("should verify seed credentials with email, role, and phone", () => {
    const byEmail = verifySeedCredentials("farmer@honeychain.io", "Honey@123");
    expect(byEmail.success).toBe(true);
    expect(byEmail.user?.name).toBe("Murugan K");

    const byRole = verifySeedCredentials("farmer", "Honey@123");
    expect(byRole.success).toBe(true);

    const byPhone = verifySeedCredentials("+919876543210", "Honey@123");
    expect(byPhone.success).toBe(true);

    const wrongPass = verifySeedCredentials("farmer@honeychain.io", "Wrong");
    expect(wrongPass.success).toBe(false);

    const unknown = verifySeedCredentials("unknown@honeychain.io", "Honey@123");
    expect(unknown.success).toBe(false);
  });

  it("should generate valid offline fallback user on signup", () => {
    const { user, token } = createOfflineFallbackUser({
      name: "Ramesh Beekeeper",
      email: "ramesh@apiary.in",
      role: "farmer",
      org_name: "Madurai Natural Honey",
      district: "Madurai",
    });
    expect(user.name).toBe("Ramesh Beekeeper");
    expect(user.role).toBe("farmer");
    expect(user.org_district).toBe("Madurai");
    expect(token.startsWith("mock-token-farmer-")).toBe(true);
  });

  it("should render AuthProvider and useAuth hook", () => {
    let captured: any = null;
    const Consumer = () => {
      captured = useAuth();
      return <div>User: {captured.user?.name}</div>;
    };

    const html = renderToString(
      <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token-farmer">
        <Consumer />
      </AuthProvider>
    );

    expect(html).toContain("Murugan K");
    expect(captured).not.toBeNull();
    expect(captured.user?.role).toBe("farmer");
    expect(captured.isAuthenticated).toBe(true);
  });

  it("should render ProtectedRoute with authorized user and render children", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/hives"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token-farmer">
          <ProtectedRoute allowedRoles={["farmer"]}>
            <div data-testid="protected-content">Secret Beekeeper Dashboard</div>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Secret Beekeeper Dashboard");
  });

  it("should redirect unauthenticated user to /login in ProtectedRoute", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/hives"]}>
        <AuthProvider initialUser={null} initialToken={null}>
          <ProtectedRoute allowedRoles={["farmer"]}>
            <div data-testid="protected-content">Secret Beekeeper Dashboard</div>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).not.toContain("Secret Beekeeper Dashboard");
  });

  it("should redirect unauthorized role to home role path in ProtectedRoute", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/hives"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.aggregator.profile} initialToken="mock-token-aggregator">
          <ProtectedRoute allowedRoles={["farmer"]}>
            <div data-testid="protected-content">Farmer Only Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).not.toContain("Farmer Only Content");
  });

  it("should render AppLayout with desktop sidebar and responsive content container", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/farmer/hives"]}>
        <AuthProvider initialUser={SEED_ACCOUNTS.farmer.profile} initialToken="mock-token-farmer">
          <AppLayout title="Apiary & Hives Telemetry">
            <div id="content">Live Telemetry Content</div>
          </AppLayout>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("HoneyChain");
    expect(html).toContain("Beekeeper Portal");
    expect(html).toContain("Hives");
    expect(html).toContain("Harvest");
    expect(html).toContain("Batches");
    expect(html).toContain("Murugan K");
    expect(html).toContain("Live Telemetry Content");
  });

  it("should render Login view with demo quick-select buttons", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider initialUser={null} initialToken={null}>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(html).toContain("HoneyChain");
    expect(html).toContain("Sign In to Portal");
    expect(html).toContain("Beekeeper");
    expect(html).toContain("Aggregator");
    expect(html).toContain("Murugan K");
    expect(html).toContain("S. Meenakshi");
    expect(html).not.toContain("Dr. Ananya Rao");
    expect(html).not.toContain("Dr. R. Sundaram");
  });

  it("should render HivesList with responsive grid and live telemetry", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <HivesList />
      </MemoryRouter>
    );

    expect(html).toContain("Hive #12");
    expect(html).toContain("Hive #9");
    expect(html).toContain("Hive #3");
    expect(html).toContain("+1.2 kg");
    expect(html).toContain("Create Batch");
  });
});
