import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  ArrowLeft,
  CheckCircle,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import productPlaceholder from '../assets/product-placeholder.svg'
import { useProducts } from '../context/ProductsContext'
import type { Product } from '../data/products'

const getImageUrl = (image: string) => {
  try {
    const parsed = JSON.parse(image) as { imageUrl?: string }
    return parsed.imageUrl || image
  } catch {
    return image
  }
}

type ProductDraft = {
  name: string
  price: string
  status: Product['status']
  stock: string
  description: string
  features: string
  image: string
}

const buildDraft = (product: Product): ProductDraft => ({
  name: product.name,
  price: product.price,
  status: product.status,
  stock: String(product.stock),
  description: product.description,
  features: product.features.join(', '),
  image: getImageUrl(product.image),
})

const formatDate = () =>
  new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

function ProductDetailPage() {
  const { sku } = useParams()
  const navigate = useNavigate()
  const {
    products,
    archiveProduct,
    restoreProduct,
    publishProduct,
    updateProduct,
    deleteProduct,
  } = useProducts()
  const product = products.find((item) => item.sku === sku)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ProductDraft | null>(
    product ? buildDraft(product) : null,
  )

  useEffect(() => {
    if (product && !isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(buildDraft(product))
    }
  }, [product, isEditing])

  if (!product) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <h3 className="text-lg font-semibold text-slate-900">
          Khong tim thay san pham
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          SKU {sku} khong ton tai hoac da bi xoa.
        </p>
        <Link
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
          to="/products"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lai danh sach
        </Link>
      </section>
    )
  }

  if (!draft) {
    return null
  }

  const handleStartEdit = () => {
    setDraft(buildDraft(product))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setDraft(buildDraft(product))
    setIsEditing(false)
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextStock = Number(draft.stock)
    const nextFeatures = draft.features
      .split(',')
      .map((feature) => feature.trim())
      .filter(Boolean)

    updateProduct(product.sku, {
      name: draft.name.trim() || product.name,
      price: draft.price.trim() || product.price,
      status: draft.status,
      stock: Number.isNaN(nextStock) ? product.stock : nextStock,
      description: draft.description.trim(),
      features: nextFeatures,
      image: draft.image.trim() || productPlaceholder,
      lastUpdated: formatDate(),
    })

    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!product.archived) {
      return
    }
    const confirmed = window.confirm(
      'Xoa vinh vien san pham nay? Hanh dong khong the hoan tac.',
    )
    if (confirmed) {
      deleteProduct(product.sku)
      navigate('/products')
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              to="/products"
            >
              <ArrowLeft className="h-4 w-4" />
              Products
            </Link>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              {product.name}
            </h3>
            <p className="mt-2 text-sm text-slate-500">{product.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ' +
                  (product.isDeleted || product.archived
                    ? 'bg-slate-200 text-slate-600'
                    : product.publishStatus === 'PUBLISHED'
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : product.publishStatus === 'DRAFT'
                        ? 'bg-slate-900/5 text-slate-700'
                        : 'bg-slate-200 text-slate-600')
                }
              >
                {product.isDeleted || product.archived
                  ? 'Deleted'
                  : product.publishStatus === 'PUBLISHED'
                    ? 'Published'
                    : product.publishStatus === 'DRAFT'
                      ? 'Draft'
                      : 'Archived'}
              </span>
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 font-semibold text-amber-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Featured
                </span>
              )}
              {product.showOnHomepage && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 font-semibold text-blue-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Homepage
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold">
                SKU {product.sku}
              </span>
              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold">
                Cap nhat {product.lastUpdated}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {isEditing ? (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                  type="button"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                  Huy
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0"
                  type="submit"
                  form="product-edit-form"
                >
                  <Save className="h-4 w-4" />
                  Luu thay doi
                </button>
              </>
            ) : (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                  type="button"
                  onClick={handleStartEdit}
                >
                  <Pencil className="h-4 w-4" />
                  Chinh sua
                </button>
                <button
                  className={
                    product.status === 'Draft' && !product.archived
                      ? 'inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0'
                      : 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400'
                  }
                  type="button"
                  onClick={() => publishProduct(product.sku)}
                  disabled={product.archived || product.status !== 'Draft'}
                >
                  <CheckCircle className="h-4 w-4" />
                  {product.status === 'Draft' ? 'Xuat ban' : 'Da xuat ban'}
                </button>
              </>
            )}
            <button
              className={
                product.archived
                  ? 'inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400'
                  : 'inline-flex items-center gap-2 rounded-2xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-400'
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
                  ? 'inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400'
                  : 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400'
              }
              type="button"
              onClick={handleDelete}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-4">
            <img
              className="h-24 w-24 rounded-3xl border border-slate-200 bg-slate-50 object-cover"
              src={
                draft.image.trim() ||
                getImageUrl(product.image) ||
                productPlaceholder
              }
              alt={product.name}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                SKU {product.sku}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--accent)]">
                {product.retailPrice ? `$${product.retailPrice}` : product.price}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cap nhat {product.lastUpdated}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Status
              </p>
              <span
                className={
                  product.archived
                    ? 'mt-2 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'
                    : product.status === 'Active'
                      ? 'mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700'
                      : product.status === 'Low Stock'
                        ? 'mt-2 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700'
                        : 'mt-2 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'
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
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Stock
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {product.stock}
              </p>
              <p className="text-xs text-slate-500">
                Last updated {product.lastUpdated}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          {isEditing ? (
            <form
              id="product-edit-form"
              className="space-y-4"
              onSubmit={handleSave}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Ten san pham
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Price
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                    value={draft.price}
                    onChange={(event) =>
                      setDraft({ ...draft, price: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Stock
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                    type="number"
                    min="0"
                    value={draft.stock}
                    onChange={(event) =>
                      setDraft({ ...draft, stock: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Status
                  </label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                    value={draft.status}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        status: event.target.value as Product['status'],
                      })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Image URL
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                    value={draft.image}
                    onChange={(event) =>
                      setDraft({ ...draft, image: event.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Description
                </label>
                <textarea
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Features (comma separated)
                </label>
                <textarea
                  className="mt-2 min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                  value={draft.features}
                  onChange={(event) =>
                    setDraft({ ...draft, features: event.target.value })
                  }
                />
              </div>
            </form>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-slate-900">
                Key features
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[var(--surface-muted)] px-4 py-3"
                  >
                    <span>{feature}</span>
                    <span className="text-xs font-semibold text-slate-400">
                      Active
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Release notes
                </p>
                <p className="mt-2">
                  Updated packaging and optimized audio curve for the 2026
                  production batch.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default ProductDetailPage
