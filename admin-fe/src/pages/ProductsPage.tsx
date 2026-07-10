import { AlertTriangle, FileDown, Package, Plus, ShoppingBag, X } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  PrimaryButton,
  StatCard,
} from '../components/ui-kit'
import { ExportButton } from '../components/ExportButton'
import { useProducts } from '../context/ProductsContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import type { Product } from '../types/product'
import ProductsList from './products/ProductsList'
import ProductsToolbar from './products/ProductsToolbar'
import {
  ITEMS_PER_PAGE,
  buildProductsView,
  type FeaturedFilter,
  type HomepageFilter,
  type ProductFilter,
  type ProductsSortDir,
  type ProductsSortField,
} from './products/productsPageShared'

const INVENTORY_ALERT_LOW_STOCK_FILTER: ProductFilter = 'lowStock'
const INVENTORY_ALERT_URGENT_STOCK_FILTER: ProductFilter = 'urgentStock'

function ProductsPage() {
  const { t } = useLanguage()
  const pageTitle = t('Sản phẩm')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const {
    products,
    isLoading: isProductsLoading,
    error: productsError,
    archiveProduct,
    restoreProduct,
    togglePublishStatus,
    deleteProduct,
    addProduct,
  } = useProducts()

  const [filter, setFilter] = useState<ProductFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFeatured, setFilterFeatured] = useState<FeaturedFilter>('all')
  const [filterHomepage, setFilterHomepage] = useState<HomepageFilter>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortField, setSortField] = useState<ProductsSortField>('updatedAt')
  const [sortDir, setSortDir] = useState<ProductsSortDir>('desc')
  const [currentPage, setCurrentPage] = useState(0)
  const [actionMessage, setActionMessage] = useState('')

  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [isQuickAdding, setIsQuickAdding] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')
  const [quickAddPrice, setQuickAddPrice] = useState('')
  const [quickAddDesc, setQuickAddDesc] = useState('')
  const quickAddNameRef = useRef<HTMLInputElement>(null)

  const inventoryAlertTone = useMemo(() => {
    const tone = searchParams.get('inventoryAlert')
    return tone === 'urgent' || tone === 'low' ? tone : null
  }, [searchParams])

  const highlightedProductId = useMemo(() => {
    const rawValue = searchParams.get('productId')
    return rawValue && rawValue.trim() ? rawValue.trim() : null
  }, [searchParams])

  const {
    activeProducts,
    lowStockProducts,
    urgentLowStockProducts,
    draftProducts,
    filterCounts,
    visibleProducts,
  } = useMemo(
    () =>
      buildProductsView({
        products,
        filter,
        filterFeatured,
        filterHomepage,
        searchTerm,
        sortField,
        sortDir,
      }),
    [filter, filterFeatured, filterHomepage, products, searchTerm, sortDir, sortField],
  )

  const highlightedProduct = useMemo(
    () => products.find((product) => product.id === highlightedProductId) ?? null,
    [highlightedProductId, products],
  )

  const prioritizedVisibleProducts = useMemo(() => {
    if (!highlightedProductId) {
      return visibleProducts
    }
    return [...visibleProducts].sort((left, right) => {
      if (left.id === highlightedProductId) return -1
      if (right.id === highlightedProductId) return 1
      return 0
    })
  }, [highlightedProductId, visibleProducts])

  const pageCount = Math.ceil(prioritizedVisibleProducts.length / ITEMS_PER_PAGE)
  const pagedProducts = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE
    return prioritizedVisibleProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [currentPage, prioritizedVisibleProducts])

  useEffect(() => {
    if (!inventoryAlertTone) {
      return
    }
    setFilter(
      inventoryAlertTone === 'urgent'
        ? INVENTORY_ALERT_URGENT_STOCK_FILTER
        : INVENTORY_ALERT_LOW_STOCK_FILTER,
    )
    setSortField('availableStock')
    setSortDir('asc')
  }, [inventoryAlertTone])

  useEffect(() => {
    setCurrentPage(0)
  }, [filter, filterFeatured, filterHomepage, searchTerm])

  useEffect(() => {
    if (pageCount === 0) {
      if (currentPage !== 0) {
        setCurrentPage(0)
      }
      return
    }

    if (currentPage > pageCount - 1) {
      setCurrentPage(pageCount - 1)
    }
  }, [currentPage, pageCount])

  useEffect(() => {
    if (!actionMessage) {
      return
    }

    const timer = window.setTimeout(() => setActionMessage(''), 3000)
    return () => window.clearTimeout(timer)
  }, [actionMessage])

  const showSuccess = useCallback((message: string) => {
    setActionMessage(message)
    notify(message, { title: pageTitle, variant: 'success' })
  }, [notify, pageTitle])

  const resetFilters = () => {
    setFilter('all')
    setSearchTerm('')
    setFilterFeatured('all')
    setFilterHomepage('all')
    setSortField('updatedAt')
    setSortDir('desc')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('inventoryAlert')
    nextParams.delete('productId')
    setSearchParams(nextParams, { replace: true })
  }

  const openQuickAdd = useCallback(() => {
    setQuickAddName('')
    setQuickAddPrice('')
    setQuickAddDesc('')
    setShowQuickAdd(true)
    window.requestAnimationFrame(() => quickAddNameRef.current?.focus())
  }, [])

  const closeQuickAdd = useCallback(() => setShowQuickAdd(false), [])

  useEffect(() => {
    if (!showQuickAdd) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickAdd()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showQuickAdd, closeQuickAdd])

  const handleQuickAdd = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const name = quickAddName.trim()
      if (!name) return
      setIsQuickAdding(true)
      try {
        const created = await addProduct({
          name,
          retailPrice: Number(quickAddPrice) || 0,
          shortDescription: quickAddDesc.trim(),
          publishStatus: 'DRAFT',
        })
        closeQuickAdd()
        notify(t('Đã tạo sản phẩm "{name}".', { name }), { title: pageTitle, variant: 'success' })
        if (created?.id) {
          navigate(`/products/${created.id}`)
        }
      } catch (err) {
        notify(err instanceof Error ? err.message : t('Không thể tạo sản phẩm'), {
          title: pageTitle,
          variant: 'error',
        })
      } finally {
        setIsQuickAdding(false)
      }
    },
    [addProduct, closeQuickAdd, navigate, notify, pageTitle, quickAddDesc, quickAddName, quickAddPrice, t],
  )

  const clearInventoryAlertContext = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('inventoryAlert')
    nextParams.delete('productId')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  const handleExportCsv = () => {
    const header = [
      t('Tên sản phẩm'),
      'SKU',
      t('Giá'),
      t('Tồn kho'),
      t('Xuất bản'),
      t('Hero trang chủ'),
      t('Danh sách sản phẩm trang chủ'),
    ]

    const rows = visibleProducts.map((product) => [
      product.name,
      product.sku,
      product.retailPrice ?? 0,
      product.availableStock,
      product.publishStatus,
      product.isFeatured ? t('Có') : t('Không'),
      product.showOnHomepage ? t('Có') : t('Không'),
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'products-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = useCallback(
    async (sku: string) => {
      const approved = await confirm({
        title: t('Xóa vĩnh viễn sản phẩm'),
        message: t('Xóa vĩnh viễn sản phẩm này?'),
        tone: 'danger',
        confirmLabel: t('Xóa'),
      })

      if (!approved) {
        return
      }

      try {
        await deleteProduct(sku)
        showSuccess(t('Đã xóa vĩnh viễn sản phẩm.'))
      } catch (error) {
        notify(error instanceof Error ? error.message : t('Không thể xóa sản phẩm'), {
          title: pageTitle,
          variant: 'error',
        })
      }
    },
    [confirm, deleteProduct, notify, pageTitle, showSuccess, t],
  )

  const handleArchiveToggle = useCallback(
    async (product: Product) => {
      if (product.isDeleted) {
        try {
          await restoreProduct(product.sku)
          showSuccess(t('Đã khôi phục sản phẩm về bản nháp.'))
        } catch (error) {
          notify(error instanceof Error ? error.message : t('Không thể khôi phục sản phẩm'), {
            title: pageTitle,
            variant: 'error',
          })
        }
        return
      }

      const approved = await confirm({
        title: t('Ẩn sản phẩm'),
        message: t('Ẩn sản phẩm này khỏi danh mục?'),
        tone: 'warning',
        confirmLabel: t('Ẩn sản phẩm'),
      })

      if (!approved) {
        return
      }

      try {
        await archiveProduct(product.sku)
        showSuccess(t('Đã ẩn sản phẩm khỏi danh mục.'))
      } catch (error) {
        notify(error instanceof Error ? error.message : t('Không thể ẩn sản phẩm'), {
          title: pageTitle,
          variant: 'error',
        })
      }
    },
    [archiveProduct, confirm, notify, pageTitle, restoreProduct, showSuccess, t],
  )

  const handlePublishToggle = useCallback(
    async (product: Product) => {
      if (product.isDeleted) {
        return
      }

      if (product.publishStatus === 'PUBLISHED') {
        const approved = await confirm({
          title: t('Hủy xuất bản'),
          message: t('Hủy xuất bản sản phẩm này?'),
          tone: 'warning',
          confirmLabel: t('Hủy xuất bản'),
        })

        if (!approved) {
          return
        }
      } else {
        const approved = await confirm({
          title: t('Xuất bản sản phẩm'),
          message: t('Xuất bản "{name}"?', { name: product.name }),
          tone: 'info',
          confirmLabel: t('Xuất bản'),
        })

        if (!approved) {
          return
        }
      }

      try {
        await togglePublishStatus(product.sku)
        showSuccess(
          product.publishStatus === 'PUBLISHED'
            ? t('Đã hủy xuất bản sản phẩm.')
            : t('Đã xuất bản sản phẩm.'),
        )
      } catch (error) {
        notify(error instanceof Error ? error.message : t('Không thể cập nhật trạng thái xuất bản'), {
          title: pageTitle,
          variant: 'error',
        })
      }
    },
    [confirm, notify, pageTitle, showSuccess, t, togglePublishStatus],
  )

  if (isProductsLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (productsError && products.length === 0) {
    return (
      <PagePanel>
        <ErrorState title={pageTitle} message={productsError} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <PageHeader
        title={pageTitle}
        subtitle={t('Quản lý sản phẩm và tồn kho.')}
        actions={
          <>
            <ExportButton
              className="w-full sm:w-auto"
              icon={<FileDown className="h-4 w-4" />}
              onExport={handleExportCsv}
              label={t('Xuất CSV')}
            />
            <PrimaryButton
              className="w-full sm:w-auto"
              icon={<Plus className="h-4 w-4" />}
              onClick={openQuickAdd}
              type="button"
            >
              {t('Thêm sản phẩm')}
            </PrimaryButton>
          </>
        }
      />

      {actionMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      {inventoryAlertTone ? (
        <div
          className={`mt-4 flex flex-col gap-3 rounded-3xl border px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between ${
            inventoryAlertTone === 'urgent'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          <div className="space-y-1">
            <p className="font-semibold">
              {inventoryAlertTone === 'urgent'
                ? t('Đang xem cảnh báo tồn kho khẩn cấp')
                : t('Đang xem cảnh báo tồn kho thấp')}
            </p>
            <p>
              {highlightedProduct
                ? t('Ưu tiên rà soát SKU {sku} để lên kế hoạch bổ sung hàng.', {
                    sku: highlightedProduct.sku,
                  })
                : t('Danh sách đang được lọc theo các SKU cần bổ sung hàng.')}
            </p>
          </div>
          <GhostButton className="w-full sm:w-auto" onClick={clearInventoryAlertContext} type="button">
            {t('Tắt ngữ cảnh cảnh báo')}
          </GhostButton>
        </div>
      ) : null}

      <ProductsToolbar
        t={t}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
        filterFeatured={filterFeatured}
        onFilterFeaturedChange={setFilterFeatured}
        filterHomepage={filterHomepage}
        onFilterHomepageChange={setFilterHomepage}
        sortField={sortField}
        sortDir={sortDir}
        onSortFieldChange={setSortField}
        onSortDirChange={setSortDir}
        onReset={resetFilters}
        filterCounts={filterCounts}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters((previous) => !previous)}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Package}
          label={t('Tổng SKU')}
          value={products.filter((product) => !product.isDeleted).length}
          hint={t('{count} bản nháp', { count: draftProducts.length })}
        />
        <StatCard
          icon={AlertTriangle}
          label={t('Tồn kho thấp')}
          value={lowStockProducts.length}
          hint={t('{count} khẩn cấp', { count: urgentLowStockProducts.length })}
          tone="warning"
        />
        <StatCard
          icon={ShoppingBag}
          label={t('Đang bán')}
          value={activeProducts.length}
          hint={t('Đang kinh doanh')}
          tone="success"
        />
      </div>

      <div className="mt-6">
        <ProductsList
          products={pagedProducts}
          t={t}
          highlightedProductId={highlightedProductId}
          inventoryAlertTone={inventoryAlertTone}
          onArchiveToggle={handleArchiveToggle}
          onDelete={handleDelete}
          onPublishToggle={handlePublishToggle}
        />
      </div>

      {pageCount > 1 ? (
        <PaginationNav
          page={currentPage}
          totalPages={pageCount}
          totalItems={visibleProducts.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          previousLabel={t('Trước')}
          nextLabel={t('Tiếp')}
        />
      ) : null}

      {confirmDialog}

      {showQuickAdd ? (
        <div
          aria-labelledby="quick-add-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          onClick={(e) => { if (e.target === e.currentTarget) closeQuickAdd() }}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--ink)]" id="quick-add-title">
                {t('Thêm sản phẩm nhanh')}
              </h2>
              <button
                aria-label={t('Đóng')}
                className="rounded-xl p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                onClick={closeQuickAdd}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleQuickAdd}>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ink)]" htmlFor="qa-name">
                  {t('Tên sản phẩm')} <span className="text-rose-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  id="qa-name"
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder={t('VD: Mũ bảo hiểm Nón Sơn')}
                  ref={quickAddNameRef}
                  required
                  type="text"
                  value={quickAddName}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ink)]" htmlFor="qa-price">
                  {t('Giá bán lẻ (VNĐ)')}
                </label>
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  id="qa-price"
                  min="0"
                  onChange={(e) => setQuickAddPrice(e.target.value)}
                  placeholder="0"
                  type="number"
                  value={quickAddPrice}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ink)]" htmlFor="qa-desc">
                  {t('Mô tả ngắn')}
                </label>
                <input
                  autoComplete="off"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  id="qa-desc"
                  onChange={(e) => setQuickAddDesc(e.target.value)}
                  placeholder={t('VD: Dành cho xe máy, size M')}
                  type="text"
                  value={quickAddDesc}
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <PrimaryButton
                  className="flex-1"
                  disabled={isQuickAdding || !quickAddName.trim()}
                  type="submit"
                >
                  {isQuickAdding ? t('Đang tạo…') : t('Tạo sản phẩm')}
                </PrimaryButton>
                <button
                  className="shrink-0 text-xs font-semibold text-[var(--accent)] underline underline-offset-2 transition hover:opacity-80"
                  onClick={() => { closeQuickAdd(); navigate('/products/new') }}
                  type="button"
                >
                  {t('Tạo đầy đủ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PagePanel>
  )
}

export default ProductsPage
