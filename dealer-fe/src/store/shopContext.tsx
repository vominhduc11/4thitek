import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { calculateDiscount } from '../lib/discounts'
import { buildOrderId } from '../lib/order'
import type { CartItem, Order, PaymentStatus, Product } from '../types'

type Summary = {
  subtotal: number
  discount: number
  total: number
  percent: number
  label: string
  ruleId?: string
}

type ShopContextValue = {
  cartItems: CartItem[]
  order: Order | null
  note: string
  paymentStatus: PaymentStatus
  cartLookup: Map<string, number>
  totalQuantity: number
  displayItems: CartItem[]
  summary: Summary
  isLocked: boolean
  addToCart: (product: Product, quantity: number) => void
  updateQuantity: (productId: string, nextQuantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  placeOrder: () => void
  payOrder: () => void
  startNewOrder: () => void
  setNote: (value: string) => void
}

const ShopContext = createContext<ShopContextValue | null>(null)

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [order, setOrder] = useState<Order | null>(null)
  const [note, setNote] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')

  const cartLookup = useMemo(() => {
    return new Map(cartItems.map((item) => [item.product.id, item.quantity]))
  }, [cartItems])

  const totalQuantity = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  )

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + item.quantity * item.product.unitPrice,
        0,
      ),
    [cartItems],
  )

  const discountPreview = useMemo(
    () => calculateDiscount({ items: cartItems, subtotal, totalQuantity }),
    [cartItems, subtotal, totalQuantity],
  )

  const draftTotal = Math.max(subtotal - discountPreview.amount, 0)
  const isLocked = Boolean(order)
  const displayItems = order ? order.items : cartItems

  const summary: Summary = order
    ? {
        subtotal: order.subtotal,
        discount: order.discount.amount,
        total: order.total,
        percent: order.discount.percent,
        label: order.discount.label,
        ruleId: order.discount.ruleId,
      }
    : {
        subtotal,
        discount: discountPreview.amount,
        total: draftTotal,
        percent: discountPreview.percent,
        label: discountPreview.label,
        ruleId: discountPreview.ruleId,
      }

  const addToCart = (product: Product, quantity: number) => {
    if (isLocked) {
      return
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  const updateQuantity = (productId: string, nextQuantity: number) => {
    if (isLocked) {
      return
    }
    if (nextQuantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
      return
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    )
  }

  const removeItem = (productId: string) => {
    if (isLocked) {
      return
    }
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    if (isLocked) {
      return
    }
    setCartItems([])
  }

  const placeOrder = () => {
    if (cartItems.length === 0 || isLocked) {
      return
    }

    const discount = calculateDiscount({ items: cartItems, subtotal, totalQuantity })
    const total = Math.max(subtotal - discount.amount, 0)

    setOrder({
      id: buildOrderId(),
      createdAt: new Date().toISOString(),
      items: cartItems,
      subtotal,
      discount,
      total,
      note,
    })
    setPaymentStatus('idle')
  }

  const payOrder = () => {
    if (!order || paymentStatus === 'success') {
      return
    }
    setPaymentStatus('success')
  }

  const startNewOrder = () => {
    setOrder(null)
    setCartItems([])
    setNote('')
    setPaymentStatus('idle')
  }

  const value: ShopContextValue = {
    cartItems,
    order,
    note,
    paymentStatus,
    cartLookup,
    totalQuantity,
    displayItems,
    summary,
    isLocked,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    placeOrder,
    payOrder,
    startNewOrder,
    setNote,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export const useShop = () => {
  const context = useContext(ShopContext)
  if (!context) {
    throw new Error('useShop must be used within ShopProvider')
  }
  return context
}
