import { AlertTriangle, Barcode, Loader2, Printer, QrCode, RefreshCw, RotateCcw, Trash2, Upload, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchAllAdminSerials,
  fetchAdminSerialsPaged,
  importAdminSerials,
  updateAdminSerialStatus,
  deleteAdminSerial,
  type BackendSerialImportSummary,
  type BackendProductSerialStatus,
  type BackendSerialResponse,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useProducts } from '../context/ProductsContext'
import { useToast } from '../context/ToastContext'
import { formatDateTime } from '../lib/formatters'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { buildSkippedSerialRetryValue } from './serialImportViewState'
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PaginationNav,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  formCardClass,
  inputClass,
  labelClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  textareaClass,
} from '../components/ui-kit'

const SERIAL_STATUS_FILTER_OPTIONS: BackendProductSerialStatus[] = [
  'AVAILABLE',
  'RESERVED',
  'DEFECTIVE',
  'ASSIGNED',
  'WARRANTY',
  'RETURNED',
]

const statusTone = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  DEFECTIVE: 'danger',
  ASSIGNED: 'neutral',
  WARRANTY: 'info',
  RETURNED: 'warning',
} as const

function getSerialBadge(
  item: BackendSerialResponse,
  statusLabels: Record<BackendProductSerialStatus, string>,
  atDealerLabel: string,
): { tone: 'success' | 'danger' | 'neutral' | 'info' | 'warning'; label: string } {
  const status = item.status ?? 'AVAILABLE'
  if (status === 'AVAILABLE' && item.dealerName) {
    return { tone: 'info', label: atDealerLabel }
  }
  return { tone: statusTone[status], label: statusLabels[status] }
}

const SERIAL_FORMAT = /^[A-Z0-9][A-Z0-9-_.]{3,63}$/i

