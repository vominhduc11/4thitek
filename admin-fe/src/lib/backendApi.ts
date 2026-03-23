const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '')
const CANONICAL_API_BASE_URL = 'https://api.4thitek.vn/api/v1'
const CANONICAL_API_ORIGIN = 'https://api.4thitek.vn'
const CANONICAL_API_VERSION = 'v1'
const LEGACY_STORAGE_HOST_PATTERN = /(^|\.)storage\.4thitek\.vn$/i
const LEGACY_STORAGE_BUCKET_PREFIX = '/4thitek-uploads/'

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)
const isLocalHostname = (value: string) => /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)$/i.test(value)

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`)

declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiBaseUrl?: string
      apiOrigin?: string
      apiVersion?: string
    }
  }
}

type ApiConfigSource = {
  apiBaseUrl?: string
  apiOrigin?: string
  apiVersion?: string
}

type ResolvedApiConfig = {
  apiBaseUrl: string
  apiOrigin: string
  apiVersion: string
}

type ApiUrlOptions = {
  version?: string
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

const readRuntimeApiOrigin = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.__APP_CONFIG__?.apiOrigin?.trim() ?? ''
}

const readRuntimeApiVersion = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.__APP_CONFIG__?.apiVersion?.trim() ?? ''
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

const hasApiConfigValue = (value: string | undefined) => Boolean(value?.trim())

const hasApiConfigSource = (source: ApiConfigSource) =>
  hasApiConfigValue(source.apiBaseUrl) ||
  hasApiConfigValue(source.apiOrigin) ||
  hasApiConfigValue(source.apiVersion)

const normalizeApiVersion = (value: string) => {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '')
  if (!trimmed) {
    return ''
  }
  if (/^\d+$/.test(trimmed)) {
    return `v${trimmed}`
  }
  const lowered = trimmed.toLowerCase()
  if (/^v\d+$/.test(lowered)) {
    return lowered
  }
  return lowered.startsWith('v') ? lowered : `v${lowered}`
}

const stripApiSuffix = (value: string) => value.replace(/\/api(?:\/v[^/]+)?$/i, '')

const normalizeApiOrigin = (value: string) => {
  if (!value) return ''

  const trimmed = trimTrailingSlash(value)
  if (!trimmed || isPlaceholderHost(trimmed)) {
    return ''
  }

  if (trimmed.startsWith('/')) {
    return stripApiSuffix(trimmed)
  }

  return stripApiSuffix(trimmed)
}

const normalizeApiBaseUrl = (value: string) => {
  if (!value) return ''

  const trimmed = trimTrailingSlash(value)
  if (!trimmed || isPlaceholderHost(trimmed)) {
    return ''
  }
  const versionMatch = trimmed.match(/\/api\/(v[^/]+)$/i)
  if (versionMatch) {
    return `${stripApiSuffix(trimmed) || ''}/api/${normalizeApiVersion(versionMatch[1])}`
  }
  if (/\/api$/i.test(trimmed)) {
    return `${trimmed}/${CANONICAL_API_VERSION}`
  }
  return `${stripApiSuffix(trimmed)}/api/${CANONICAL_API_VERSION}`
}

const deriveApiVersionFromBaseUrl = (value: string) => {
  if (!value) {
    return ''
  }
  const normalized = normalizeApiBaseUrl(value)
  const match = normalized.match(/\/api\/(v[^/]+)$/i)
  return match ? normalizeApiVersion(match[1]) : ''
}

const joinApiBaseUrl = (origin: string, version: string) => {
  const normalizedVersion = normalizeApiVersion(version) || CANONICAL_API_VERSION
  return origin ? `${origin}/api/${normalizedVersion}` : `/api/${normalizedVersion}`
}

const resolveConfiguredApi = (source: ApiConfigSource): ResolvedApiConfig | null => {
  if (!hasApiConfigSource(source)) {
    return null
  }

  const normalizedBaseUrl = normalizeApiBaseUrl(source.apiBaseUrl ?? '')
  const normalizedOrigin =
    normalizeApiOrigin(source.apiOrigin ?? '') || normalizeApiOrigin(normalizedBaseUrl)
  const normalizedVersion =
    normalizeApiVersion(source.apiVersion ?? '') ||
    deriveApiVersionFromBaseUrl(normalizedBaseUrl) ||
    CANONICAL_API_VERSION

  return {
    apiBaseUrl: normalizedBaseUrl || joinApiBaseUrl(normalizedOrigin, normalizedVersion),
    apiOrigin: normalizedOrigin,
    apiVersion: normalizedVersion,
  }
}

const shouldPreferEnvApiConfig = (runtimeSource: ApiConfigSource, envSource: ApiConfigSource) => {
  if (!hasApiConfigSource(envSource)) {
    return false
  }

  if (import.meta.env.DEV) {
    return true
  }

  return hasApiConfigSource(runtimeSource) && isLocalHostname(readWindowHostname())
}

const resolvedApiConfig = (() => {
  const runtimeSource: ApiConfigSource = {
    apiBaseUrl: readRuntimeApiBaseUrl(),
    apiOrigin: readRuntimeApiOrigin(),
    apiVersion: readRuntimeApiVersion(),
  }
  const envSource: ApiConfigSource = {
    apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').trim(),
    apiOrigin: (import.meta.env.VITE_API_ORIGIN ?? '').trim(),
    apiVersion: (import.meta.env.VITE_API_VERSION ?? '').trim(),
  }
  const preferredSource = shouldPreferEnvApiConfig(runtimeSource, envSource)
    ? envSource
    : hasApiConfigSource(runtimeSource)
      ? runtimeSource
      : envSource

  return (
    resolveConfiguredApi(preferredSource) ??
    resolveConfiguredApi({
      apiBaseUrl: CANONICAL_API_BASE_URL,
      apiOrigin: CANONICAL_API_ORIGIN,
      apiVersion: CANONICAL_API_VERSION,
    })!
  )
})()

const joinOriginAndPath = (origin: string, path: string) => (origin ? `${origin}${path}` : path)

export const hasBackendApi = () => resolvedApiConfig.apiBaseUrl.length > 0

export const getApiOrigin = () => resolvedApiConfig.apiOrigin

export const getApiVersion = () => resolvedApiConfig.apiVersion

export const getApiBaseUrl = (options?: ApiUrlOptions) => {
  const requestedVersion = normalizeApiVersion(options?.version ?? '')
  if (!requestedVersion || requestedVersion === resolvedApiConfig.apiVersion) {
    return resolvedApiConfig.apiBaseUrl
  }

  return joinApiBaseUrl(resolvedApiConfig.apiOrigin, requestedVersion)
}

export const buildApiUrl = (path: string, options?: ApiUrlOptions) => {
  if (isAbsoluteUrl(path)) {
    return path
  }

  const apiBaseUrl = getApiBaseUrl(options)
  if (!apiBaseUrl) {
    return ''
  }

  const normalizedPath = ensureLeadingSlash(path)
  if (
    normalizedPath === '/api' ||
    normalizedPath.startsWith('/api/') ||
    /^\/api\/v[^/]+(?:\/|$)/i.test(normalizedPath)
  ) {
    return joinOriginAndPath(getApiOrigin(), normalizedPath)
  }

  return `${apiBaseUrl}${normalizedPath}`
}

export const getBackendOrigin = () => {
  const apiOrigin = getApiOrigin()
  if (apiOrigin) {
    try {
      return new URL(apiOrigin, typeof window !== 'undefined' ? window.location.origin : undefined).origin
    } catch {
      if (apiOrigin.startsWith('/')) {
        return typeof window !== 'undefined' ? window.location.origin : ''
      }
    }
  }

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
