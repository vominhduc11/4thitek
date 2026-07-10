import { type BackendDiscountRuleStatus, authorizedJsonRequest } from './client'

export type BackendDiscountRuleResponse = {
  id: number
  fromQuantity: number
  toQuantity?: number | null
  rangeLabel: string
  percent?: number | string | null
  status?: BackendDiscountRuleStatus | null
  updatedAt?: string | null
}

export type BackendDiscountRuleUpsertRequest = {
  fromQuantity: number
  toQuantity: number | null
  percent: number
  status?: BackendDiscountRuleStatus
}

export const fetchAdminDiscountRules = (token: string) =>
  authorizedJsonRequest<BackendDiscountRuleResponse[]>({
    path: '/admin/discount-rules',
    token,
  })

export const createAdminDiscountRule = (
  token: string,
  body: BackendDiscountRuleUpsertRequest,
) =>
  authorizedJsonRequest<BackendDiscountRuleResponse>({
    path: '/admin/discount-rules',
    token,
    method: 'POST',
    body,
  })

export const updateAdminDiscountRule = (
  token: string,
  id: number,
  body: BackendDiscountRuleUpsertRequest,
) =>
  authorizedJsonRequest<BackendDiscountRuleResponse>({
    path: `/admin/discount-rules/${id}`,
    token,
    method: 'PUT',
    body,
  })

export const updateAdminDiscountRuleStatus = (
  token: string,
  id: number,
  status: BackendDiscountRuleStatus,
) =>
  authorizedJsonRequest<BackendDiscountRuleResponse>({
    path: `/admin/discount-rules/${id}/status`,
    token,
    method: 'PATCH',
    body: { status },
  })
