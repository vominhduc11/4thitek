/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildApiUrl, hasBackendApi } from '../lib/backendApi'

type AuthUser = {
  username: string
  role: string
  accessToken?: string
  accountType?: string
  roles?: string[]
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
    return {
      username: parsed.username,
      role: parsed.role,
      accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : undefined,
      accountType: typeof parsed.accountType === 'string' ? parsed.accountType : undefined,
      roles: Array.isArray(parsed.roles)
        ? parsed.roles.filter((item): item is string => typeof item === 'string')
        : undefined,
    }
  } catch {
    return null
  }
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
        message: 'Thông tin đăng nhập không hợp lệ',
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
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
          message: payloadData?.error || 'Đăng nhập thất bại',
        }
      }

      const roles = Array.isArray(payloadData.data.user?.roles)
        ? payloadData.data.user.roles
        : []

      if (!roles.includes('ADMIN')) {
        return {
          ok: false,
          message: 'Tài khoản không có quyền admin',
        }
      }

      const nextUser: AuthUser = {
        username: payloadData.data.user.username || username,
        role: 'Admin',
        accessToken: payloadData.data.accessToken,
        accountType: payloadData.data.user.accountType,
        roles,
      }

      setUser(nextUser)

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
    } catch {
      return {
        ok: false,
        message: 'Không kết nối được backend',
      }
    } finally {
      setIsLoggingIn(false)
    }
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
      accessToken: user?.accessToken ?? null,
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
