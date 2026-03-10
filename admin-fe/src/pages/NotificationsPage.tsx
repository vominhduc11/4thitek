import { Megaphone, RefreshCw, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  createAdminNotificationDispatch,
  fetchAdminNotifications,
  type BackendNotificationCreateRequest,
  type BackendNotificationResponse,
  type BackendNotifyType,
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

const AUDIENCE_OPTIONS: BackendNotificationCreateRequest['audience'][] = [
  'DEALERS',
  'CUSTOMERS',
  'ALL_ACCOUNTS',
  'ACCOUNTS',
]

const TYPE_OPTIONS: BackendNotifyType[] = ['SYSTEM', 'PROMOTION', 'ORDER', 'WARRANTY']

const typeTone: Record<BackendNotifyType, 'neutral' | 'info' | 'warning' | 'success'> = {
  SYSTEM: 'neutral',
  PROMOTION: 'warning',
  ORDER: 'info',
  WARRANTY: 'success',
}

function NotificationsPage() {
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [items, setItems] = useState<BackendNotificationResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    audience: 'DEALERS' as BackendNotificationCreateRequest['audience'],
    type: 'SYSTEM' as BackendNotifyType,
    title: '',
    content: '',
    link: '',
    accountIdsText: '',
  })

  const loadData = async (nextPage = page) => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchAdminNotifications(accessToken, { page: nextPage, size: 25 })
      setItems(response.items)
      setTotalPages(response.totalPages)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Khong tai duoc notifications')
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
      const haystack = [item.title, item.content, item.accountName, item.accountType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return !normalizedQuery || haystack.includes(normalizedQuery)
    })
  }, [items, query])

  const stats = useMemo(
    () => ({
      total: items.length,
      unread: items.filter((item) => !item.isRead).length,
      promotions: items.filter((item) => item.type === 'PROMOTION').length,
    }),
    [items],
  )

  const handleSend = async () => {
    if (!accessToken) return
    if (!form.title.trim() || !form.content.trim()) {
      notify('Can nhap title va content truoc khi gui', {
        title: 'Notifications',
        variant: 'error',
      })
      return
    }

    const accountIds =
      form.audience === 'ACCOUNTS'
        ? form.accountIdsText
            .split(/[,\n]+/)
            .map((value) => Number(value.trim()))
            .filter((value) => Number.isFinite(value))
        : undefined

    setIsSending(true)
    try {
      const response = await createAdminNotificationDispatch(accessToken, {
        audience: form.audience,
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        link: form.link.trim() || undefined,
        accountIds,
      })
      notify(`Da gui thong bao cho ${response.recipientCount} tai khoan`, {
        title: 'Notifications',
        variant: 'success',
      })
      setForm({
        audience: 'DEALERS',
        type: 'SYSTEM',
        title: '',
        content: '',
        link: '',
        accountIdsText: '',
      })
      setPage(0)
      await loadData(0)
    } catch (sendError) {
      notify(sendError instanceof Error ? sendError.message : 'Khong gui duoc notification', {
        title: 'Notifications',
        variant: 'error',
      })
    } finally {
      setIsSending(false)
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
        <ErrorState title="Khong tai duoc notifications" message={error} onRetry={() => void loadData(page)} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Manual notifications</h3>
          <p className="text-sm text-slate-500">
            Gui thong bao chu dong cho dealer hoac customer tu admin UI.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="notification-search"
            label="Search notifications"
            placeholder="Tim title, account, content..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-72 max-w-full"
          />
          <GhostButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadData(page)} type="button">
            Tai lai
          </GhostButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Megaphone} label="Current page" value={stats.total} tone="neutral" />
        <StatCard icon={Megaphone} label="Unread" value={stats.unread} tone="warning" />
        <StatCard icon={Megaphone} label="Promotions" value={stats.promotions} tone="info" />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Audience</span>
            <select
              className={`${inputClass} mt-2 w-full`}
              value={form.audience}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  audience: event.target.value as BackendNotificationCreateRequest['audience'],
                }))
              }
            >
              {AUDIENCE_OPTIONS.map((audience) => (
                <option key={audience} value={audience}>
                  {audience}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</span>
            <select
              className={`${inputClass} mt-2 w-full`}
              value={form.type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, type: event.target.value as BackendNotifyType }))
              }
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Title</span>
            <input
              className={`${inputClass} mt-2 w-full`}
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Nhap tieu de thong bao"
            />
          </label>
          <label className="text-sm text-slate-700 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Content</span>
            <textarea
              className="mt-2 min-h-[130px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Nhap noi dung thong bao"
            />
          </label>
          <label className="text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Link</span>
            <input
              className={`${inputClass} mt-2 w-full`}
              value={form.link}
              onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
              placeholder="/account or /dealer/orders"
            />
          </label>
          {form.audience === 'ACCOUNTS' ? (
            <label className="text-sm text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Account IDs</span>
              <input
                className={`${inputClass} mt-2 w-full`}
                value={form.accountIdsText}
                onChange={(event) => setForm((prev) => ({ ...prev, accountIdsText: event.target.value }))}
                placeholder="1, 2, 3"
              />
            </label>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="btn-stable inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)]"
            disabled={isSending}
            onClick={() => void handleSend()}
            type="button"
          >
            <Send className="h-4 w-4" />
            {isSending ? 'Dang gui...' : 'Gui thong bao'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Chua co notification"
            message="Gui thong bao dau tien hoac tai them du lieu."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Title</th>
                  <th className="px-3 py-2 font-semibold">Account</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="rounded-2xl bg-white/80 text-sm text-slate-700 shadow-sm">
                    <td className="rounded-l-2xl px-3 py-3">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.content}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      <p>{item.accountName ?? 'N/A'}</p>
                      <p>{item.accountType ?? 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={typeTone[item.type ?? 'SYSTEM']}>
                        {item.type ?? 'SYSTEM'}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={item.isRead ? 'neutral' : 'warning'}>
                        {item.isRead ? 'READ' : 'UNREAD'}
                      </StatusBadge>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3 text-xs text-slate-500">
                      {item.createdAt ? formatDateTime(item.createdAt) : 'N/A'}
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

export default NotificationsPage
