import { buildApiUrl } from '../backendApi'
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  refreshStoredAuthSession,
  shouldRefreshAuthSession,
} from '../authSession'

export type ApiResponse<T> = {
  success: boolean
  data: T
  error?: string | null
}

export type BackendPagedResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  sortBy: string
}

export type BackendPublishStatus = 'DRAFT' | 'PUBLISHED'
export type BackendBlogStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
export type BackendOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCEL_REQUESTED'
  | 'CANCEL_REJECTED'
  | 'CANCELLED'
export type BackendPaymentMethod = 'BANK_TRANSFER'
export type BackendPaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED'
export type BackendDealerAccountStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED'
export type BackendFinancialSettlementType = 'CANCELLATION_REFUND' | 'STALE_ORDER_REVIEW'
export type BackendStaffUserStatus = 'ACTIVE' | 'PENDING'
export type BackendDiscountRuleStatus = 'ACTIVE' | 'DRAFT'
export type BackendWarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'VOID'
export type BackendProductSerialStatus = 'AVAILABLE' | 'RESERVED' | 'DEFECTIVE' | 'ASSIGNED' | 'WARRANTY' | 'RETURNED' | 'INSPECTING' | 'SCRAPPED' | 'WARRANTY_REPLACED'
export type BackendRmaAction = 'START_INSPECTION' | 'PASS_QC' | 'SCRAP'
export type BackendRmaRequest = {
  action: BackendRmaAction
  reason: string
  proofUrls?: string[]
}
export type BackendNotifyType = 'SYSTEM' | 'PROMOTION' | 'ORDER' | 'WARRANTY'
export type BackendSupportPriority = 'normal' | 'high' | 'urgent'
export type BackendSupportCategory = 'order' | 'warranty' | 'product' | 'payment' | 'returnOrder' | 'other'
export type BackendSupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type BackendSupportMessageAuthorRole = 'dealer' | 'admin' | 'system'
export type BackendMediaType = 'image' | 'video' | 'document' | 'other'
export type BackendMediaStatus = 'pending' | 'active' | 'deleted' | 'orphaned' | 'quarantined'
export type BackendMediaCategory =
  | 'support_ticket'
  | 'payment_proof'
  | 'product'
  | 'blog'
  | 'avatar'
  | 'other'
export type BackendMediaUploadMethod = 'PRESIGNED_PUT' | 'MULTIPART'
export type BackendReportExportType = 'ORDERS' | 'REVENUE' | 'WARRANTIES' | 'SERIALS'
export type BackendReportFormat = 'XLSX' | 'PDF'
export type BackendReturnRequestType = 'COMMERCIAL_RETURN' | 'DEFECTIVE_RETURN' | 'WARRANTY_RMA'
export type BackendReturnRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'AWAITING_RECEIPT'
  | 'RECEIVED'
  | 'INSPECTING'
  | 'PARTIALLY_RESOLVED'
  | 'COMPLETED'
  | 'CANCELLED'
export type BackendReturnRequestResolution = 'REPLACE' | 'CREDIT_NOTE' | 'REFUND' | 'INSPECT_ONLY'
export type BackendReturnRequestItemStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RECEIVED'
  | 'INSPECTING'
  | 'QC_PASSED'
  | 'QC_FAILED'
  | 'RESTOCKED'
  | 'SCRAPPED'
  | 'REPLACED'
  | 'CREDITED'
  | 'REPAIRED'
  | 'RETURNED_TO_CUSTOMER'
  | 'WARRANTY_REJECTED'
export type BackendReturnRequestItemCondition = 'SEALED' | 'OPEN_BOX' | 'USED' | 'DEFECTIVE'
export type BackendReturnRequestItemFinalResolution =
  | 'RESTOCK'
  | 'REPLACE'
  | 'CREDIT_NOTE'
  | 'REFUND'
  | 'SCRAP'
  | 'REPAIR'
  | 'RETURN_TO_CUSTOMER'
  | 'REJECT_WARRANTY'
export type BackendReturnRequestAttachmentCategory = 'PROOF' | 'DEFECT_PHOTO' | 'RECEIPT' | 'PACKING' | 'OTHER'

export type BackendReportDownloadResponse = {
  blob: Blob
  fileName: string
  contentType: string
}

