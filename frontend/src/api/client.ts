import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

// The access token is short lived and kept in memory only. The refresh token is an
// httpOnly cookie, so a script running on the page cannot read or steal it.
let accessToken: string | null = null

export const getAccessToken = () => accessToken
export const setAccessToken = (token: string | null) => {
  accessToken = token
}

// withCredentials, or the browser will not send the refresh cookie to the API origin.
const api = axios.create({ baseURL, withCredentials: true })

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/** Trade the refresh cookie for a new access token. Rejects when there is no valid session. */
export async function requestAccessToken() {
  // A bare axios call, so a failure here cannot re-enter the interceptor below.
  const { data } = await axios.post(`${baseURL}/auth/refresh/`, {}, { withCredentials: true })
  accessToken = data.access
  return data.access as string
}

// While one refresh is in flight, other failed requests wait on the same promise
// rather than each firing their own.
let refreshing: Promise<string> | null = null

function refreshAccessToken() {
  if (!refreshing) {
    refreshing = requestAccessToken().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

function signOut() {
  accessToken = null
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as AxiosRequestConfig & { retried?: boolean }
    const isAuthCall = request?.url?.includes('/auth/')

    // Access tokens expire quickly, so renew and replay the request once. Anything
    // else means the session is really over.
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
