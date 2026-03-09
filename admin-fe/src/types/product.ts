export type PublishStatus = 'DRAFT' | 'PUBLISHED'

export type Product = {
  id: string
  name: string
  sku: string
  shortDescription: string
  status: 'Active' | 'Low Stock' | 'Draft'
  publishStatus: PublishStatus
  stock: number
  retailPrice: number
  image: string
  descriptions: string
  videos: string
  specifications: string
  showOnHomepage: boolean
  isFeatured: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}
