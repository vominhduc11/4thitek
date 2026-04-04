import type {
  BackendAdminSettingsResponse,
  BackendBlogResponse,
  BackendBlogStatus,
  BackendBlogUpsertRequest,
  BackendDealerAccountResponse,
  BackendDealerAccountStatus,
  BackendDiscountRuleResponse,
  BackendDiscountRuleStatus,
  BackendOrderResponse,
  BackendOrderStatus,
  BackendPaymentMethod,
  BackendPaymentStatus,
  BackendStaffUserResponse,
  BackendStaffUserStatus,
} from './adminApi'
import type {
  AppSettings,
  BlogPost,
  BlogStatus,
  Dealer,
  DealerStatus,
  DiscountRule,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RuleStatus,
  StaffUser,
  UserStatus,
} from '../context/adminDataTypes'
import { initialSettings } from '../context/adminDataTypes'

export const mapBackendOrderStatus = (status?: BackendOrderStatus | null): OrderStatus => {
  switch (status) {
    case 'CONFIRMED':
      return 'confirmed'
    case 'SHIPPING':
      return 'shipping'
    case 'COMPLETED':
      return 'completed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'pending'
  }
}

export const toBackendOrderStatus = (status: OrderStatus): BackendOrderStatus => {
  switch (status) {
    case 'confirmed':
      return 'CONFIRMED'
    case 'shipping':
      return 'SHIPPING'
    case 'completed':
      return 'COMPLETED'
    case 'cancelled':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

export const mapBackendPaymentMethod = (method?: BackendPaymentMethod | null): PaymentMethod => {
  switch (method) {
    case 'DEBT':
      return 'debt'
    case 'BANK_TRANSFER':
      return 'bank_transfer'
    default:
      return null
  }
}

export const toBackendPaymentMethod = (method: Exclude<PaymentMethod, null>): BackendPaymentMethod =>
  method === 'debt' ? 'DEBT' : 'BANK_TRANSFER'

export const mapBackendPaymentStatus = (status?: BackendPaymentStatus | null): PaymentStatus => {
  switch (status) {
    case 'PAID':
      return 'paid'
    case 'DEBT_RECORDED':
      return 'debt_recorded'
    case 'CANCELLED':
      return 'cancelled'
    case 'FAILED':
      return 'failed'
    default:
      return 'pending'
  }
}

export const mapBackendBlogStatus = (status?: BackendBlogStatus | null): BlogStatus => {
  switch (status) {
    case 'PUBLISHED':
      return 'published'
    case 'SCHEDULED':
      return 'scheduled'
    default:
      return 'draft'
  }
}

export const toBackendBlogStatus = (status: BlogStatus): BackendBlogStatus => {
  switch (status) {
    case 'published':
      return 'PUBLISHED'
    case 'scheduled':
      return 'SCHEDULED'
    default:
      return 'DRAFT'
  }
}

export const mapBackendDealerAccountStatus = (
  status?: BackendDealerAccountStatus | null,
): DealerStatus => {
  switch (status) {
    case 'UNDER_REVIEW':
      return 'under_review'
    case 'SUSPENDED':
      return 'suspended'
    default:
      return 'active'
  }
}

export const toBackendDealerAccountStatus = (status: DealerStatus): BackendDealerAccountStatus => {
  switch (status) {
    case 'under_review':
      return 'UNDER_REVIEW'
    case 'suspended':
      return 'SUSPENDED'
    default:
      return 'ACTIVE'
  }
}

const uniq = <T>(values: T[]) => Array.from(new Set(values))

const mapAllowedOrderTransitions = (
  current: OrderStatus,
  transitions?: BackendOrderStatus[] | null,
): OrderStatus[] => {
  const mapped = uniq((transitions ?? []).map((status) => mapBackendOrderStatus(status)))
  if (mapped.length === 0) {
    return [current]
  }
  return mapped.includes(current) ? mapped : [current, ...mapped]
}

const mapAllowedDealerTransitions = (
  current: DealerStatus,
  transitions?: BackendDealerAccountStatus[] | null,
): DealerStatus[] => {
  const mapped = uniq((transitions ?? []).map((status) => mapBackendDealerAccountStatus(status)))
  if (mapped.length === 0) {
    return [current]
  }
  return mapped.includes(current) ? mapped : [current, ...mapped]
}

export const mapBackendUserStatus = (status?: BackendStaffUserStatus | null): UserStatus =>
  status === 'PENDING' ? 'pending' : 'active'

export const toBackendUserStatus = (status: UserStatus): BackendStaffUserStatus =>
  status === 'pending' ? 'PENDING' : 'ACTIVE'

export const mapBackendRuleStatus = (status?: BackendDiscountRuleStatus | null): RuleStatus => {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'PENDING':
      return 'pending'
    default:
      return 'draft'
  }
}

export const toBackendRuleStatus = (status: RuleStatus): BackendDiscountRuleStatus => {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'pending':
      return 'PENDING'
    default:
      return 'DRAFT'
  }
}

