import { Hono } from "hono";
import type { Context } from "hono";
import crypto from "node:crypto";

export interface UserRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  role: string;
  org_id: string;
  org_name: string;
  org_district: string;
  state?: string;
  created_at: string;
}

export interface OrgRecord {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  org_id: string;
  org_name: string;
  org_district: string;
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")): string {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export const SEED_USERS = [
  {
    id: "u-farmer-01",
    org_id: "org-farmer-01",
    name: "Murugan K",
    email: "farmer@honeychain.io",
    phone: "+919876543210",
    role: "farmer",
    org_name: "Kanchipuram Natural Apiaries FPO",
    org_district: "Kanchipuram",
    state: "Tamil Nadu",
  },
  {
    id: "u-aggregator-01",
    org_id: "org-aggregator-01",
    name: "S. Meenakshi",
    email: "aggregator@honeychain.io",
    phone: "+919876543220",
    role: "aggregator",
    org_name: "Tamil Nadu State Honey Aggregator Coop",
    org_district: "Chennai",
    state: "Tamil Nadu",
  },
  {
    id: "u-lab-01",
    org_id: "org-lab-01",
    name: "Dr. Ananya Rao",
    email: "lab@honeychain.io",
    phone: "+919876543230",
    role: "lab",
    org_name: "National Honey Quality Testing Lab",
    org_district: "Chennai",
    state: "Tamil Nadu",
  },
  {
    id: "u-regulator-01",
    org_id: "org-regulator-01",
    name: "Dr. R. Sundaram",
    email: "regulator@honeychain.io",
    phone: "+919876543240",
    role: "regulator",
    org_name: "National Honey Board",
    org_district: "Tamil Nadu",
    state: "Tamil Nadu",
  },
];

const DEFAULT_SEED_PASSWORD = "Honey@123";

export const userStore = new Map<string, UserRecord>();
export const orgStore = new Map<string, OrgRecord>();
export const tokenStore = new Map<string, { userId: string; createdAt: number }>();

export function initSeedData() {
  userStore.clear();
  orgStore.clear();
  tokenStore.clear();

  for (const seed of SEED_USERS) {
    orgStore.set(seed.org_id, {
      id: seed.org_id,
      name: seed.org_name,
      type: seed.role,
      district: seed.org_district,
      state: seed.state,
    });

    userStore.set(seed.id, {
      id: seed.id,
      org_id: seed.org_id,
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      password_hash: hashPassword(DEFAULT_SEED_PASSWORD),
      role: seed.role,
      org_name: seed.org_name,
      org_district: seed.org_district,
      state: seed.state,
      created_at: new Date().toISOString(),
    });
  }
}

// Initialise immediately
initSeedData();

function formatUser(user: UserRecord): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    org_id: user.org_id,
    org_name: user.org_name,
    org_district: user.org_district,
  };
}

