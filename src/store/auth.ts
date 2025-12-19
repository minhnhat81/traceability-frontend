import { create } from "zustand";

/* =========================
   Types
========================= */
type User = {
  username?: string;
  email?: string;
  role?: string;
  tenant_id?: number;
};

type AuthState = {
  token: string | null;
  user: User | null;
  authInitialized: boolean;

  setAuth: (token: string, user?: User, tenantId?: number) => void;
  clearAuth: () => void;
  initAuth: () => void;
};

/* =========================
   JWT decode helper
========================= */
function decodeJwt<T = any>(token?: string | null): T | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/* =========================
   Store
========================= */
export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  authInitialized: false,

  setAuth: (token, user, tenantId) => {
    localStorage.setItem("access_token", token);

    if (tenantId) {
      localStorage.setItem("tenant_id", String(tenantId));
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }

    set({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  initAuth: () => {
    try {
      const token = localStorage.getItem("access_token");
      let user: User | null = null;

      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        user = JSON.parse(userRaw);
      } else if (token) {
        const payload = decodeJwt<any>(token);
        if (payload) {
          user = {
            username: payload.username || payload.sub,
            email: payload.email,
            role:
              payload.role ||
              payload.roles ||
              payload["x-role"],
            tenant_id:
              Number(
                payload.tenant_id ||
                  payload["tenant"] ||
                  payload["x-tenant-id"]
              ) || undefined,
          };

          localStorage.setItem("user", JSON.stringify(user));

          if (user.tenant_id) {
            localStorage.setItem("tenant_id", String(user.tenant_id));
          }
        }
      }

      set({
        token,
        user,
        authInitialized: true,
      });
    } catch (e) {
      console.error("initAuth error:", e);
      set({ token: null, user: null, authInitialized: true });
    }
  },
}));
