import productPlaceholder from '../assets/product-placeholder.svg'

export type PublishStatus = 'DRAFT' | 'PUBLISHED'

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
    name: 'SCS SX Pro Elite',
    sku: 'SCS-SX-PRO-ELITE',
    shortDescription: 'Tai nghe gaming flagship với ANC chủ động, âm thanh vòm 7.1 và driver 50mm.',
    description:
      'Tai nghe gaming flagship với driver 50mm, ANC chủ động, âm thanh vòm 7.1 và đèn RGB tùy biến.',
    status: 'Active',
    publishStatus: 'PUBLISHED',
    stock: 120,
    retailPrice: 5990000,
    price: '5990000',
    image: JSON.stringify({ imageUrl: productPlaceholder }),
    descriptions: JSON.stringify([{"type": "title", "text": "SCS SX Pro Elite"}, {"type": "description", "text": "Driver 50mm, ANC chủ động, âm thanh vòm 7.1."}]),
    videos: JSON.stringify([{"title": "Giới thiệu SX Pro Elite", "url": "https://example.com/video.mp4", "type": "tutorial"}]),
    specifications: JSON.stringify([{"label": "Driver", "value": "50mm"}, {"label": "Kết nối", "value": "USB + 3.5mm"}, {"label": "Âm thanh", "value": "7.1 Virtual"}]),
    showOnHomepage: true,
    isFeatured: true,
    isDeleted: false,
    features: ["ANC chủ động", "7.1 Virtual", "RGB tùy biến"],
    lastUpdated: 'Feb 03, 2026',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-02-03T00:00:00Z',
    archived: false,
  },
  {
    id: '2',
    name: 'SCS SX Wireless Pro',
    sku: 'SCS-SX-WIRELESS-PRO',
    shortDescription: 'Không dây độ trễ thấp, pin 30 giờ, 2.4G + Bluetooth.',
    description:
      'Tai nghe gaming không dây với độ trễ thấp, pin 30 giờ, hỗ trợ 2.4G và Bluetooth.',
    status: 'Active',
    publishStatus: 'PUBLISHED',
    stock: 64,
    retailPrice: 4490000,
    price: '4490000',
    image: JSON.stringify({ imageUrl: productPlaceholder }),
    descriptions: JSON.stringify([{"type": "title", "text": "SCS SX Wireless Pro"}, {"type": "description", "text": "2.4G low latency, pin 30 giờ, chuyển đổi nhanh."}]),
    videos: JSON.stringify([]),
    specifications: JSON.stringify([{"label": "Driver", "value": "40mm"}, {"label": "Pin", "value": "30h"}, {"label": "Kết nối", "value": "2.4G + BT 5.2"}]),
    showOnHomepage: true,
    isFeatured: true,
    isDeleted: false,
    features: ["2.4G Low Latency", "BT 5.2", "Pin 30h"],
    lastUpdated: 'Feb 02, 2026',
    createdAt: '2026-01-08T00:00:00Z',
    updatedAt: '2026-02-02T00:00:00Z',
    archived: false,
  },
  {
    id: '3',
    name: 'SCS Professional Studio',
    sku: 'SCS-PRO-STUDIO',
    shortDescription: 'Tai nghe kiểm âm cân bằng, trung thực, phù hợp phòng thu.',
    description:
      'Tai nghe kiểm âm cân bằng, thiết kế thoải mái cho phiên làm việc dài.',
    status: 'Low Stock',
    publishStatus: 'PUBLISHED',
    stock: 14,
    retailPrice: 3290000,
    price: '3290000',
    image: JSON.stringify({ imageUrl: productPlaceholder }),
    descriptions: JSON.stringify([{"type": "title", "text": "SCS Professional Studio"}, {"type": "description", "text": "EQ trung tính, dải âm chi tiết, dây tháo rời."}]),
    videos: JSON.stringify([]),
    specifications: JSON.stringify([{"label": "Driver", "value": "45mm"}, {"label": "Trở kháng", "value": "32Ω"}, {"label": "Dây", "value": "Detachable"}]),
    showOnHomepage: false,
    isFeatured: false,
    isDeleted: false,
    features: ["EQ trung tính", "Đệm tai êm", "Dây tháo rời"],
    lastUpdated: 'Jan 28, 2026',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-28T00:00:00Z',
    archived: false,
  },
  {
    id: '4',
    name: 'SCS Wired Pro',
    sku: 'SCS-WIRED-PRO',
    shortDescription: 'Tai nghe có dây chuyên nghiệp cho thu âm và chỉnh âm.',
    description:
      'Tai nghe có dây chuyên nghiệp, dải âm rộng, phù hợp mix/master.',
    status: 'Draft',
    publishStatus: 'DRAFT',
    stock: 0,
    retailPrice: 2490000,
    price: '2490000',
    image: JSON.stringify({ imageUrl: productPlaceholder }),
    descriptions: JSON.stringify([{"type": "title", "text": "SCS Wired Pro"}, {"type": "description", "text": "Thiết kế bền bỉ, âm trung thực, kiểm âm chính xác."}]),
    videos: JSON.stringify([]),
    specifications: JSON.stringify([{"label": "Driver", "value": "40mm"}, {"label": "Cáp", "value": "1.8m"}, {"label": "Kết nối", "value": "3.5mm"}]),
    showOnHomepage: false,
    isFeatured: false,
    isDeleted: false,
    features: ["Cáp thay thế", "Đệm tai thoáng", "Âm trung thực"],
    lastUpdated: 'Jan 22, 2026',
    createdAt: '2026-01-12T00:00:00Z',
    updatedAt: '2026-01-22T00:00:00Z',
    archived: false,
  },
]
