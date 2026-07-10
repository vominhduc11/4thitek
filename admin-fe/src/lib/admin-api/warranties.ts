import {
  type BackendWarrantyStatus,
  type BackendPagedResponse,
  authorizedJsonRequest,
  fetchAllPagedItems,
} from './client'

export type BackendWarrantyResponse = {
  id: number
  warrantyCode?: string | null
  productSerialId?: number | null
  serial?: string | null
  productId?: number | null
  productName?: string | null
  productSku?: string | null
  dealerId?: number | null
  dealerName?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  status?: BackendWarrantyStatus | null
  warrantyStart?: string | null
  warrantyEnd?: string | null
  remainingDays?: number | null
  createdAt?: string | null
}

export const fetchAdminWarranties = (
  token: string,
  params?: { page?: number; size?: number },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendWarrantyResponse>>({
    path: '/admin/warranties',
    token,
    params,
  })

export const fetchAllAdminWarranties = (token: string, size?: number) =>
  fetchAllPagedItems((params) => fetchAdminWarranties(token, params), size)

export const updateAdminWarrantyStatus = (
  token: string,
  id: number,
  status: BackendWarrantyStatus,
) =>
  authorizedJsonRequest<BackendWarrantyResponse>({
    path: `/admin/warranties/${id}/status`,
    token,
    method: 'PATCH',
    body: { status },
  })
