import { Barcode, RefreshCw, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAdminSerialsPaged,
  importAdminSerials,
  updateAdminSerialStatus,
  type BackendProductSerialStatus,
  type BackendSerialResponse,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useProducts } from '../context/ProductsContext'
import { formatDateTime } from '../lib/formatters'
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  SearchInput,
  StatCard,
  StatusBadge,
  inputClass,
} from '../components/ui-kit'

const SERIAL_STATUS_OPTIONS: BackendProductSerialStatus[] = [
  'AVAILABLE',
  'DEFECTIVE',
  'SOLD',
  'WARRANTY',
  'RETURNED',
]

const serialTone: Record<BackendProductSerialStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  AVAILABLE: 'success',
  DEFECTIVE: 'danger',
  SOLD: 'neutral',
  WARRANTY: 'info',
  RETURNED: 'warning',
}

function SerialsPage() {
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const { products } = useProducts()
  const [items, setItems] = useState<BackendSerialResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | BackendProductSerialStatus>('ALL')
  const [showImport, setShowImport] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    productId: '',
    serials: '',
    status: 'AVAILABLE' as BackendProductSerialStatus,
    dealerId: '',
    customerId: '',
    orderId: '',
    warehouseId: 'main',
    warehouseName: 'Kho tong',
  })

  const loadData = async (nextPage = page) => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchAdminSerialsPaged(accessToken, { page: nextPage, size: 25 })
      setItems(response.items)
      setTotalPages(response.totalPages)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Khong tai duoc serials')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData(page)
  }, [accessToken, page])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return items.filter((item) => {
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
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
      return matchesStatus && matchesQuery
    })
  }, [items, query, statusFilter])

  const stats = useMemo(
    () => ({
      available: items.filter((item) => item.status === 'AVAILABLE').length,
      sold: items.filter((item) => item.status === 'SOLD').length,
      warranty: items.filter((item) => item.status === 'WARRANTY').length,
    }),
    [items],
  )

  const handleImport = async () => {
    if (!accessToken) return
    const productId = Number(form.productId)
    const serials = form.serials
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)

    if (Number.isNaN(productId) || serials.length === 0) {
      notify('Can chon product va nhap it nhat 1 serial', {
        title: 'Serials',
        variant: 'error',
      })
      return
    }

    setIsImporting(true)
    try {
      const imported = await importAdminSerials(accessToken, {
        productId,
        serials,
        status: form.status,
        dealerId: form.dealerId ? Number(form.dealerId) : undefined,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        orderId: form.orderId ? Number(form.orderId) : undefined,
        warehouseId: form.warehouseId.trim() || undefined,
        warehouseName: form.warehouseName.trim() || undefined,
      })
      notify(`Da import ${imported.length} serial`, {
        title: 'Serials',
        variant: 'success',
      })
      setForm({
        productId: '',
        serials: '',
        status: 'AVAILABLE',
        dealerId: '',
        customerId: '',
        orderId: '',
        warehouseId: 'main',
        warehouseName: 'Kho tong',
      })
      setShowImport(false)
      setPage(0)
      await loadData(0)
    } catch (importError) {
      notify(importError instanceof Error ? importError.message : 'Khong import duoc serials', {
        title: 'Serials',
        variant: 'error',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleStatusChange = async (id: number, status: BackendProductSerialStatus) => {
    if (!accessToken) return
    try {
      const updated = await updateAdminSerialStatus(accessToken, id, status)
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      notify(`Da cap nhat serial ${updated.serial}`, {
        title: 'Serials',
        variant: 'success',
      })
    } catch (updateError) {
      notify(updateError instanceof Error ? updateError.message : 'Khong cap nhat duoc serial', {
        title: 'Serials',
        variant: 'error',
      })
    }
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
        <ErrorState title="Khong tai duoc serials" message={error} onRetry={() => void loadData(page)} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Serial inventory</h3>
          <p className="text-sm text-slate-500">
            Import serial hang loat va theo doi trang thai serial trong toan bo he thong.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="serial-search"
            label="Search serials"
            placeholder="Tim serial, product, dealer..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-72 max-w-full"
          />
          <select
            aria-label="Serial status filter"
            className={inputClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | BackendProductSerialStatus)}
          >
            <option value="ALL">Tat ca</option>
            {SERIAL_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <GhostButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadData(page)} type="button">
            Tai lai
          </GhostButton>
          <button
            className="btn-stable inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)]"
            onClick={() => setShowImport((prev) => !prev)}
            type="button"
          >
            <Upload className="h-4 w-4" />
            Import serial
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Barcode} label="Available" value={stats.available} tone="success" />
        <StatCard icon={Barcode} label="Sold" value={stats.sold} tone="neutral" />
        <StatCard icon={Barcode} label="Warranty" value={stats.warranty} tone="info" />
      </div>

      {showImport ? (
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</span>
              <select
                className={`${inputClass} mt-2 w-full`}
                value={form.productId}
                onChange={(event) => setForm((prev) => ({ ...prev, productId: event.target.value }))}
              >
                <option value="">Chon san pham</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.sku}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</span>
              <select
                className={`${inputClass} mt-2 w-full`}
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as BackendProductSerialStatus }))
                }
              >
                {SERIAL_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700 lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Serial list</span>
              <textarea
                className="mt-2 min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Moi serial mot dong, hoac tach bang dau phay"
                value={form.serials}
                onChange={(event) => setForm((prev) => ({ ...prev, serials: event.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Warehouse ID</span>
              <input
                className={`${inputClass} mt-2 w-full`}
                value={form.warehouseId}
                onChange={(event) => setForm((prev) => ({ ...prev, warehouseId: event.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Warehouse name</span>
              <input
                className={`${inputClass} mt-2 w-full`}
                value={form.warehouseName}
                onChange={(event) => setForm((prev) => ({ ...prev, warehouseName: event.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dealer ID</span>
              <input
                className={`${inputClass} mt-2 w-full`}
                value={form.dealerId}
                onChange={(event) => setForm((prev) => ({ ...prev, dealerId: event.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Order ID</span>
              <input
                className={`${inputClass} mt-2 w-full`}
                value={form.orderId}
                onChange={(event) => setForm((prev) => ({ ...prev, orderId: event.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer ID</span>
              <input
                className={`${inputClass} mt-2 w-full`}
                value={form.customerId}
                onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <GhostButton onClick={() => setShowImport(false)} type="button">
              Huy
            </GhostButton>
            <button
              className="btn-stable inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)]"
              disabled={isImporting}
              onClick={() => void handleImport()}
              type="button"
            >
              {isImporting ? 'Dang import...' : 'Import'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Barcode}
            title="Khong co serial"
            message="Thu thay doi bo loc hoac import serial moi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Serial</th>
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Owner</th>
                  <th className="px-3 py-2 font-semibold">Warehouse</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Imported</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="rounded-2xl bg-white/80 text-sm text-slate-700 shadow-sm">
                    <td className="rounded-l-2xl px-3 py-3">
                      <p className="font-semibold text-slate-900">{item.serial}</p>
                      <p className="text-xs text-slate-500">{item.orderCode ?? 'No order'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{item.productName ?? 'N/A'}</p>
                      <p className="text-xs text-slate-500">{item.productSku ?? 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      <p>Dealer: {item.dealerName ?? 'N/A'}</p>
                      <p>Customer: {item.customerName ?? 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      <p>{item.warehouseName ?? 'N/A'}</p>
                      <p>{item.warehouseId ?? 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <StatusBadge tone={serialTone[item.status ?? 'AVAILABLE']}>
                          {item.status ?? 'AVAILABLE'}
                        </StatusBadge>
                        <select
                          aria-label={`Serial status ${item.id}`}
                          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          value={item.status ?? 'AVAILABLE'}
                          onChange={(event) =>
                            void handleStatusChange(item.id, event.target.value as BackendProductSerialStatus)
                          }
                        >
                          {SERIAL_STATUS_OPTIONS.map((status) => (
                            <option key={`${item.id}-${status}`} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3 text-xs text-slate-500">
                      {item.importedAt ? formatDateTime(item.importedAt) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>Page {page + 1} / {Math.max(totalPages, 1)}</span>
        <div className="flex items-center gap-2">
          <GhostButton disabled={page <= 0} onClick={() => setPage((prev) => Math.max(prev - 1, 0))} type="button">
            Prev
          </GhostButton>
          <GhostButton
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            type="button"
          >
            Next
          </GhostButton>
        </div>
      </div>
    </PagePanel>
  )
}

export default SerialsPage
