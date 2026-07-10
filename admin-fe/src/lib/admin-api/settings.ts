import { authorizedJsonRequest } from './client'

export type BackendAdminSettingsResponse = {
  id: number
  emailConfirmation: boolean
  sessionTimeoutMinutes: number
  orderAlerts: boolean
  inventoryAlerts: boolean
  vatPercent: number
  sepay?: {
    enabled?: boolean | null
    hasWebhookToken?: boolean | null
    webhookTokenMasked?: string | null
    bankName?: string | null
    accountNumber?: string | null
    accountHolder?: string | null
  } | null
  emailSettings?: {
    enabled?: boolean | null
    from?: string | null
    fromName?: string | null
  } | null
  rateLimitOverrides?: {
    enabled?: boolean | null
    auth?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
    passwordReset?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
    warrantyLookup?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
    upload?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
    webhook?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
  } | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendAdminSettingsUpdateRequest = {
  emailConfirmation?: boolean
  sessionTimeoutMinutes?: number
  orderAlerts?: boolean
  inventoryAlerts?: boolean
  vatPercent?: number
  sepay?: {
    enabled?: boolean
    bankName?: string
    accountNumber?: string
    accountHolder?: string
  }
  emailSettings?: {
    enabled?: boolean
    from?: string
    fromName?: string
  }
  rateLimitOverrides?: {
    enabled?: boolean
    auth?: {
      requests?: number
      windowSeconds?: number
    }
    passwordReset?: {
      requests?: number
      windowSeconds?: number
    }
    warrantyLookup?: {
      requests?: number
      windowSeconds?: number
    }
    upload?: {
      requests?: number
      windowSeconds?: number
    }
    webhook?: {
      requests?: number
      windowSeconds?: number
    }
  }
}

export type BackendChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export const fetchAdminSettings = (token: string) =>
  authorizedJsonRequest<BackendAdminSettingsResponse>({
    path: '/admin/settings',
    token,
  })

export const updateAdminSettings = (
  token: string,
  body: BackendAdminSettingsUpdateRequest,
) =>
  authorizedJsonRequest<BackendAdminSettingsResponse>({
    path: '/admin/settings',
    token,
    method: 'PUT',
    body,
  })

export const replaceAdminSepayWebhookToken = (
  token: string,
  body: { newWebhookToken: string },
) =>
  authorizedJsonRequest<BackendAdminSettingsResponse>({
    path: '/admin/settings/sepay/webhook-token',
    token,
    method: 'PUT',
    body,
  })

export const changeAdminPassword = (
  token: string,
  body: BackendChangePasswordRequest,
) =>
  authorizedJsonRequest<{ status: string }>({
    path: '/admin/password',
    token,
    method: 'PATCH',
    body,
  })

export const testAdminEmailSettings = (token: string) =>
  authorizedJsonRequest<{ status: string }>({
    path: '/admin/settings/test-email',
    token,
    method: 'POST',
  })
