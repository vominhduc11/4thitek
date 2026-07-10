import {
  BackendProductSerialStatus,
  BackendRmaRequest,
  authorizedJsonRequest,
  fetchAllPagedItems,
  BackendPagedResponse,
} from './client'

export type BackendSerialResponse = {
  id: number
  serial: string
  status?: BackendProductSerialStatus | null
  productId?: number | null
  productName?: string | null
  productSku?: string | null
  dealerId?: number | null
  dealerName?: string | null
  pendingDealerId?: number | null
  pendingDealerName?: string | null
  customerName?: string | null
  orderId?: number | null
  orderCode?: string | null
  warehouseId?: string | null
  warehouseName?: string | null
  importedAt?: string | null
}

export type BackendSerialImportSkippedItem = {
  serial: string
  reason: string
}

export type BackendSerialImportSummary<T> = {
  importedItems: T[]
  skippedItems: BackendSerialImportSkippedItem[]
  importedCount: number
  skippedCount: number
}

export type BackendSerialImportRequest = {
  productId: number
  serials: string[]
  status?: BackendProductSerialStatus
  dealerId?: number
  orderId?: number
  warehouseId?: string
  warehouseName?: string
}

export const fetchAdminSerialsPaged = (
  token: string,
  params?: { page?: number; size?: number },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendSerialResponse>>({
    path: '/admin/serials/page',
    token,
    params,
  })

export const fetchAllAdminSerials = (token: string, size?: number) =>
  fetchAllPagedItems((params) => fetchAdminSerialsPaged(token, params), size)

export const importAdminSerials = (token: string, body: BackendSerialImportRequest) =>
  authorizedJsonRequest<BackendSerialImportSummary<BackendSerialResponse>>({
    path: '/admin/serials/import',
    token,
    method: 'POST',
    body,
  })

export const updateAdminSerialStatus = (
  token: string,
  id: number,
  status: BackendProductSerialStatus,
) =>
  authorizedJsonRequest<BackendSerialResponse>({
    path: `/admin/serials/${id}/status`,
    token,
    method: 'PATCH',
    body: { status },
  })

export const deleteAdminSerial = (token: string, id: number) =>
  authorizedJsonRequest<{ status: string }>({
    path: `/admin/serials/${id}`,
    token,
    method: 'DELETE',
  })

export const applyAdminRmaAction = (token: string, id: number, body: BackendRmaRequest) =>
  authorizedJsonRequest<BackendSerialResponse>({
    path: `/admin/serials/${id}/rma`,
    token,
    method: 'PATCH',
    body,
  })
