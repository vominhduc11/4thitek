export type OrderStatus = 'packing' | 'pending' | 'delivering' | 'completed' | 'cancelled'
export type PaymentMethod = 'bank_transfer' | 'debt' | null
export type PaymentStatus = 'pending' | 'paid' | 'debt_recorded' | 'cancelled' | 'failed'
export type BlogStatus = 'published' | 'scheduled' | 'draft'
export type DealerStatus = 'active' | 'under_review' | 'suspended'
export type UserStatus = 'active' | 'pending'
export type RuleStatus = 'active' | 'pending' | 'draft'

export type OrderItem = {
  productId: number
  productSku: string
  productName: string
  quantity: number
  unitPrice: number
}

export type Order = {
  id: string
  orderCode: string
  dealer: string
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paidAmount: number
  outstandingAmount: number
  items: number
  address: string
  note: string
  createdAt: string
  orderItems: OrderItem[]
}

export type BlogPost = {
  id: string
  title: string
  category: string
  categoryId?: string
  status: BlogStatus
  updatedAt: string
  excerpt: string
  imageUrl?: string
  showOnHomepage?: boolean
  content?: string
}

export type Dealer = {
  id: string
  name: string
  businessName: string
  contactName: string
  status: DealerStatus
  orders: number
  lastOrderAt: string
  revenue: number
  creditLimit: number
  email: string
  phone: string
}

export type StaffUser = {
  id: string
  name: string
  role: string
  email: string
  status: UserStatus
}

export type DiscountRule = {
  id: string
  label: string
  range: string
  percent: number
  status: RuleStatus
  updatedAt: string
}

export type RateLimitBucketSettings = {
  requests: number
  windowSeconds: number
}

export type SepayAppSettings = {
  enabled: boolean
  webhookToken: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

export type EmailAppSettings = {
  enabled: boolean
  from: string
  fromName: string
}

export type RateLimitOverridesSettings = {
  enabled: boolean
  auth: RateLimitBucketSettings
  passwordReset: RateLimitBucketSettings
  warrantyLookup: RateLimitBucketSettings
  upload: RateLimitBucketSettings
  webhook: RateLimitBucketSettings
}

export type AppSettings = {
  emailConfirmation: boolean
  sessionTimeoutMinutes: number
  orderAlerts: boolean
  inventoryAlerts: boolean
  sepay: SepayAppSettings
  emailSettings: EmailAppSettings
  rateLimitOverrides: RateLimitOverridesSettings
}

export const initialSettings: AppSettings = {
  emailConfirmation: true,
  sessionTimeoutMinutes: 30,
  orderAlerts: true,
  inventoryAlerts: true,
  sepay: {
    enabled: false,
    webhookToken: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  },
  emailSettings: {
    enabled: false,
    from: '',
    fromName: '',
  },
  rateLimitOverrides: {
    enabled: true,
    auth: { requests: 10, windowSeconds: 60 },
    passwordReset: { requests: 5, windowSeconds: 300 },
    warrantyLookup: { requests: 30, windowSeconds: 60 },
    upload: { requests: 20, windowSeconds: 60 },
    webhook: { requests: 120, windowSeconds: 60 },
  },
}
