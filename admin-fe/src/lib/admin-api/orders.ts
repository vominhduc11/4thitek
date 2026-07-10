import {
  type BackendOrderStatus,
  type BackendPaymentMethod,
  type BackendPaymentStatus,
  type BackendPagedResponse,
  authorizedJsonRequest,
  fetchAllPagedItems,
} from './client'
import { type BackendSerialResponse } from './serials'

export type BackendOrderItemResponse = {
  productId: number
  productSku: string
  productName: string
  quantity?: number | null
  unitPrice?: number | string | null
}

export type BackendOrderResponse = {
  id: number
  orderCode: string
  dealerId?: number | null
  dealerName?: string | null
  status?: BackendOrderStatus | null
  paymentMethod?: BackendPaymentMethod | null
  paymentStatus?: BackendPaymentStatus | null
  paidAmount?: number | string | null
  totalAmount?: number | string | null
  outstandingAmount?: number | string | null
  itemCount?: number | null
  address?: string | null
  note?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  orderItems?: BackendOrderItemResponse[] | null
  staleReviewRequired?: boolean | null
  shippingOverdue?: boolean | null
  allowedTransitions?: BackendOrderStatus[] | null
}

export type BackendOrderSummaryResponse = {
  total: number
  pending: number
  shipping: number
}

export type AdminAssignOrderSerialsRequest = {
  assignments: Array<{
    productId: number
    serials: string[]
  }>
}

export const fetchAdminOrders = (token: string) =>
  fetchAllPagedItems(
    (params) =>
      authorizedJsonRequest<BackendPagedResponse<BackendOrderResponse>>({
        path: '/admin/orders/page',
        token,
        params,
      }),
    100,
  )

export const fetchAdminOrdersPaged = (
  token: string,
  params?: {
    page?: number
    size?: number
    status?: BackendOrderStatus
    query?: string
    sortBy?: string
    sortDir?: string
  },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendOrderResponse>>({
    path: '/admin/orders/page',
    token,
    params,
  })

export const fetchAdminOrderById = (token: string, id: number) =>
  authorizedJsonRequest<BackendOrderResponse>({
    path: `/admin/orders/${id}`,
    token,
  })

export const fetchAdminOrderSummary = (token: string) =>
  authorizedJsonRequest<BackendOrderSummaryResponse>({
    path: '/admin/orders/summary',
    token,
  })

export const updateAdminOrderStatus = (
  token: string,
  id: number,
  status: BackendOrderStatus,
  cancelReason?: string,
) =>
  authorizedJsonRequest<BackendOrderResponse>({
    path: `/admin/orders/${id}/status`,
    token,
    method: 'PATCH',
    body: { status, ...(cancelReason ? { cancelReason } : {}) },
  })

export const recordAdminOrderPayment = (
  token: string,
  id: number,
  body: {
    amount: number
    method?: BackendPaymentMethod
    channel?: string
    transactionCode?: string
    note?: string
    paidAt?: string
  },
) =>
  authorizedJsonRequest<BackendOrderResponse>({
    path: `/admin/orders/${id}/payments`,
    token,
    method: 'POST',
    body,
  })

export const deleteAdminOrder = (token: string, id: number) =>
  authorizedJsonRequest<{ status: string }>({
    path: `/admin/orders/${id}`,
    token,
    method: 'DELETE',
  })

export const assignAdminOrderSerials = (
  token: string,
  orderId: number,
  body: AdminAssignOrderSerialsRequest,
) =>
  authorizedJsonRequest<BackendSerialResponse[]>({
    path: `/admin/orders/${orderId}/assign-serials`,
    token,
    method: 'POST',
    body,
  })
