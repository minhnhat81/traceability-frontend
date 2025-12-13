import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import { useAuth } from './store/auth'

export const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:8022/api'

export function api(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  })

  // ✅ Request interceptor
  instance.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
      const token = useAuth.getState().token

      if (token) {
        // ⚠️ Axios v1: headers là AxiosHeaders class
        cfg.headers.set('Authorization', `Bearer ${token}`)
      }

      return cfg
    },
    (err: AxiosError) => Promise.reject(err)
  )

  // ✅ Response interceptor
  instance.interceptors.response.use(
    res => res,
    (err: AxiosError) => {
      const status = err.response?.status

      if (status === 401) {
        console.warn(
          '[API] 401 Unauthorized – token hết hạn, logout'
        )

        // 👉 ép kiểu nhẹ cho Zustand
        const auth = useAuth.getState() as any
        auth.logout?.()
      }

      if (err.code === 'ERR_NETWORK') {
        console.error('[API] Network error:', err.message)
      }

      if (status === 403) {
        console.warn('[API] 403 Forbidden – không đủ quyền')
      }

      if (status && status >= 500) {
        console.error('[API] Server error:', err.message)
      }

      return Promise.reject(err)
    }
  )

  return instance
}
