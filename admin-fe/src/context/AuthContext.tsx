/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildApiUrl, hasBackendApi } from '../lib/backendApi'
import {
  clearStoredAuthSession,
  createAuthSessionFromResponse,
  readStoredAuthSession,
  refreshStoredAuthSession,
  storeAuthSession,
  subscribeToAuthSession,
  updateStoredAuthSession,
  type StoredAuthSession,
} from '../lib/authSession'

type AuthUser = {
  username: string
  role: string
  accessToken?: string
  accountType?: string
  roles?: string[]
  requiresPasswordChange?: boolean
}

type LoginPayload = {
  username: string
  password: string
  remember: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoggingIn: boolean
  isInitializing: boolean
  requiresPasswordChange: boolean
  login: (payload: LoginPayload) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
  hasRole: (role: string) => boolean
  completePasswordChange: () => void
}

type ApiResponse<T> = {
  success: boolean
  data: T
  error?: string | null
}

type AuthApiResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: {
    id: number
    username: string
    accountType: string
    roles: string[]
    requirePasswordChange?: boolean
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

const mapSessionToUser = (session: StoredAuthSession | null): AuthUser | null => {
  if (!session?.accessToken) {
    return null
  }

  return {
    username: session.username,
    role: session.role,
    accessToken: session.accessToken,
    accountType: session.accountType,
    roles: session.roles,
    requiresPasswordChange: session.requiresPasswordChange,
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() =>
    mapSessionToUser(readStoredAuthSession()),
  )
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isInitializing, setIsInitializing] = useState(() => {
    const storedSession = readStoredAuthSession()
    return Boolean(storedSession?.refreshCookieIssued && !storedSession.accessToken)
  })

  useEffect(() => {
    return subscribeToAuthSession(() => {
      const storedSession = readStoredAuthSession()
      setUser(mapSessionToUser(storedSession))
      setIsInitializing(Boolean(storedSession?.refreshCookieIssued && !storedSession.accessToken))
    })
  }, [])

  useEffect(() => {
    const storedSession = readStoredAuthSession()

    if (!storedSession?.refreshCookieIssued || storedSession.accessToken) {
      setIsInitializing(false)
      return
    }

    let active = true
    setIsInitializing(true)

    void refreshStoredAuthSession().finally(() => {
      if (!active) {
        return
      }

      const nextSession = readStoredAuthSession()
      setUser(mapSessionToUser(nextSession))
      setIsInitializing(false)
    })

    return () => {
      active = false
    }
  }, [])

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

    try {
      if (!hasBackendApi()) {
        return {
          ok: false,
          message: 'Chua cau hinh VITE_API_BASE_URL',
        }
      }

      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          remember: payload.remember,
        }),
      })

      let payloadData: ApiResponse<AuthApiResponse> | null = null
      try {
        payloadData = (await response.json()) as ApiResponse<AuthApiResponse>
      } catch {
        payloadData = null
      }

      if (!response.ok || !payloadData?.success || !payloadData.data?.accessToken) {
        return {
          ok: false,
          message: payloadData?.error || 'Dang nhap that bai',
        }
      }

      const nextSession = createAuthSessionFromResponse(payloadData.data, username, null, {
        remember: payload.remember,
      })

      if (!nextSession) {
        return {
          ok: false,
          message: 'Tai khoan khong co quyen admin',
        }
      }

      storeAuthSession(nextSession, payload.remember)
      setUser(mapSessionToUser(nextSession))
      setIsInitializing(false)

      return { ok: true }
    } catch {
      return {
        ok: false,
        message: 'Khong ket noi duoc backend',
      }
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(() => {
    if (hasBackendApi()) {
      void fetch(buildApiUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      }).catch(() => undefined)
    }
    setUser(null)
    setIsInitializing(false)
    clearStoredAuthSession()
  }, [])

  const hasRole = useCallback(
    (role: string) => Boolean(user?.roles?.includes(role)),
    [user?.roles],
  )

  const completePasswordChange = useCallback(() => {
    const nextSession = updateStoredAuthSession((current) => ({
      ...current,
      requiresPasswordChange: false,
    }))

    setUser(mapSessionToUser(nextSession))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken: user?.accessToken ?? null,
      isAuthenticated: Boolean(user?.accessToken),
      isLoggingIn,
      isInitializing,
      requiresPasswordChange: Boolean(user?.requiresPasswordChange),
      login,
      logout,
      hasRole,
      completePasswordChange,
    }),
    [completePasswordChange, hasRole, isInitializing, isLoggingIn, login, logout, user],
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
