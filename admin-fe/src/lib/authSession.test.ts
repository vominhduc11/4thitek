import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadModule = async () => {
  vi.resetModules()
  return import('./authSession')
}

const createStorage = (): Storage => {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => {
      store.clear()
    },
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
  }
}

const createWindowMock = () => {
  const localStorage = createStorage()
  const sessionStorage = createStorage()
  return {
    localStorage,
    sessionStorage,
    location: {
      hostname: 'localhost',
      origin: 'http://localhost:5173',
    },
    dispatchEvent: vi.fn(() => true),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window
}

describe('authSession storage hardening', () => {
  beforeEach(() => {
    const windowMock = createWindowMock()
    vi.stubGlobal('window', windowMock)
    vi.stubGlobal('localStorage', windowMock.localStorage)
    vi.stubGlobal('sessionStorage', windowMock.sessionStorage)
    localStorage.clear()
    sessionStorage.clear()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps access token out of Web Storage while preserving in-memory session', async () => {
    const module = await loadModule()

    module.storeAuthSession(
      {
        username: 'owner',
        role: 'Super Admin',
        accessToken: 'access-token',
        expiresAt: Date.now() + 60_000,
        refreshCookieIssued: true,
      },
      true,
    )

    expect(sessionStorage.getItem('admin_auth_session') ?? '').not.toContain('access-token')
    expect(localStorage.getItem('admin_auth_user') ?? '').not.toContain('access-token')
    expect(module.readStoredAuthSession()).toMatchObject({
      username: 'owner',
      accessToken: 'access-token',
      refreshCookieIssued: true,
      persistAcrossRestarts: true,
    })
  })

  it('refreshes via credentials include without sending a refresh token body', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://admin-api.example.com/api/v1')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'backend-refresh-token',
            tokenType: 'Bearer',
            expiresIn: 120000,
            user: {
              id: 1,
              username: 'owner',
              accountType: 'ADMIN',
              roles: ['ADMIN'],
            },
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const module = await loadModule()
    module.storeAuthSession(
      {
        username: 'owner',
        role: 'Admin',
        refreshCookieIssued: true,
        persistAcrossRestarts: true,
      },
      true,
    )

    const nextSession = await module.refreshStoredAuthSession()

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Remember-Session': 'true',
      },
      body: '{}',
    })
    expect(nextSession?.accessToken).toBe('new-access-token')
    expect(sessionStorage.getItem('admin_auth_session') ?? '').not.toContain(
      'backend-refresh-token',
    )
    expect(localStorage.getItem('admin_auth_user') ?? '').not.toContain(
      'backend-refresh-token',
    )
  })
})
