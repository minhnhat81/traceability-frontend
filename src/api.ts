import axios, { AxiosError, AxiosInstance } from "axios";
import { useAuth } from "./store/auth";

function normalizeBase(url: string) {
  // bỏ dấu / ở cuối
  return url.replace(/\/+$/, "");
}

// ✅ Ưu tiên env VITE_API_URL (Vercel phải set), nếu không có thì fallback về Heroku
export const API_BASE = normalizeBase(
  import.meta.env.VITE_API_URL || 'http://localhost:8022'
);

export function api(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    withCredentials: false,
  });

  instance.interceptors.request.use(
    (cfg) => {
      const token = useAuth.getState().token;

      if (token) {
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as any)["Authorization"] = `Bearer ${token}`;
      }

      return cfg;
    },
    (err: AxiosError) => Promise.reject(err)
  );

  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const status = err.response?.status;

      if (status === 401) {
        const auth = useAuth.getState() as any;
        auth.logout?.();
      }

      return Promise.reject(err);
    }
  );

  return instance;
}