const parseBlogImage = (value?: string | null) => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as { imageUrl?: string }
    if (typeof parsed?.imageUrl === 'string' && parsed.imageUrl.trim()) {
      return parsed.imageUrl
    }
  } catch {
    // Preserve raw image values from older records instead of dropping them.
  }
  return value
}

const parseFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const mapOrder = (order: BackendOrderResponse): Order => {
  const totalAmount = parseFiniteNumber(order.totalAmount)
  const paidAmount = parseFiniteNumber(order.paidAmount)
  const outstandingAmount =
    order.outstandingAmount === undefined
      ? Math.max(0, totalAmount - paidAmount)
      : parseFiniteNumber(order.outstandingAmount)

  return {
    id: String(order.id),
    orderCode: order.orderCode?.trim() || `#${order.id}`,
    dealer: order.dealerName || '',
    total: totalAmount,
    status: mapBackendOrderStatus(order.status),
    paymentMethod: mapBackendPaymentMethod(order.paymentMethod),
    paymentStatus: mapBackendPaymentStatus(order.paymentStatus),
    paidAmount,
    outstandingAmount,
    reservedCreditAmount: parseFiniteNumber(order.reservedCreditAmount),
    openReceivableAmount: parseFiniteNumber(order.openReceivableAmount),
    creditExposureAmount: parseFiniteNumber(order.creditExposureAmount),
    items: Number(order.itemCount ?? 0),
    address: order.address || '',
    note: order.note || '',
    createdAt: order.createdAt || '',
    orderItems: (order.orderItems ?? []).map((item) => ({
      productId: item.productId,
      productSku: item.productSku,
      productName: item.productName,
      quantity: Number(item.quantity ?? 0),
      unitPrice: parseFiniteNumber(item.unitPrice),
    })),
    staleReviewRequired: Boolean(order.staleReviewRequired) || false,
    allowedTransitions: mapAllowedOrderTransitions(
      mapBackendOrderStatus(order.status),
      order.allowedTransitions,
    ),
  }
}

export const mapBlog = (blog: BackendBlogResponse): BlogPost => ({
  id: String(blog.id),
  title: blog.title || '',
  category: blog.categoryName || '',
  categoryId: blog.categoryId == null ? undefined : String(blog.categoryId),
  status: mapBackendBlogStatus(blog.status),
  updatedAt: blog.updatedAt || blog.createdAt || '',
  excerpt: blog.description || '',
  imageUrl: parseBlogImage(blog.image),
  showOnHomepage: Boolean(blog.showOnHomepage),
  content: blog.introduction || undefined,
  scheduledAt: blog.scheduledAt || undefined,
})

export const mapDealer = (dealer: BackendDealerAccountResponse): Dealer => ({
  id: String(dealer.id),
  name: dealer.name || dealer.businessName || dealer.contactName || '',
  businessName: dealer.businessName || dealer.name || '',
  contactName: dealer.contactName || dealer.businessName || dealer.name || '',
  status: mapBackendDealerAccountStatus(dealer.status),
  orders: Number(dealer.orders ?? 0),
  lastOrderAt: dealer.lastOrderAt || '',
  revenue: Number(dealer.revenue ?? 0),
  creditLimit: Number(dealer.creditLimit ?? 0),
  reservedCredit: Number(dealer.reservedCredit ?? 0),
  openReceivable: Number(dealer.openReceivable ?? 0),
  totalCreditExposure: Number(dealer.totalCreditExposure ?? 0),
  availableCredit: Number(dealer.availableCredit ?? 0),
  email: dealer.email || '',
  phone: dealer.phone || '',
  allowedTransitions: mapAllowedDealerTransitions(
    mapBackendDealerAccountStatus(dealer.status),
    dealer.allowedTransitions,
  ),
})

export const mapUser = (user: BackendStaffUserResponse): StaffUser => ({
  id: String(user.id),
  name: user.name || user.username || '',
  role: user.role || '',
  systemRole: user.systemRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
  email: user.email || '',
  status: mapBackendUserStatus(user.status),
})

export const mapDiscountRule = (rule: BackendDiscountRuleResponse): DiscountRule => ({
  id: String(rule.id),
  label: rule.label || '',
  range: rule.range || '',
  percent: Number(rule.percent ?? 0),
  status: mapBackendRuleStatus(rule.status),
  updatedAt: rule.updatedAt || '',
})

