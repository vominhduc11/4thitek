/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Product, PublishStatus } from '../types/product'
import productPlaceholder from '../assets/product-placeholder.svg'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  type BackendProductResponse,
  type BackendProductUpsertRequest,
  updateAdminProduct,
} from '../lib/adminApi'
import { hasBackendApi } from '../lib/backendApi'

type ProductsContextValue = {
  products: Product[]
  archiveProduct: (sku: string) => Promise<void>
  restoreProduct: (sku: string) => Promise<void>
  publishProduct: (sku: string) => Promise<void>
  updateProduct: (sku: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (sku: string) => Promise<void>
  addProduct: (payload?: Partial<Product>) => Promise<Product | undefined>
  togglePublishStatus: (sku: string) => Promise<void>
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined)

const deriveStatus = (product: Product): Product['status'] => {
  if (product.publishStatus !== 'PUBLISHED' || product.isDeleted) {
    return 'Draft'
  }
  if (product.stock < 20) return 'Low Stock'
  return 'Active'
}

const normalizeProduct = (product: Product): Product => {
  const publishStatus: PublishStatus =
    product.publishStatus === 'PUBLISHED'
      ? 'PUBLISHED'
      : product.publishStatus === 'DRAFT'
        ? 'DRAFT'
        : product.status === 'Draft' || product.isDeleted
          ? 'DRAFT'
          : 'PUBLISHED'

  return {
    ...product,
    publishStatus,
    status: deriveStatus({ ...product, publishStatus }),
    isDeleted: product.isDeleted ?? false,
  }
}

const safeJsonStringify = (value: unknown, fallback: string) => {
  try {
    return JSON.stringify(value ?? JSON.parse(fallback))
  } catch {
    return fallback
  }
}

const parseImageField = (value?: string) => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // fall through
  }
  return { imageUrl: value }
}

const parseArrayField = (value?: string) => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
      : undefined
  } catch {
    return undefined
  }
}

const mapResponseToProduct = (product: BackendProductResponse): Product =>
  normalizeProduct({
    id: String(product.id),
    name: product.name || '',
    sku: product.sku || `PRD-${product.id}`,
    shortDescription: product.shortDescription || '',
    status: 'Draft',
    publishStatus: product.publishStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    stock: Number(product.stock ?? 0),
    retailPrice: Number(product.retailPrice ?? 0),
    image:
      product.image && Object.keys(product.image).length > 0
        ? JSON.stringify(product.image)
        : JSON.stringify({ imageUrl: productPlaceholder }),
    descriptions: safeJsonStringify(product.descriptions ?? [], '[]'),
    videos: safeJsonStringify(product.videos ?? [], '[]'),
    specifications: safeJsonStringify(product.specifications ?? [], '[]'),
    showOnHomepage: Boolean(product.showOnHomepage),
    isFeatured: Boolean(product.isFeatured),
    isDeleted: Boolean(product.isDeleted),
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || product.createdAt || new Date().toISOString(),
  })

const toUpsertPayload = (payload: Partial<Product>): BackendProductUpsertRequest => {
  const request: BackendProductUpsertRequest = {}

  if ('sku' in payload && payload.sku !== undefined) {
    request.sku = payload.sku.trim()
  }
  if ('name' in payload && payload.name !== undefined) {
    request.name = payload.name.trim()
  }
  if ('shortDescription' in payload && payload.shortDescription !== undefined) {
    request.shortDescription = payload.shortDescription.trim()
  }
  if ('image' in payload && payload.image !== undefined) {
    const image = parseImageField(payload.image)
    if (image) {
      request.image = image
    }
  }
  if ('descriptions' in payload && payload.descriptions !== undefined) {
    request.descriptions = parseArrayField(payload.descriptions) ?? []
  }
  if ('videos' in payload && payload.videos !== undefined) {
    request.videos = parseArrayField(payload.videos) ?? []
  }
  if ('specifications' in payload && payload.specifications !== undefined) {
    request.specifications = parseArrayField(payload.specifications) ?? []
  }
  if ('retailPrice' in payload && payload.retailPrice !== undefined) {
    request.retailPrice = Number(payload.retailPrice ?? 0)
  }
  if ('stock' in payload && payload.stock !== undefined) {
    request.stock = Number(payload.stock ?? 0)
  }
  if ('showOnHomepage' in payload && payload.showOnHomepage !== undefined) {
    request.showOnHomepage = payload.showOnHomepage
  }
  if ('isFeatured' in payload && payload.isFeatured !== undefined) {
    request.isFeatured = payload.isFeatured
  }
  if ('isDeleted' in payload && payload.isDeleted !== undefined) {
    request.isDeleted = payload.isDeleted
  }
  if ('publishStatus' in payload && payload.publishStatus !== undefined) {
    request.publishStatus = payload.publishStatus
  }

  return request
}

