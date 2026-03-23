import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./authSession', () => ({
  clearStoredAuthSession: vi.fn(),
  readStoredAuthSession: vi.fn(() => null),
  refreshStoredAuthSession: vi.fn(async () => null),
  shouldRefreshAuthSession: vi.fn(() => false),
}))

const importAdminApi = async () => {
  vi.resetModules()
  return import('./adminApi')
}

describe('adminApi importAdminSerials', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('parses the serial import summary contract returned by the backend', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api/v1')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            importedItems: [
              {
                id: 1,
                serial: 'SERIAL-001',
                status: 'AVAILABLE',
                productId: 5,
              },
            ],
            skippedItems: [
              {
                serial: 'SERIAL-002',
                reason: 'Serial already exists',
              },
            ],
            importedCount: 1,
            skippedCount: 1,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { importAdminSerials } = await importAdminApi()
    const result = await importAdminSerials('access-token', {
      productId: 5,
      serials: ['SERIAL-001', 'SERIAL-002'],
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/admin\/serials\/import$/)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: 5,
        serials: ['SERIAL-001', 'SERIAL-002'],
      }),
    })
    expect(result).toEqual({
      importedItems: [
        {
          id: 1,
          serial: 'SERIAL-001',
          status: 'AVAILABLE',
          productId: 5,
        },
      ],
      skippedItems: [
        {
          serial: 'SERIAL-002',
          reason: 'Serial already exists',
        },
      ],
      importedCount: 1,
      skippedCount: 1,
    })
  })
})
