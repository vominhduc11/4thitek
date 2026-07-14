import { type BackendPublishStatus, authorizedJsonRequest } from './client'

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

// Dry-run xem trước: map bản nháp sang public shape (giống GET /product/{id}) mà không
// lưu DB. Xem API_CONTRACT §5.1 "Live Preview".
export type PublicProductPreviewResponse = {
  id: number | null
  name: string | null
  sku: string | null
  shortDescription: string | null
  description: string | null
  image: string | null
  price: number
  specifications: unknown
  videos: unknown
  descriptions: unknown
  stock: number
  warrantyMonths: number
}

export const previewAdminProduct = (token: string, body: BackendProductUpsertRequest) =>
  authorizedJsonRequest<PublicProductPreviewResponse>({
    path: '/admin/products/preview',
    token,
    method: 'POST',
    body,
  })
