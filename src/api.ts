import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://tracebility-backend-v2-7a55d0dee97d.herokuapp.com'

export function api(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    withCredentials: false,
  })

  // ✅ Request interceptor: gắn token
  instance.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('access_token')

      if (token) {
        cfg.headers.set('Authorization', `Bearer ${token}`)
      }

      return cfg
    },
    (err: AxiosError) => Promise.reject(err)
  )

  // ✅ Response interceptor: auto logout khi 401
  instance.interceptors.response.use(
    res => res,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )

  return instance
}
