import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  CheckCircle,
  Eye,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import { useProducts } from '../context/ProductsContext'

type ProductFilter = 'all' | 'active' | 'lowStock' | 'draft' | 'archived'

function ProductsPage() {
  const {
    products,
    archiveProduct,
    restoreProduct,
    publishProduct,
    deleteProduct,
  } = useProducts()
  const [filter, setFilter] = useState<ProductFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const archivedProducts = products.filter((product) => product.archived)

  const activeProducts = products.filter(
    (product) => !product.archived && product.status === 'Active',
  )
  const lowStockProducts = products.filter(
    (product) => !product.archived && product.status === 'Low Stock',
  )
  const draftProducts = products.filter(
    (product) => !product.archived && product.status === 'Draft',
  )

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleProducts = products.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.sku.toLowerCase().includes(normalizedSearch)

    const matchesFilter = (() => {
      switch (filter) {
        case 'active':
          return !product.archived && product.status === 'Active'
        case 'lowStock':
          return !product.archived && product.status === 'Low Stock'
        case 'draft':
          return !product.archived && product.status === 'Draft'
        case 'archived':
          return product.archived
        default:
          return true
      }
    })()

    return matchesSearch && matchesFilter
  })

  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const primaryButtonClass =
    'inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0'
  const filterBaseClass =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition'

  const handleDelete = (sku: string) => {
    if (
      window.confirm('Xoa vinh vien san pham nay? Hanh dong khong the hoan tac.')
    ) {
      deleteProduct(sku)
    }
  }

  const filters = [
    { value: 'all', label: 'All', count: products.length },
    { value: 'active', label: 'Active', count: activeProducts.length },
    { value: 'lowStock', label: 'Low Stock', count: lowStockProducts.length },
    { value: 'draft', label: 'Draft', count: draftProducts.length },
    { value: 'archived', label: 'Archived', count: archivedProducts.length },
  ] as const

  return (
    <section className={`${panelClass} animate-card-enter`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Products</h3>
          <p className="text-sm text-slate-500">Quan ly san pham va ton kho.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-52 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
              placeholder="Tim ten, SKU..."
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-1">
            {filters.map((option) => {
              const isActive = filter === option.value
              return (
                <button
                  key={option.value}
                  className={
                    isActive
                      ? `${filterBaseClass} bg-[var(--accent)] text-white shadow-sm`
                      : `${filterBaseClass} text-slate-500 hover:text-slate-900`
                  }
                  type="button"
                  onClick={() => setFilter(option.value)}
                >
                  <span>{option.label}</span>
                  <span
                    className={
                      isActive
                        ? 'rounded-full bg-white/20 px-2 py-0.5 text-[0.65rem]'
                        : 'rounded-full bg-white px-2 py-0.5 text-[0.65rem] text-slate-500'
                    }
                  >
                    {option.count}
                  </span>
                </button>
              )
            })}
          </div>
          <button className={primaryButtonClass} type="button">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Total SKUs
          </p>
          <h4 className="mt-2 text-2xl font-semibold text-slate-900">
            {products.filter((product) => !product.archived).length}
          </h4>
          <span className="text-xs text-slate-500">
            {draftProducts.length} drafts
          </span>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Low Stock
          </p>
          <h4 className="mt-2 text-2xl font-semibold text-slate-900">
            {lowStockProducts.length}
          </h4>
          <span className="text-xs text-slate-500">Restock alert</span>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Active Lines
          </p>
          <h4 className="mt-2 text-2xl font-semibold text-slate-900">
            {activeProducts.length}
          </h4>
          <span className="text-xs text-slate-500">On sale now</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="hidden grid-cols-[2.1fr_1fr_1fr_0.6fr_0.9fr] gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-slate-400 md:grid">
          <span>Product</span>
          <span>SKU</span>
          <span>Status</span>
          <span>Stock</span>
          <span>Action</span>
        </div>
        {visibleProducts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] px-6 py-10 text-center text-sm text-slate-500">
            <Package className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-4 text-base font-semibold text-slate-900">
              Khong tim thay san pham
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Thu doi bo loc hoac tu khoa tim kiem.
            </p>
          </div>
        ) : (
          visibleProducts.map((product) => (
            <div
              key={product.sku}
              className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-4 text-sm text-slate-700 shadow-sm backdrop-blur md:grid-cols-[2.1fr_1fr_1fr_0.6fr_0.9fr] md:items-center"
            >
              <div className="flex items-center gap-3">
                <img
                  className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-cover"
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Cap nhat {product.lastUpdated}
                  </p>
                </div>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {product.sku}
              </span>
              <span
                className={
                  product.archived
                    ? 'inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'
                    : product.status === 'Active'
                      ? 'inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700'
                      : product.status === 'Low Stock'
                        ? 'inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700'
                        : 'inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'
                }
              >
                <span
                  className={
                    product.archived
                      ? 'h-2 w-2 rounded-full bg-slate-400'
                      : product.status === 'Active'
                        ? 'h-2 w-2 rounded-full bg-emerald-500'
                        : product.status === 'Low Stock'
                          ? 'h-2 w-2 rounded-full bg-amber-500'
                          : 'h-2 w-2 rounded-full bg-slate-400'
                  }
                />
                {product.archived ? 'Archived' : product.status}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {product.stock}
              </span>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                  to={`/products/${product.sku}`}
                >
                  <Eye className="h-4 w-4" />
                  Chi tiet
                </Link>
                <button
                  className={
                    product.status === 'Draft' && !product.archived
                      ? 'inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)]'
                      : 'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400'
                  }
                  type="button"
                  onClick={() => publishProduct(product.sku)}
                  disabled={product.archived || product.status !== 'Draft'}
                >
                  <CheckCircle className="h-4 w-4" />
                  {product.status === 'Draft' ? 'Xuat ban' : 'Da xuat ban'}
                </button>
                <button
                  className={
                    product.archived
                      ? 'inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400'
                      : 'inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-400'
                  }
                  type="button"
                  onClick={() =>
                    product.archived
                      ? restoreProduct(product.sku)
                      : archiveProduct(product.sku)
                  }
                >
                  {product.archived ? (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Khoi phuc
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      An san pham
                    </>
                  )}
                </button>
                <button
                  className={
                    product.archived
                      ? 'inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400'
                      : 'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400'
                  }
                  type="button"
                  onClick={() => handleDelete(product.sku)}
                  disabled={!product.archived}
                  title={
                    product.archived
                      ? 'Xoa vinh vien'
                      : 'Chi xoa vinh vien duoc khi da an san pham'
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Xoa
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default ProductsPage
