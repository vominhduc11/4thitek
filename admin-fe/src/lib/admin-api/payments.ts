import {
  BackendPaymentMethod,
  BackendPaymentStatus,
  BackendFinancialSettlementType,
  BackendPagedResponse,
  authorizedJsonRequest,
} from './client'

export type BackendOrderAdjustmentType = 'CORRECTION' | 'WRITE_OFF' | 'CREDIT_NOTE' | 'REFUND_RECORD'

export type BackendOrderAdjustmentResponse = {
  id: number
  orderId: number
  type: BackendOrderAdjustmentType
  amount: number | string
  reason: string
  referenceCode?: string | null
  createdBy?: string | null
  createdByRole?: string | null
  createdAt?: string | null
}

export type BackendOrderAdjustmentRequest = {
  type: BackendOrderAdjustmentType
  amount: number
  reason: string
  referenceCode?: string
  confirmOverride?: boolean
}

export type BackendUnmatchedPaymentStatus = 'PENDING' | 'MATCHED' | 'REFUNDED' | 'WRITTEN_OFF'
export type BackendUnmatchedPaymentReason =
  | 'ORDER_NOT_FOUND'
  | 'AMOUNT_MISMATCH'
  | 'ORDER_ALREADY_SETTLED'
  | 'ORDER_CANCELLED'

export type BackendUnmatchedPaymentResponse = {
  id: number
  transactionCode?: string | null
  amount?: number | string | null
  senderInfo?: string | null
  content?: string | null
  orderCodeHint?: string | null
  receivedAt?: string | null
  reason?: BackendUnmatchedPaymentReason | null
  status?: BackendUnmatchedPaymentStatus | null
  createdAt?: string | null
  resolution?: string | null
  resolvedBy?: string | null
  resolvedAt?: string | null
  matchedOrderId?: number | null
}

export type BackendRecentPaymentResponse = {
  id: number
  orderId?: number | null
  orderCode?: string | null
  dealerId?: number | null
  dealerName?: string | null
  amount?: number | string | null
  method?: BackendPaymentMethod | null
  status?: BackendPaymentStatus | null
  channel?: string | null
  transactionCode?: string | null
  note?: string | null
  proofFileName?: string | null
  paidAt?: string | null
  createdAt?: string | null
}

export type BackendFinancialSettlementStatus = 'PENDING' | 'REFUNDED' | 'WRITTEN_OFF' | 'CREDITED'

export type BackendFinancialSettlementResponse = {
  id: number
  orderId?: number | null
  orderCode?: string | null
  type?: BackendFinancialSettlementType | null
  amount?: number | string | null
  status: BackendFinancialSettlementStatus
  createdBy?: string | null
  createdAt?: string | null
  resolution?: string | null
  resolvedBy?: string | null
  resolvedAt?: string | null
}

export type BackendOrderPaymentResponse = {
  id: number
  orderId?: number | null
  amount?: number | string | null
  method?: BackendPaymentMethod | null
  channel?: string | null
  transactionCode?: string | null
  note?: string | null
  paidAt?: string | null
  createdAt?: string | null
  recordedBy?: string | null
}

export const fetchAdminUnmatchedPayments = (
  token: string,
  params?: { page?: number; size?: number; status?: string; reason?: string },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendUnmatchedPaymentResponse>>({
    path: '/admin/unmatched-payments',
    token,
    params,
  })

export const resolveAdminUnmatchedPayment = (
  token: string,
  id: number,
  body: {
    status: BackendUnmatchedPaymentStatus
    resolution?: string
    matchedOrderId?: number
    allocationAmount?: number
  },
) =>
  authorizedJsonRequest<BackendUnmatchedPaymentResponse>({
    path: `/admin/unmatched-payments/${id}`,
    token,
    method: 'PATCH',
    body,
  })

export const fetchAdminFinancialSettlements = (
  token: string,
  params?: { status?: string },
) =>
  authorizedJsonRequest<BackendFinancialSettlementResponse[]>({
    path: '/admin/financial-settlements',
    token,
    params,
  })

export const resolveAdminFinancialSettlement = (
  token: string,
  id: number,
  body: { status: BackendFinancialSettlementStatus; resolution: string },
) =>
  authorizedJsonRequest<BackendFinancialSettlementResponse>({
    path: `/admin/financial-settlements/${id}`,
    token,
    method: 'PATCH',
    body,
  })

export const fetchAdminOrderAdjustments = (token: string, orderId: number) =>
  authorizedJsonRequest<BackendOrderAdjustmentResponse[]>({
    path: `/admin/orders/${orderId}/adjustments`,
    token,
  })

export const createAdminOrderAdjustment = (
  token: string,
  orderId: number,
  body: BackendOrderAdjustmentRequest,
) =>
  authorizedJsonRequest<BackendOrderAdjustmentResponse>({
    path: `/admin/orders/${orderId}/adjustments`,
    token,
    method: 'POST',
    body,
  })

export const fetchAdminRecentPayments = (
  token: string,
  params?: {
    page?: number
    size?: number
    dealerId?: number
    from?: string
    to?: string
    minAmount?: number
    maxAmount?: number
    hasProof?: boolean
  },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendRecentPaymentResponse>>({
    path: '/admin/payments/recent',
    token,
    params,
  })

export const fetchAdminOrderPayments = (token: string, orderId: number) =>
  authorizedJsonRequest<BackendOrderPaymentResponse[]>({
    path: `/admin/orders/${orderId}/payments`,
    token,
  })
