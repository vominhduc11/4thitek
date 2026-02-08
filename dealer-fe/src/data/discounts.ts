import type { DiscountRule } from '../types'

export const DISCOUNT_RULES: DiscountRule[] = [
  {
    id: 'total-10m',
    label: 'Chương trình Q2: giảm 2% cho đơn từ 10 triệu',
    percent: 2,
    isEligible: (context) => context.subtotal >= 10000000,
  },
  {
    id: 'total-50m',
    label: 'Giảm 3% cho đơn từ 50 triệu',
    percent: 3,
    isEligible: (context) => context.subtotal >= 50000000,
  },
  {
    id: 'total-100m',
    label: 'Giảm 5% cho đơn từ 100 triệu',
    percent: 5,
    isEligible: (context) => context.subtotal >= 100000000,
  },
  {
    id: 'total-200m',
    label: 'Giảm 7% cho đơn từ 200 triệu',
    percent: 7,
    isEligible: (context) => context.subtotal >= 200000000,
  },
]
