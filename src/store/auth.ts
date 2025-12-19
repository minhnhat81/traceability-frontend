// src/store/auth.ts
import { create } from "zustand";

type Tenant = { id: number; name?: string };
type User = {
  id?: number;
  email?: string;
  name?: string; // ✅ thêm để Topbar/TopTabs dùng không lỗi
  role?: string;
  username?: string;
  tenant_id?: number;
};

type AuthState = {
  // --- state ---
  token: string;
  tenant: Tenant | null; // ✅ thêm lại để Users.tsx / EPCISTab.tsx dùng
  user: User | null;
  authInitialized: boolean;

  // --- actions (giữ nguyên các hàm cũ) ---
  setToken: (t: string) => void; // ✅ file khác đang gọi
  setTenant: (t: Tenant | null) => void;
  setUser: (u: User | null) => void; // ✅ file khác đang gọi
  clearAuth: () => void;
  initAuth: () => void;

  // --- alias để tương thích nếu nơi khác dùng tên khác ---
  login?: (t: string) => void;
  logout?: () => void;
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
    // ✅ chuẩn hoá dùng access_token để khớp api.ts hiện tại
    localStorage.setItem("access_token", t);
    // giữ thêm key cũ nếu project còn chỗ đọc "token"
    localStorage.setItem("token", t);
    set({ token: t });
  },

  setTenant: (tenant) => {
    if (tenant) {
      localStorage.setItem("tenant", JSON.stringify(tenant));
      localStorage.setItem("tenant_id", String(tenant.id)); // ✅ api.ts đang đọc tenant_id
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
    // ✅ xoá cả key mới + key cũ để tránh lệch state
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("tenant");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    set({ token: "", tenant: null, user: null });
  },

  initAuth: () => {
    try {
      // ✅ ưu tiên access_token (chuẩn), fallback token (cũ)
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        "";

      const tenant = JSON.parse(localStorage.getItem("tenant") || "null");
      let user = JSON.parse(localStorage.getItem("user") || "null");

      // 🔁 Nếu chưa có user trong LS, decode từ JWT
      if (!user && token) {
        const payload = decodeJwt<any>(token);
        if (payload) {
          user = {
            username: payload.username || payload.name || payload.sub || "User",
            name: payload.name || payload.username || payload.sub || "User", // ✅ đảm bảo có name
            email: payload.email,
            role: (payload.role || payload.roles || payload["x-role"] || "").toString(),
            tenant_id:
              Number(payload.tenant_id || payload["tenant"] || payload["x-tenant-id"]) ||
              undefined,
          };
          localStorage.setItem("user", JSON.stringify(user));
          if (user.role) localStorage.setItem("role", user.role);
        }
      }

      // fallback role nếu chỉ có key role lẻ
      if (!user) {
        const role = localStorage.getItem("role");
        if (role) user = { username: "User", name: "User", role };
      }

      // ✅ nếu có tenant_id mà chưa có tenant object → tạo tenant tối thiểu
      let tenantObj: Tenant | null = tenant;
      const tenantIdLS = localStorage.getItem("tenant_id");
      if (!tenantObj && tenantIdLS) {
        tenantObj = { id: Number(tenantIdLS) };
      }

      set({
        token,
        tenant: tenantObj,
        user,
        authInitialized: true,
      });
    } catch (e) {
      console.error("initAuth error:", e);
      set({ token: "", tenant: null, user: null, authInitialized: true });
    }
  },

  // ✅ alias để tương thích nếu có nơi gọi login/logout
  login: (t: string) => {
    // gọi lại setToken để giữ 1 luồng
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
    set({ token: "", tenant: null, user: null });
  },
}));
