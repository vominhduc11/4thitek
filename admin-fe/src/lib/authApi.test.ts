import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./backendApi', () => ({
  buildApiUrl: (path: string) => `/api/v1${path}`,
  hasBackendApi: () => true,
}))

const importAuthApi = async () => {
  vi.resetModules()
  return import('./authApi')
}

describe('authApi requestAdminPasswordReset', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('posts the admin forgot-password request to the shared auth endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: 'If the email exists in our system, a password reset link has been sent.',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )

    const { requestAdminPasswordReset } = await importAuthApi()
    await requestAdminPasswordReset('ops@example.com')

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/v1/auth/forgot-password')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'ops@example.com' }),
    })
  })
})