// Neutral fallback codes let calling layers map API failures through their own i18n.
export const ADMIN_API_REQUEST_FAILED = 'ADMIN_API_REQUEST_FAILED'
export const ADMIN_API_SESSION_EXPIRED = 'ADMIN_API_SESSION_EXPIRED'

export const buildQueryString = (params?: Record<string, string | number | boolean | null | undefined>) => {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  const serialized = searchParams.toString()
  return serialized ? `?${serialized}` : ''
}

export const parseApiResponse = async <T>(response: Response) => {
  try {
    return (await response.json()) as ApiResponse<T>
  } catch {
    return null
  }
}

export const requestWithToken = ({
  path,
  token,
  method,
  body,
  params,
}: {
  path: string
  token: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | boolean | null | undefined>
}) =>
  fetch(buildApiUrl(`${path}${buildQueryString(params)}`), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export const resolveAuthorizedToken = async (fallbackToken: string) => {
  const storedSession = readStoredAuthSession()

  if (!storedSession) {
    return fallbackToken
  }

  if (shouldRefreshAuthSession(storedSession)) {
    const refreshedSession = await refreshStoredAuthSession()
    return refreshedSession?.accessToken ?? storedSession.accessToken ?? fallbackToken
  }

  return storedSession.accessToken ?? fallbackToken
}

export const authorizedJsonRequest = async <T>({
  path,
  token,
  method = 'GET',
  body,
  params,
}: {
  path: string
  token: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | boolean | null | undefined>
}): Promise<T> => {
  let activeToken = await resolveAuthorizedToken(token)
  let response = await requestWithToken({
    path,
    token: activeToken,
    method,
    body,
    params,
  })

  if (response.status === 401) {
    const refreshedSession = await refreshStoredAuthSession()
    if (refreshedSession?.accessToken) {
      activeToken = refreshedSession.accessToken
      response = await requestWithToken({
        path,
        token: activeToken,
        method,
        body,
        params,
      })
    }
  }

  const payload = await parseApiResponse<T>(response)

  if (!response.ok || !payload?.success) {
    if (response.status === 401) {
      clearStoredAuthSession()
    }
    throw new Error(
      payload?.error || (response.status === 401 ? ADMIN_API_SESSION_EXPIRED : ADMIN_API_REQUEST_FAILED),
    )
  }

  return payload.data
}

export const parseDownloadFilename = (response: Response, fallbackFileName: string) => {
  const contentDisposition = response.headers.get('Content-Disposition') ?? ''
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }
  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  if (plainMatch?.[1]) {
    return plainMatch[1]
  }
  return fallbackFileName
}

export const authorizedBlobRequest = async ({
  path,
  token,
  params,
  fallbackFileName,
}: {
  path: string
  token: string
  params?: Record<string, string | number | boolean | null | undefined>
  fallbackFileName: string
}): Promise<BackendReportDownloadResponse> => {
  let activeToken = await resolveAuthorizedToken(token)
  let response = await requestWithToken({
    path,
    token: activeToken,
    method: 'GET',
    params,
  })

  if (response.status === 401) {
    const refreshedSession = await refreshStoredAuthSession()
    if (refreshedSession?.accessToken) {
      activeToken = refreshedSession.accessToken
      response = await requestWithToken({
        path,
        token: activeToken,
        method: 'GET',
        params,
      })
    }
  }

  if (!response.ok) {
    const payload = await parseApiResponse<unknown>(response)
    if (response.status === 401) {
      clearStoredAuthSession()
    }
    throw new Error(
      payload?.error || (response.status === 401 ? ADMIN_API_SESSION_EXPIRED : ADMIN_API_REQUEST_FAILED),
    )
  }

  return {
    blob: await response.blob(),
    fileName: parseDownloadFilename(response, fallbackFileName),
    contentType: response.headers.get('Content-Type') || 'application/octet-stream',
  }
}

export const fetchAllPagedItems = async <T>(
  fetchPage: (params: { page?: number; size?: number }) => Promise<BackendPagedResponse<T>>,
  size = 100,
) => {
  const firstPage = await fetchPage({ page: 0, size })
  if (firstPage.totalPages <= 1) {
    return firstPage.items
  }

  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) =>
      fetchPage({ page: index + 1, size }),
    ),
  )

  return [firstPage, ...remainingPages].flatMap((pageData) => pageData.items)
}
