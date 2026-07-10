import {
  type BackendDealerAccountStatus,
  type BackendPagedResponse,
  authorizedJsonRequest,
  fetchAllPagedItems,
} from './client'

export type BackendDealerAccountResponse = {
  id: number
  name: string
  businessName?: string | null
  contactName?: string | null
  status?: BackendDealerAccountStatus | null
  orders?: number | null
  lastOrderAt?: string | null
  revenue?: number | string | null
  email?: string | null
  phone?: string | null
  taxCode?: string | null
  addressLine?: string | null
  ward?: string | null
  district?: string | null
  city?: string | null
  country?: string | null
  avatarUrl?: string | null
  salesPolicy?: string | null
  allowedTransitions?: BackendDealerAccountStatus[] | null
}

export type BackendDealerAccountSummaryResponse = {
  total: number
  active: number
  underReview: number
  suspended: number
  totalRevenue: number | string
}

export type BackendDealerAccountUpsertRequest = {
  name: string
  businessName?: string
  contactName?: string
  status?: BackendDealerAccountStatus
  revenue?: number
  email: string
  phone: string
}

export type BackendDealerProfileUpdateRequest = {
  businessName?: string
  contactName?: string
  taxCode?: string
  phone?: string
  addressLine?: string
  ward?: string
  district?: string
  city?: string
  country?: string
  email?: string
  avatarUrl?: string
  salesPolicy?: string
}

export const fetchAdminDealerAccounts = (token: string) =>
  fetchAllPagedItems(
    (params) =>
      authorizedJsonRequest<BackendPagedResponse<BackendDealerAccountResponse>>({
        path: '/admin/dealers/accounts/page',
        token,
        params,
      }),
    100,
  )

export const fetchAdminDealerAccountsPaged = (
  token: string,
  params?: {
    page?: number
    size?: number
    status?: BackendDealerAccountStatus
    query?: string
    sortBy?: string
    sortDir?: string
  },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendDealerAccountResponse>>({
    path: '/admin/dealers/accounts/page',
    token,
    params,
  })

export const fetchAdminDealerAccountSummary = (token: string) =>
  authorizedJsonRequest<BackendDealerAccountSummaryResponse>({
    path: '/admin/dealers/accounts/summary',
    token,
  })

export const updateAdminDealerAccountStatus = (
  token: string,
  id: number,
  status: BackendDealerAccountStatus,
  reason?: string,
) =>
  authorizedJsonRequest<BackendDealerAccountResponse>({
    path: `/admin/dealers/accounts/${id}/status`,
    token,
    method: 'PATCH',
    body: { status, reason },
  })

export const updateAdminDealerProfile = (
  token: string,
  id: number,
  body: BackendDealerProfileUpdateRequest,
) =>
  authorizedJsonRequest<BackendDealerAccountResponse>({
    path: `/admin/dealers/accounts/${id}`,
    token,
    method: 'PUT',
    body,
  })
