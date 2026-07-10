import {
  BackendMediaCategory,
  BackendMediaUploadMethod,
  BackendMediaType,
  BackendMediaStatus,
  BackendPagedResponse,
  authorizedJsonRequest,
} from './client'

export type BackendMediaUploadSessionResponse = {
  mediaAssetId: number
  uploadMethod: BackendMediaUploadMethod
  uploadUrl: string
  uploadHeaders?: Record<string, string> | null
  expiresAt?: string | null
}

export type BackendMediaAssetResponse = {
  id: number
  objectKey?: string | null
  originalFileName?: string | null
  contentType?: string | null
  mediaType?: BackendMediaType | null
  category?: BackendMediaCategory | null
  sizeBytes?: number | null
  status?: BackendMediaStatus | null
  downloadUrl?: string | null
  accessUrl?: string | null
  createdAt?: string | null
  finalizedAt?: string | null
  deletedAt?: string | null
}

export type BackendMediaAccessUrlResponse = {
  mediaAssetId: number
  accessUrl: string
  expiresAt?: string | null
}

export type BackendAdminMediaListItem = {
  id: number
  objectKey?: string | null
  fileName?: string | null
  mediaType?: BackendMediaType | null
  contentType?: string | null
  sizeBytes?: number | null
  category?: BackendMediaCategory | null
  status?: BackendMediaStatus | null
  ownerAccountId?: number | null
  ownerName?: string | null
  uploadedByAccountId?: number | null
  uploadedByName?: string | null
  linkedTicketId?: number | null
  linkedTicketCode?: string | null
  linkedDealerName?: string | null
  downloadUrl?: string | null
  createdAt?: string | null
  finalizedAt?: string | null
  deletedAt?: string | null
}

export type BackendAdminMediaSummary = {
  totalFiles: number
  totalBytes: number
  imageBytes: number
  videoBytes: number
  documentBytes: number
  pendingBytes: number
  orphanedBytes: number
}

export const createMediaUploadSession = (
  token: string,
  body: {
    fileName: string
    contentType: string
    sizeBytes: number
    category: BackendMediaCategory
  },
) =>
  authorizedJsonRequest<BackendMediaUploadSessionResponse>({
    path: '/media/upload-session',
    token,
    method: 'POST',
    body,
  })

export const finalizeMediaUpload = (
  token: string,
  mediaAssetId: number,
) =>
  authorizedJsonRequest<BackendMediaAssetResponse>({
    path: '/media/finalize',
    token,
    method: 'POST',
    body: { mediaAssetId },
  })

export const deleteMediaAsset = (token: string, mediaAssetId: number) =>
  authorizedJsonRequest<{ status?: string; id?: number }>({
    path: `/media/${mediaAssetId}`,
    token,
    method: 'DELETE',
  })

export const deleteUploadUrl = (token: string, url: string) =>
  authorizedJsonRequest<{ status?: string; url?: string }>({
    path: '/upload',
    token,
    method: 'DELETE',
    params: { url },
  })

export const fetchMediaAccessUrl = (token: string, mediaAssetId: number) =>
  authorizedJsonRequest<BackendMediaAccessUrlResponse>({
    path: `/media/${mediaAssetId}/access-url`,
    token,
  })

export const fetchAdminMediaList = (
  token: string,
  params?: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
    mediaType?: BackendMediaType
    status?: BackendMediaStatus
    category?: BackendMediaCategory
    query?: string
    from?: string
    to?: string
  },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendAdminMediaListItem>>({
    path: '/admin/media',
    token,
    params,
  })

export const fetchAdminMediaSummary = (token: string) =>
  authorizedJsonRequest<BackendAdminMediaSummary>({
    path: '/admin/media/summary',
    token,
  })

export const softDeleteAdminMedia = (
  token: string,
  id: number,
  body?: {
    status?: BackendMediaStatus
    force?: boolean
    reason?: string
  },
) =>
  authorizedJsonRequest<BackendAdminMediaListItem>({
    path: `/admin/media/${id}`,
    token,
    method: 'PATCH',
    body: body ?? { status: 'deleted' },
  })

export const hardDeleteAdminMedia = (token: string, id: number) =>
  authorizedJsonRequest<{ status: string }>({
    path: `/admin/media/${id}`,
    token,
    method: 'DELETE',
  })
