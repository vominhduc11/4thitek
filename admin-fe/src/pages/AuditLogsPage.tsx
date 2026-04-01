import { useCallback, useState } from 'react'
import {
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  inputClass,
  labelClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
} from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { fetchAdminAuditLogs, type BackendAuditLogResponse } from '../lib/adminApi'
import { formatDateTime } from '../lib/formatters'

const PAGE_SIZE = 50
const EMPTY_VALUE = '-'

type AuditFilters = {
  from: string
  to: string
  actor: string
  action: string
}

const INITIAL_FILTERS: AuditFilters = { from: '', to: '', actor: '', action: '' }

function AuditLogsPage() {
  const { accessToken } = useAuth()
  const { t } = useLanguage()
  const [logs, setLogs] = useState<BackendAuditLogResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [filters, setFilters] = useState<AuditFilters>(INITIAL_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(INITIAL_FILTERS)

  const load = useCallback(async (nextPage: number, activeFilters: AuditFilters) => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminAuditLogs(accessToken, nextPage, PAGE_SIZE, {
        from: activeFilters.from || undefined,
        to: activeFilters.to || undefined,
        actor: activeFilters.actor.trim() || undefined,
        action: activeFilters.action.trim() || undefined,
      })
      setLogs(data.items)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Không tải được nhật ký'))
    } finally {
      setLoading(false)
    }
  }, [accessToken, t])

  if (!loaded && !loading && !error) {
    void load(0, appliedFilters)
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    setPage(0)
    void load(0, filters)
  }

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS)
    setAppliedFilters(INITIAL_FILTERS)
    setPage(0)
    void load(0, INITIAL_FILTERS)
  }

  const hasActiveFilters =
    appliedFilters.from !== '' ||
    appliedFilters.to !== '' ||
    appliedFilters.actor.trim() !== '' ||
    appliedFilters.action.trim() !== ''

  const renderPagination = () =>
    totalPages > 1 ? (
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GhostButton
          className="w-full sm:w-auto"
          disabled={page <= 0}
          onClick={() => void load(page - 1, appliedFilters)}
          type="button"
        >
          {t('Trang trước')}
        </GhostButton>
        <span className="text-center text-xs text-[var(--muted)]">
          {t('Trang')} {page + 1} / {totalPages}
        </span>
        <GhostButton
          className="w-full sm:w-auto"
          disabled={page >= totalPages - 1}
          onClick={() => void load(page + 1, appliedFilters)}
          type="button"
        >
          {t('Trang sau')}
        </GhostButton>
      </div>
    ) : null

  return (
    <PagePanel>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink)]">{t('Nhật ký hệ thống')}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t('Lịch sử thao tác quản trị.')}</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1">
            <span className={labelClass}>{t('Từ ngày')}</span>
            <input
              aria-label={t('Từ ngày')}
              className={inputClass}
              max={filters.to || undefined}
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>{t('Đến ngày')}</span>
            <input
              aria-label={t('Đến ngày')}
              className={inputClass}
              min={filters.from || undefined}
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>{t('Người dùng')}</span>
            <input
              aria-label={t('Người dùng')}
              className={inputClass}
              placeholder={t('Email hoặc tên...')}
              value={filters.actor}
              onChange={(e) => setFilters((f) => ({ ...f, actor: e.target.value }))}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>{t('Hành động')}</span>
            <input
              aria-label={t('Hành động')}
              className={inputClass}
              placeholder={t('Ví dụ: UPDATE_ORDER...')}
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={handleApplyFilters}>
            {t('Áp dụng')}
          </PrimaryButton>
          {hasActiveFilters && (
            <GhostButton type="button" onClick={handleResetFilters}>
              {t('Xóa bộ lọc')}
            </GhostButton>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-6">
          <LoadingRows rows={8} />
        </div>
      )}

      {error && !loading && (
        <div className="mt-6">
          <ErrorState title={t('Không tải được nhật ký')} message={error} onRetry={() => void load(page, appliedFilters)} />
        </div>
      )}

      {!loading && !error && loaded && (
        <>
          <div className="mt-6 space-y-4 xl:hidden">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted)]">
                {t('Không có nhật ký phù hợp.')}
              </p>
            ) : (
              logs.map((log) => (
                <article key={log.id} className={tableCardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={tableMetaClass}>{t('Thời gian')}</p>
                      <p className="mt-1 font-semibold text-[var(--ink)]">
                        {log.createdAt ? formatDateTime(log.createdAt) : EMPTY_VALUE}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--ink)]">
                      {log.requestMethod || EMPTY_VALUE}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className={tableMetaClass}>{t('Hành động')}</p>
                      <p className="mt-1 font-medium text-[var(--ink)]">{log.action || EMPTY_VALUE}</p>
                    </div>
                    <div>
                      <p className={tableMetaClass}>{t('Vai trò')}</p>
                      <p className="mt-1 text-sm text-[var(--ink)]">{log.actorRole || EMPTY_VALUE}</p>
                    </div>
                    <div>
                      <p className={tableMetaClass}>{t('Người dùng')}</p>
                      <p className="mt-1 break-words text-sm text-[var(--ink)]">{log.actor || EMPTY_VALUE}</p>
                    </div>
                    <div>
                      <p className={tableMetaClass}>IP</p>
                      <p className="mt-1 break-all text-sm text-[var(--ink)]">{log.ipAddress || EMPTY_VALUE}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className={tableMetaClass}>{t('Đường dẫn')}</p>
                      <p className="mt-1 break-all font-mono text-xs text-[var(--ink)]">
                        {log.requestPath || EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className={tableMetaClass}>{t('Loại thực thể')}</p>
                      <p className="mt-1 text-sm text-[var(--ink)]">{log.entityType || EMPTY_VALUE}</p>
                    </div>
                    <div>
                      <p className={tableMetaClass}>{t('ID thực thể')}</p>
                      <p className="mt-1 break-all text-sm text-[var(--ink)]">{log.entityId || EMPTY_VALUE}</p>
                    </div>
                  </div>
                </article>
              ))
            )}
            {renderPagination()}
          </div>

          <div className="mt-6 hidden overflow-x-auto xl:block">
            <table className="min-w-[74rem] w-full text-xs">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="w-40 px-3 py-2 text-left font-semibold">{t('Thời gian')}</th>
                  <th className="min-w-44 px-3 py-2 text-left font-semibold">{t('Người dùng')}</th>
                  <th className="w-28 px-3 py-2 text-left font-semibold">{t('Vai trò')}</th>
                  <th className="min-w-36 px-3 py-2 text-left font-semibold">{t('Hành động')}</th>
                  <th className="w-24 px-3 py-2 text-left font-semibold">{t('Phương thức')}</th>
                  <th className="min-w-64 px-3 py-2 text-left font-semibold">{t('Đường dẫn')}</th>
                  <th className="w-32 px-3 py-2 text-left font-semibold">{t('Loại thực thể')}</th>
                  <th className="w-28 px-3 py-2 text-left font-semibold">{t('ID thực thể')}</th>
                  <th className="w-32 px-3 py-2 text-left font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-sm text-[var(--muted)]">
                      {t('Không có nhật ký phù hợp.')}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className={tableRowClass}>
                      <td className="rounded-l-2xl px-3 py-2 align-top whitespace-nowrap">
                        {log.createdAt ? formatDateTime(log.createdAt) : EMPTY_VALUE}
                      </td>
                      <td className="px-3 py-2 align-top">{log.actor || EMPTY_VALUE}</td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">{log.actorRole || EMPTY_VALUE}</td>
                      <td className="px-3 py-2 align-top font-medium">{log.action || EMPTY_VALUE}</td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono">
                          {log.requestMethod || EMPTY_VALUE}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top break-all font-mono">{log.requestPath || EMPTY_VALUE}</td>
                      <td className="px-3 py-2 align-top">{log.entityType || EMPTY_VALUE}</td>
                      <td className="px-3 py-2 align-top break-all">{log.entityId || EMPTY_VALUE}</td>
                      <td className="rounded-r-2xl px-3 py-2 align-top break-all">{log.ipAddress || EMPTY_VALUE}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {renderPagination()}
          </div>
        </>
      )}
    </PagePanel>
  )
}

export default AuditLogsPage
