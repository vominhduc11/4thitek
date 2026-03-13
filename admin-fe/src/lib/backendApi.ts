const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '')
const CANONICAL_API_BASE_URL = 'https://api.4thitek.vn/api/v1'
const LEGACY_STORAGE_HOST_PATTERN = /(^|\.)storage\.4thitek\.vn$/i
const LEGACY_STORAGE_BUCKET_PREFIX = '/4thitek-uploads/'

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)
const isLocalHostname = (value: string) => /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)$/i.test(value)

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`)

declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiBaseUrl?: string
    }
  }
}

const isPlaceholderHost = (value: string) => {
  if (!value || value.startsWith('/')) {
    return false
  }

  try {
    const parsed = new URL(value)
    return /(^|\.)example\.com$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

const readRuntimeApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.__APP_CONFIG__?.apiBaseUrl?.trim() ?? ''
}

const readWindowHostname = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  const hostname = window.location?.hostname?.trim()
  if (hostname) {
    return hostname
  }

  const origin = window.location?.origin?.trim() ?? ''
  if (!origin) {
    return ''
  }

  try {
    return new URL(origin).hostname
  } catch {
    return ''
  }
}

const shouldPreferEnvApiBaseUrl = (runtimeValue: string, envValue: string) => {
  if (!envValue) {
    return false
  }

  if (import.meta.env.DEV) {
    return true
  }

  return Boolean(runtimeValue) && isLocalHostname(readWindowHostname())
}

const rawApiBaseUrl = (() => {
  const runtimeApiBaseUrl = readRuntimeApiBaseUrl()
  const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
  const trimmed = shouldPreferEnvApiBaseUrl(runtimeApiBaseUrl, envApiBaseUrl)
    ? envApiBaseUrl
    : runtimeApiBaseUrl || envApiBaseUrl
  if (!trimmed || isPlaceholderHost(trimmed)) {
    return CANONICAL_API_BASE_URL
  }
  return trimmed
})()

const normalizeApiBaseUrl = (value: string) => {
  if (!value) return ''

  const trimmed = trimTrailingSlash(value)
  if (!trimmed) return ''
  if (trimmed.endsWith('/api') || trimmed.endsWith('/api/v1')) {
    return trimmed
  }
  return `${trimmed}/api/v1`
}

const stripApiSuffix = (value: string) => value.replace(/\/api(?:\/v1)?$/i, '')

export const hasBackendApi = () => normalizeApiBaseUrl(rawApiBaseUrl).length > 0

export const getApiBaseUrl = () => normalizeApiBaseUrl(rawApiBaseUrl)

export const buildApiUrl = (path: string) => {
  if (isAbsoluteUrl(path)) {
    return path
  }

  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    return ''
  }

  const normalizedPath = ensureLeadingSlash(path)
  if (
    normalizedPath === '/api' ||
    normalizedPath.startsWith('/api/') ||
    normalizedPath === '/api/v1' ||
    normalizedPath.startsWith('/api/v1/')
  ) {
    return `${stripApiSuffix(apiBaseUrl)}${normalizedPath}`
  }

  return `${apiBaseUrl}${normalizedPath}`
}

export const getBackendOrigin = () => {
  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }

  try {
    return new URL(stripApiSuffix(apiBaseUrl)).origin
  } catch {
    if (apiBaseUrl.startsWith('/')) {
      return typeof window !== 'undefined' ? window.location.origin : ''
    }
    return ''
  }
}

const normalizeAssetPath = (value: string) => {
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }

  if (isAbsoluteUrl(value)) {
    try {
      const parsed = new URL(value)
      if (LEGACY_STORAGE_HOST_PATTERN.test(parsed.hostname) && parsed.pathname.startsWith(LEGACY_STORAGE_BUCKET_PREFIX)) {
        return `/uploads/${trimLeadingSlash(parsed.pathname.slice(LEGACY_STORAGE_BUCKET_PREFIX.length))}`
      }
    } catch {
      return value
    }
    return value
  }

  if (value.startsWith('/uploads/')) {
    return value
  }

  if (value.startsWith('/')) {
    return value
  }

  return `/uploads/${trimLeadingSlash(value)}`
}

export const resolveBackendAssetUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }
  const normalized = normalizeAssetPath(trimmed)
  if (isAbsoluteUrl(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized
  }
  if (normalized.startsWith('/')) {
    const origin = getBackendOrigin()
    return origin ? `${origin}${normalized}` : normalized
  }
  return normalized
}
