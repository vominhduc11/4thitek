import { buildApiUrl, hasBackendApi } from './backendApi'

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

export type StoredAuthSession = {
  username: string
  role: string
  accessToken?: string
  refreshToken?: string
  accountType?: string
  roles?: string[]
  requiresPasswordChange?: boolean
  expiresAt?: number
}

const LOCAL_STORAGE_KEY = 'admin_auth_user'
const SESSION_STORAGE_KEY = 'admin_auth_session'
const AUTH_SESSION_EVENT = 'admin-auth-session-changed'
const REFRESH_BUFFER_MS = 30_000

let refreshPromise: Promise<StoredAuthSession | null> | null = null

const isBrowser = () => typeof window !== 'undefined'

const getLocalStorage = () => (isBrowser() ? window.localStorage : null)

const getSessionStorage = () => (isBrowser() ? window.sessionStorage : null)

const sanitizeSession = (input: Partial<StoredAuthSession>): StoredAuthSession | null => {
  const username = typeof input.username === 'string' ? input.username.trim() : ''
  const role = typeof input.role === 'string' ? input.role.trim() : ''

  if (!username || !role) {
    return null
  }

  return {
    username,
    role,
    accessToken:
      typeof input.accessToken === 'string' && input.accessToken.trim()
        ? input.accessToken
        : undefined,
    refreshToken:
      typeof input.refreshToken === 'string' && input.refreshToken.trim()
        ? input.refreshToken
        : undefined,
    accountType: typeof input.accountType === 'string' ? input.accountType : undefined,
    roles: Array.isArray(input.roles)
      ? input.roles.filter((roleItem): roleItem is string => typeof roleItem === 'string')
      : undefined,
    requiresPasswordChange:
      typeof input.requiresPasswordChange === 'boolean'
        ? input.requiresPasswordChange
        : undefined,
    expiresAt:
      typeof input.expiresAt === 'number' && Number.isFinite(input.expiresAt)
        ? input.expiresAt
        : undefined,
  }
}

const parseSession = (raw: string | null) => {
  if (!raw) {
    return null
  }

  try {
    return sanitizeSession(JSON.parse(raw) as Partial<StoredAuthSession>)
  } catch {
    return null
  }
}

const emitAuthSessionChange = () => {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT))
}

const writeSessionToStorage = (session: StoredAuthSession, remember: boolean) => {
  const localStorage = getLocalStorage()
  const sessionStorage = getSessionStorage()

  sessionStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))

  if (remember) {
    localStorage?.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        ...session,
        accessToken: undefined,
      }),
    )
  } else {
    localStorage?.removeItem(LOCAL_STORAGE_KEY)
  }

  emitAuthSessionChange()
}

export const createAuthSessionFromResponse = (
  payload: AuthApiResponse,
  fallbackUsername: string,
  currentSession?: StoredAuthSession | null,
) => {
  const roles = Array.isArray(payload.user?.roles) ? payload.user.roles : []

  if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
    return null
  }

  return sanitizeSession({
    username: payload.user.username || currentSession?.username || fallbackUsername,
    role: roles.includes('SUPER_ADMIN') ? 'Super Admin' : 'Admin',
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken || currentSession?.refreshToken,
    accountType: payload.user.accountType || currentSession?.accountType,
    roles,
    requiresPasswordChange: Boolean(payload.user.requirePasswordChange),
    expiresAt:
      typeof payload.expiresIn === 'number' && Number.isFinite(payload.expiresIn)
        ? Date.now() + payload.expiresIn
        : undefined,
  })
}

export const readStoredAuthSession = (): StoredAuthSession | null => {
  const sessionStorage = getSessionStorage()
  const localStorage = getLocalStorage()

  return (
    parseSession(sessionStorage?.getItem(SESSION_STORAGE_KEY) ?? null) ??
    parseSession(localStorage?.getItem(LOCAL_STORAGE_KEY) ?? null)
  )
}

export const hasPersistedAuthSession = () =>
  Boolean(getLocalStorage()?.getItem(LOCAL_STORAGE_KEY))

export const storeAuthSession = (
  session: StoredAuthSession,
  remember: boolean,
): StoredAuthSession | null => {
  const sanitized = sanitizeSession(session)

  if (!sanitized) {
    clearStoredAuthSession()
    return null
  }

  writeSessionToStorage(sanitized, remember)
  return sanitized
}

export const updateStoredAuthSession = (
  updater: (current: StoredAuthSession) => StoredAuthSession | null,
) => {
  const current = readStoredAuthSession()
  if (!current) {
    return null
  }

  const next = updater(current)
  if (!next) {
    clearStoredAuthSession()
    return null
  }

  return storeAuthSession(next, hasPersistedAuthSession())
}

export const clearStoredAuthSession = () => {
  getLocalStorage()?.removeItem(LOCAL_STORAGE_KEY)
  getSessionStorage()?.removeItem(SESSION_STORAGE_KEY)
  emitAuthSessionChange()
}

export const subscribeToAuthSession = (listener: () => void) => {
  if (!isBrowser()) {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === LOCAL_STORAGE_KEY ||
      event.key === SESSION_STORAGE_KEY ||
      event.key === null
    ) {
      listener()
    }
  }

  window.addEventListener(AUTH_SESSION_EVENT, listener)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, listener)
    window.removeEventListener('storage', handleStorage)
  }
}

export const shouldRefreshAuthSession = (session: StoredAuthSession | null) =>
  Boolean(
    session?.refreshToken &&
      (!session.accessToken ||
        (session.expiresAt != null && session.expiresAt <= Date.now() + REFRESH_BUFFER_MS)),
  )

const parseApiResponse = async <T>(response: Response) => {
  try {
    return (await response.json()) as ApiResponse<T>
  } catch {
    return null
  }
}

export const refreshStoredAuthSession = async () => {
  if (refreshPromise) {
    return refreshPromise
  }

  const current = readStoredAuthSession()
  if (!current?.refreshToken || !hasBackendApi()) {
    return null
  }

  const remember = hasPersistedAuthSession()

  refreshPromise = (async () => {
    let response: Response

    try {
      response = await fetch(buildApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: current.refreshToken,
        }),
      })
    } catch {
      return null
    }

    const payload = await parseApiResponse<AuthApiResponse>(response)

    if (!response.ok || !payload?.success || !payload.data?.accessToken) {
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        clearStoredAuthSession()
      }
      return null
    }

    const nextSession = createAuthSessionFromResponse(
      payload.data,
      current.username,
      current,
    )

    if (!nextSession) {
      clearStoredAuthSession()
      return null
    }

    return storeAuthSession(nextSession, remember)
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}