const replaceProduct = (products: Product[], nextProduct: Product) =>
  products.map((product) => (product.sku === nextProduct.sku ? nextProduct : product))

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [products, setProducts] = useState<Product[]>([])

  const useRemoteData = useMemo(() => hasBackendApi() && Boolean(accessToken), [accessToken])

  useEffect(() => {
    if (!useRemoteData || !accessToken) {
      const timer = window.setTimeout(() => {
        setProducts([])
      }, 0)
      return () => window.clearTimeout(timer)
    }

    let cancelled = false

    const loadProducts = async () => {
      try {
        const response = await fetchAdminProducts(accessToken)
        if (!cancelled) {
          setProducts(response.map(mapResponseToProduct))
        }
      } catch (error) {
        if (!cancelled) {
          notify(error instanceof Error ? error.message : 'Khong tai duoc danh sach san pham', {
            title: 'Products',
            variant: 'error',
          })
        }
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [accessToken, notify, useRemoteData])

  const archiveProduct = async (sku: string) => {
    if (!useRemoteData || !accessToken) return

    const target = products.find((product) => product.sku === sku)
    if (!target) return

    const updated = await updateAdminProduct(accessToken, Number(target.id), {
      isDeleted: true,
      publishStatus: 'DRAFT',
    })
    setProducts((prev) => replaceProduct(prev, mapResponseToProduct(updated)))
  }

  const restoreProduct = async (sku: string) => {
    if (!useRemoteData || !accessToken) return

    const target = products.find((product) => product.sku === sku)
    if (!target) return

    const updated = await updateAdminProduct(accessToken, Number(target.id), {
      isDeleted: false,
      publishStatus: 'DRAFT',
    })
    setProducts((prev) => replaceProduct(prev, mapResponseToProduct(updated)))
  }

  const publishProduct = async (sku: string) => {
    if (!useRemoteData || !accessToken) return

    const target = products.find((product) => product.sku === sku)
    if (!target) return

    const updated = await updateAdminProduct(accessToken, Number(target.id), {
      publishStatus: 'PUBLISHED',
      isDeleted: false,
    })
    setProducts((prev) => replaceProduct(prev, mapResponseToProduct(updated)))
  }

  const updateProduct = async (sku: string, updates: Partial<Product>) => {
    if (!useRemoteData || !accessToken) return

    const target = products.find((product) => product.sku === sku)
    if (!target) return

    const updated = await updateAdminProduct(accessToken, Number(target.id), toUpsertPayload(updates))
    setProducts((prev) => replaceProduct(prev, mapResponseToProduct(updated)))
  }

  const deleteProduct = async (sku: string) => {
    if (!useRemoteData || !accessToken) return

    const target = products.find((product) => product.sku === sku)
    if (!target) return

    await deleteAdminProduct(accessToken, Number(target.id))
    setProducts((prev) => prev.filter((product) => product.sku !== sku))
  }

  const addProduct = async (payload: Partial<Product> = {}) => {
    if (!useRemoteData || !accessToken) return undefined

    const created = await createAdminProduct(accessToken, toUpsertPayload(payload))
    const normalized = mapResponseToProduct(created)
    setProducts((prev) => [normalized, ...prev])
    return normalized
  }

  const togglePublishStatus = async (sku: string) => {
    if (!useRemoteData || !accessToken) return

    const target = products.find((product) => product.sku === sku)
    if (!target) return

    const updated = await updateAdminProduct(accessToken, Number(target.id), {
      publishStatus: target.publishStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
      isDeleted: false,
    })
    setProducts((prev) => replaceProduct(prev, mapResponseToProduct(updated)))
  }

  const value = {
    products,
    archiveProduct,
    restoreProduct,
    publishProduct,
    updateProduct,
    deleteProduct,
    addProduct,
    togglePublishStatus,
  }

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider')
  }
  return context
}
