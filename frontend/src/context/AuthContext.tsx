import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import api, { clearToken, getToken, setToken } from '../api/client'

interface AuthValue {
  token: string | null
  username: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

const USERNAME_KEY = 'username'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(USERNAME_KEY),
  )

  const login = useCallback(async (name: string, password: string) => {
    const { data } = await api.post('/auth/login/', { username: name, password })
    setToken(data.access)
    localStorage.setItem(USERNAME_KEY, name)
    setTokenState(data.access)
    setUsername(name)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(USERNAME_KEY)
    setTokenState(null)
    setUsername(null)
  }, [])

  const value = useMemo(
    () => ({ token, username, isAuthenticated: Boolean(token), login, logout }),
    [token, username, login, logout],
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
