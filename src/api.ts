import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://tracebility-backend-v2-7a55d0dee97d.herokuapp.com";

/**
 * Singleton axios instance
 * Giữ nguyên cách gọi api().get(...) ở toàn bộ project
 */
let _api: AxiosInstance | null = null;

export function api(): AxiosInstance {
  if (_api) return _api;

  _api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    withCredentials: false,
  });

  // =========================
  // Request interceptor
  // =========================
  _api.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem("access_token");
      const tenantId = localStorage.getItem("tenant_id");

      // ✅ FIX TS2322 (điểm mấu chốt)
      cfg.headers = {
        ...(cfg.headers || {}),
      } as AxiosRequestHeaders;

      // JWT
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }

      // Tenant (KHÔNG hardcode)
      if (tenantId) {
        cfg.headers["X-Tenant-ID"] = tenantId;
      }

      return cfg;
    },
    (err: AxiosError) => Promise.reject(err)
  );

  // =========================
  // Response interceptor
  // =========================
  _api.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("tenant_id");
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }
  );

  return _api;
}
