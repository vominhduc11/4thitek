import { resolveBackendAssetUrl } from '../../lib/backendApi'
import type { Product } from '../../types/product'

export type ProductFilter = 'all' | 'active' | 'lowStock' | 'urgentStock' | 'outOfStock' | 'draft' | 'deleted'
export type FeaturedFilter = 'all' | 'featured' | 'nonFeatured'
export type HomepageFilter = 'all' | 'homepage' | 'nonHomepage'
export type ProductsSortField = 'name' | 'retailPrice' | 'availableStock' | 'updatedAt'
export type ProductsSortDir = 'asc' | 'desc'

export const ITEMS_PER_PAGE = 15

const imageUrlCache = new Map<string, string>()

export const getProductImageUrl = (image: string) => {
  const cached = imageUrlCache.get(image)
  if (cached) {
    return cached
  }

  let resolved = ''
  try {
    const parsed = JSON.parse(image) as { imageUrl?: string }
    resolved = resolveBackendAssetUrl(parsed.imageUrl || image)
  } catch {
    resolved = resolveBackendAssetUrl(image)
  }

  imageUrlCache.set(image, resolved)
  return resolved
}

export const formatPriceVND = (value: number | string) => {
  const num = typeof value === 'number' ? value : Number(value || 0)
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

type BuildProductsViewArgs = {
  products: Product[]
  filter: ProductFilter
  filterFeatured: FeaturedFilter
  filterHomepage: HomepageFilter
  searchTerm: string
  sortField: ProductsSortField
  sortDir: ProductsSortDir
}

export const buildProductsView = ({
  products,
  filter,
  filterFeatured,
  filterHomepage,
  searchTerm,
  sortField,
  sortDir,
}: BuildProductsViewArgs) => {
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const isUrgentLowStock = (product: Product) =>
    !product.isDeleted && product.status === 'Active' && product.availableStock > 0 && product.availableStock < 5

  const activeProducts = products.filter((product) => !product.isDeleted && product.status === 'Active')
  const lowStockProducts = products.filter(
    (product) => !product.isDeleted && product.availableStock > 0 && product.availableStock <= 10,
  )
  const urgentLowStockProducts = products.filter(isUrgentLowStock)
  const draftProducts = products.filter((product) => !product.isDeleted && product.status === 'Draft')

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.sku.toLowerCase().includes(normalizedSearch)

    const matchesFeatured =
      filterFeatured === 'all'
        ? true
        : filterFeatured === 'featured'
          ? Boolean(product.isFeatured)
          : !product.isFeatured

    const matchesHomepage =
      filterHomepage === 'all'
        ? true
        : filterHomepage === 'homepage'
          ? Boolean(product.showOnHomepage)
          : !product.showOnHomepage

    return matchesSearch && matchesFeatured && matchesHomepage
  })

  const filterCounts = filteredProducts.reduce(
    (acc, product) => {
      if (product.isDeleted) {
        acc.deleted += 1
        return acc
      }

      acc.all += 1
      if (product.status === 'Active') acc.active += 1
      if (product.status === 'Draft') acc.draft += 1
      if (product.status === 'Active' && product.availableStock === 0) acc.outOfStock += 1
      if (product.status === 'Active' && product.availableStock > 0 && product.availableStock <= 10) {
        acc.lowStock += 1
      }
      if (isUrgentLowStock(product)) {
        acc.urgentStock += 1
      }

      return acc
    },
    {
      all: 0,
      active: 0,
      lowStock: 0,
      urgentStock: 0,
      outOfStock: 0,
      draft: 0,
      deleted: 0,
    } satisfies Record<ProductFilter, number>,
  )

  const filteredByTab = filteredProducts.filter((product) => {
    switch (filter) {
      case 'active':
        return !product.isDeleted && product.status === 'Active'
      case 'lowStock':
        return !product.isDeleted && product.status === 'Active' && product.availableStock > 0 && product.availableStock <= 10
      case 'urgentStock':
        return isUrgentLowStock(product)
      case 'outOfStock':
        return !product.isDeleted && product.status === 'Active' && product.availableStock === 0
      case 'draft':
        return !product.isDeleted && product.status === 'Draft'
      case 'deleted':
        return product.isDeleted
      default:
        return !product.isDeleted
    }
  })

  const visibleProducts = [...filteredByTab].sort((a, b) => {
    let comparison = 0

    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name, 'vi')
    } else if (sortField === 'retailPrice') {
      comparison = (a.retailPrice ?? 0) - (b.retailPrice ?? 0)
    } else if (sortField === 'availableStock') {
      comparison = (a.availableStock ?? 0) - (b.availableStock ?? 0)
    } else {
      comparison = new Date(a.updatedAt ?? 0).getTime() - new Date(b.updatedAt ?? 0).getTime()
    }

    return sortDir === 'asc' ? comparison : -comparison
  })

  return {
    activeProducts,
    lowStockProducts,
    urgentLowStockProducts,
    draftProducts,
    filterCounts,
    visibleProducts,
  }
}
