const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`)

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

const normalizeApiBaseUrl = (value: string) => {
  if (!value) return ''

  const trimmed = trimTrailingSlash(value)
  if (!trimmed) return ''
  if (trimmed.endsWith('/api')) {
    return trimmed
  }
  return `${trimmed}/api`
}

const stripApiSuffix = (value: string) => value.replace(/\/api$/i, '')

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
  if (normalizedPath === '/api' || normalizedPath.startsWith('/api/')) {
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

export const resolveBackendAssetUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }
  if (isAbsoluteUrl(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }
  if (trimmed.startsWith('/')) {
    const origin = getBackendOrigin()
    return origin ? `${origin}${trimmed}` : trimmed
  }
  return trimmed
}
