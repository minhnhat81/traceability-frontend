// src/store/auth.ts
import { create } from "zustand";

type Tenant = { id: number; name?: string };

type User = {
  id?: number;
  email?: string;
  name?: string;
  role?: string;
  username?: string;
  tenant_id?: number;
};

type AuthState = {
  token: string;
  tenant: Tenant | null;
  user: User | null;
  authInitialized: boolean;

  setToken: (t: string) => void;
  setTenant: (t: Tenant | null) => void;
  setUser: (u: User | null) => void;

  clearAuth: () => void;
  initAuth: () => void;

  login?: (t: string) => void;
  logout?: () => void;
};

// ---------- helper: decode JWT ----------
function decodeJwt<T = any>(token?: string | null): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export const useAuth = create<AuthState>((set) => ({
  token: "",
  tenant: null,
  user: null,
  authInitialized: false,

  // ===============================
  // SET TOKEN (🔥 FIX CHÍNH)
  // ===============================
  setToken: (token) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("token", token);

    const payload = decodeJwt<any>(token);

    let user: User | null = null;
    let tenant: Tenant | null = null;

    if (payload) {
      user = {
        username: payload.username || payload.name || payload.sub || "User",
        name: payload.name || payload.username || payload.sub || "User",
        email: payload.email,
        role: String(
          payload.role ||
            payload.roles ||
            payload["x-role"] ||
            ""
        ).toLowerCase(),
        tenant_id:
          Number(
            payload.tenant_id ||
              payload["tenant"] ||
              payload["x-tenant-id"]
          ) || undefined,
      };

      if (user.tenant_id) {
        tenant = { id: user.tenant_id };
        localStorage.setItem("tenant_id", String(user.tenant_id));
        localStorage.setItem("tenant", JSON.stringify(tenant));
      }

      localStorage.setItem("user", JSON.stringify(user));
      if (user.role) localStorage.setItem("role", user.role);
    }

    set({
      token,
      user,
      tenant,
      authInitialized: true,
    });
  },

  setTenant: (tenant) => {
    if (tenant) {
      localStorage.setItem("tenant", JSON.stringify(tenant));
      localStorage.setItem("tenant_id", String(tenant.id));
    } else {
      localStorage.removeItem("tenant");
      localStorage.removeItem("tenant_id");
    }
    set({ tenant });
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role) localStorage.setItem("role", user.role);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }
    set({ user });
  },

  clearAuth: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("tenant");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    set({
      token: "",
      tenant: null,
      user: null,
      authInitialized: true,
    });
  },

  // ===============================
  // INIT AUTH (reload / refresh)
  // ===============================
  initAuth: () => {
    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        "";

      const tenant = JSON.parse(localStorage.getItem("tenant") || "null");
      let user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user && token) {
        const payload = decodeJwt<any>(token);
        if (payload) {
          user = {
            username: payload.username || payload.sub || "User",
            name: payload.name || payload.username || "User",
            email: payload.email,
            role: String(
              payload.role ||
                payload.roles ||
                payload["x-role"] ||
                ""
            ).toLowerCase(),
            tenant_id:
              Number(
                payload.tenant_id ||
                  payload["tenant"] ||
                  payload["x-tenant-id"]
              ) || undefined,
          };
          localStorage.setItem("user", JSON.stringify(user));
          if (user.role) localStorage.setItem("role", user.role);
        }
      }

      let tenantObj: Tenant | null = tenant;
      const tenantIdLS = localStorage.getItem("tenant_id");
      if (!tenantObj && tenantIdLS) {
        tenantObj = { id: Number(tenantIdLS) };
      }

      set({
        token,
        user,
        tenant: tenantObj,
        authInitialized: true,
      });
    } catch (e) {
      console.error("initAuth error:", e);
      set({
        token: "",
        tenant: null,
        user: null,
        authInitialized: true,
      });
    }
  },

  // alias
  login: (t) => {
    localStorage.setItem("access_token", t);
    localStorage.setItem("token", t);
    set({ token: t });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("tenant");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    set({
      token: "",
      tenant: null,
      user: null,
      authInitialized: true,
    });
  },
}));
