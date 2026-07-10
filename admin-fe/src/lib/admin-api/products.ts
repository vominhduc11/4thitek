import { BackendPublishStatus, authorizedJsonRequest } from './client'

export type BackendProductResponse = {
  id: number
  sku: string
  name: string
  shortDescription: string
  image?: Record<string, unknown> | null
  descriptions?: Array<Record<string, unknown>> | null
  videos?: Array<Record<string, unknown>> | null
  specifications?: Array<Record<string, unknown>> | null
  retailPrice?: number | string | null
  availableStock?: number | null
  warrantyPeriod?: number | null
  showOnHomepage?: boolean | null
  isFeatured?: boolean | null
  isDeleted?: boolean | null
  publishStatus?: BackendPublishStatus | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendProductUpsertRequest = {
  sku?: string
  name?: string
  shortDescription?: string
  image?: Record<string, unknown>
  descriptions?: Array<Record<string, unknown>>
  videos?: Array<Record<string, unknown>>
  specifications?: Array<Record<string, unknown>>
  retailPrice?: number
  warrantyPeriod?: number
  showOnHomepage?: boolean
  isFeatured?: boolean
  isDeleted?: boolean
  publishStatus?: BackendPublishStatus
}

export const fetchAdminProducts = (token: string) =>
  authorizedJsonRequest<BackendProductResponse[]>({
    path: '/admin/products',
    token,
  })

export const createAdminProduct = (token: string, body: BackendProductUpsertRequest) =>
  authorizedJsonRequest<BackendProductResponse>({
    path: '/admin/products',
    token,
    method: 'POST',
    body,
  })

export const updateAdminProduct = (
  token: string,
  id: number,
  body: BackendProductUpsertRequest,
) =>
  authorizedJsonRequest<BackendProductResponse>({
    path: `/admin/products/${id}`,
    token,
    method: 'PUT',
    body,
  })

export const deleteAdminProduct = (token: string, id: number) =>
  authorizedJsonRequest<{ status: string }>({
    path: `/admin/products/${id}`,
    token,
    method: 'DELETE',
  })
