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
  accountType?: string
  roles?: string[]
  requiresPasswordChange?: boolean
  expiresAt?: number
  refreshCookieIssued?: boolean
  persistAcrossRestarts?: boolean
}

type PersistedAuthSession = Omit<StoredAuthSession, 'accessToken' | 'expiresAt'>

const LOCAL_STORAGE_KEY = 'admin_auth_user'
const SESSION_STORAGE_KEY = 'admin_auth_session'
const AUTH_SESSION_EVENT = 'admin-auth-session-changed'
const REFRESH_BUFFER_MS = 30_000

let refreshPromise: Promise<StoredAuthSession | null> | null = null
let volatileAccessToken: string | null = null
let volatileExpiresAt: number | undefined

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
    refreshCookieIssued:
      typeof input.refreshCookieIssued === 'boolean'
        ? input.refreshCookieIssued
        : undefined,
    persistAcrossRestarts:
      typeof input.persistAcrossRestarts === 'boolean'
        ? input.persistAcrossRestarts
        : undefined,
  }
}

const toPersistedSession = (session: StoredAuthSession): PersistedAuthSession => ({
  username: session.username,
  role: session.role,
  accountType: session.accountType,
  roles: session.roles,
  requiresPasswordChange: session.requiresPasswordChange,
  refreshCookieIssued: session.refreshCookieIssued,
  persistAcrossRestarts: session.persistAcrossRestarts,
})

const parsePersistedSession = (raw: string | null) => {
  if (!raw) {
    return null
  }

  try {
    const parsed = sanitizeSession(JSON.parse(raw) as Partial<StoredAuthSession>)
    if (!parsed) {
      return null
    }
    return toPersistedSession(parsed)
  } catch {
    return null
  }
}

const mergeSession = (persisted: PersistedAuthSession | null): StoredAuthSession | null => {
  if (!persisted) {
    return null
  }

  return sanitizeSession({
    ...persisted,
    accessToken: volatileAccessToken ?? undefined,
    expiresAt: volatileExpiresAt,
  })
}

const emitAuthSessionChange = () => {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT))
}

const setVolatileTokens = (accessToken?: string, expiresAt?: number) => {
  volatileAccessToken =
    typeof accessToken === 'string' && accessToken.trim() ? accessToken : null
  volatileExpiresAt =
    typeof expiresAt === 'number' && Number.isFinite(expiresAt) ? expiresAt : undefined
}

const writeSessionToStorage = (session: StoredAuthSession, remember: boolean) => {
  const localStorage = getLocalStorage()
  const sessionStorage = getSessionStorage()
  const persistedSession = toPersistedSession({
    ...session,
    persistAcrossRestarts: remember,
  })

  setVolatileTokens(session.accessToken, session.expiresAt)
  sessionStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(persistedSession))

  if (remember) {
    localStorage?.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistedSession))
  } else {
    localStorage?.removeItem(LOCAL_STORAGE_KEY)
  }

  emitAuthSessionChange()
}

export const createAuthSessionFromResponse = (
  payload: AuthApiResponse,
  fallbackUsername: string,
  currentSession?: StoredAuthSession | null,
  options?: { remember?: boolean },
) => {
  const roles = Array.isArray(payload.user?.roles) ? payload.user.roles : []

  if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
    return null
  }

  const remember =
    typeof options?.remember === 'boolean'
      ? options.remember
      : Boolean(currentSession?.persistAcrossRestarts)

  return sanitizeSession({
    username: payload.user.username || currentSession?.username || fallbackUsername,
    role: roles.includes('SUPER_ADMIN') ? 'Super Admin' : 'Admin',
    accessToken: payload.accessToken,
    accountType: payload.user.accountType || currentSession?.accountType,
    roles,
    requiresPasswordChange: Boolean(payload.user.requirePasswordChange),
    expiresAt:
      typeof payload.expiresIn === 'number' && Number.isFinite(payload.expiresIn)
        ? Date.now() + payload.expiresIn
        : undefined,
    refreshCookieIssued: true,
    persistAcrossRestarts: remember,
  })
}

export const readStoredAuthSession = (): StoredAuthSession | null => {
  const sessionStorage = getSessionStorage()
  const localStorage = getLocalStorage()

  return (
    mergeSession(parsePersistedSession(sessionStorage?.getItem(SESSION_STORAGE_KEY) ?? null)) ??
    mergeSession(parsePersistedSession(localStorage?.getItem(LOCAL_STORAGE_KEY) ?? null))
  )
}

export const hasPersistedAuthSession = () =>
  Boolean(getLocalStorage()?.getItem(LOCAL_STORAGE_KEY))

export const storeAuthSession = (
  session: StoredAuthSession,
  remember: boolean,
): StoredAuthSession | null => {
  const sanitized = sanitizeSession({
    ...session,
    persistAcrossRestarts: remember,
    refreshCookieIssued: session.refreshCookieIssued ?? true,
  })

  if (!sanitized) {
    clearStoredAuthSession()
    return null
  }

  writeSessionToStorage(sanitized, remember)
  return readStoredAuthSession()
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

  const remember = Boolean(next.persistAcrossRestarts ?? current.persistAcrossRestarts)
  return storeAuthSession(next, remember)
}

export const clearStoredAuthSession = () => {
  getLocalStorage()?.removeItem(LOCAL_STORAGE_KEY)
  getSessionStorage()?.removeItem(SESSION_STORAGE_KEY)
  setVolatileTokens()
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
    session?.refreshCookieIssued &&
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
  if (!current?.refreshCookieIssued || !hasBackendApi()) {
    return null
  }

  const remember = Boolean(current.persistAcrossRestarts ?? hasPersistedAuthSession())

  refreshPromise = (async () => {
    let response: Response

    try {
      response = await fetch(buildApiUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Remember-Session': String(remember),
        },
        body: '{}',
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

    const nextSession = createAuthSessionFromResponse(payload.data, current.username, current, {
      remember,
    })

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
