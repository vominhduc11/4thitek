export type Product = {
  id: string
  name: string
  sku: string
  category: string
  unitPrice: number
  unitLabel: string
  stock: number
  minOrder: number
  packSize: string
}

export type CartItem = {
  product: Product
  quantity: number
}

export type DiscountContext = {
  items: CartItem[]
  subtotal: number
  totalQuantity: number
}

export type DiscountRule = {
  id: string
  label: string
  percent: number
  isEligible: (context: DiscountContext) => boolean
}

export type DiscountResult = {
  ruleId?: string
  label: string
  percent: number
  amount: number
}

export type Order = {
  id: string
  createdAt: string
  items: CartItem[]
  subtotal: number
  discount: DiscountResult
  total: number
  note: string
}

export type PaymentStatus = 'idle' | 'success'
