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
  setTenant: (t: Tenant) => void;
  setUser: (u: User | null) => void;
  clearAuth: () => void;
  initAuth: () => void;
};

// ---- helper: decode JWT (base64url) an toàn ----
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

  setToken: (t) => {
    localStorage.setItem("token", t);
    set({ token: t });
  },

  setTenant: (tenant) => {
    if (tenant) localStorage.setItem("tenant", JSON.stringify(tenant));
    else localStorage.removeItem("tenant");
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
    localStorage.removeItem("token");
    localStorage.removeItem("tenant");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    set({ token: "", tenant: null, user: null });
  },

  initAuth: () => {
    try {
      const token = localStorage.getItem("token") || "";
      const tenant = JSON.parse(localStorage.getItem("tenant") || "null");
      let user = JSON.parse(localStorage.getItem("user") || "null");

      // 🔁 Nếu chưa có user trong LS, decode từ JWT
      if (!user && token) {
        const payload = decodeJwt<any>(token);
        if (payload) {
          user = {
            username: payload.username || payload.name || payload.sub || "User",
            email: payload.email,
            role:
              (payload.role || payload.roles || payload["x-role"] || "").toString(),
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

      // fallback role nếu chỉ có key role lẻ
      if (!user) {
        const role = localStorage.getItem("role");
        if (role) user = { username: "User", role };
      }

      set({
        token,
        tenant,
        user,
        authInitialized: true,
      });
    } catch (e) {
      console.error("initAuth error:", e);
      set({ token: "", tenant: null, user: null, authInitialized: true });
    }
  },
}));
