import productPlaceholder from '../assets/product-placeholder.svg'

export type Product = {
  name: string
  sku: string
  status: 'Active' | 'Low Stock' | 'Draft'
  stock: number
  image: string
  price: string
  description: string
  features: string[]
  lastUpdated: string
  archived: boolean
}

export const products: Product[] = [
  {
    name: 'SCS Pro Max',
    sku: 'SCS-PRO-MAX',
    status: 'Active',
    stock: 120,
    image: productPlaceholder,
    price: '$299',
    description:
      'Flagship over-ear headphones with spatial audio, adaptive noise control, and studio-grade tuning.',
    features: ['Adaptive ANC', 'Spatial Audio', '40h Battery'],
    lastUpdated: 'Jan 28, 2026',
    archived: false,
  },
  {
    name: 'SCS Studio',
    sku: 'SCS-STUDIO',
    status: 'Low Stock',
    stock: 18,
    image: productPlaceholder,
    price: '$219',
    description:
      'Balanced monitoring headphones built for creators who need accuracy and comfort for long sessions.',
    features: ['Neutral EQ', 'Foldable Design', 'Detachable Cable'],
    lastUpdated: 'Jan 30, 2026',
    archived: false,
  },
  {
    name: 'SCS Lite',
    sku: 'SCS-LITE',
    status: 'Active',
    stock: 240,
    image: productPlaceholder,
    price: '$129',
    description:
      'Lightweight on-ear headphones with punchy bass and seamless device switching.',
    features: ['Multi-point Bluetooth', 'On-ear Controls', '26h Battery'],
    lastUpdated: 'Jan 29, 2026',
    archived: false,
  },
  {
    name: 'SCS Travel',
    sku: 'SCS-TRAVEL',
    status: 'Draft',
    stock: 0,
    image: productPlaceholder,
    price: '$179',
    description:
      'Compact travel headphones with quick-charge and fold-flat portability.',
    features: ['Quick Charge', 'Fold-flat', 'Travel Case'],
    lastUpdated: 'Jan 25, 2026',
    archived: false,
  },
]
