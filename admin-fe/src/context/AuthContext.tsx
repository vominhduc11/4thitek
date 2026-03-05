/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AuthUser = {
  username: string
  role: string
}

type LoginPayload = {
  username: string
  password: string
  remember: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoggingIn: boolean
  login: (payload: LoginPayload) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
}

const STORAGE_KEY = 'admin_auth_user'

const parseStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (!parsed.username || !parsed.role) return null
    return { username: parsed.username, role: parsed.role }
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(parseStoredUser)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const login = useCallback<AuthContextValue['login']>(async (payload) => {
    const username = payload.username.trim()
    const password = payload.password.trim()
    if (username.length < 3 || password.length < 4) {
      return {
        ok: false,
        message: 'Thong tin dang nhap khong hop le',
      }
    }

    setIsLoggingIn(true)
    await new Promise((resolve) => {
      window.setTimeout(resolve, 420)
    })

    const nextUser: AuthUser = {
      username,
      role: 'Admin',
    }
    setUser(nextUser)
    setIsLoggingIn(false)

    try {
      if (payload.remember) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore storage errors
    }

    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage errors
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoggingIn,
      login,
      logout,
    }),
    [isLoggingIn, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
