// src/api/index.ts hoặc src/api/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://traceability-backend-v2-7a55d0dee97d.herokuapp.com";

// 🔒 Singleton instance
let _api: AxiosInstance | null = null;

export function api(): AxiosInstance {
  if (_api) return _api;

  _api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    withCredentials: false,
  });

  // ✅ Request interceptor: gắn token
  _api.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    },
    (err: AxiosError) => Promise.reject(err)
  );

  // ✅ Response interceptor
  _api.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }
  );

  return _api;
}