const copyByLanguage = {
  vi: {
    title: 'Serial',
    description: 'Kiểm soát import hàng loạt, truy vết chủ sở hữu và cập nhật trạng thái serial theo vòng đời.',
    searchLabel: 'Tìm serial',
    searchPlaceholder: 'Tìm serial, sản phẩm, đại lý...',
    status: 'Trạng thái',
    all: 'Tất cả',
    import: 'Import serial',
    product: 'Sản phẩm',
    serialHeader: 'Serial',
    owner: 'Sở hữu',
    warehouse: 'Kho',
    importedAt: 'Ngày nhập',
    next: 'Tiếp',
    previous: 'Trước',
    available: 'Khả dụng',
    sold: 'Đã gán',
    pending: 'đang giao',
    warranty: 'Bảo hành',
    defective: 'Hàng lỗi',
    returned: 'Trả lại',
    results: 'kết quả',
    emptyTitle: 'Không có serial phù hợp',
    emptyMessage: 'Thử đổi bộ lọc hoặc import thêm serial.',
    loadTitle: 'Không tải được serial',
    loadFallback: 'Hệ thống chưa lấy được danh sách serial.',
    importTitle: 'Import danh sách serial',
    serialList: 'Danh sách serial',
    serialsPlaceholder: 'Mỗi dòng một serial, hoặc phân cách bằng dấu phẩy.\nVí dụ:\nSN001\nSN002\nSN003',
    save: 'Thực hiện import',
    cancel: 'Hủy',
    importError: 'Vui lòng chọn sản phẩm và nhập ít nhất một serial hợp lệ.',
    formatError: 'Một số serial không đúng định dạng. Chỉ chấp nhận chữ, số, dấu gạch và tối thiểu 4 ký tự.',
    reload: 'Tải lại',
    loadingStats: 'Đang tải...',
    importSuccess: 'Import thành công {count} serial.',
    importSummary: 'Đã import {imported} serial, bỏ qua {skipped} serial.',
    skippedItemsTitle: 'Serial bị bỏ qua',
    skippedEmptySerial: '(trống)',
    skippedReason: 'Lý do',
    markDefective: 'Đánh dấu lỗi',
    markAvailable: 'Đưa về kho',
    confirmDefectiveTitle: 'Xác nhận đánh dấu hàng lỗi',
    confirmDefectiveMessage: 'Serial này sẽ bị đánh dấu là hàng lỗi và không thể phân phối cho đến khi được khôi phục.',
    confirmRepairTitle: 'Xác nhận đưa về kho',
    confirmRepairMessage: 'Serial này sẽ trở về trạng thái khả dụng và có thể phân phối lại.',
    deleteSerial: 'Xóa serial',
    confirmDeleteTitle: 'Xác nhận xóa serial',
    confirmDeleteMessage: 'Serial "{serial}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.',
    deleteSuccess: 'Đã xóa serial thành công.',
    atDealer: 'Tại đại lý',
    showQr: 'Mã QR',
    printQr: 'In mã QR',
    qrTitle: 'Mã QR Serial',
    close: 'Đóng',
    statusLabels: {
      AVAILABLE: 'Khả dụng',
      RESERVED: 'Đang giữ chỗ',
      DEFECTIVE: 'Hàng lỗi',
      ASSIGNED: 'Đã gán',
      WARRANTY: 'Bảo hành',
      RETURNED: 'Trả lại',
    } as Record<BackendProductSerialStatus, string>,
  },
  en: {
    title: 'Serials',
    description: 'Control batch imports, ownership tracing, and serial lifecycle status in one place.',
    searchLabel: 'Search serials',
    searchPlaceholder: 'Search serials, products, or dealers...',
    status: 'Status',
    all: 'All',
    import: 'Import serials',
    product: 'Product',
    serialHeader: 'Serial',
    owner: 'Owner',
    warehouse: 'Warehouse',
    importedAt: 'Imported',
    next: 'Next',
    previous: 'Previous',
    available: 'Available',
    sold: 'Assigned',
    pending: 'in transit',
    warranty: 'Warranty',
    defective: 'Defective',
    returned: 'Returned',
    results: 'results',
    emptyTitle: 'No matching serials',
    emptyMessage: 'Try another filter or import more serials.',
    loadTitle: 'Unable to load serials',
    loadFallback: 'The serial list could not be loaded.',
    importTitle: 'Import serial list',
    serialList: 'Serial list',
    serialsPlaceholder: 'One serial per line, or comma-separated.\nExample:\nSN001\nSN002\nSN003',
    save: 'Run import',
    cancel: 'Cancel',
    importError: 'Select a product and enter at least one valid serial.',
    formatError: 'Some serials are invalid. Only letters, numbers, dashes, and at least 4 characters are allowed.',
    reload: 'Reload',
    loadingStats: 'Loading...',
    importSuccess: 'Successfully imported {count} serial(s).',
    importSummary: 'Imported {imported} serial(s), skipped {skipped} serial(s).',
    skippedItemsTitle: 'Skipped serials',
    skippedEmptySerial: '(blank)',
    skippedReason: 'Reason',
    markDefective: 'Mark as defective',
    markAvailable: 'Restore to stock',
    confirmDefectiveTitle: 'Confirm mark as defective',
    confirmDefectiveMessage: 'This serial will be marked as defective and cannot be distributed until restored.',
    confirmRepairTitle: 'Confirm restore to stock',
    confirmRepairMessage: 'This serial will return to available status and can be distributed again.',
    deleteSerial: 'Delete serial',
    confirmDeleteTitle: 'Confirm delete serial',
    confirmDeleteMessage: 'Serial "{serial}" will be permanently deleted. This action cannot be undone.',
    deleteSuccess: 'Serial deleted successfully.',
    atDealer: 'At dealer',
    showQr: 'QR Code',
    printQr: 'Print QR',
    qrTitle: 'Serial QR Code',
    close: 'Close',
    statusLabels: {
      AVAILABLE: 'Available',
      RESERVED: 'Reserved',
      DEFECTIVE: 'Defective',
      ASSIGNED: 'Assigned',
      WARRANTY: 'Warranty',
      RETURNED: 'Returned',
    } as Record<BackendProductSerialStatus, string>,
  },
} as const

function SerialsPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const { products } = useProducts()
  const { confirm, confirmDialog } = useConfirmDialog()
  const [qrItem, setQrItem] = useState<BackendSerialResponse | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<BackendSerialResponse[]>([])
  const [allItems, setAllItems] = useState<BackendSerialResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | BackendProductSerialStatus>('ALL')
  const [showImport, setShowImport] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [lastImportResult, setLastImportResult] = useState<BackendSerialImportSummary<BackendSerialResponse> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== 'ALL'
  const [form, setForm] = useState({
    productId: '',
    serials: '',
  })

  const loadData = useCallback(async (nextPage: number) => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchAdminSerialsPaged(accessToken, { page: nextPage, size: 25 })
      setItems(response.items)
      setPage(response.page)
      setTotalPages(response.totalPages)
      setTotalItems(response.totalElements)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadFallback)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, copy.loadFallback])

  useEffect(() => {
    void loadData(page)
  }, [loadData, page])

  const loadAllItems = useCallback(async () => {
    if (!accessToken) return
    setIsFilterLoading(true)
    setError(null)
    try {
      const response = await fetchAllAdminSerials(accessToken, 100)
      setAllItems(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadFallback)
    } finally {
      setIsFilterLoading(false)
    }
  }, [accessToken, copy.loadFallback])

  // Always load all items so stats are always accurate across all pages
  useEffect(() => {
    void loadAllItems()
  }, [loadAllItems])

  const sourceItems = hasActiveFilters ? allItems : items

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return sourceItems.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' ? true : item.status === statusFilter
      const haystack = [
        item.serial,
        item.productName,
        item.productSku,
        item.dealerName,
        item.customerName,
        item.orderCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [query, sourceItems, statusFilter])

  const stats = useMemo(
    () => ({
      available: allItems.filter((item) => item.status === 'AVAILABLE').length,
      sold: allItems.filter((item) => item.status === 'ASSIGNED').length,
      warranty: allItems.filter((item) => item.status === 'WARRANTY').length,
      defective: allItems.filter((item) => item.status === 'DEFECTIVE').length,
      returned: allItems.filter((item) => item.status === 'RETURNED').length,
    }),
    [allItems],
  )

  const handleReload = useCallback(async () => {
    await Promise.all([loadData(page), loadAllItems()])
  }, [loadAllItems, loadData, page])

  const handleImport = async () => {
    if (!accessToken) return
    const productId = Number(form.productId)
    const serials = form.serials
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)

    if (!form.productId || Number.isNaN(productId) || productId <= 0 || serials.length === 0) {
      notify(copy.importError, { title: copy.title, variant: 'error' })
      return
    }

    if (serials.some((value) => !SERIAL_FORMAT.test(value))) {
      notify(copy.formatError, { title: copy.title, variant: 'error' })
      return
    }

    setIsImporting(true)
    try {
      const importResult = await importAdminSerials(accessToken, {
        productId,
        serials,
      })
      setLastImportResult(importResult)
      if (importResult.skippedCount === 0) {
        setForm({
          productId: '',
          serials: '',
        })
        setShowImport(false)
      } else {
        setForm((current) => ({
          ...current,
          serials: buildSkippedSerialRetryValue(importResult.skippedItems),
        }))
      }
      setPage(0)
      await Promise.all([loadData(0), loadAllItems()])
      notify(
        copy.importSummary
          .replace('{imported}', String(importResult.importedCount))
          .replace('{skipped}', String(importResult.skippedCount)),
        {
          title: copy.importTitle,
          variant: 'success',
        },
      )
    } catch (importError) {
      notify(importError instanceof Error ? importError.message : copy.loadFallback, {
        title: copy.title,
        variant: 'error',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteSerial = async (item: BackendSerialResponse) => {
    const approved = await confirm({
      title: copy.confirmDeleteTitle,
      message: copy.confirmDeleteMessage.replace('{serial}', item.serial),
      tone: 'danger',
      confirmLabel: copy.deleteSerial,
    })
    if (!approved) return
    try {
      await deleteAdminSerial(accessToken!, item.id)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      setAllItems((current) => current.filter((entry) => entry.id !== item.id))
      notify(copy.deleteSuccess, { title: copy.title, variant: 'success' })
    } catch (err) {
      notify(err instanceof Error ? err.message : copy.loadFallback, { title: copy.title, variant: 'error' })
    }
  }

  const handleSerialAction = async (item: BackendSerialResponse, next: 'DEFECTIVE' | 'AVAILABLE') => {
    const isMarkingDefective = next === 'DEFECTIVE'
    const approved = await confirm({
      title: isMarkingDefective ? copy.confirmDefectiveTitle : copy.confirmRepairTitle,
      message: isMarkingDefective ? copy.confirmDefectiveMessage : copy.confirmRepairMessage,
      tone: isMarkingDefective ? 'danger' : 'warning',
      confirmLabel: isMarkingDefective ? copy.markDefective : copy.markAvailable,
    })
    if (!approved) return
    try {
      const updated = await updateAdminSerialStatus(accessToken!, item.id, next)
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
      setAllItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
    } catch (err) {
      notify(err instanceof Error ? err.message : copy.loadFallback, { title: copy.title, variant: 'error' })
    }
  }

  const handlePrintQr = () => {
    if (!qrRef.current) return
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        body > * { visibility: hidden !important; }
        #qr-print-root, #qr-print-root * { visibility: visible !important; }
        #qr-print-root {
          position: fixed !important;
          inset: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 12px !important;
          background: white !important;
        }
      }
    `
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
  }

  if (isLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  if (error) {
    return (
      <PagePanel>
        <ErrorState title={copy.loadTitle} message={error} onRetry={() => void handleReload()} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <SearchInput
            id="serials-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:max-w-sm lg:w-72 xl:w-80"
          />
          <select
            aria-label={copy.status}
            className={`${inputClass} w-full sm:w-auto`}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | BackendProductSerialStatus)}
          >
            <option value="ALL">{copy.all}</option>
            {SERIAL_STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {copy.statusLabels[status]}
              </option>
            ))}
          </select>
          <GhostButton aria-label={copy.reload} icon={<RefreshCw className="h-4 w-4" />} onClick={() => void handleReload()} type="button">
            {copy.reload}
          </GhostButton>
          <PrimaryButton
            aria-label={copy.import}
            icon={<Upload className="h-4 w-4" />}
            onClick={() => {
              setShowImport((current) => !current)
              setLastImportResult(null)
            }}
            type="button"
          >
            {copy.import}
          </PrimaryButton>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Barcode} label={copy.available} value={isFilterLoading ? copy.loadingStats : stats.available} tone="success" />
        <StatCard icon={Barcode} label={copy.sold} value={isFilterLoading ? copy.loadingStats : stats.sold} tone="neutral" />
        <StatCard icon={Barcode} label={copy.warranty} value={isFilterLoading ? copy.loadingStats : stats.warranty} tone="info" />
        <StatCard icon={Barcode} label={copy.defective} value={isFilterLoading ? copy.loadingStats : stats.defective} tone="warning" />
        <StatCard icon={Barcode} label={copy.returned} value={isFilterLoading ? copy.loadingStats : stats.returned} tone="neutral" />
      </div>

      {/* Import form */}
      {showImport ? (
        <div className={`${formCardClass} mt-6`}>
          <p className="text-sm font-semibold text-[var(--ink)]">{copy.importTitle}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>{copy.product}</span>
              <select
                className={inputClass}
                value={form.productId}
                onChange={(event) => {
                  setForm((current) => ({ ...current, productId: event.target.value }))
                  setLastImportResult(null)
                }}
              >
                <option value="">{copy.product}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.sku}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>{copy.serialList}</span>
              <textarea
                className={textareaClass}
                placeholder={copy.serialsPlaceholder}
                value={form.serials}
                onChange={(event) => {
                  setForm((current) => ({ ...current, serials: event.target.value }))
                  setLastImportResult(null)
                }}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton className="w-full sm:w-auto" disabled={isImporting} onClick={() => void handleImport()} type="button">
              {isImporting ? `${copy.import}...` : copy.save}
            </PrimaryButton>
            <GhostButton
              className="w-full sm:w-auto"
              onClick={() => {
                setShowImport(false)
                setLastImportResult(null)
              }}
              type="button"
            >
              {copy.cancel}
            </GhostButton>
          </div>
          {lastImportResult ? (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--ink)]">
                {copy.importSummary
                  .replace('{imported}', String(lastImportResult.importedCount))
                  .replace('{skipped}', String(lastImportResult.skippedCount))}
              </p>
              {lastImportResult.skippedCount > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className={tableMetaClass}>{copy.skippedItemsTitle}</p>
                  <div className="space-y-2">
                    {lastImportResult.skippedItems.map((item, index) => (
                      <div
                        key={`${item.serial}-${index}`}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--ink)]"
                      >
                        <p className="font-medium">{item.serial || copy.skippedEmptySerial}</p>
                        <p className={tableMetaClass}>
                          {copy.skippedReason}: {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Results area */}
      <div className="mt-6">
        {/* Filter loading inline */}
        {isFilterLoading && hasActiveFilters ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{copy.loadingStats}</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState icon={Barcode} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            {/* Results count when filtering */}
            {hasActiveFilters && (
              <p className="mb-3 text-sm text-slate-500">
                {filteredItems.length} {copy.results}
              </p>
            )}

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {filteredItems.map((item) => (
                <article key={item.id} className={tableCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{item.serial}</p>
                      <p className={tableMetaClass}>{item.orderCode ?? '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title={copy.showQr}
                        onClick={() => setQrItem(item)}
                        className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                      <StatusBadge tone={getSerialBadge(item, copy.statusLabels, copy.atDealer).tone}>
                        {getSerialBadge(item, copy.statusLabels, copy.atDealer).label}
                      </StatusBadge>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.product}</span>
                      <span className="text-right text-[var(--ink)]">{item.productName ?? '-'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.owner}</span>
                      <span className="text-right text-[var(--ink)]">
                        {item.dealerName ?? (item.pendingDealerName ? <span className="text-[var(--ink-muted)] italic">{item.pendingDealerName} ({copy.pending})</span> : item.customerName ?? '-')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.importedAt}</span>
                      <span className="text-right text-[var(--ink)]">{item.importedAt ? formatDateTime(item.importedAt) : '-'}</span>
                    </div>
                  </div>
                  {item.status === 'AVAILABLE' && !item.dealerName && !item.pendingDealerName && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSerialAction(item, 'DEFECTIVE')}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {copy.markDefective}
                      </button>
                      <button
                        type="button"
                        title={copy.deleteSerial}
                        onClick={() => void handleDeleteSerial(item)}
                        className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-800 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {item.status === 'DEFECTIVE' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSerialAction(item, 'AVAILABLE')}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {copy.markAvailable}
                      </button>
                      <button
                        type="button"
                        title={copy.deleteSerial}
                        onClick={() => void handleDeleteSerial(item)}
                        className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-800 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="px-3 py-2 font-semibold">{copy.serialHeader}</th>
                    <th className="px-3 py-2 font-semibold">{copy.product}</th>
                    <th className="px-3 py-2 font-semibold">{copy.owner}</th>
                    <th className="px-3 py-2 font-semibold">{copy.status}</th>
                    <th className="px-3 py-2 font-semibold">{copy.importedAt}</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={tableRowClass}>
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">{item.serial}</p>
                        <p className={tableMetaClass}>{item.orderCode ?? '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{item.productName ?? '-'}</p>
                        <p className={tableMetaClass}>{item.productSku ?? '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        {item.dealerName
                          ? <p>{item.dealerName}</p>
                          : item.pendingDealerName
                            ? <p className="italic text-[var(--ink-muted)]">{item.pendingDealerName} <span className="text-xs">({copy.pending})</span></p>
                            : <p>-</p>
                        }
                        <p className={tableMetaClass}>{item.customerName ?? '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={getSerialBadge(item, copy.statusLabels, copy.atDealer).tone}>
                          {getSerialBadge(item, copy.statusLabels, copy.atDealer).label}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {item.importedAt ? formatDateTime(item.importedAt) : '-'}
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title={copy.showQr}
                            onClick={() => setQrItem(item)}
                            className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>
                          {item.status === 'AVAILABLE' && !item.dealerName && !item.pendingDealerName && (
                            <button
                              type="button"
                              title={copy.markDefective}
                              onClick={() => void handleSerialAction(item, 'DEFECTIVE')}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {copy.markDefective}
                            </button>
                          )}
                          {item.status === 'DEFECTIVE' && (
                            <button
                              type="button"
                              title={copy.markAvailable}
                              onClick={() => void handleSerialAction(item, 'AVAILABLE')}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              {copy.markAvailable}
                            </button>
                          )}
                          {(item.status === 'AVAILABLE' || item.status === 'DEFECTIVE') && (
                            <button
                              type="button"
                              title={copy.deleteSerial}
                              onClick={() => void handleDeleteSerial(item)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination (chỉ khi không filter) */}
      {!hasActiveFilters && (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={25}
          onPageChange={setPage}
          previousLabel={copy.previous}
          nextLabel={copy.next}
        />
      )}

      {confirmDialog}

      {/* QR Modal */}
      {qrItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setQrItem(null)}
        >
          <div
            className="relative flex w-72 flex-col items-center gap-5 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label={copy.close}
              onClick={() => setQrItem(null)}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-sm font-semibold text-[var(--ink)]">{copy.qrTitle}</p>

            <div ref={qrRef} id="qr-print-root" className="flex flex-col items-center gap-3">
              <QRCodeSVG
                value={qrItem.serial}
                size={180}
                level="H"
                marginSize={2}
              />
              <p className="text-center text-base font-bold tracking-widest text-[var(--ink)]">
                {qrItem.serial}
              </p>
              {qrItem.productName && (
                <p className="text-center text-xs text-slate-500">{qrItem.productName}</p>
              )}
              {qrItem.productSku && (
                <p className="text-center text-xs text-slate-400">SKU: {qrItem.productSku}</p>
              )}
            </div>

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={handlePrintQr}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Printer className="h-4 w-4" />
                {copy.printQr}
              </button>
              <button
                type="button"
                onClick={() => setQrItem(null)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-raised)]"
              >
                {copy.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </PagePanel>
  )
}

export default SerialsPageRevamp
