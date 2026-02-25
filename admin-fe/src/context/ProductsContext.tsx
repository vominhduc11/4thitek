/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
import { products as seedProducts } from '../data/products'
import type { Product, PublishStatus } from '../data/products'
import productPlaceholder from '../assets/product-placeholder.svg'

type ProductsContextValue = {
  products: Product[]
  archiveProduct: (sku: string) => void
  restoreProduct: (sku: string) => void
  publishProduct: (sku: string) => void
  updateProduct: (sku: string, updates: Partial<Product>) => void
  deleteProduct: (sku: string) => void
  addProduct: (payload?: Partial<Product>) => void
  togglePublishStatus: (sku: string) => void
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

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts.map(normalizeProduct))

  const archiveProduct = (sku: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.sku === sku
          ? normalizeProduct({
              ...product,
              isDeleted: true,
              publishStatus: 'DRAFT',
            })
          : product,
      ),
    )
  }

  const restoreProduct = (sku: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.sku === sku
          ? normalizeProduct({
              ...product,
              isDeleted: false,
              publishStatus: 'DRAFT',
            })
          : product,
      ),
    )
  }

  const publishProduct = (sku: string) => {
    const updatedAt = new Date().toISOString()

    setProducts((prev) =>
      prev.map((product) => {
        if (product.sku !== sku || product.isDeleted) {
          return product
        }
        if (product.publishStatus === 'PUBLISHED') {
          return product
        }
        return normalizeProduct({
          ...product,
          publishStatus: 'PUBLISHED',
          updatedAt,
          isDeleted: false,
        })
      }),
    )
  }

  const updateProduct = (sku: string, updates: Partial<Product>) => {
    const nextUpdatedAt = updates.updatedAt || new Date().toISOString()
    setProducts((prev) =>
      prev.map((product) =>
        product.sku === sku
          ? normalizeProduct({ ...product, ...updates, updatedAt: nextUpdatedAt })
          : product,
      ),
    )
  }

  const deleteProduct = (sku: string) => {
    setProducts((prev) => prev.filter((product) => product.sku !== sku))
  }

  const addProduct = (payload: Partial<Product> = {}) => {
    const now = new Date()
    const id = payload.id || String(Date.now())
    const sku = payload.sku || `NEW-${id}`
    const base: Product = {
      id,
      name: payload.name || `New Product ${products.length + 1}`,
      sku,
      shortDescription: payload.shortDescription || '',
      status: 'Draft',
      publishStatus: payload.publishStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      stock: payload.stock ?? 0,
      retailPrice: payload.retailPrice ?? 0,
      image:
        payload.image ||
        JSON.stringify({
          imageUrl: productPlaceholder,
        }),
      descriptions: payload.descriptions || '[]',
      videos: payload.videos || '[]',
      specifications: payload.specifications || '[]',
      showOnHomepage: payload.showOnHomepage ?? false,
      isFeatured: payload.isFeatured ?? false,
      isDeleted: payload.isDeleted ?? false,
      createdAt: payload.createdAt || now.toISOString(),
      updatedAt: payload.updatedAt || now.toISOString(),
    }

    setProducts((prev) => [...prev, normalizeProduct(base)])
  }

  const togglePublishStatus = (sku: string) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.sku !== sku) return product
        const nextStatus: PublishStatus =
          product.publishStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
        return normalizeProduct({
          ...product,
          publishStatus: nextStatus,
          isDeleted: false
        })
      })
    )
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

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider')
  }
  return context
}
