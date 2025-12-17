import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import { useAuth } from './store/auth'

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://tracebility-backend-v2-7a55d0dee97d.herokuapp.com'

export function api(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    withCredentials: false,
  })

  instance.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
      const token = useAuth.getState().token

      if (token) {
        // ✅ Axios v1 đúng chuẩn
        cfg.headers.set('Authorization', `Bearer ${token}`)
      }

      return cfg
    },
    (err: AxiosError) => Promise.reject(err)
  )

  instance.interceptors.response.use(
    res => res,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        const auth = useAuth.getState() as any
        auth.logout?.()
      }
      return Promise.reject(err)
    }
  )

  return instance
}
