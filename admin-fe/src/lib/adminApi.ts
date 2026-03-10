import { buildApiUrl } from './backendApi'

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
export type BackendDealerAccountTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE'
export type BackendDealerAccountStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'NEEDS_ATTENTION'
export type BackendStaffUserStatus = 'ACTIVE' | 'PENDING'
export type BackendDiscountRuleStatus = 'ACTIVE' | 'PENDING' | 'DRAFT'
export type BackendWarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'VOID'
export type BackendProductSerialStatus = 'AVAILABLE' | 'DEFECTIVE' | 'SOLD' | 'WARRANTY' | 'RETURNED'
export type BackendNotifyType = 'SYSTEM' | 'PROMOTION' | 'ORDER' | 'WARRANTY'
export type BackendSupportPriority = 'NORMAL' | 'HIGH' | 'URGENT'
export type BackendSupportCategory = 'ORDER' | 'WARRANTY' | 'PRODUCT' | 'PAYMENT' | 'OTHER'
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
  stock?: number | null
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
  stock?: number
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
  showOnHomepage?: boolean
  isDeleted?: boolean
}

export type BackendCategory = {
  id: number
  name: string
}

export type BackendOrderResponse = {
  id: number
  orderCode: string
  dealerId?: number | null
  dealerName?: string | null
  status?: BackendOrderStatus | null
  paidAmount?: number | string | null
  totalAmount?: number | string | null
  itemCount?: number | null
  address?: string | null
  note?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendDealerAccountResponse = {
  id: number
  name: string
  tier?: BackendDealerAccountTier | null
  status?: BackendDealerAccountStatus | null
  orders?: number | null
  lastOrderAt?: string | null
  revenue?: number | string | null
  email?: string | null
  phone?: string | null
}

export type BackendDealerAccountUpsertRequest = {
  name: string
  tier?: BackendDealerAccountTier
  status?: BackendDealerAccountStatus
  revenue?: number
  email: string
  phone: string
}

export type BackendStaffUserResponse = {
  id: number
  name: string
  role: string
  status?: BackendStaffUserStatus | null
  username?: string | null
  email?: string | null
}

export type BackendStaffUserUpsertRequest = {
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
  customerId?: number | null
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
  customerId?: number | null
  customerName?: string | null
  orderId?: number | null
  orderCode?: string | null
  warehouseId?: string | null
  warehouseName?: string | null
  importedAt?: string | null
}

export type BackendSerialImportRequest = {
  productId: number
  serials: string[]
  status?: BackendProductSerialStatus
  dealerId?: number
  customerId?: number
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
  content: string
  isRead?: boolean | null
  type?: BackendNotifyType | null
  link?: string | null
  createdAt?: string | null
}

export type BackendNotificationCreateRequest = {
  audience: 'DEALERS' | 'CUSTOMERS' | 'ALL_ACCOUNTS' | 'ACCOUNTS'
  title: string
  content: string
  type?: BackendNotifyType
  link?: string
  accountIds?: number[]
}

export type BackendNotificationDispatchResponse = {
  audience: string
  type: BackendNotifyType
  recipientCount: number
  recipientIds: number[]
  dispatchedAt: string
}

export type BackendReportExportResponse = {
  fileName: string
  contentType: string
  content: string
}

export type BackendAdminSettingsResponse = {
  id: number
  emailConfirmation: boolean
  sessionTimeoutMinutes: number
  orderAlerts: boolean
  inventoryAlerts: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackendAdminSettingsUpdateRequest = {
  emailConfirmation?: boolean
  sessionTimeoutMinutes?: number
  orderAlerts?: boolean
  inventoryAlerts?: boolean
}

const defaultErrorMessage = 'Request failed'

const buildQueryString = (params?: Record<string, string | number | null | undefined>) => {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })
  const serialized = searchParams.toString()
  return serialized ? `?${serialized}` : ''
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
  params?: Record<string, string | number | null | undefined>
}): Promise<T> => {
  const response = await fetch(buildApiUrl(`${path}${buildQueryString(params)}`), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let payload: ApiResponse<T> | null = null
  try {
    payload = (await response.json()) as ApiResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || defaultErrorMessage)
  }

  return payload.data
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
  authorizedJsonRequest<BackendOrderResponse[]>({
    path: '/admin/orders',
    token,
  })

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

export const deleteAdminOrder = (token: string, id: number) =>
  authorizedJsonRequest<{ status: string }>({
    path: `/admin/orders/${id}`,
    token,
    method: 'DELETE',
  })

export const fetchAdminDealerAccounts = (token: string) =>
  authorizedJsonRequest<BackendDealerAccountResponse[]>({
    path: '/admin/dealers/accounts',
    token,
  })

export const createAdminDealerAccount = (
  token: string,
  body: BackendDealerAccountUpsertRequest,
) =>
  authorizedJsonRequest<BackendDealerAccountResponse>({
    path: '/admin/dealers/accounts',
    token,
    method: 'POST',
    body,
  })

export const updateAdminDealerAccountStatus = (
  token: string,
  id: number,
  status: BackendDealerAccountStatus,
) =>
  authorizedJsonRequest<BackendDealerAccountResponse>({
    path: `/admin/dealers/accounts/${id}/status`,
    token,
    method: 'PATCH',
    body: { status },
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

export const fetchAdminSupportTickets = (
  token: string,
  params?: { page?: number; size?: number },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendSupportTicketResponse>>({
    path: '/admin/support-tickets',
    token,
    params,
  })

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

export const importAdminSerials = (token: string, body: BackendSerialImportRequest) =>
  authorizedJsonRequest<BackendSerialResponse[]>({
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

export const fetchAdminNotifications = (
  token: string,
  params?: { page?: number; size?: number },
) =>
  authorizedJsonRequest<BackendPagedResponse<BackendNotificationResponse>>({
    path: '/admin/notifications/page',
    token,
    params,
  })

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
) =>
  authorizedJsonRequest<BackendReportExportResponse>({
    path: '/admin/reports/export',
    token,
    params: { type, format },
  })
