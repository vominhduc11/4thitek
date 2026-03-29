import { useState } from 'react'
import {
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
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

function AuditLogsPage() {
  const { accessToken } = useAuth()
  const { t } = useLanguage()
  const [logs, setLogs] = useState<BackendAuditLogResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = async (nextPage: number) => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminAuditLogs(accessToken, nextPage, PAGE_SIZE)
      setLogs(data.items)
      setPage(data.page)
      setTotalPages(data.totalPages)
      setLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Không tải được nhật ký'))
    } finally {
      setLoading(false)
    }
  }

  if (!loaded && !loading && !error) {
    void load(0)
  }

  const renderPagination = () =>
    totalPages > 1 ? (
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GhostButton
          className="w-full sm:w-auto"
          disabled={page <= 0}
          onClick={() => void load(page - 1)}
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
          onClick={() => void load(page + 1)}
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

      {loading && (
        <div className="mt-6">
          <LoadingRows rows={8} />
        </div>
      )}

      {error && !loading && (
        <div className="mt-6">
          <ErrorState title={t('Không tải được nhật ký')} message={error} onRetry={() => void load(page)} />
        </div>
      )}

      {!loading && !error && loaded && (
        <>
          <div className="mt-6 space-y-4 xl:hidden">
            {logs.map((log) => (
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
            ))}
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
                {logs.map((log) => (
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
                ))}
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
