import productPlaceholder from '../assets/product-placeholder.svg'

export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type Product = {
  id: string
  name: string
  sku: string
  shortDescription: string
  description: string
  status: 'Active' | 'Low Stock' | 'Draft'
  publishStatus: PublishStatus
  stock: number
  retailPrice: number
  price: string
  image: string // stored as JSON string to mirror JSONB column
  descriptions: string // JSON string
  videos: string // JSON string
  specifications: string // JSON string
  showOnHomepage: boolean
  isFeatured: boolean
  isDeleted: boolean
  features: string[]
  lastUpdated: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export const products: Product[] = [
  {
    id: '1',
    name: 'SCS Pro Max',
    sku: 'SCS-PRO-MAX',
    shortDescription: 'Flagship over-ear with spatial audio and adaptive ANC.',
    description:
      'Flagship over-ear headphones with spatial audio, adaptive noise control, and studio-grade tuning.',
    status: 'Active',
    publishStatus: 'PUBLISHED',
    stock: 120,
    retailPrice: 299,
    price: '$299',
    image: JSON.stringify({ imageUrl: productPlaceholder }),
    descriptions: JSON.stringify([
      { type: 'title', text: 'SCS Pro Max' },
      { type: 'description', text: 'Spatial audio. Adaptive ANC. Studio tuned.' },
    ]),
    videos: JSON.stringify([]),
    specifications: JSON.stringify([
      { label: 'Driver', value: '50mm' },
      { label: 'Battery', value: '40h' },
    ]),
    showOnHomepage: true,
    isFeatured: true,
    isDeleted: false,
    features: ['Adaptive ANC', 'Spatial Audio', '40h Battery'],
    lastUpdated: 'Jan 28, 2026',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-28T00:00:00Z',
    archived: false,
  },
  {
    id: '2',
    name: 'SCS Studio',
    sku: 'SCS-STUDIO',
    shortDescription:
      'Balanced monitoring headphones built for creators who need accuracy and comfort for long sessions.',
    description:
      'Balanced monitoring headphones built for creators who need accuracy and comfort for long sessions.',
    status: 'Low Stock',
    publishStatus: 'PUBLISHED',
    stock: 18,
    retailPrice: 219,
    price: '$219',
    image: JSON.stringify({ imageUrl: productPlaceholder }),
    descriptions: JSON.stringify([{ type: 'description', text: 'Neutral EQ, foldable design.' }]),
    videos: JSON.stringify([]),
    specifications: JSON.stringify([{ label: 'Driver', value: '45mm' }]),
    showOnHomepage: true,
    isFeatured: false,
    isDeleted: false,
    features: ['Neutral EQ', 'Foldable Design', 'Detachable Cable'],
    lastUpdated: 'Jan 30, 2026',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-30T00:00:00Z',
    archived: false,
  },
  {
    id: '3',
    name: 'SCS Lite',
    sku: 'SCS-LITE',
    shortDescription: 'Lightweight on-ear with punchy bass and seamless switching.',
    status: 'Active',
    publishStatus: 'PUBLISHED',
    stock: 240,
    retailPrice: 129,
    price: '$129',
    image: JSON.stringify({ imageUrl: productPlaceholder }),
    description:
      'Lightweight on-ear headphones with punchy bass and seamless device switching.',
    descriptions: JSON.stringify([{ type: 'description', text: 'Multi-point BT, 26h battery.' }]),
    videos: JSON.stringify([]),
    specifications: JSON.stringify([{ label: 'Driver', value: '40mm' }]),
    showOnHomepage: false,
    isFeatured: false,
    isDeleted: false,
    features: ['Multi-point Bluetooth', 'On-ear Controls', '26h Battery'],
    lastUpdated: 'Jan 29, 2026',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-29T00:00:00Z',
    archived: false,
  },
  {
    id: '4',
    name: 'SCS Travel',
    sku: 'SCS-TRAVEL',
    shortDescription: 'Compact travel headphones with quick-charge and fold-flat portability.',
    status: 'Draft',
    publishStatus: 'DRAFT',
    stock: 0,
    retailPrice: 179,
    price: '$179',
    image: JSON.stringify({ imageUrl: productPlaceholder }),
    description:
      'Compact travel headphones with quick-charge and fold-flat portability.',
    descriptions: JSON.stringify([{ type: 'description', text: 'Fold-flat, travel case included.' }]),
    videos: JSON.stringify([]),
    specifications: JSON.stringify([{ label: 'Driver', value: '40mm' }]),
    showOnHomepage: false,
    isFeatured: false,
    isDeleted: false,
    features: ['Quick Charge', 'Fold-flat', 'Travel Case'],
    lastUpdated: 'Jan 25, 2026',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-25T00:00:00Z',
    archived: false,
  },
]
