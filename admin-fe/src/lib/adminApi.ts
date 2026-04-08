import { buildApiUrl } from './backendApi'
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  refreshStoredAuthSession,
  shouldRefreshAuthSession,
} from './authSession'

type ApiResponse<T> = {
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
export type BackendOrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'
export type BackendPaymentMethod = 'BANK_TRANSFER'
export type BackendPaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED'
export type BackendDealerAccountStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED'
export type BackendFinancialSettlementType = 'CANCELLATION_REFUND' | 'STALE_ORDER_REVIEW'
export type BackendStaffUserStatus = 'ACTIVE' | 'PENDING'
export type BackendDiscountRuleStatus = 'ACTIVE' | 'PENDING' | 'DRAFT'
export type BackendWarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'VOID'
export type BackendProductSerialStatus = 'AVAILABLE' | 'RESERVED' | 'DEFECTIVE' | 'ASSIGNED' | 'WARRANTY' | 'RETURNED' | 'INSPECTING' | 'SCRAPPED'
export type BackendRmaAction = 'START_INSPECTION' | 'PASS_QC' | 'SCRAP'
export type BackendRmaRequest = {
  action: BackendRmaAction
  reason: string
  proofUrls?: string[]
}
export type BackendNotifyType = 'SYSTEM' | 'PROMOTION' | 'ORDER' | 'WARRANTY'
export type BackendSupportPriority = 'NORMAL' | 'HIGH' | 'URGENT'
export type BackendSupportCategory = 'ORDER' | 'WARRANTY' | 'PRODUCT' | 'PAYMENT' | 'RETURN' | 'OTHER'
export type BackendSupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type BackendReportExportType = 'ORDERS' | 'REVENUE' | 'WARRANTIES' | 'SERIALS'
export type BackendReportFormat = 'XLSX' | 'PDF'

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

export type BackendBlogResponse = {
  id: number
  categoryId?: number | null
  categoryName?: string | null
  title: string
  description: string
  image?: string | null
  introduction?: string | null
  status?: BackendBlogStatus | null
  scheduledAt?: string | null
  showOnHomepage?: boolean | null
  isDeleted?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendBlogUpsertRequest = {
  categoryId?: number
  categoryName?: string
  title?: string
  description?: string
  image?: string
  introduction?: string
  status?: BackendBlogStatus
  scheduledAt?: string | null
  showOnHomepage?: boolean
  isDeleted?: boolean
}

export type BackendCategory = {
  id: number
  name: string
}

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
  allowedTransitions?: BackendOrderStatus[] | null
}

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

export type BackendAuditLogResponse = {
  id: number
  createdAt?: string | null
  actor?: string | null
  actorRole?: string | null
  action?: string | null
  requestMethod?: string | null
  requestPath?: string | null
  entityType?: string | null
  entityId?: string | null
  ipAddress?: string | null
}

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
  allowedTransitions?: BackendDealerAccountStatus[] | null
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

export type BackendStaffUserResponse = {
  id: number
  name: string
  role: string
  systemRole?: 'ADMIN' | 'SUPER_ADMIN' | null
  status?: BackendStaffUserStatus | null
  username?: string | null
  email?: string | null
  temporaryPassword?: string | null
}

export type BackendStaffUserUpsertRequest = {
  email: string
  name: string
  role: string
  status?: BackendStaffUserStatus
}

export type BackendDiscountRuleResponse = {
  id: number
  label: string
  range: string
  percent?: number | string | null
  status?: BackendDiscountRuleStatus | null
  updatedAt?: string | null
}

export type BackendDiscountRuleUpsertRequest = {
  label: string
  range: string
  percent: number
  status?: BackendDiscountRuleStatus
}

export type BackendDashboardResponse = {
  revenue: {
    label: string
    value: number | string
    delta: string
    progress: number
  }
  orders: {
    total: number
    pending: number
    progress: number
  }
  lowStock: {
    skus: number
    restock: number
    progress: number
  }
  orderStatus: Array<{
    label: string
    value: number
  }>
  topProducts: Array<{
    name: string
    units: string
  }>
  system: Array<{
    label: string
    value: string
    hint?: string | null
    tone?: string | null
    group?: string | null
  }>
  trend: {
    title: string
    subtitle: string
    points: Array<{
      label: string
      value: number
    }>
  }
  unmatchedPendingCount?: number
  settlementPendingCount?: number
  staleOrdersCount?: number
}

export type BackendSupportTicketResponse = {
  id: number
  dealerId?: number | null
  dealerName?: string | null
  ticketCode?: string | null
  category?: BackendSupportCategory | null
  priority?: BackendSupportPriority | null
  status?: BackendSupportTicketStatus | null
  subject?: string | null
  message?: string | null
  adminReply?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  resolvedAt?: string | null
  closedAt?: string | null
}

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

export type BackendNotificationResponse = {
  id: number
  accountId?: number | null
  accountName?: string | null
  accountType?: string | null
  title: string
  body: string
  isRead?: boolean | null
  type?: BackendNotifyType | null
  link?: string | null
  deepLink?: string | null
  createdAt?: string | null
}

export type BackendNotificationCreateRequest = {
  audience: 'DEALERS' | 'ALL_ACCOUNTS' | 'ACCOUNTS'
  title: string
  body: string
  type?: BackendNotifyType
  link?: string
  deepLink?: string
  accountIds?: number[]
}

export type BackendNotificationDispatchResponse = {
  audience: string
  type: BackendNotifyType
  recipientCount: number
  recipientIds: number[]
  dispatchedAt: string
}

export type BackendReportDownloadResponse = {
  blob: Blob
  fileName: string
  contentType: string
}

export type BackendAdminSettingsResponse = {
  id: number
  emailConfirmation: boolean
  sessionTimeoutMinutes: number
  orderAlerts: boolean
  inventoryAlerts: boolean
  vatPercent: number
  sepay?: {
    enabled?: boolean | null
    webhookToken?: string | null
    bankName?: string | null
    accountNumber?: string | null
    accountHolder?: string | null
  } | null
  emailSettings?: {
    enabled?: boolean | null
    from?: string | null
    fromName?: string | null
  } | null
  rateLimitOverrides?: {
    enabled?: boolean | null
    auth?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
    passwordReset?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
    warrantyLookup?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
    upload?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
    webhook?: {
      requests?: number | null
      windowSeconds?: number | null
    } | null
  } | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendAdminSettingsUpdateRequest = {
  emailConfirmation?: boolean
  sessionTimeoutMinutes?: number
  orderAlerts?: boolean
  inventoryAlerts?: boolean
  vatPercent?: number
  sepay?: {
    enabled?: boolean
    webhookToken?: string
    bankName?: string
    accountNumber?: string
    accountHolder?: string
  }
  emailSettings?: {
    enabled?: boolean
    from?: string
    fromName?: string
  }
  rateLimitOverrides?: {
    enabled?: boolean
    auth?: {
      requests?: number
      windowSeconds?: number
    }
    passwordReset?: {
      requests?: number
      windowSeconds?: number
    }
    warrantyLookup?: {
      requests?: number
      windowSeconds?: number
    }
    upload?: {
      requests?: number
      windowSeconds?: number
    }
    webhook?: {
      requests?: number
      windowSeconds?: number
    }
  }
}

export type BackendChangePasswordRequest = {
  currentPassword: string
  newPassword: string
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
  reviewSuggested?: boolean | null
}

// Neutral fallback codes let calling layers map API failures through their own i18n.
export const ADMIN_API_REQUEST_FAILED = 'ADMIN_API_REQUEST_FAILED'
export const ADMIN_API_SESSION_EXPIRED = 'ADMIN_API_SESSION_EXPIRED'

const buildQueryString = (params?: Record<string, string | number | boolean | null | undefined>) => {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  const serialized = searchParams.toString()
  return serialized ? `?${serialized}` : ''
}

const parseApiResponse = async <T>(response: Response) => {
  try {
    return (await response.json()) as ApiResponse<T>
  } catch {
    return null
  }
}

const requestWithToken = ({
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

const resolveAuthorizedToken = async (fallbackToken: string) => {
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

const authorizedJsonRequest = async <T>({
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

const parseDownloadFilename = (response: Response, fallbackFileName: string) => {
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

const authorizedBlobRequest = async ({
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

const fetchAllPagedItems = async <T>(
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

export const fetchAdminBlogs = (token: string) =>
  authorizedJsonRequest<BackendBlogResponse[]>({
    path: '/admin/blogs',
    token,
  })

export const createAdminBlog = (token: string, body: BackendBlogUpsertRequest) =>
  authorizedJsonRequest<BackendBlogResponse>({
    path: '/admin/blogs',
    token,
    method: 'POST',
    body,
  })

export const updateAdminBlog = (token: string, id: number, body: BackendBlogUpsertRequest) =>
  authorizedJsonRequest<BackendBlogResponse>({
    path: `/admin/blogs/${id}`,
    token,
    method: 'PUT',
    body,
  })

export const deleteAdminBlog = (token: string, id: number) =>
  authorizedJsonRequest<{ status: string }>({
    path: `/admin/blogs/${id}`,
    token,
    method: 'DELETE',
  })

export const fetchAdminCategories = (token: string) =>
  authorizedJsonRequest<BackendCategory[]>({
    path: '/admin/categories',
    token,
  })

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

export const updateAdminOrderStatus = (
  token: string,
  id: number,
  status: BackendOrderStatus,
) =>
  authorizedJsonRequest<BackendOrderResponse>({
    path: `/admin/orders/${id}/status`,
    token,
    method: 'PATCH',
    body: { status },
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

export type AdminAssignOrderSerialsRequest = {
  assignments: Array<{
    productId: number
    serials: string[]
  }>
}

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

export const fetchAdminUsers = (token: string) =>
  authorizedJsonRequest<BackendStaffUserResponse[]>({
    path: '/admin/users',
    token,
  })

export const createAdminUser = (token: string, body: BackendStaffUserUpsertRequest) =>
  authorizedJsonRequest<BackendStaffUserResponse>({
    path: '/admin/users',
    token,
    method: 'POST',
    body,
  })

export const updateAdminUserStatus = (
  token: string,
  id: number,
  status: BackendStaffUserStatus,
) =>
  authorizedJsonRequest<BackendStaffUserResponse>({
    path: `/admin/users/${id}/status`,
    token,
    method: 'PATCH',
    body: { status },
  })

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

export const fetchAdminDashboard = (token: string) =>
  authorizedJsonRequest<BackendDashboardResponse>({
    path: '/admin/dashboard',
    token,
  })

export const fetchAdminSettings = (token: string) =>
  authorizedJsonRequest<BackendAdminSettingsResponse>({
    path: '/admin/settings',
    token,
  })

export const updateAdminSettings = (
  token: string,
  body: BackendAdminSettingsUpdateRequest,
) =>
  authorizedJsonRequest<BackendAdminSettingsResponse>({
    path: '/admin/settings',
    token,
    method: 'PUT',
    body,
  })

export const changeAdminPassword = (
  token: string,
  body: BackendChangePasswordRequest,
) =>
  authorizedJsonRequest<{ status: string }>({
    path: '/admin/password',
    token,
    method: 'PATCH',
    body,
  })

export const fetchAdminSupportTickets = (
  token: string,
  params?: { page?: number; size?: number },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendSupportTicketResponse>>({
    path: '/admin/support-tickets',
    token,
    params,
  })

export const fetchAllAdminSupportTickets = (token: string, size?: number) =>
  fetchAllPagedItems((params) => fetchAdminSupportTickets(token, params), size)

export const updateAdminSupportTicket = (
  token: string,
  id: number,
  body: {
    status: BackendSupportTicketStatus
    adminReply?: string
  },
) =>
  authorizedJsonRequest<BackendSupportTicketResponse>({
    path: `/admin/support-tickets/${id}`,
    token,
    method: 'PATCH',
    body,
  })

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

export const fetchAdminNotifications = (
  token: string,
  params?: { page?: number; size?: number },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendNotificationResponse>>({
    path: '/admin/notifications/page',
    token,
    params,
  })

export const fetchAllAdminNotifications = (token: string, size?: number) =>
  fetchAllPagedItems((params) => fetchAdminNotifications(token, params), size)

export const createAdminNotificationDispatch = (
  token: string,
  body: BackendNotificationCreateRequest,
) =>
  authorizedJsonRequest<BackendNotificationDispatchResponse>({
    path: '/admin/notifications',
    token,
    method: 'POST',
    body,
  })

export const exportAdminReport = (
  token: string,
  type: BackendReportExportType,
  format: BackendReportFormat,
  dateRange?: { from?: string; to?: string },
) =>
  authorizedBlobRequest({
    path: '/admin/reports/export',
    token,
    params: { type, format, from: dateRange?.from, to: dateRange?.to },
    fallbackFileName: `${type.toLowerCase()}-report.${format.toLowerCase()}`,
  })

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
  body: { status: BackendUnmatchedPaymentStatus; resolution?: string; matchedOrderId?: number },
) =>
  authorizedJsonRequest<BackendUnmatchedPaymentResponse>({
    path: `/admin/unmatched-payments/${id}`,
    token,
    method: 'PATCH',
    body,
  })

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

export const fetchAdminOrderPayments = (token: string, orderId: number) =>
  authorizedJsonRequest<BackendOrderPaymentResponse[]>({
    path: `/admin/orders/${orderId}/payments`,
    token,
  })

export const resetAdminUserPassword = (token: string, userId: number) =>
  authorizedJsonRequest<{ temporaryPassword: string }>({
    path: `/admin/users/${userId}/reset-password`,
    token,
    method: 'POST',
  })

export const testAdminEmailSettings = (token: string) =>
  authorizedJsonRequest<{ status: string }>({
    path: '/admin/settings/test-email',
    token,
    method: 'POST',
  })

export const markAdminRecentPaymentReviewed = (token: string, paymentId: number) =>
  authorizedJsonRequest<BackendRecentPaymentResponse>({
    path: `/admin/payments/recent/${paymentId}/review`,
    token,
    method: 'PATCH',
  })

export const fetchAdminAuditLogs = (
  token: string,
  page?: number,
  size?: number,
  filters?: { from?: string; to?: string; actor?: string; action?: string },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendAuditLogResponse>>({
    path: '/admin/audit-logs',
    token,
    params: {
      page: page ?? 0,
      size: size ?? 50,
      from: filters?.from,
      to: filters?.to,
      actor: filters?.actor,
      action: filters?.action,
    },
  })
