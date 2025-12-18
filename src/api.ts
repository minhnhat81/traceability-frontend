// src/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuth } from "./store/auth";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://tracebility-backend-v2-7a55d0dee97d.herokuapp.com";

function getToken(): string | null {
  // ✅ Ưu tiên access_token, fallback token (vì project bạn đang lẫn 2 key)
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    null
  );
}

export function api(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    withCredentials: false,
  });

  instance.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
      // ✅ Lấy token MỖI REQUEST (tránh lỗi instance tạo trước khi login)
      const token = getToken();

      if (token) {
        // axios v1: cfg.headers có thể là AxiosHeaders hoặc object thường
        if (cfg.headers && typeof (cfg.headers as any).set === "function") {
          (cfg.headers as any).set("Authorization", `Bearer ${token}`);
        } else {
          cfg.headers = {
            ...(cfg.headers || {}),
            Authorization: `Bearer ${token}`,
          } as any;
        }
      }

      return cfg;
    },
    (err: AxiosError) => Promise.reject(err)
  );

  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const status = err.response?.status;

      // ✅ 401/403 đều coi là token invalid/missing
      if (status === 401 || status === 403) {
        // clear zustand + localStorage
        try {
          const auth = useAuth.getState() as any;
          auth.clearAuth?.();
        } catch {}

        localStorage.removeItem("access_token");
        localStorage.removeItem("token");

        // nếu bạn đang dùng HashRouter thì nên về "#/login"
        // (BrowserRouter thì "/login")
        if (window.location.hash !== "#/login") {
          window.location.hash = "#/login";
        }
      }

      return Promise.reject(err);
    }
  );

  return instance;
}
