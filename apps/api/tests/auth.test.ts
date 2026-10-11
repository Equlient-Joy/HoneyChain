import { beforeEach, describe, expect, it } from "bun:test";
import app from "../src/index";
import { initSeedData } from "../src/modules/m1-auth/routes";

describe("Backend Authentication Module (M1-Auth)", () => {
  beforeEach(() => {
    initSeedData();
  });

  it("should successfully login with farmer email and password", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "farmer@honeychain.io",
        password: "Honey@123",
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe("string");
    expect(data.user).toEqual({
      id: "u-farmer-01",
      name: "Murugan K",
      email: "farmer@honeychain.io",
      phone: "+919876543210",
      role: "farmer",
      org_id: "org-farmer-01",
      org_name: "Kanchipuram Natural Apiaries FPO",
      org_district: "Kanchipuram",
    });
  });

  it("should successfully login with phone number and password", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "+919876543210",
        password: "Honey@123",
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user.id).toBe("u-farmer-01");
    expect(data.user.role).toBe("farmer");
    expect(data.user.phone).toBe("+919876543210");
  });

  it("should support login for all default seed roles (aggregator, lab, regulator)", async () => {
    const roles = [
      {
        email: "aggregator@honeychain.io",
        phone: "+919876543220",
        role: "aggregator",
        name: "S. Meenakshi",
        org_name: "Tamil Nadu State Honey Aggregator Coop",
        org_district: "Chennai",
      },
      {
        email: "lab@honeychain.io",
        phone: "+919876543230",
        role: "lab",
        name: "Dr. Ananya Rao",
        org_name: "National Honey Quality Testing Lab",
        org_district: "Chennai",
      },
      {
        email: "regulator@honeychain.io",
        phone: "+919876543240",
        role: "regulator",
        name: "Dr. R. Sundaram",
        org_name: "National Honey Board",
        org_district: "Tamil Nadu",
      },
    ];

    for (const item of roles) {
      const res = await app.request("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: item.email,
          password: "Honey@123",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.user.role).toBe(item.role);
      expect(data.user.name).toBe(item.name);
      expect(data.user.org_name).toBe(item.org_name);
      expect(data.user.org_district).toBe(item.org_district);
    }
  });

  it("should reject login with invalid password", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "farmer@honeychain.io",
        password: "WrongPassword999",
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("INVALID_CREDENTIALS");
    expect(data.message).toBe("Invalid email/phone or password.");
  });

  it("should reject login with non-existent identifier", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "unknown@honeychain.io",
        password: "Honey@123",
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("INVALID_CREDENTIALS");
    expect(data.message).toBe("Invalid email/phone or password.");
  });

  it("should fetch current user with GET /api/v1/auth/me using bearer token", async () => {
    // 1. Login to obtain token
    const loginRes = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "farmer@honeychain.io",
        password: "Honey@123",
      }),
    });
    const { token, user: initialUser } = await loginRes.json();

    // 2. Call /auth/me with bearer token
    const meRes = await app.request("/api/v1/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user).toEqual(initialUser);
  });

  it("should return 401 UNAUTHORIZED on GET /api/v1/auth/me when token is missing or invalid", async () => {
    // Missing token
    const noTokenRes = await app.request("/api/v1/auth/me");
    expect(noTokenRes.status).toBe(401);
    const noTokenData = await noTokenRes.json();
    expect(noTokenData.error).toBe("UNAUTHORIZED");

    // Invalid token
    const badTokenRes = await app.request("/api/v1/auth/me", {
      headers: {
        Authorization: "Bearer invalid-token-xyz-123",
      },
    });
    expect(badTokenRes.status).toBe(401);
    const badTokenData = await badTokenRes.json();
    expect(badTokenData.error).toBe("UNAUTHORIZED");
  });

  it("should create a new user and organization via POST /api/v1/auth/signup and return token", async () => {
    const signupPayload = {
      name: "Ravi Chandran",
      email: "ravi.farmer@honeychain.io",
      phone: "+919876543999",
      password: "RaviSecure@2026",
      role: "farmer",
      org_name: "Nilgiris Mountain Honey Society",
      state: "Tamil Nadu",
      district: "Nilgiris",
    };

    const signupRes = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupPayload),
    });

    expect(signupRes.status).toBe(201);
    const signupData = await signupRes.json();
    expect(signupData.token).toBeDefined();
    expect(signupData.user.id).toBeDefined();
    expect(signupData.user.name).toBe("Ravi Chandran");
    expect(signupData.user.email).toBe("ravi.farmer@honeychain.io");
    expect(signupData.user.phone).toBe("+919876543999");
    expect(signupData.user.role).toBe("farmer");
    expect(signupData.user.org_name).toBe("Nilgiris Mountain Honey Society");
    expect(signupData.user.org_district).toBe("Nilgiris");
    expect(signupData.user.org_id).toBeDefined();

    // Verify newly signed-up user can immediately login with their credentials
    const loginRes = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "ravi.farmer@honeychain.io",
        password: "RaviSecure@2026",
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.user.id).toBe(signupData.user.id);

    // Verify GET /auth/me with the signup token
    const meRes = await app.request("/api/v1/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${signupData.token}`,
      },
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user.email).toBe("ravi.farmer@honeychain.io");
  });

  it("should reject signup when duplicate email or phone is submitted", async () => {
    const duplicateEmailPayload = {
      name: "Duplicate User",
      email: "farmer@honeychain.io", // already exists
      phone: "+919876543000",
      password: "Password@123",
      role: "farmer",
      org_name: "Some Apiary",
      state: "Tamil Nadu",
      district: "Madurai",
    };

    const res1 = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicateEmailPayload),
    });
    expect(res1.status).toBe(400);
    const data1 = await res1.json();
    expect(data1.error).toBe("DUPLICATE_USER");

    const duplicatePhonePayload = {
      name: "Duplicate Phone",
      email: "newemail@honeychain.io",
      phone: "+919876543210", // already exists
      password: "Password@123",
      role: "farmer",
      org_name: "Some Apiary",
      state: "Tamil Nadu",
      district: "Madurai",
    };

    const res2 = await app.request("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicatePhonePayload),
    });
    expect(res2.status).toBe(400);
    const data2 = await res2.json();
    expect(data2.error).toBe("DUPLICATE_USER");
  });

  it("should invalidate bearer token upon POST /api/v1/auth/logout", async () => {
    // 1. Login
    const loginRes = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "farmer@honeychain.io",
        password: "Honey@123",
      }),
    });
    const { token } = await loginRes.json();

    // 2. Logout
    const logoutRes = await app.request("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(logoutRes.status).toBe(200);
    const logoutData = await logoutRes.json();
    expect(logoutData.status).toBe("ok");

    // 3. /auth/me should now return 401
    const meRes = await app.request("/api/v1/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(meRes.status).toBe(401);
  });
});
