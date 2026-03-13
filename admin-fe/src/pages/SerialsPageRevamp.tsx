import { Barcode, RefreshCw, Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAllAdminSerials,
  fetchAdminSerialsPaged,
  importAdminSerials,
  updateAdminSerialStatus,
  type BackendProductSerialStatus,
  type BackendSerialResponse,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useProducts } from '../context/ProductsContext'
import { useToast } from '../context/ToastContext'
import { formatDateTime } from '../lib/formatters'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
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
  tableActionSelectClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  textareaClass,
} from '../components/ui-kit'

const SERIAL_STATUS_FILTER_OPTIONS: BackendProductSerialStatus[] = [
  'AVAILABLE',
  'DEFECTIVE',
  'SOLD',
  'WARRANTY',
  'RETURNED',
]

const SERIAL_IMPORT_STATUS_OPTIONS: BackendProductSerialStatus[] = [
  'AVAILABLE',
  'DEFECTIVE',
  'SOLD',
]

const SERIAL_MANUAL_STATUS_OPTIONS: BackendProductSerialStatus[] = [
  'AVAILABLE',
  'DEFECTIVE',
  'SOLD',
  'WARRANTY',
]

const getManualStatusOptions = (
  currentStatus: BackendProductSerialStatus | null | undefined,
): BackendProductSerialStatus[] => {
  if (!currentStatus || SERIAL_MANUAL_STATUS_OPTIONS.includes(currentStatus)) {
    return SERIAL_MANUAL_STATUS_OPTIONS
  }
  return [currentStatus, ...SERIAL_MANUAL_STATUS_OPTIONS]
}

const statusTone = {
  AVAILABLE: 'success',
  DEFECTIVE: 'danger',
  SOLD: 'neutral',
  WARRANTY: 'info',
  RETURNED: 'warning',
} as const

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
    owner: 'Sở hữu',
    warehouse: 'Kho',
    importedAt: 'Ngày nhập',
    next: 'Tiếp',
    previous: 'Trước',
    available: 'Khả dụng',
    sold: 'Đã bán',
    warranty: 'Bảo hành',
    emptyTitle: 'Không có serial phù hợp',
    emptyMessage: 'Thử đổi bộ lọc hoặc import thêm serial.',
    loadTitle: 'Không tải được serial',
    loadFallback: 'Hệ thống chưa lấy được danh sách serial.',
    importTitle: 'Import danh sách serial',
    serialList: 'Danh sách serial',
    warehouseId: 'Mã kho',
    warehouseName: 'Tên kho',
    dealerId: 'ID đại lý',
    orderId: 'ID đơn hàng',
    save: 'Thực hiện import',
    cancel: 'Hủy',
    confirmTitle: 'Xác nhận đổi trạng thái serial',
    confirmMessage: 'Chuyển serial này sang trạng thái "{status}"?',
    importError: 'Vui lòng chọn sản phẩm và nhập ít nhất một serial hợp lệ.',
    formatError: 'Một số serial không đúng định dạng. Chỉ chấp nhận chữ, số, dấu gạch và tối thiểu 4 ký tự.',
    reload: 'Tải lại',
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
    owner: 'Owner',
    warehouse: 'Warehouse',
    importedAt: 'Imported',
    next: 'Next',
    previous: 'Previous',
    available: 'Available',
    sold: 'Sold',
    warranty: 'Warranty',
    emptyTitle: 'No matching serials',
    emptyMessage: 'Try another filter or import more serials.',
    loadTitle: 'Unable to load serials',
    loadFallback: 'The serial list could not be loaded.',
    importTitle: 'Import serial list',
    serialList: 'Serial list',
    warehouseId: 'Warehouse ID',
    warehouseName: 'Warehouse name',
    dealerId: 'Dealer ID',
    orderId: 'Order ID',
    save: 'Run import',
    cancel: 'Cancel',
    confirmTitle: 'Confirm serial status change',
    confirmMessage: 'Change this serial to "{status}"?',
    importError: 'Select a product and enter at least one valid serial.',
    formatError: 'Some serials are invalid. Only letters, numbers, dashes, and at least 4 characters are allowed.',
    reload: 'Reload',
  },
} as const

function SerialsPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const { products } = useProducts()
  const { confirm, confirmDialog } = useConfirmDialog()
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
  const [error, setError] = useState<string | null>(null)
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== 'ALL'
  const [form, setForm] = useState({
    productId: '',
    serials: '',
    status: 'AVAILABLE' as BackendProductSerialStatus,
    dealerId: '',
    orderId: '',
    warehouseId: 'main',
    warehouseName: 'Kho tổng',
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

  useEffect(() => {
    if (!hasActiveFilters) {
      setAllItems([])
      setIsFilterLoading(false)
      setError(null)
      return
    }

    void loadAllItems()
  }, [hasActiveFilters, loadAllItems])

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
      available: sourceItems.filter((item) => item.status === 'AVAILABLE').length,
      sold: sourceItems.filter((item) => item.status === 'SOLD').length,
      warranty: sourceItems.filter((item) => item.status === 'WARRANTY').length,
    }),
    [sourceItems],
  )

  const handleReload = useCallback(async () => {
    await loadData(page)
    if (hasActiveFilters) {
      await loadAllItems()
    }
  }, [hasActiveFilters, loadAllItems, loadData, page])

  const handleImport = async () => {
    if (!accessToken) return
    const productId = Number(form.productId)
    const serials = form.serials
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)

    if (Number.isNaN(productId) || serials.length === 0) {
      notify(copy.importError, { title: copy.title, variant: 'error' })
      return
    }

    if (serials.some((value) => !SERIAL_FORMAT.test(value))) {
      notify(copy.formatError, { title: copy.title, variant: 'error' })
      return
    }

    setIsImporting(true)
    try {
      await importAdminSerials(accessToken, {
        productId,
        serials,
        status: form.status,
        dealerId: form.dealerId ? Number(form.dealerId) : undefined,
        orderId: form.orderId ? Number(form.orderId) : undefined,
        warehouseId: form.warehouseId.trim() || undefined,
        warehouseName: form.warehouseName.trim() || undefined,
      })
      setForm({
        productId: '',
        serials: '',
        status: 'AVAILABLE',
        dealerId: '',
        orderId: '',
        warehouseId: 'main',
        warehouseName: 'Kho tổng',
      })
      setShowImport(false)
      setPage(0)
      await loadData(0)
      if (hasActiveFilters) {
        await loadAllItems()
      }
    } catch (importError) {
      notify(importError instanceof Error ? importError.message : copy.loadFallback, {
        title: copy.title,
        variant: 'error',
      })
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading || isFilterLoading) {
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
                {status}
              </option>
            ))}
          </select>
          <GhostButton aria-label={copy.reload} icon={<RefreshCw className="h-4 w-4" />} onClick={() => void handleReload()} type="button">
            {copy.reload}
          </GhostButton>
          <PrimaryButton aria-label={copy.import} icon={<Upload className="h-4 w-4" />} onClick={() => setShowImport((current) => !current)} type="button">
            {copy.import}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Barcode} label={copy.available} value={stats.available} tone="success" />
        <StatCard icon={Barcode} label={copy.sold} value={stats.sold} tone="neutral" />
        <StatCard icon={Barcode} label={copy.warranty} value={stats.warranty} tone="info" />
      </div>

      {showImport ? (
        <div className={`${formCardClass} mt-6`}>
          <p className="text-sm font-semibold text-[var(--ink)]">{copy.importTitle}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>{copy.product}</span>
              <select
                className={inputClass}
                value={form.productId}
                onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}
              >
                <option value="">{copy.product}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.sku}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.status}</span>
              <select
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value as BackendProductSerialStatus }))
                }
              >
                {SERIAL_IMPORT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.warehouseId}</span>
              <input
                className={inputClass}
                value={form.warehouseId}
                onChange={(event) => setForm((current) => ({ ...current, warehouseId: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.warehouseName}</span>
              <input
                className={inputClass}
                value={form.warehouseName}
                onChange={(event) => setForm((current) => ({ ...current, warehouseName: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.dealerId}</span>
              <input
                className={inputClass}
                value={form.dealerId}
                onChange={(event) => setForm((current) => ({ ...current, dealerId: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.orderId}</span>
              <input
                className={inputClass}
                value={form.orderId}
                onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>{copy.serialList}</span>
              <textarea
                className={textareaClass}
                value={form.serials}
                onChange={(event) => setForm((current) => ({ ...current, serials: event.target.value }))}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton className="w-full sm:w-auto" disabled={isImporting} onClick={() => void handleImport()} type="button">
              {isImporting ? `${copy.import}...` : copy.save}
            </PrimaryButton>
            <GhostButton className="w-full sm:w-auto" onClick={() => setShowImport(false)} type="button">
              {copy.cancel}
            </GhostButton>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredItems.length === 0 ? (
          <EmptyState icon={Barcode} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredItems.map((item) => (
                <article key={item.id} className={tableCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{item.serial}</p>
                      <p className={tableMetaClass}>{item.orderCode ?? copy.orderId}</p>
                    </div>
                    <StatusBadge tone={statusTone[item.status ?? 'AVAILABLE']}>
                      {item.status ?? 'AVAILABLE'}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.product}</span>
                      <span className="text-right text-[var(--ink)]">{item.productName ?? '-'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.owner}</span>
                      <span className="text-right text-[var(--ink)]">{item.dealerName ?? item.customerName ?? '-'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.warehouse}</span>
                      <span className="text-right text-[var(--ink)]">{item.warehouseName ?? item.warehouseId ?? '-'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={tableMetaClass}>{copy.importedAt}</span>
                      <span className="text-right text-[var(--ink)]">{item.importedAt ? formatDateTime(item.importedAt) : '-'}</span>
                    </div>
                  </div>
                  <select
                    aria-label={`${copy.status} ${item.id}`}
                    className={`mt-4 w-full ${tableActionSelectClass}`}
                    disabled={item.status === 'RETURNED'}
                    value={item.status ?? 'AVAILABLE'}
                    onChange={async (event) => {
                      const next = event.target.value as BackendProductSerialStatus
                      if (next === item.status) return
                      const approved = await confirm({
                        title: copy.confirmTitle,
                        message: copy.confirmMessage.replace('{status}', next),
                        tone: next === 'DEFECTIVE' ? 'danger' : 'warning',
                        confirmLabel: next,
                      })
                      if (!approved) {
                        event.currentTarget.value = item.status ?? 'AVAILABLE'
                        return
                      }
                      try {
                        const updated = await updateAdminSerialStatus(accessToken!, item.id, next)
                        setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
                        setAllItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
                      } catch (updateError) {
                        notify(updateError instanceof Error ? updateError.message : copy.loadFallback, {
                          title: copy.title,
                          variant: 'error',
                        })
                      }
                    }}
                  >
                    {getManualStatusOptions(item.status).map((status) => (
                      <option key={`${item.id}-${status}`} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="px-3 py-2 font-semibold">Serial</th>
                    <th className="px-3 py-2 font-semibold">{copy.product}</th>
                    <th className="px-3 py-2 font-semibold">{copy.owner}</th>
                    <th className="px-3 py-2 font-semibold">{copy.warehouse}</th>
                    <th className="px-3 py-2 font-semibold">{copy.status}</th>
                    <th className="px-3 py-2 font-semibold">{copy.importedAt}</th>
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
                        <p>{item.dealerName ?? '-'}</p>
                        <p className={tableMetaClass}>{item.customerName ?? '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{item.warehouseName ?? '-'}</p>
                        <p className={tableMetaClass}>{item.warehouseId ?? '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={statusTone[item.status ?? 'AVAILABLE']}>
                          {item.status ?? 'AVAILABLE'}
                        </StatusBadge>
                        <select
                          aria-label={`${copy.status} ${item.id}`}
                          className={`mt-2 w-full ${tableActionSelectClass}`}
                          disabled={item.status === 'RETURNED'}
                          value={item.status ?? 'AVAILABLE'}
                          onChange={async (event) => {
                            const next = event.target.value as BackendProductSerialStatus
                            if (next === item.status) return
                            const approved = await confirm({
                              title: copy.confirmTitle,
                              message: copy.confirmMessage.replace('{status}', next),
                              tone: next === 'DEFECTIVE' ? 'danger' : 'warning',
                              confirmLabel: next,
                            })
                            if (!approved) {
                              event.currentTarget.value = item.status ?? 'AVAILABLE'
                              return
                            }
                      try {
                        const updated = await updateAdminSerialStatus(accessToken!, item.id, next)
                        setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
                        setAllItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
                      } catch (updateError) {
                        notify(updateError instanceof Error ? updateError.message : copy.loadFallback, {
                          title: copy.title,
                                variant: 'error',
                              })
                            }
                          }}
                        >
                          {getManualStatusOptions(item.status).map((status) => (
                            <option key={`${item.id}-${status}`} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="rounded-r-2xl px-3 py-3 text-sm">
                        {item.importedAt ? formatDateTime(item.importedAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!hasActiveFilters ? (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={25}
          onPageChange={setPage}
          previousLabel={copy.previous}
          nextLabel={copy.next}
        />
      ) : null}
      {confirmDialog}
    </PagePanel>
  )
}

export default SerialsPageRevamp
