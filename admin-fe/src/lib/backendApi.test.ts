import { afterEach, describe, expect, it, vi } from 'vitest'

const importBackendApi = async () => {
  vi.resetModules()
  return import('./backendApi')
}

describe('backendApi', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete (globalThis as { window?: unknown }).window
  })

  it('falls back to the canonical API base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    const api = await importBackendApi()

    expect(api.getApiBaseUrl()).toBe('https://api.4thitek.vn/api/v1')
    expect(api.buildApiUrl('/orders')).toBe('https://api.4thitek.vn/api/v1/orders')
  })

  it('normalizes runtime config host values to the canonical /api/v1 endpoint', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    ;(globalThis as { window?: unknown }).window = {
      __APP_CONFIG__: {
        apiBaseUrl: 'https://api.4thitek.vn',
      },
      location: {
        origin: 'https://admin.4thitek.vn',
      },
    }

    const api = await importBackendApi()

    expect(api.getApiBaseUrl()).toBe('https://api.4thitek.vn/api/v1')
    expect(api.buildApiUrl('/users')).toBe('https://api.4thitek.vn/api/v1/users')
    expect(api.buildApiUrl('/api/v1/orders')).toBe('https://api.4thitek.vn/api/v1/orders')
  })

  it('prefers the local env API base URL while running on localhost', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080/api')
    ;(globalThis as { window?: unknown }).window = {
      __APP_CONFIG__: {
        apiBaseUrl: 'https://api.4thitek.vn/api/v1',
      },
      location: {
        origin: 'http://127.0.0.1:4173',
      },
    }

    const api = await importBackendApi()

    expect(api.getApiBaseUrl()).toBe('http://localhost:8080/api/v1')
    expect(api.buildApiUrl('/orders')).toBe('http://localhost:8080/api/v1/orders')
  })

  it('normalizes runtime values that already end with /api to /api/v1', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    ;(globalThis as { window?: unknown }).window = {
      __APP_CONFIG__: {
        apiBaseUrl: 'https://api.4thitek.vn/api',
      },
      location: {
        origin: 'https://admin.4thitek.vn',
      },
    }

    const api = await importBackendApi()

    expect(api.getApiBaseUrl()).toBe('https://api.4thitek.vn/api/v1')
    expect(api.buildApiUrl('/auth/login')).toBe('https://api.4thitek.vn/api/v1/auth/login')
  })

  it('rewrites legacy storage host assets through the backend uploads path', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    ;(globalThis as { window?: unknown }).window = {
      __APP_CONFIG__: {
        apiBaseUrl: 'https://api.4thitek.vn/api/v1',
      },
      location: {
        origin: 'https://admin.4thitek.vn',
      },
    }

    const api = await importBackendApi()

    expect(
      api.resolveBackendAssetUrl(
        'https://storage.4thitek.vn/4thitek-uploads/products/example.png',
      ),
    ).toBe('https://api.4thitek.vn/uploads/products/example.png')
  })

  it('normalizes bare object keys to the backend uploads path', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    ;(globalThis as { window?: unknown }).window = {
      __APP_CONFIG__: {
        apiBaseUrl: 'https://api.4thitek.vn/api/v1',
      },
      location: {
        origin: 'https://admin.4thitek.vn',
      },
    }

    const api = await importBackendApi()

    expect(api.resolveBackendAssetUrl('products/example.png')).toBe(
      'https://api.4thitek.vn/uploads/products/example.png',
    )
  })
})
