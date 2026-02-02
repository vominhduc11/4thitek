import { createContext, useContext, useMemo, useState } from 'react'
import { Product, products as seedProducts } from '../data/products'

type ProductsContextValue = {
  products: Product[]
  archiveProduct: (sku: string) => void
  restoreProduct: (sku: string) => void
  publishProduct: (sku: string) => void
  updateProduct: (sku: string, updates: Partial<Product>) => void
  deleteProduct: (sku: string) => void
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts)

  const archiveProduct = (sku: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.sku === sku ? { ...product, archived: true } : product,
      ),
    )
  }

  const restoreProduct = (sku: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.sku === sku ? { ...product, archived: false } : product,
      ),
    )
  }

  const publishProduct = (sku: string) => {
    const publishedAt = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    setProducts((prev) =>
      prev.map((product) => {
        if (product.sku !== sku || product.archived) {
          return product
        }
        if (product.status !== 'Draft') {
          return product
        }
        return {
          ...product,
          status: 'Active',
          lastUpdated: publishedAt,
        }
      }),
    )
  }

  const updateProduct = (sku: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.sku === sku ? { ...product, ...updates } : product,
      ),
    )
  }

  const deleteProduct = (sku: string) => {
    setProducts((prev) => prev.filter((product) => product.sku !== sku))
  }

  const value = useMemo(
    () => ({
      products,
      archiveProduct,
      restoreProduct,
      publishProduct,
      updateProduct,
      deleteProduct,
    }),
    [products],
  )

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
