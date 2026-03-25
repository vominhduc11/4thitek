import { useState } from 'react'
import { PagePanel, LoadingRows, ErrorState, GhostButton, tableHeadClass, tableRowClass } from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { fetchAdminAuditLogs, type BackendAuditLogResponse } from '../lib/adminApi'
import { formatDateTime } from '../lib/formatters'

const PAGE_SIZE = 50

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
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-3 py-2 text-left font-semibold">{t('Thời gian')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('Người dùng')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('Vai trò')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('Hành động')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('Phương thức')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('Đường dẫn')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('Loại thực thể')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('ID thực thể')}</th>
                <th className="px-3 py-2 text-left font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {logs.map((log) => (
                <tr key={log.id} className={tableRowClass}>
                  <td className="rounded-l-2xl px-3 py-2 whitespace-nowrap">{log.createdAt ? formatDateTime(log.createdAt) : '—'}</td>
                  <td className="px-3 py-2">{log.actor || '—'}</td>
                  <td className="px-3 py-2">{log.actorRole || '—'}</td>
                  <td className="px-3 py-2 font-medium">{log.action || '—'}</td>
                  <td className="px-3 py-2">
                    <span className="rounded px-1.5 py-0.5 bg-[var(--surface-muted)] font-mono">
                      {log.requestMethod || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-xs truncate font-mono">{log.requestPath || '—'}</td>
                  <td className="px-3 py-2">{log.entityType || '—'}</td>
                  <td className="px-3 py-2">{log.entityId || '—'}</td>
                  <td className="rounded-r-2xl px-3 py-2">{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <GhostButton
                disabled={page <= 0}
                onClick={() => void load(page - 1)}
                type="button"
              >
                {t('Trang trước')}
              </GhostButton>
              <span className="text-xs text-[var(--muted)]">
                {t('Trang')} {page + 1} / {totalPages}
              </span>
              <GhostButton
                disabled={page >= totalPages - 1}
                onClick={() => void load(page + 1)}
                type="button"
              >
                {t('Trang sau')}
              </GhostButton>
            </div>
          )}
        </div>
      )}
    </PagePanel>
  )
}

export default AuditLogsPage
