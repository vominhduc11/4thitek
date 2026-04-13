import { buildApiUrl, hasBackendApi } from './backendApi'

type ApiResponse<T> = {
  success: boolean
  data: T
  error?: string | null
  errorCode?: string | null
}

export class AuthApiError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'AuthApiError'
    this.code = code
  }
}

export type ResendEmailVerificationResponse = {
  status: string
  message: string
}

export type VerifyEmailResponse = {
  status: string
  message: string
  verifiedAt?: string | null
}

export type ForgotPasswordResponse = string

export type ResetPasswordTokenValidationResponse = {
  valid: boolean
  status: 'valid' | 'expired' | 'invalid'
  message: string
}

export type ResetPasswordResponse = string

const AUTH_API_REQUEST_FAILED = 'Authentication request failed'
const AUTH_API_NOT_CONFIGURED = 'Backend API is not configured'

const parseApiResponse = async <T>(response: Response): Promise<ApiResponse<T> | null> => {
  try {
    return (await response.json()) as ApiResponse<T>
  } catch {
    return null
  }
}

const postAuthJson = async <T>(path: string, body: unknown): Promise<T> => {
  if (!hasBackendApi()) {
    throw new AuthApiError(AUTH_API_NOT_CONFIGURED)
  }

  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = await parseApiResponse<T>(response)

  if (!response.ok || !payload?.success) {
    throw new AuthApiError(payload?.error || AUTH_API_REQUEST_FAILED, payload?.errorCode || undefined)
  }

  return payload.data
}

const getAuthJson = async <T>(path: string): Promise<T> => {
  if (!hasBackendApi()) {
    throw new AuthApiError(AUTH_API_NOT_CONFIGURED)
  }

  const response = await fetch(buildApiUrl(path), {
    method: 'GET',
    credentials: 'include',
  })

  const payload = await parseApiResponse<T>(response)

  if (!response.ok || !payload?.success) {
    throw new AuthApiError(payload?.error || AUTH_API_REQUEST_FAILED, payload?.errorCode || undefined)
  }

  return payload.data
}

export const resendAdminEmailVerification = (identity: string) =>
  postAuthJson<ResendEmailVerificationResponse>('/auth/resend-email-verification', {
    identity,
  })

export const verifyAdminEmail = (token: string) =>
  postAuthJson<VerifyEmailResponse>('/auth/verify-email', {
    token,
  })

export const requestAdminPasswordReset = (email: string) =>
  postAuthJson<ForgotPasswordResponse>('/auth/forgot-password', {
    email,
  })

export const validateAdminPasswordResetToken = (token: string) =>
  getAuthJson<ResetPasswordTokenValidationResponse>(`/auth/reset-password/validate?token=${encodeURIComponent(token)}`)

export const resetAdminPassword = (token: string, newPassword: string) =>
  postAuthJson<ResetPasswordResponse>('/auth/reset-password', {
    token,
    newPassword,
  })
