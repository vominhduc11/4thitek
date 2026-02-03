import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  CheckCircle,
  Eye,
  FileDown,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Star,
  Home,
  Ban,
  X,
} from 'lucide-react'
import { useProducts } from '../context/ProductsContext'

type ProductFilter = 'all' | 'active' | 'lowStock' | 'draft' | 'archived'
type PublishFilter = 'all' | 'published' | 'draft' | 'archived' | 'deleted'
type FeaturedFilter = 'all' | 'featured' | 'nonFeatured'
type HomepageFilter = 'all' | 'homepage' | 'nonHomepage'
type StockFilter = 'all' | 'low' | 'out'

const getImageUrl = (image: string) => {
  try {
    const parsed = JSON.parse(image) as { imageUrl?: string }
    return parsed.imageUrl || image
  } catch {
    return image
  }
}

const formatPriceVND = (value: number | string) => {
  const num = typeof value === 'number' ? value : Number(value || 0)
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}


function ProductsPage() {
  const {
    products,
    archiveProduct,
    restoreProduct,
    publishProduct,
    deleteProduct,
    addProduct,
    togglePublishStatus,
  } = useProducts()
  const [filter, setFilter] = useState<ProductFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPublish, setFilterPublish] = useState<PublishFilter>('all')
  const [filterFeatured, setFilterFeatured] = useState<FeaturedFilter>('all')
  const [filterHomepage, setFilterHomepage] = useState<HomepageFilter>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'description' | 'specs' | 'videos'>('basic')
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    shortDescription: '',
    longDescription: '',
    descriptions: [
      { type: 'title', text: 'Tiêu đề' },
      { type: 'description', text: 'Mô tả ngắn' },
    ] as { type: 'title' | 'description'; text: string }[],
    specifications: [
      { label: 'Driver', value: '50mm' },
      { label: 'Battery', value: '40h' },
    ] as { label: string; value: string }[],
    videos: [
      {
        title: 'Review',
        descriptions: 'Video review',
        url: 'https://example.com/video.mp4',
        thumbnail: '',
        type: 'review' as 'review' | 'unboxing' | 'demo' | 'tutorial',
      },
    ],
    retailPrice: '',
    stock: '',
    publishStatus: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    isFeatured: false,
    showOnHomepage: false,
    imageUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

    const matchesPublish =
      filterPublish === 'all'
        ? true
        : filterPublish === 'published'
          ? product.publishStatus === 'PUBLISHED' && !product.archived && !product.isDeleted
          : filterPublish === 'draft'
            ? product.publishStatus === 'DRAFT' && !product.archived && !product.isDeleted
            : filterPublish === 'archived'
              ? product.archived && !product.isDeleted
              : product.isDeleted

    const matchesFeatured =
      filterFeatured === 'all'
        ? true
        : filterFeatured === 'featured'
          ? !!product.isFeatured
          : !product.isFeatured

    const matchesHomepage =
      filterHomepage === 'all'
        ? true
        : filterHomepage === 'homepage'
          ? !!product.showOnHomepage
          : !product.showOnHomepage

    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
          ? product.stock > 0 && product.stock < 20
          : product.stock === 0

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

    return (
      matchesSearch &&
      matchesFilter &&
      matchesPublish &&
      matchesFeatured &&
      matchesHomepage &&
      matchesStock
    )
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
    { value: 'archived', label: 'Archived / Deleted', count: archivedProducts.length },
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
          <div className="flex flex-wrap gap-2">
            <select
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={filterPublish}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterPublish(e.target.value as PublishFilter)}
            >
              <option value="all">Publish: All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted</option>
            </select>
            <select
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={filterFeatured}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterFeatured(e.target.value as FeaturedFilter)}
            >
              <option value="all">Featured: All</option>
              <option value="featured">Featured</option>
              <option value="nonFeatured">Not Featured</option>
            </select>
            <select
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={filterHomepage}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterHomepage(e.target.value as HomepageFilter)}
            >
              <option value="all">Homepage: All</option>
              <option value="homepage">Homepage</option>
              <option value="nonHomepage">Not Homepage</option>
            </select>
            <select
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
              value={stockFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setStockFilter(e.target.value as StockFilter)}
            >
              <option value="all">Stock: All</option>
              <option value="low">Low (&lt;20)</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
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
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            type="button"
            onClick={() => {
              const header = ['Name', 'SKU', 'Price', 'Stock', 'Publish', 'Featured', 'Homepage']
              const rows = visibleProducts.map((p) => [
                p.name,
                p.sku,
                p.retailPrice ?? p.price ?? 0,
                p.stock,
                p.publishStatus,
                p.isFeatured ? 'yes' : 'no',
                p.showOnHomepage ? 'yes' : 'no'
              ])
              const csv = [header, ...rows]
                .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
                .join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'products-export.csv'
              link.click()
              URL.revokeObjectURL(url)
            }}
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </button>
          <button
            className={primaryButtonClass}
            type="button"
            onClick={() => {
              setActiveTab('basic')
              setNewProduct({
                name: '',
                sku: '',
                shortDescription: '',
                longDescription: '',
                descriptions: [
                  { type: 'title', text: 'Tiêu đề' },
                  { type: 'description', text: 'Mô tả ngắn' },
                ],
                specifications: [
                  { label: 'Driver', value: '50mm' },
                  { label: 'Battery', value: '40h' },
                ],
                videos: [
                  {
                    title: 'Review',
                    descriptions: 'Video review',
                    url: 'https://example.com/video.mp4',
                    thumbnail: '',
                    type: 'review',
                  },
                ],
                retailPrice: '',
                stock: '',
                publishStatus: 'DRAFT',
                isFeatured: false,
                showOnHomepage: false,
                imageUrl: '',
              })
              setErrors({})
              setShowModal(true)
            }}
          >
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
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_0.7fr_0.9fr] gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-slate-400 md:grid">
          <span>Product</span>
          <span>SKU</span>
          <span>Publish</span>
          <span>Price</span>
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
              className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-4 text-sm text-slate-700 shadow-sm backdrop-blur md:grid-cols-[2fr_1fr_1fr_1fr_0.7fr_0.9fr] md:items-center"
            >
              <div className="flex items-center gap-3">
                <img
                  className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-cover"
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  loading="lazy"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 flex flex-wrap items-center gap-1">
                    {product.name}
                    {product.isFeatured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                    {product.showOnHomepage && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        <Home className="h-3 w-3" /> Homepage
                      </span>
                    )}
                    {product.isDeleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        <Ban className="h-3 w-3" /> Deleted
                      </span>
                    )}
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
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ' +
                  (product.archived || product.isDeleted
                    ? 'bg-slate-200 text-slate-600'
                    : product.publishStatus === 'PUBLISHED'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : product.publishStatus === 'DRAFT'
                        ? 'bg-slate-900/5 text-slate-700'
                        : 'bg-slate-200 text-slate-600')
                }
              >
                {product.archived || product.isDeleted
                  ? 'Deleted'
                  : product.publishStatus === 'PUBLISHED'
                    ? 'Published'
                    : product.publishStatus === 'DRAFT'
                      ? 'Draft'
                      : 'Archived'}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {formatPriceVND(product.retailPrice || product.price || 0)}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {product.stock > 999 ? '999+' : product.stock}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={
                      product.publishStatus === 'PUBLISHED' &&
                      !product.archived &&
                      !product.isDeleted
                    }
                    onChange={() => togglePublishStatus(product.sku)}
                  />
                  {product.publishStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
                </label>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">Create product</h4>
              <button
                className="rounded-full p-2 hover:bg-slate-100"
                onClick={() => {
                  setActiveTab('basic')
                  setShowModal(false)
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: 'basic', label: 'Thông tin' },
                { id: 'description', label: 'Mô tả' },
                { id: 'specs', label: 'Thông số' },
                { id: 'videos', label: 'Videos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={
                    activeTab === tab.id
                      ? 'rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white shadow'
                      : 'rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700'
                  }
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'basic' && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Name *</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>SKU *</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  />
                  {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
                </label>
                <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                  <span>Short description</span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    rows={2}
                    value={newProduct.shortDescription}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, shortDescription: e.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                  <span>Long description</span>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    rows={3}
                    value={newProduct.longDescription}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, longDescription: e.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Retail price *</span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={newProduct.retailPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, retailPrice: e.target.value })}
                  />
                  {errors.retailPrice && <p className="text-xs text-red-500">{errors.retailPrice}</p>}
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Stock *</span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  />
                  {errors.stock && <p className="text-xs text-red-500">{errors.stock}</p>}
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Publish status</span>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={newProduct.publishStatus}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        publishStatus: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
                      })
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm text-slate-700">
                  <span>Image URL</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  />
                  {newProduct.imageUrl && (
                    <div className="mt-2 rounded-xl border bg-slate-50 p-2">
                      <img
                        src={newProduct.imageUrl}
                        alt="preview"
                        className="h-32 w-full rounded-lg object-cover"
                        onError={(ev) => ((ev.target as HTMLImageElement).style.display = 'none')}
                      />
                    </div>
                  )}
                </label>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.isFeatured}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, isFeatured: e.target.checked })
                      }
                    />
                    Featured
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.showOnHomepage}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, showOnHomepage: e.target.checked })
                      }
                    />
                    Homepage
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'description' && (
              <div className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Mô tả (Descriptions)</span>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        descriptions: [
                          { type: 'title', text: 'Tiêu đề' },
                          { type: 'description', text: 'Mô tả ngắn' },
                        ],
                      })
                    }
                  >
                    Dùng mẫu
                  </button>
                </div>
                {newProduct.descriptions.map((d, idx) => (
                  <div key={idx} className="grid grid-cols-[120px_1fr_auto] items-center gap-2">
                    <select
                      className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                      value={d.type}
                      onChange={(e) => {
                        const copy = [...newProduct.descriptions]
                        copy[idx] = { ...copy[idx], type: e.target.value as 'title' | 'description' }
                        setNewProduct({ ...newProduct, descriptions: copy })
                      }}
                    >
                      <option value="title">Title</option>
                      <option value="description">Description</option>
                    </select>
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={d.text}
                      onChange={(e) => {
                        const copy = [...newProduct.descriptions]
                        copy[idx] = { ...copy[idx], text: e.target.value }
                        setNewProduct({ ...newProduct, descriptions: copy })
                      }}
                      placeholder={d.type === 'title' ? 'Tiêu đề' : 'Mô tả'}
                    />
                    <button
                      type="button"
                      className="text-xs text-red-500"
                      onClick={() => {
                        const copy = newProduct.descriptions.filter((_, i) => i !== idx)
                        setNewProduct({ ...newProduct, descriptions: copy.length ? copy : [{ type: 'title', text: '' }] })
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-[var(--accent)]"
                  onClick={() =>
                    setNewProduct({
                      ...newProduct,
                      descriptions: [...newProduct.descriptions, { type: 'description', text: '' }],
                    })
                  }
                >
                  + Thêm dòng mô tả
                </button>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Thông số (Specifications)</span>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        specifications: [
                          { label: 'Driver', value: '50mm' },
                          { label: 'Battery', value: '40h' },
                        ],
                      })
                    }
                  >
                    Dùng mẫu
                  </button>
                </div>
                {newProduct.specifications.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Label"
                      value={s.label}
                      onChange={(e) => {
                        const copy = [...newProduct.specifications]
                        copy[idx] = { ...copy[idx], label: e.target.value }
                        setNewProduct({ ...newProduct, specifications: copy })
                      }}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Value"
                      value={s.value}
                      onChange={(e) => {
                        const copy = [...newProduct.specifications]
                        copy[idx] = { ...copy[idx], value: e.target.value }
                        setNewProduct({ ...newProduct, specifications: copy })
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs text-red-500"
                      onClick={() => {
                        const copy = newProduct.specifications.filter((_, i) => i !== idx)
                        setNewProduct({ ...newProduct, specifications: copy.length ? copy : [{ label: '', value: '' }] })
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-[var(--accent)]"
                  onClick={() =>
                    setNewProduct({
                      ...newProduct,
                      specifications: [...newProduct.specifications, { label: '', value: '' }],
                    })
                  }
                >
                  + Thêm thông số
                </button>
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Videos</span>
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] underline"
                    onClick={() =>
                      setNewProduct({
                        ...newProduct,
                        videos: [
                          {
                            title: 'Review',
                            descriptions: 'Video review',
                            url: 'https://example.com/video.mp4',
                            thumbnail: '',
                            type: 'review',
                          },
                        ],
                      })
                    }
                  >
                    Dùng mẫu
                  </button>
                </div>
                {newProduct.videos.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Title"
                        value={v.title}
                        onChange={(e) => {
                          const copy = [...newProduct.videos]
                          copy[idx] = { ...copy[idx], title: e.target.value }
                          setNewProduct({ ...newProduct, videos: copy })
                        }}
                      />
                      <select
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={v.type}
                        onChange={(e) => {
                          const copy = [...newProduct.videos]
                          copy[idx] = { ...copy[idx], type: e.target.value as typeof v.type }
                          setNewProduct({ ...newProduct, videos: copy })
                        }}
                      >
                        <option value="review">Review</option>
                        <option value="unboxing">Unboxing</option>
                        <option value="demo">Demo</option>
                        <option value="tutorial">Tutorial</option>
                      </select>
                    </div>
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Video URL"
                      value={v.url}
                      onChange={(e) => {
                        const copy = [...newProduct.videos]
                        copy[idx] = { ...copy[idx], url: e.target.value }
                        setNewProduct({ ...newProduct, videos: copy })
                      }}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Thumbnail URL"
                      value={v.thumbnail}
                      onChange={(e) => {
                        const copy = [...newProduct.videos]
                        copy[idx] = { ...copy[idx], thumbnail: e.target.value }
                        setNewProduct({ ...newProduct, videos: copy })
                      }}
                    />
                    <textarea
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Description"
                      rows={2}
                      value={v.descriptions}
                      onChange={(e) => {
                        const copy = [...newProduct.videos]
                        copy[idx] = { ...copy[idx], descriptions: e.target.value }
                        setNewProduct({ ...newProduct, videos: copy })
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs text-red-500 self-end"
                      onClick={() => {
                        const copy = newProduct.videos.filter((_, i) => i !== idx)
                        setNewProduct({
                          ...newProduct,
                          videos: copy.length
                            ? copy
                            : [
                                { title: '', descriptions: '', url: '', thumbnail: '', type: 'review' as const },
                              ],
                        })
                      }}
                    >
                      Xóa video
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-[var(--accent)]"
                  onClick={() =>
                    setNewProduct({
                      ...newProduct,
                      videos: [
                        ...newProduct.videos,
                        { title: '', descriptions: '', url: '', thumbnail: '', type: 'review' as const },
                      ],
                    })
                  }
                >
                  + Thêm video
                </button>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => {
                  setActiveTab('basic')
                  setShowModal(false)
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                onClick={() => {
                  const nextErrors: Record<string, string> = {}
                  if (!newProduct.name.trim()) nextErrors.name = 'Name is required'
                  if (!newProduct.sku.trim()) nextErrors.sku = 'SKU is required'
                  if (products.some((p) => p.sku === newProduct.sku.trim())) {
                    nextErrors.sku = 'SKU already exists'
                  }
                  const priceNum = Number(newProduct.retailPrice)
                  if (Number.isNaN(priceNum) || priceNum < 0) {
                    nextErrors.retailPrice = 'Price must be a non-negative number'
                  }
                  const stockNum = Number(newProduct.stock)
                  if (Number.isNaN(stockNum) || stockNum < 0) {
                    nextErrors.stock = 'Stock must be a non-negative number'
                  }
                  setErrors(nextErrors)
                  if (Object.keys(nextErrors).length) return

                  const descJson = JSON.stringify(newProduct.descriptions || [])
                  const specJson = JSON.stringify(newProduct.specifications || [])
                  const videoJson = JSON.stringify(newProduct.videos || [])

                  addProduct({
                    name: newProduct.name.trim(),
                    sku: newProduct.sku.trim(),
                    shortDescription: newProduct.shortDescription.trim(),
                    description: newProduct.longDescription.trim() || newProduct.shortDescription.trim(),
                    retailPrice: priceNum || 0,
                    price: String(priceNum || 0),
                    stock: stockNum || 0,
                    publishStatus: newProduct.publishStatus,
                    isFeatured: newProduct.isFeatured,
                    showOnHomepage: newProduct.showOnHomepage,
                    image: newProduct.imageUrl
                      ? JSON.stringify({ imageUrl: newProduct.imageUrl })
                      : undefined,
                    descriptions: descJson,
                    specifications: specJson,
                    videos: videoJson,
                  })
                  setShowModal(false)
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProductsPage
