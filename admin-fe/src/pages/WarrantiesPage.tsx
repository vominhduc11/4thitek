import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAdminWarranties,
  updateAdminWarrantyStatus,
  type BackendWarrantyResponse,
  type BackendWarrantyStatus,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
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

const STATUS_OPTIONS: BackendWarrantyStatus[] = ['ACTIVE', 'EXPIRED', 'VOID']

const statusTone: Record<BackendWarrantyStatus, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  VOID: 'danger',
}

function WarrantiesPage() {
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [items, setItems] = useState<BackendWarrantyResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | BackendWarrantyStatus>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (nextPage = page) => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchAdminWarranties(accessToken, { page: nextPage, size: 25 })
      setItems(response.items)
      setTotalPages(response.totalPages)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Khong tai duoc warranties')
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
        item.warrantyCode,
        item.serial,
        item.productName,
        item.customerName,
        item.dealerName,
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
      active: items.filter((item) => item.status === 'ACTIVE').length,
      expired: items.filter((item) => item.status === 'EXPIRED').length,
      voided: items.filter((item) => item.status === 'VOID').length,
    }),
    [items],
  )

  const handleStatusChange = async (id: number, status: BackendWarrantyStatus) => {
    if (!accessToken) return
    try {
      const updated = await updateAdminWarrantyStatus(accessToken, id, status)
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      notify(`Da cap nhat ${updated.warrantyCode ?? `warranty #${updated.id}`}`, {
        title: 'Warranties',
        variant: 'success',
      })
    } catch (updateError) {
      notify(updateError instanceof Error ? updateError.message : 'Khong cap nhat duoc warranty', {
        title: 'Warranties',
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
        <ErrorState title="Khong tai duoc warranty" message={error} onRetry={() => void loadData(page)} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Warranty management</h3>
          <p className="text-sm text-slate-500">
            Quan ly bao hanh tap trung cho admin, bao gom duyet va kiem soat han bao hanh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="warranty-search"
            label="Search warranties"
            placeholder="Tim warranty, serial, customer..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-72 max-w-full"
          />
          <select
            aria-label="Warranty status filter"
            className={inputClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | BackendWarrantyStatus)}
          >
            <option value="ALL">Tat ca</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <GhostButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadData(page)} type="button">
            Tai lai
          </GhostButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={ShieldCheck} label="Active" value={stats.active} tone="success" />
        <StatCard icon={ShieldCheck} label="Expired" value={stats.expired} tone="warning" />
        <StatCard icon={ShieldCheck} label="Void" value={stats.voided} tone="warning" />
      </div>

      <div className="mt-6">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Khong co warranty"
            message="Thu thay doi bo loc hoac tai them du lieu."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Warranty</th>
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Customer</th>
                  <th className="px-3 py-2 font-semibold">Dealer</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">End</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="rounded-2xl bg-white/80 text-sm text-slate-700 shadow-sm">
                    <td className="rounded-l-2xl px-3 py-3">
                      <p className="font-semibold text-slate-900">{item.warrantyCode ?? `#${item.id}`}</p>
                      <p className="text-xs text-slate-500">Serial: {item.serial ?? 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{item.productName ?? 'N/A'}</p>
                      <p className="text-xs text-slate-500">{item.productSku ?? 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p>{item.customerName ?? 'N/A'}</p>
                      <p className="text-xs text-slate-500">{item.customerPhone ?? item.customerEmail ?? 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3">{item.dealerName ?? 'N/A'}</td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={statusTone[item.status ?? 'ACTIVE']}>
                        {item.status ?? 'ACTIVE'}
                      </StatusBadge>
                      <p className="mt-1 text-xs text-slate-500">
                        Remaining: {item.remainingDays ?? 0} days
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {item.warrantyEnd ? formatDateTime(item.warrantyEnd) : 'N/A'}
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <select
                        aria-label={`Warranty status ${item.id}`}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        value={item.status ?? 'ACTIVE'}
                        onChange={(event) =>
                          void handleStatusChange(item.id, event.target.value as BackendWarrantyStatus)
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={`${item.id}-${status}`} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
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

export default WarrantiesPage
