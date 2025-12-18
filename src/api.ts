import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuth } from "./store/auth";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://tracebility-backend-v2-7a55d0dee97d.herokuapp.com";

export function api(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    withCredentials: false,
  });

  instance.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
      // ✅ FIX 403: đọc token từ cả store + localStorage
      const token =
        useAuth.getState().token ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");

      if (token) {
        cfg.headers.set("Authorization", `Bearer ${token}`);
      }

      return cfg;
    },
    (err: AxiosError) => Promise.reject(err)
  );

  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        const auth = useAuth.getState() as any;
        auth.clearAuth?.();
      }
      return Promise.reject(err);
    }
  );

  return instance;
}