function generateToken(userId: string): string {
  const token = `token-${userId}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  tokenStore.set(token, { userId, createdAt: Date.now() });
  return token;
}

function extractToken(c: Context): string | null {
  const authHeader = c.req.header("Authorization") || c.req.header("authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1].trim();
  return authHeader.trim();
}

export const authRoutes = new Hono();

// POST /auth/login
authRoutes.post("/auth/login", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "INVALID_CREDENTIALS", message: "Invalid email/phone or password." }, 401);
  }

  const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return c.json({ error: "INVALID_CREDENTIALS", message: "Invalid email/phone or password." }, 401);
  }

  const user = Array.from(userStore.values()).find((u) => {
    const emailMatch = u.email && u.email.toLowerCase() === identifier.toLowerCase();
    const phoneMatch = u.phone && u.phone === identifier;
    return emailMatch || phoneMatch;
  });

  if (!user) {
    return c.json({ error: "INVALID_CREDENTIALS", message: "Invalid email/phone or password." }, 401);
  }

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) {
    return c.json({ error: "INVALID_CREDENTIALS", message: "Invalid email/phone or password." }, 401);
  }

  const token = generateToken(user.id);
  return c.json({
    token,
    user: formatUser(user),
  }, 200);
});

// POST /auth/signup
authRoutes.post("/auth/signup", async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "VALIDATION_ERROR", message: "Invalid JSON payload." }, 400);
  }

  const { name, email, phone, password, role, org_name, state, district } = body || {};

  if (!name || !password || !role || !org_name || (!email && !phone)) {
    return c.json({
      error: "VALIDATION_ERROR",
      message: "Missing required fields. Name, password, role, org_name, and either email or phone are required.",
    }, 400);
  }

  const cleanEmail = typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
  const cleanPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;

  const isDuplicate = Array.from(userStore.values()).some((u) => {
    const emailDup = cleanEmail && u.email && u.email.toLowerCase() === cleanEmail;
    const phoneDup = cleanPhone && u.phone && u.phone === cleanPhone;
    return emailDup || phoneDup;
  });

  if (isDuplicate) {
    return c.json({
      error: "DUPLICATE_USER",
      message: "A user with this email or phone number already exists.",
    }, 400);
  }

  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const orgDistrict = (district || "").trim();
  const orgState = (state || "Tamil Nadu").trim();

  orgStore.set(orgId, {
    id: orgId,
    name: org_name.trim(),
    type: role.trim(),
    state: orgState,
    district: orgDistrict,
  });

  const newUser: UserRecord = {
    id: userId,
    org_id: orgId,
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    password_hash: hashPassword(password),
    role: role.trim(),
    org_name: org_name.trim(),
    org_district: orgDistrict,
    state: orgState,
    created_at: new Date().toISOString(),
  };

  userStore.set(userId, newUser);
  const token = generateToken(userId);

  return c.json({
    token,
    user: formatUser(newUser),
  }, 201);
});

// GET /auth/me
authRoutes.get("/auth/me", (c) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }

  const session = tokenStore.get(token);
  if (!session) {
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }

  const user = userStore.get(session.userId);
  if (!user) {
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }

  return c.json({ user: formatUser(user) }, 200);
});

// POST /auth/logout
authRoutes.post("/auth/logout", (c) => {
  const token = extractToken(c);
  if (token) {
    tokenStore.delete(token);
  }
  return c.json({ status: "ok" });
});

export const ID_ALIASES: Record<string, string> = {
  "BK-001": "farmer@honeychain.io",
  "FARMER": "farmer@honeychain.io",
  "AG-001": "aggregator@honeychain.io",
  "AGGREGATOR": "aggregator@honeychain.io",
  "LAB-001": "lab@honeychain.io",
  "LAB": "lab@honeychain.io",
  "REG-001": "regulator@honeychain.io",
  "REGULATOR": "regulator@honeychain.io",
};

// GET /auth/resolve/:id
authRoutes.get("/auth/resolve/:id", (c) => {
  const rawId = c.req.param("id").toUpperCase();
  const normalizedIdentifier = ID_ALIASES[rawId] || rawId.toLowerCase();

  const user = Array.from(userStore.values()).find(
    (u) =>
      (u.email && u.email.toLowerCase() === normalizedIdentifier) ||
      (u.email && u.email.toLowerCase() === rawId.toLowerCase()) ||
      u.phone === normalizedIdentifier ||
      u.phone === rawId ||
      u.id.toLowerCase() === normalizedIdentifier ||
      u.id.toLowerCase() === rawId.toLowerCase()
  );

  if (!user) {
    return c.json(
      {
        error: "USER_NOT_FOUND",
        message: `No active user profile associated with ID '${rawId}'.`,
      },
      404
    );
  }

  const token = generateToken(user.id);

  const targetUi =
    user.role === "farmer"
      ? "/farmer/hives"
      : user.role === "aggregator"
      ? "/aggregator"
      : user.role === "lab"
      ? "/lab"
      : user.role === "regulator"
      ? "/regulator"
      : "/aggregator";

  return c.json(
    {
      status: "RESOLVED",
      token,
      target_ui: targetUi,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        org_id: user.org_id,
        org_name: user.org_name,
        org_district: user.org_district,
      },
    },
    200
  );
});
