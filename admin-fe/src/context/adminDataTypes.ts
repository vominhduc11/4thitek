export type OrderStatus = 'packing' | 'pending' | 'delivering' | 'completed' | 'cancelled'
export type PaymentMethod = 'bank_transfer' | 'debt' | null
export type PaymentStatus = 'pending' | 'paid' | 'debt_recorded' | 'cancelled' | 'failed'
export type BlogStatus = 'published' | 'scheduled' | 'draft'
export type DealerTier = 'platinum' | 'gold' | 'silver' | 'bronze'
export type DealerStatus = 'active' | 'under_review' | 'suspended'
export type UserStatus = 'active' | 'pending'
export type RuleStatus = 'active' | 'pending' | 'draft'

export type Order = {
  id: string
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
}

export type Dealer = {
  id: string
  name: string
  businessName: string
  contactName: string
  tier: DealerTier
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

export type AppSettings = {
  emailConfirmation: boolean
  sessionTimeoutMinutes: number
  orderAlerts: boolean
  inventoryAlerts: boolean
}

export const initialSettings: AppSettings = {
  emailConfirmation: true,
  sessionTimeoutMinutes: 30,
  orderAlerts: true,
  inventoryAlerts: true,
}