export const mapBackendSettings = (settings: BackendAdminSettingsResponse): AppSettings => ({
  emailConfirmation: Boolean(settings.emailConfirmation),
  sessionTimeoutMinutes: Number(settings.sessionTimeoutMinutes ?? initialSettings.sessionTimeoutMinutes),
  orderAlerts: Boolean(settings.orderAlerts),
  inventoryAlerts: Boolean(settings.inventoryAlerts),
  vatPercent: Number(settings.vatPercent ?? initialSettings.vatPercent),
  sepay: {
    enabled: Boolean(settings.sepay?.enabled),
    webhookToken: settings.sepay?.webhookToken?.trim() || '',
    bankName: settings.sepay?.bankName?.trim() || '',
    accountNumber: settings.sepay?.accountNumber?.trim() || '',
    accountHolder: settings.sepay?.accountHolder?.trim() || '',
  },
  emailSettings: {
    enabled: Boolean(settings.emailSettings?.enabled),
    from: settings.emailSettings?.from?.trim() || '',
    fromName: settings.emailSettings?.fromName?.trim() || '',
  },
  rateLimitOverrides: {
    enabled:
      typeof settings.rateLimitOverrides?.enabled === 'boolean'
        ? settings.rateLimitOverrides.enabled
        : initialSettings.rateLimitOverrides.enabled,
    auth: {
      requests: Number(settings.rateLimitOverrides?.auth?.requests ?? initialSettings.rateLimitOverrides.auth.requests),
      windowSeconds: Number(
        settings.rateLimitOverrides?.auth?.windowSeconds ?? initialSettings.rateLimitOverrides.auth.windowSeconds,
      ),
    },
    passwordReset: {
      requests: Number(
        settings.rateLimitOverrides?.passwordReset?.requests ?? initialSettings.rateLimitOverrides.passwordReset.requests,
      ),
      windowSeconds: Number(
        settings.rateLimitOverrides?.passwordReset?.windowSeconds ??
          initialSettings.rateLimitOverrides.passwordReset.windowSeconds,
      ),
    },
    warrantyLookup: {
      requests: Number(
        settings.rateLimitOverrides?.warrantyLookup?.requests ?? initialSettings.rateLimitOverrides.warrantyLookup.requests,
      ),
      windowSeconds: Number(
        settings.rateLimitOverrides?.warrantyLookup?.windowSeconds ??
          initialSettings.rateLimitOverrides.warrantyLookup.windowSeconds,
      ),
    },
    upload: {
      requests: Number(settings.rateLimitOverrides?.upload?.requests ?? initialSettings.rateLimitOverrides.upload.requests),
      windowSeconds: Number(
        settings.rateLimitOverrides?.upload?.windowSeconds ?? initialSettings.rateLimitOverrides.upload.windowSeconds,
      ),
    },
    webhook: {
      requests: Number(settings.rateLimitOverrides?.webhook?.requests ?? initialSettings.rateLimitOverrides.webhook.requests),
      windowSeconds: Number(
        settings.rateLimitOverrides?.webhook?.windowSeconds ?? initialSettings.rateLimitOverrides.webhook.windowSeconds,
      ),
    },
  },
})

export const toBlogUpsertRequest = (payload: {
  category?: string
  categoryId?: string
  title?: string
  excerpt?: string
  imageUrl?: string
  content?: string
  status?: BlogStatus
  showOnHomepage?: boolean
  scheduledAt?: string
}): BackendBlogUpsertRequest => ({
  categoryId: payload.categoryId ? Number(payload.categoryId) : undefined,
  categoryName: payload.category?.trim() || undefined,
  title: payload.title?.trim() || undefined,
  description: payload.excerpt?.trim() || undefined,
  image: payload.imageUrl ? JSON.stringify({ imageUrl: payload.imageUrl }) : undefined,
  introduction:
    payload.content?.trim()
      ? JSON.stringify(
          payload.content
            .split(/\n{2,}/)
            .map((block) => block.trim())
            .filter(Boolean)
            .map((text) => ({ type: 'paragraph', text })),
        )
      : payload.excerpt?.trim()
        ? JSON.stringify([{ type: 'paragraph', text: payload.excerpt.trim() }])
        : undefined,
  status: payload.status ? toBackendBlogStatus(payload.status) : undefined,
  scheduledAt: payload.scheduledAt || undefined,
  showOnHomepage:
    payload.showOnHomepage === undefined
      ? payload.status === 'published'
      : payload.showOnHomepage,
  isDeleted: false,
})
