import axios, { AxiosError } from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://tracebility-backend-v2-7a55d0dee97d.herokuapp.com";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: false,
});

/**
 * Attach JWT token
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Global 401 handler
 */
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/#/login";
    }
    return Promise.reject(err);
  }
);
