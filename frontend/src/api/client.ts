import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export const getToken = () => localStorage.getItem(ACCESS_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY)

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function signOut() {
  clearTokens()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// While one refresh is in flight, other failed requests wait on the same promise
// rather than each firing their own.
let refreshing: Promise<string> | null = null

function refreshAccessToken() {
  if (!refreshing) {
    const refresh = getRefreshToken()
    if (!refresh) return Promise.reject(new Error('No refresh token'))

    // A bare axios call, so a failure here cannot re-enter this interceptor.
    refreshing = axios
      .post(`${baseURL}/auth/refresh/`, { refresh })
      .then(({ data }) => {
        localStorage.setItem(ACCESS_KEY, data.access)
        return data.access as string
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as AxiosRequestConfig & { retried?: boolean }
    const isAuthCall = request?.url?.includes('/auth/')

    // Access tokens are short lived, so trade the refresh token for a new one and
    // replay the request once. Anything else means the session is really over.
    if (error.response?.status === 401 && request && !request.retried && !isAuthCall) {
      request.retried = true
      try {
        const token = await refreshAccessToken()
        request.headers = { ...request.headers, Authorization: `Bearer ${token}` }
        return api(request)
      } catch {
        signOut()
      }
    } else if (error.response?.status === 401 && !isAuthCall) {
      signOut()
    }

    return Promise.reject(error)
  },
)

export default api
