import { LifeBuoy, MessageSquareMore, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  fetchAdminSupportTickets,
  updateAdminSupportTicket,
  type BackendSupportTicketResponse,
  type BackendSupportTicketStatus,
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
  softCardClass,
} from '../components/ui-kit'

const statusTone: Record<BackendSupportTicketStatus, 'info' | 'warning' | 'success' | 'neutral'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'neutral',
}

const priorityTone: Record<string, 'neutral' | 'warning' | 'danger'> = {
  NORMAL: 'neutral',
  HIGH: 'warning',
  URGENT: 'danger',
}

const STATUS_OPTIONS: BackendSupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

function SupportTicketsPage() {
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [tickets, setTickets] = useState<BackendSupportTicketResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | BackendSupportTicketStatus>('ALL')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState<BackendSupportTicketStatus>('OPEN')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTickets = async (nextPage = page) => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchAdminSupportTickets(accessToken, { page: nextPage, size: 25 })
      setTickets(response.items)
      setTotalPages(response.totalPages)
      if (response.items.length > 0) {
        const nextSelectedId =
          response.items.find((item) => item.id === selectedId)?.id ?? response.items[0].id
        setSelectedId(nextSelectedId)
      } else {
        setSelectedId(null)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Khong tai duoc support tickets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets(page)
  }, [accessToken, page])

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'ALL' ? true : ticket.status === statusFilter
      const haystack = [
        ticket.ticketCode,
        ticket.dealerName,
        ticket.subject,
        ticket.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
      return matchesStatus && matchesQuery
    })
  }, [query, statusFilter, tickets])

  const selectedTicket =
    filteredTickets.find((ticket) => ticket.id === selectedId) ??
    tickets.find((ticket) => ticket.id === selectedId) ??
    null

  useEffect(() => {
    if (!selectedTicket) return
    setReplyDraft(selectedTicket.adminReply ?? '')
    setStatusDraft(selectedTicket.status ?? 'OPEN')
  }, [selectedTicket?.id])

  const stats = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === 'OPEN').length,
      progress: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((ticket) => ticket.status === 'RESOLVED').length,
    }),
    [tickets],
  )

  const handleSave = async () => {
    if (!accessToken || !selectedTicket) return
    setIsSaving(true)
    try {
      const updated = await updateAdminSupportTicket(accessToken, selectedTicket.id, {
        status: statusDraft,
        adminReply: replyDraft.trim() || undefined,
      })
      setTickets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      notify(`Da cap nhat ${updated.ticketCode ?? `ticket #${updated.id}`}`, {
        title: 'Support tickets',
        variant: 'success',
      })
    } catch (saveError) {
      notify(saveError instanceof Error ? saveError.message : 'Khong cap nhat duoc ticket', {
        title: 'Support tickets',
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
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
        <ErrorState title="Khong tai duoc ticket" message={error} onRetry={() => void loadTickets(page)} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Support tickets</h3>
          <p className="text-sm text-slate-500">
            Theo doi va phan hoi ticket tu dealer ngay trong admin portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="support-ticket-search"
            label="Search tickets"
            placeholder="Tim ma ticket, dealer, chu de..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-72 max-w-full"
          />
          <select
            aria-label="Ticket status filter"
            className={inputClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | BackendSupportTicketStatus)}
          >
            <option value="ALL">Tat ca</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <GhostButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadTickets(page)} type="button">
            Tai lai
          </GhostButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={LifeBuoy} label="Dang mo" value={stats.open} tone="warning" />
        <StatCard icon={MessageSquareMore} label="Dang xu ly" value={stats.progress} tone="info" />
        <StatCard icon={LifeBuoy} label="Da resolve" value={stats.resolved} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="Khong co ticket"
              message="Thu doi bo loc hoac tai them du lieu."
            />
          ) : (
            filteredTickets.map((ticket) => {
              const active = ticket.id === selectedTicket?.id
              return (
                <button
                  key={ticket.id}
                  type="button"
                  className={[
                    softCardClass,
                    'w-full text-left transition',
                    active ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]' : 'hover:border-[var(--accent)]',
                  ].join(' ')}
                  onClick={() => setSelectedId(ticket.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {ticket.ticketCode ?? `#${ticket.id}`} · {ticket.subject ?? 'No subject'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ticket.dealerName ?? 'Unknown dealer'} · {formatDateTime(ticket.createdAt ?? new Date().toISOString())}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={priorityTone[ticket.priority ?? 'NORMAL'] ?? 'neutral'}>
                        {ticket.priority ?? 'NORMAL'}
                      </StatusBadge>
                      <StatusBadge tone={statusTone[ticket.status ?? 'OPEN']}>
                        {ticket.status ?? 'OPEN'}
                      </StatusBadge>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{ticket.message ?? 'No message'}</p>
                </button>
              )
            })
          )}

          <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
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
        </div>

        <div className={softCardClass}>
          {selectedTicket ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selected ticket</p>
                <h4 className="mt-2 text-lg font-semibold text-slate-900">
                  {selectedTicket.ticketCode ?? `Ticket #${selectedTicket.id}`}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedTicket.dealerName ?? 'Unknown dealer'} · {selectedTicket.category ?? 'OTHER'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {selectedTicket.message ?? 'No message'}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</span>
                  <select
                    className={`${inputClass} mt-2 w-full`}
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value as BackendSupportTicketStatus)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Timeline</span>
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                    <p>Created: {formatDateTime(selectedTicket.createdAt ?? new Date().toISOString())}</p>
                    <p>Updated: {formatDateTime(selectedTicket.updatedAt ?? selectedTicket.createdAt ?? new Date().toISOString())}</p>
                    <p>Resolved: {selectedTicket.resolvedAt ? formatDateTime(selectedTicket.resolvedAt) : 'N/A'}</p>
                    <p>Closed: {selectedTicket.closedAt ? formatDateTime(selectedTicket.closedAt) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <label className="block text-sm text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin reply</span>
                <textarea
                  className="mt-2 min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  placeholder="Nhap noi dung phan hoi cho dealer..."
                />
              </label>

              <div className="flex justify-end">
                <button
                  className="btn-stable inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)]"
                  disabled={isSaving}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {isSaving ? 'Dang luu...' : 'Luu cap nhat'}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={MessageSquareMore}
              title="Chua chon ticket"
              message="Chon mot ticket de xem chi tiet va cap nhat phan hoi."
            />
          )}
        </div>
      </div>
    </PagePanel>
  )
}

export default SupportTicketsPage
