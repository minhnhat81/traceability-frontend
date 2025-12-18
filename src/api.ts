// src/api.ts
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://traceability-backend-v2-55d0dee97d.herokuapp.com";

export const api = () => {
  const token = localStorage.getItem("access_token"); // ✅ SỬA Ở ĐÂY

  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.warn("Unauthorized → token invalid or missing");
      }
      return Promise.reject(err);
    }
  );

  return instance;
};

export default api;
