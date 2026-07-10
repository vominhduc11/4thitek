import {
  type BackendNotifyType,
  type BackendPagedResponse,
  authorizedJsonRequest,
  fetchAllPagedItems,
} from './client'

export type BackendNotificationResponse = {
  id: number
  accountId?: number | null
  accountName?: string | null
  accountType?: string | null
  title: string
  body: string
  isRead?: boolean | null
  type?: BackendNotifyType | null
  link?: string | null
  deepLink?: string | null
  createdAt?: string | null
}

export type BackendNotificationCreateRequest = {
  audience: 'DEALERS' | 'ALL_ACCOUNTS' | 'ACCOUNTS'
  title: string
  body: string
  type?: BackendNotifyType
  link?: string
  deepLink?: string
  accountIds?: number[]
}

export type BackendNotificationDispatchResponse = {
  audience: string
  type: BackendNotifyType
  recipientCount: number
  recipientIds: number[]
  dispatchedAt: string
}

export const fetchAdminNotifications = (
  token: string,
  params?: { page?: number; size?: number },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendNotificationResponse>>({
    path: '/admin/notifications/page',
    token,
    params,
  })

export const fetchAllAdminNotifications = (token: string, size?: number) =>
  fetchAllPagedItems((params) => fetchAdminNotifications(token, params), size)

export const createAdminNotificationDispatch = (
  token: string,
  body: BackendNotificationCreateRequest,
) =>
  authorizedJsonRequest<BackendNotificationDispatchResponse>({
    path: '/admin/notifications',
    token,
    method: 'POST',
    body,
  })
