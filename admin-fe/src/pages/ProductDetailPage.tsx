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
import { useLanguage } from '../context/LanguageContext'
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

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

const parseCurrencyValue = (value: string) => {
  const cleaned = value.replace(/[^\d.-]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function ProductDetailPage() {
  const { sku } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
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

  const productStatusLabelMap: Record<Product['status'], string> = {
    Active: 'Đang bán',
    'Low Stock': 'Tồn kho thấp',
    Draft: 'Bản nháp',
  }

  const publishStatusLabelMap: Record<Product['publishStatus'], string> = {
    PUBLISHED: 'Đã xuất bản',
    DRAFT: 'Bản nháp',
  }

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
          {t('Không tìm thấy sản phẩm')}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          {t('SKU {sku} không tồn tại hoặc đã bị xóa.', { sku: sku ?? '' })}
        </p>
        <Link
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
          to="/products"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Quay lại danh sách')}
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
      'Xóa vĩnh viễn sản phẩm này? Hành động không thể hoàn tác.',
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
              {t('Sản phẩm')}
            </Link>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              {product.name}
            </h3>
            <p className="mt-2 text-sm text-slate-500">{product.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
                  ? t('Đã xóa')
                  : t(publishStatusLabelMap[product.publishStatus])}
              </span>
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 font-semibold text-amber-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('Nổi bật')}
                </span>
              )}
              {product.showOnHomepage && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 font-semibold text-blue-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('Trang chủ')}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold">
                SKU {product.sku}
              </span>
              <span className="rounded-full bg-slate-900/5 px-3 py-1 font-semibold">
                {t('Cập nhật {date}', { date: product.lastUpdated })}
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
                  {t('Hủy')}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0"
                  type="submit"
                  form="product-edit-form"
                >
                  <Save className="h-4 w-4" />
                  {t('Lưu thay đổi')}
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
                  {t('Chỉnh sửa')}
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
                  {product.status === 'Draft'
                    ? t('Xuất bản')
                    : t('Đã xuất bản')}
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
                  {t('Khôi phục')}
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  {t('Ẩn sản phẩm')}
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
                  ? t('Xóa vĩnh viễn')
                  : t('Chỉ xóa vĩnh viễn được khi đã ẩn sản phẩm')
              }
            >
              <Trash2 className="h-4 w-4" />
              {t('Xóa')}
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
                {formatCurrency(
                  product.retailPrice && product.retailPrice > 0
                    ? product.retailPrice
                    : parseCurrencyValue(product.price),
                )}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t('Cập nhật {date}', { date: product.lastUpdated })}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t('Trạng thái')}
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
                {product.archived
                  ? t('Đã lưu trữ')
                  : t(productStatusLabelMap[product.status])}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t('Tồn kho')}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {product.stock}
              </p>
              <p className="text-xs text-slate-500">
                {t('Cập nhật {date}', { date: product.lastUpdated })}
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
                    {t('Tên sản phẩm')}
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus:outline-none"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('Giá')}
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus:outline-none"
                    value={draft.price}
                    onChange={(event) =>
                      setDraft({ ...draft, price: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('Tồn kho')}
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus:outline-none"
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
                    {t('Trạng thái')}
                  </label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-[var(--surface)] focus:outline-none"
                    value={draft.status}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        status: event.target.value as Product['status'],
                      })
                    }
                  >
                    <option value="Active">{t('Đang bán')}</option>
                    <option value="Low Stock">{t('Tồn kho thấp')}</option>
                    <option value="Draft">{t('Bản nháp')}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('Ảnh URL')}
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus:outline-none"
                    value={draft.image}
                    onChange={(event) =>
                      setDraft({ ...draft, image: event.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t('Mô tả')}
                </label>
                <textarea
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus:outline-none"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t('Tính năng (ngăn cách bằng dấu phẩy)')}
                </label>
                <textarea
                  className="mt-2 min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-[var(--surface)] focus:outline-none"
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
                {t('Tính năng chính')}
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] px-4 py-3"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-4 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t('Ghi chú phát hành')}
                </p>
                <p className="mt-2">
                  {t(
                    'Đã cập nhật bao bì và tối ưu đường âm cho lô sản xuất 2026.',
                  )}
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
