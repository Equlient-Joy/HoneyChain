import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "farmer" | "aggregator" | "station";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  org_id: string;
  org_name: string;
  org_district: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithId: (id: string) => Promise<{ success: boolean; targetUi?: string; error?: string }>;
  signup: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Default fallback accounts matching seeded data
export const SEED_ACCOUNTS: Record<string, { profile: UserProfile; password: string }> = {
  farmer: {
    password: "Honey@123",
    profile: {
      id: "u-farmer-1",
      name: "Murugan K",
      email: "farmer@honeychain.io",
      phone: "+919876543210",
      role: "farmer",
      org_id: "f1a1a1a1-1111-4000-8000-000000000001",
      org_name: "Kanchipuram Natural Apiaries FPO",
      org_district: "Kanchipuram",
    },
  },
  aggregator: {
    password: "Honey@123",
    profile: {
      id: "u-aggregator-1",
      name: "S. Meenakshi",
      email: "aggregator@honeychain.io",
      phone: "+919876543220",
      role: "aggregator",
      org_id: "ag1a1a1a-3333-4000-8000-000000000003",
      org_name: "Tamil Nadu State Honey Aggregator Coop",
      org_district: "Chennai",
    },
  },
};

export function verifySeedCredentials(
  identifier: string,
  password: string
): { success: boolean; user?: UserProfile; token?: string; error?: string } {
  const trimmed = identifier.trim().toLowerCase();
  const match = Object.entries(SEED_ACCOUNTS).find(([key, acc]) => {
    return (
      key.toLowerCase() === trimmed ||
      acc.profile.email.toLowerCase() === trimmed ||
      (acc.profile.phone && acc.profile.phone === identifier.trim()) ||
      acc.profile.role.toLowerCase() === trimmed
    );
  });

  if (!match) {
    return { success: false, error: "Invalid email/phone or password." };
  }

  const [_, acc] = match;
  if (acc.password !== password) {
    return { success: false, error: "Invalid email/phone or password." };
  }

  const syntheticToken = `mock-token-${acc.profile.role}-${Date.now()}`;
  return { success: true, user: acc.profile, token: syntheticToken };
}

