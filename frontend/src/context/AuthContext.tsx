import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import api, { requestAccessToken, setAccessToken } from '../api/client'

interface AuthValue {
  username: string | null
  isAuthenticated: boolean
  /** False until the stored session has been checked, so guards do not redirect too early. */
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

const USERNAME_KEY = 'username'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(USERNAME_KEY),
  )
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // The access token only lives in memory, so after a reload the refresh cookie is
    // what brings the session back.
    requestAccessToken()
      .then(setToken)
      .catch(() => {
        setUsername(null)
        localStorage.removeItem(USERNAME_KEY)
      })
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (name: string, password: string) => {
    const { data } = await api.post('/auth/login/', { username: name, password })
    setAccessToken(data.access)
    localStorage.setItem(USERNAME_KEY, name)
    setToken(data.access)
    setUsername(name)
  }, [])

  const logout = useCallback(async () => {
    try {
      // Clears the refresh cookie; only the server can do that.
      await api.post('/auth/logout/')
    } finally {
      setAccessToken(null)
      localStorage.removeItem(USERNAME_KEY)
      setToken(null)
      setUsername(null)
    }
  }, [])

  const value = useMemo(
    () => ({ username, isAuthenticated: Boolean(token), ready, login, logout }),
    [token, username, ready, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
