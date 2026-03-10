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
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { formatDateTime } from '../lib/formatters'
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
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  textareaClass,
} from '../components/ui-kit'

const AUDIENCE_OPTIONS: BackendNotificationCreateRequest['audience'][] = [
  'DEALERS',
  'CUSTOMERS',
  'ALL_ACCOUNTS',
  'ACCOUNTS',
]

const TYPE_OPTIONS: BackendNotifyType[] = ['SYSTEM', 'PROMOTION', 'ORDER', 'WARRANTY']

const typeTone = {
  SYSTEM: 'neutral',
  PROMOTION: 'warning',
  ORDER: 'info',
  WARRANTY: 'success',
} as const

const TITLE_MAX = 120
const CONTENT_MAX = 500

const copyByLanguage = {
  vi: {
    title: 'Thông báo',
    description: 'Gửi thông báo chủ động theo nhóm nhận và kiểm tra lịch sử thông báo đã phát đi.',
    searchLabel: 'Tìm thông báo',
    searchPlaceholder: 'Tìm tiêu đề, tài khoản, nội dung...',
    audience: 'Đối tượng',
    type: 'Loại',
    content: 'Nội dung',
    link: 'Liên kết',
    accountIds: 'Danh sách ID tài khoản',
    send: 'Gửi thông báo',
    currentPage: 'Trang hiện tại',
    unread: 'Chưa đọc',
    promotions: 'Khuyến mãi',
    emptyTitle: 'Chưa có thông báo',
    emptyMessage: 'Tạo thông báo đầu tiên hoặc tải lại dữ liệu.',
    loadTitle: 'Không tải được thông báo',
    loadFallback: 'Danh sách thông báo chưa thể tải.',
    createTitle: 'Tạo chiến dịch thông báo',
    titleLabel: 'Tiêu đề',
    account: 'Tài khoản',
    created: 'Tạo lúc',
    next: 'Tiếp',
    previous: 'Trước',
    statusRead: 'Đã đọc',
    statusUnread: 'Chưa đọc',
    validationError: 'Vui lòng nhập đủ tiêu đề và nội dung.',
    contentError: 'Tiêu đề hoặc nội dung vượt quá giới hạn cho phép.',
    reload: 'Tải lại',
  },
  en: {
    title: 'Notifications',
    description: 'Send targeted notifications and review dispatch history from one screen.',
    searchLabel: 'Search notifications',
    searchPlaceholder: 'Search title, account, or content...',
    audience: 'Audience',
    type: 'Type',
    content: 'Content',
    link: 'Link',
    accountIds: 'Account IDs',
    send: 'Send notification',
    currentPage: 'Current page',
    unread: 'Unread',
    promotions: 'Promotions',
    emptyTitle: 'No notifications yet',
    emptyMessage: 'Send the first notification or reload the data.',
    loadTitle: 'Unable to load notifications',
    loadFallback: 'The notification list could not be loaded.',
    createTitle: 'Create notification dispatch',
    titleLabel: 'Title',
    account: 'Account',
    created: 'Created',
    next: 'Next',
    previous: 'Previous',
    statusRead: 'Read',
    statusUnread: 'Unread',
    validationError: 'Title and content are required.',
    contentError: 'Title or content exceeds the allowed length.',
    reload: 'Reload',
  },
} as const

function NotificationsPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [items, setItems] = useState<BackendNotificationResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
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
      setPage(response.page)
      setTotalPages(response.totalPages)
      setTotalItems(response.totalElements)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadFallback)
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
      notify(copy.validationError, { title: copy.title, variant: 'error' })
      return
    }
    if (form.title.trim().length > TITLE_MAX || form.content.trim().length > CONTENT_MAX) {
      notify(copy.contentError, { title: copy.title, variant: 'error' })
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
      await createAdminNotificationDispatch(accessToken, {
        audience: form.audience,
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        link: form.link.trim() || undefined,
        accountIds,
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
      notify(sendError instanceof Error ? sendError.message : copy.loadFallback, {
        title: copy.title,
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
        <ErrorState title={copy.loadTitle} message={error} onRetry={() => void loadData(page)} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <SearchInput
            id="notifications-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-80"
          />
          <GhostButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadData(page)} type="button">
            {copy.reload}
          </GhostButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Megaphone} label={copy.currentPage} value={stats.total} tone="neutral" />
        <StatCard icon={Megaphone} label={copy.unread} value={stats.unread} tone="warning" />
        <StatCard icon={Megaphone} label={copy.promotions} value={stats.promotions} tone="info" />
      </div>

      <div className={`${formCardClass} mt-6`}>
        <p className="text-sm font-semibold text-[var(--ink)]">{copy.createTitle}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <select
            className={inputClass}
            value={form.audience}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
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
          <select
            className={inputClass}
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as BackendNotifyType }))}
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            className={`${inputClass} md:col-span-2`}
            maxLength={TITLE_MAX}
            placeholder={copy.titleLabel}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <textarea
            className={`${textareaClass} md:col-span-2`}
            maxLength={CONTENT_MAX}
            placeholder={copy.content}
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
          />
          <input
            className={inputClass}
            placeholder={copy.link}
            value={form.link}
            onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
          />
          {form.audience === 'ACCOUNTS' ? (
            <input
              className={inputClass}
              placeholder={copy.accountIds}
              value={form.accountIdsText}
              onChange={(event) => setForm((current) => ({ ...current, accountIdsText: event.target.value }))}
            />
          ) : null}
        </div>
        <p className={`mt-2 ${tableMetaClass}`}>
          {form.title.length}/{TITLE_MAX} · {form.content.length}/{CONTENT_MAX}
        </p>
        <div className="mt-4">
          <PrimaryButton disabled={isSending} icon={<Send className="h-4 w-4" />} onClick={() => void handleSend()} type="button">
            {isSending ? `${copy.send}...` : copy.send}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6">
        {filteredItems.length === 0 ? (
          <EmptyState icon={Megaphone} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredItems.map((item) => (
                <article key={item.id} className={tableCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{item.title}</p>
                      <p className={tableMetaClass}>{item.accountName ?? item.accountType ?? '-'}</p>
                    </div>
                    <StatusBadge tone={typeTone[item.type ?? 'SYSTEM']}>{item.type ?? 'SYSTEM'}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--ink)]">{item.content}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <StatusBadge tone={item.isRead ? 'neutral' : 'warning'}>
                      {item.isRead ? copy.statusRead : copy.statusUnread}
                    </StatusBadge>
                    <span className={tableMetaClass}>{item.createdAt ? formatDateTime(item.createdAt) : '-'}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="px-3 py-2 font-semibold">{copy.titleLabel}</th>
                    <th className="px-3 py-2 font-semibold">{copy.account}</th>
                    <th className="px-3 py-2 font-semibold">{copy.type}</th>
                    <th className="px-3 py-2 font-semibold">{copy.statusRead}</th>
                    <th className="px-3 py-2 font-semibold">{copy.created}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={tableRowClass}>
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">{item.title}</p>
                        <p className={`${tableMetaClass} line-clamp-2`}>{item.content}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{item.accountName ?? '-'}</p>
                        <p className={tableMetaClass}>{item.accountType ?? '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={typeTone[item.type ?? 'SYSTEM']}>{item.type ?? 'SYSTEM'}</StatusBadge>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={item.isRead ? 'neutral' : 'warning'}>
                          {item.isRead ? copy.statusRead : copy.statusUnread}
                        </StatusBadge>
                      </td>
                      <td className="rounded-r-2xl px-3 py-3 text-sm">
                        {item.createdAt ? formatDateTime(item.createdAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <PaginationNav
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={25}
        onPageChange={setPage}
        previousLabel={copy.previous}
        nextLabel={copy.next}
      />
    </PagePanel>
  )
}

export default NotificationsPageRevamp
