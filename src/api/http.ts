import axios, { AxiosError } from 'axios'
import router from '@/router'
import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
})

http.interceptors.request.use((config) => {
  const { token } = useAuthStore()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const errorText = (error: AxiosError<any>): string => {
  const data = error.response?.data
  if (data?.errors && typeof data.errors === 'object') {
    return Object.entries(data.errors)
      .map(([key, value]) => `${key} ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('; ')
  }
  if (typeof data?.message === 'string' && data.message) return data.message
  return i18n.global.t('messages.genericError')
}

http.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      const wasLoggedIn = auth.isLoggedIn
      auth.clear()
      const current = router.currentRoute.value
      if (wasLoggedIn && current.name !== 'login') {
        router.replace({ name: 'login', query: { redirect: current.fullPath } })
      }
      return Promise.reject(error)
    }
    // callers that report the failure themselves pass `silent: true`
    if (!(error.config as any)?.silent) {
      ElMessage.error({ message: errorText(error), duration: 4000 })
    }
    return Promise.reject(error)
  },
)

export default http as unknown as {
  get<T = any>(url: string, config?: any): Promise<T>
  post<T = any>(url: string, data?: any, config?: any): Promise<T>
  put<T = any>(url: string, data?: any, config?: any): Promise<T>
  delete<T = any>(url: string, config?: any): Promise<T>
}
