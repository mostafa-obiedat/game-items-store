import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import api, { requestSession, setAccessToken } from '../api/client'

interface AuthValue {
  username: string | null
  isAuthenticated: boolean
  /** False until the stored session has been checked, so guards do not redirect too early. */
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Nothing about the session is kept on the client, so after a reload the refresh
    // cookie is what brings both the token and the current user back.
    requestSession()
      .then((session) => {
        setToken(session.access)
        setUsername(session.username)
      })
      .catch(() => undefined)
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (name: string, password: string) => {
    const { data } = await api.post('/auth/login/', { username: name, password })
    setAccessToken(data.access)
    setToken(data.access)
    setUsername(data.username)
  }, [])

  const logout = useCallback(async () => {
    try {
      // Clears the refresh cookie; only the server can do that.
      await api.post('/auth/logout/')
    } finally {
      setAccessToken(null)
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