export function createOfflineFallbackUser(data: any): { user: UserProfile; token: string } {
  const role: UserRole = data.role === "aggregator" ? "aggregator" : "farmer";
  const fallbackUser: UserProfile = {
    id: `u-${Date.now()}`,
    name: data.name || "New User",
    email: data.email || "",
    phone: data.phone,
    role,
    org_id: `org-${Date.now()}`,
    org_name: data.org_name || "New Organization",
    org_district: data.district || "Kanchipuram",
  };
  const mockToken = `mock-token-${fallbackUser.role}-${Date.now()}`;
  return { user: fallbackUser, token: mockToken };
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: UserProfile | null;
  initialToken?: string | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialUser = null,
  initialToken = null,
}) => {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  const [token, setToken] = useState<string | null>(initialToken);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser && !initialToken);

  useEffect(() => {
    if (initialUser !== null || initialToken !== null) {
      setIsLoading(false);
      return;
    }

    try {
      const storedToken =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("honeychain_auth_token")
          : null;
      const storedUser =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("honeychain_auth_user")
          : null;

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn("Failed to load auth from localStorage:", e);
    } finally {
      setIsLoading(false);
    }
  }, [initialUser, initialToken]);

  const fallbackSeedLogin = (
    identifier: string,
    password: string
  ): { success: boolean; error?: string } => {
    const verified = verifySeedCredentials(identifier, password);
    if (!verified.success || !verified.user || !verified.token) {
      return { success: false, error: verified.error || "Invalid email/phone or password." };
    }

    setToken(verified.token);
    setUser(verified.user);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("honeychain_auth_token", verified.token);
        localStorage.setItem("honeychain_auth_user", JSON.stringify(verified.user));
      } catch {}
    }
    return { success: true };
  };

  const login = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const profile: UserProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email || "",
          phone: data.user.phone || undefined,
          role: data.user.role as UserRole,
          org_id: data.user.org_id,
          org_name: data.user.org_name,
          org_district: data.user.org_district || "Kanchipuram",
        };

        setToken(data.token);
        setUser(profile);
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem("honeychain_auth_token", data.token);
            localStorage.setItem("honeychain_auth_user", JSON.stringify(profile));
          } catch {}
        }
        setIsLoading(false);
        return { success: true };
      }

      // Check fallback seed accounts on 400 or 401
      const fallback = fallbackSeedLogin(identifier, password);
      if (fallback.success) {
        setIsLoading(false);
        return fallback;
      }

      const errJson = await res.json().catch(() => ({}));
      setIsLoading(false);
      return {
        success: false,
        error: errJson.message || "Invalid email/phone or password.",
      };
    } catch {
      // Backend server unreachable - fallback to seed accounts
      const fallback = fallbackSeedLogin(identifier, password);
      setIsLoading(false);
      return fallback;
    }
  };

  const signup = async (data: any): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const resData = await res.json();
        const profile: UserProfile = {
          id: resData.user.id,
          name: resData.user.name,
          email: resData.user.email || "",
          phone: resData.user.phone || undefined,
          role: resData.user.role as UserRole,
          org_id: resData.user.org_id,
          org_name: resData.user.org_name,
          org_district: resData.user.org_district || data.district || "Kanchipuram",
        };

        setToken(resData.token);
        setUser(profile);
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem("honeychain_auth_token", resData.token);
            localStorage.setItem("honeychain_auth_user", JSON.stringify(profile));
          } catch {}
        }
        setIsLoading(false);
        return { success: true };
      } else {
        const errJson = await res.json().catch(() => ({}));
        setIsLoading(false);
        return { success: false, error: errJson.message || "Signup failed." };
      }
    } catch {
      // Offline fallback
      const { user: fallbackUser, token: mockToken } = createOfflineFallbackUser(data);
      setToken(mockToken);
      setUser(fallbackUser);
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("honeychain_auth_token", mockToken);
          localStorage.setItem("honeychain_auth_user", JSON.stringify(fallbackUser));
        } catch {}
      }
      setIsLoading(false);
      return { success: true };
    }
  };

  const logout = useCallback(() => {
    if (token && !token.startsWith("mock-")) {
      fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    setToken(null);
    setUser(null);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("honeychain_auth_token");
        localStorage.removeItem("honeychain_auth_user");
        localStorage.removeItem("honeychain_user_profile");
      } catch {}
    }
  }, [token]);

  const loginWithId = async (rawId: string) => {
    const upper = rawId.trim().toUpperCase();
    // Offline fallback aliases
    if (upper === "BK-001" || upper === "FARMER") {
      const profile = SEED_ACCOUNTS.farmer.profile;
      setUser(profile);
      setToken("mock-token-farmer");
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("honeychain_auth_token", "mock-token-farmer");
          localStorage.setItem("honeychain_auth_user", JSON.stringify(profile));
          localStorage.setItem("honeychain_user_profile", JSON.stringify(profile));
        } catch {}
      }
      return { success: true, targetUi: "/farmer/hives" };
    }
    if (upper === "AG-001" || upper === "AGGREGATOR") {
      const profile = SEED_ACCOUNTS.aggregator.profile;
      setUser(profile);
      setToken("mock-token-aggregator");
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("honeychain_auth_token", "mock-token-aggregator");
          localStorage.setItem("honeychain_auth_user", JSON.stringify(profile));
          localStorage.setItem("honeychain_user_profile", JSON.stringify(profile));
        } catch {}
      }
      return { success: true, targetUi: "/aggregator" };
    }

    // Live backend call
    try {
      const res = await fetch(`/api/v1/auth/resolve/${encodeURIComponent(rawId)}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem("honeychain_auth_token", data.token);
            localStorage.setItem("honeychain_auth_user", JSON.stringify(data.user));
            localStorage.setItem("honeychain_user_profile", JSON.stringify(data.user));
          } catch {}
        }
        return { success: true, targetUi: data.target_ui };
      }
      return { success: false, error: "Invalid ID. Use BK-001 or AG-001." };
    } catch {
      return { success: false, error: "Network error resolving ID." };
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    loginWithId,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
