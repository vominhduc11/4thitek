import type {
  BackendAdminSettingsResponse,
  BackendBlogResponse,
  BackendBlogStatus,
  BackendBlogUpsertRequest,
  BackendDealerAccountResponse,
  BackendDealerAccountStatus,
  BackendDealerAccountTier,
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
  DealerTier,
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
      return 'packing'
    case 'SHIPPING':
      return 'delivering'
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
    case 'packing':
      return 'CONFIRMED'
    case 'delivering':
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

export const mapBackendDealerAccountTier = (tier?: BackendDealerAccountTier | null): DealerTier => {
  switch (tier) {
    case 'PLATINUM':
      return 'platinum'
    case 'SILVER':
      return 'silver'
    case 'BRONZE':
      return 'bronze'
    default:
      return 'gold'
  }
}

export const toBackendDealerAccountTier = (tier: DealerTier): BackendDealerAccountTier => {
  switch (tier) {
    case 'platinum':
      return 'PLATINUM'
    case 'silver':
      return 'SILVER'
    case 'bronze':
      return 'BRONZE'
    default:
      return 'GOLD'
  }
}

export const mapBackendDealerAccountStatus = (
  status?: BackendDealerAccountStatus | null,
): DealerStatus => {
  switch (status) {
    case 'UNDER_REVIEW':
      return 'under_review'
    case 'NEEDS_ATTENTION':
      return 'needs_attention'
    default:
      return 'active'
  }
}

export const toBackendDealerAccountStatus = (status: DealerStatus): BackendDealerAccountStatus => {
  switch (status) {
    case 'under_review':
      return 'UNDER_REVIEW'
    case 'needs_attention':
      return 'NEEDS_ATTENTION'
    default:
      return 'ACTIVE'
  }
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

  return {
    id: String(order.id),
    dealer: order.dealerName || '',
    total: totalAmount,
    status: mapBackendOrderStatus(order.status),
    paymentMethod: mapBackendPaymentMethod(order.paymentMethod),
    paymentStatus: mapBackendPaymentStatus(order.paymentStatus),
    paidAmount,
    outstandingAmount: Math.max(0, totalAmount - paidAmount),
    items: Number(order.itemCount ?? 0),
    address: order.address || '',
    note: order.note || '',
    createdAt: order.createdAt || '',
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
})

export const mapDealer = (dealer: BackendDealerAccountResponse): Dealer => ({
  id: String(dealer.id),
  name: dealer.name || dealer.businessName || dealer.contactName || '',
  businessName: dealer.businessName || dealer.name || '',
  contactName: dealer.contactName || dealer.businessName || dealer.name || '',
  tier: mapBackendDealerAccountTier(dealer.tier),
  status: mapBackendDealerAccountStatus(dealer.status),
  orders: Number(dealer.orders ?? 0),
  lastOrderAt: dealer.lastOrderAt || '',
  revenue: Number(dealer.revenue ?? 0),
  creditLimit: Number(dealer.creditLimit ?? 0),
  email: dealer.email || '',
  phone: dealer.phone || '',
})

export const mapUser = (user: BackendStaffUserResponse): StaffUser => ({
  id: String(user.id),
  name: user.name || user.username || '',
  role: user.role || '',
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
})

export const toBlogUpsertRequest = (payload: {
  category?: string
  categoryId?: string
  title?: string
  excerpt?: string
  imageUrl?: string
  status?: BlogStatus
  showOnHomepage?: boolean
}): BackendBlogUpsertRequest => ({
  categoryId: payload.categoryId ? Number(payload.categoryId) : undefined,
  categoryName: payload.category?.trim() || undefined,
  title: payload.title?.trim() || undefined,
  description: payload.excerpt?.trim() || undefined,
  image: payload.imageUrl ? JSON.stringify({ imageUrl: payload.imageUrl }) : undefined,
  introduction: payload.excerpt?.trim()
    ? JSON.stringify([{ type: 'paragraph', text: payload.excerpt.trim() }])
    : undefined,
  status: payload.status ? toBackendBlogStatus(payload.status) : undefined,
  showOnHomepage:
    payload.showOnHomepage === undefined
      ? payload.status === 'published'
      : payload.showOnHomepage,
  isDeleted: false,
})
