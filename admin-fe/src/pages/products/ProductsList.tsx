import { Archive, Eye, RotateCcw, Sparkles, Star, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/ui-kit'
import type { Product } from '../../types/product'
import { formatPriceVND, getProductImageUrl } from './productsPageShared'

type TranslationFunction = (key: string, vars?: Record<string, string | number>) => string

type ProductsListProps = {
  products: Product[]
  t: TranslationFunction
  onArchiveToggle: (product: Product) => void
  onDelete: (sku: string) => void
  onPublishToggle: (product: Product) => void
}

const publishToneClass = (product: Product) => {
  if (product.isDeleted) {
    return 'cursor-default bg-slate-200 text-slate-600'
  }

  return product.publishStatus === 'PUBLISHED'
    ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
    : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'
}

function ProductsList({
  products,
  t,
  onArchiveToggle,
  onDelete,
  onPublishToggle,
}: ProductsListProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title={t('Không tìm thấy sản phẩm')}
        message={t('Thử đổi bộ lọc hoặc từ khóa tìm kiếm.')}
      />
    )
  }

  return (
    <div className="grid gap-3">
      <div className="hidden items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)] md:grid md:grid-cols-[2fr_1fr_0.9fr]">
        <span>{t('Sản phẩm')}</span>
        <span>{t('Trạng thái')}</span>
        <span>{t('Thao tác')}</span>
      </div>

      {products.map((product) => (
        <article
          key={product.sku}
          className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--ink)] shadow-sm transition hover:border-[var(--accent-soft)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] md:grid-cols-[2fr_1fr_0.9fr] md:items-center"
        >
          <div className="flex items-center gap-3">
            <img
              alt={product.name}
              className="h-12 w-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] object-cover"
              loading="lazy"
              src={getProductImageUrl(product.image)}
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--ink)]">{product.name}</p>
                <div className="flex items-center gap-1">
                  {product.isFeatured ? (
                    <span
                      aria-label={t('Nổi bật')}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-700"
                      role="img"
                      title={t('Nổi bật')}
                    >
                      <Star aria-hidden="true" className="h-3 w-3" />
                    </span>
                  ) : null}
                  {product.showOnHomepage ? (
                    <span
                      aria-label={t('Trang chủ')}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-700"
                      role="img"
                      title={t('Trang chủ')}
                    >
                      <Sparkles aria-hidden="true" className="h-3 w-3" />
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-[var(--muted)]">
                <span className="uppercase tracking-[0.2em] text-slate-400">SKU {product.sku}</span>
                <span className="px-2 text-slate-300">|</span>
                <span className="font-semibold text-[var(--ink)]">
                  {formatPriceVND(product.retailPrice || 0)}
                </span>
                <span className="px-2 text-slate-300">|</span>
                <span>
                  {t('Tồn')}: {product.availableStock > 999 ? '999+' : product.availableStock}
                </span>
              </p>
            </div>
          </div>

          <div>
            <button
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${publishToneClass(product)}`}
              disabled={product.isDeleted}
              onClick={() => {
                if (!product.isDeleted) {
                  onPublishToggle(product)
                }
              }}
              title={
                product.isDeleted
                  ? undefined
                  : product.publishStatus === 'DRAFT'
                    ? t('Xuất bản')
                    : t('Hủy xuất bản')
              }
              type="button"
            >
              {product.isDeleted
                ? t('Đã xóa')
                : product.publishStatus === 'PUBLISHED'
                  ? t('Đã xuất bản')
                  : t('Bản nháp')}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Link
              aria-label={t('Chi tiết')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border)] px-2 text-[var(--ink)] transition hover:border-[var(--accent)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
              title={t('Chi tiết')}
              to={`/products/${product.sku}`}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{t('Chi tiết')}</span>
            </Link>

            <button
              aria-label={product.isDeleted ? t('Khôi phục') : t('Ẩn sản phẩm')}
              className={
                product.isDeleted
                  ? 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 px-2 text-emerald-700 transition hover:border-emerald-400'
                  : 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-amber-200 px-2 text-amber-700 transition hover:border-amber-400'
              }
              onClick={() => onArchiveToggle(product)}
              title={product.isDeleted ? t('Khôi phục') : t('Ẩn sản phẩm')}
              type="button"
            >
              {product.isDeleted ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {product.isDeleted ? t('Khôi phục') : t('Ẩn')}
              </span>
            </button>

            <button
              aria-label={t('Xóa')}
              className={
                product.isDeleted
                  ? 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-rose-200 px-2 text-rose-700 transition hover:border-rose-400'
                  : 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-2xl border border-[var(--border)] px-2 text-slate-400'
              }
              disabled={!product.isDeleted}
              onClick={() => onDelete(product.sku)}
              title={
                product.isDeleted
                  ? t('Xóa vĩnh viễn')
                  : t('Cần ẩn sản phẩm trước khi xóa vĩnh viễn')
              }
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('Xóa')}</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ProductsList
