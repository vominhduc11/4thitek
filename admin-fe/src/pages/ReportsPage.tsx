import { Download, FileText, LineChart, PackageCheck, ShieldCheck, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  exportAdminReport,
  type BackendReportExportType,
  type BackendReportFormat,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  EmptyState,
  PagePanel,
  PrimaryButton,
  StatCard,
  softCardClass,
} from '../components/ui-kit'

type ReportDefinition = {
  type: BackendReportExportType
  title: string
  description: string
  icon: typeof ShoppingCart
}

const REPORTS: ReportDefinition[] = [
  {
    type: 'ORDERS',
    title: 'Orders report',
    description: 'Export order volume, payment state, and item counts for operations.',
    icon: ShoppingCart,
  },
  {
    type: 'REVENUE',
    title: 'Revenue report',
    description: 'Export dealer revenue, paid amount, and outstanding balance summary.',
    icon: LineChart,
  },
  {
    type: 'WARRANTIES',
    title: 'Warranty report',
    description: 'Export warranty lifecycle data for support and after-sales teams.',
    icon: ShieldCheck,
  },
  {
    type: 'SERIALS',
    title: 'Serial inventory report',
    description: 'Export serial ownership, status, and warehouse assignment snapshots.',
    icon: PackageCheck,
  },
]

const decodeBase64 = (value: string) => {
  const raw = window.atob(value)
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index)
  }
  return bytes
}

const downloadFile = (fileName: string, contentType: string, content: string) => {
  const blob = new Blob([decodeBase64(content)], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function ReportsPage() {
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [activeJob, setActiveJob] = useState<string | null>(null)

  const stats = useMemo(
    () => ({
      total: REPORTS.length,
      formats: 2,
      ready: 'XLSX + PDF',
    }),
    [],
  )

  const handleExport = async (type: BackendReportExportType, format: BackendReportFormat) => {
    if (!accessToken) {
      return
    }

    const jobKey = `${type}-${format}`
    setActiveJob(jobKey)

    try {
      const response = await exportAdminReport(accessToken, type, format)
      downloadFile(response.fileName, response.contentType, response.content)
      notify(`Downloaded ${response.fileName}`, {
        title: 'Reports',
        variant: 'success',
      })
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not export report', {
        title: 'Reports',
        variant: 'error',
      })
    } finally {
      setActiveJob(null)
    }
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Reports export</h3>
          <p className="text-sm text-slate-500">
            Download operational exports for accounting, warehouse, and support teams.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label="Report sets" value={stats.total} tone="neutral" />
        <StatCard icon={Download} label="Formats" value={stats.formats} tone="info" />
        <StatCard icon={FileText} label="Available now" value={stats.ready} tone="success" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <article key={report.type} className={softCardClass}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-base font-semibold text-slate-900">{report.title}</h4>
                  <p className="mt-2 text-sm text-slate-500">{report.description}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <PrimaryButton
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => void handleExport(report.type, 'XLSX')}
                  disabled={activeJob !== null}
                  type="button"
                >
                  {activeJob === `${report.type}-XLSX` ? 'Exporting XLSX...' : 'Download XLSX'}
                </PrimaryButton>
                <PrimaryButton
                  className="bg-slate-900 shadow-[0_16px_30px_rgba(15,23,42,0.22)] hover:bg-slate-800"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => void handleExport(report.type, 'PDF')}
                  disabled={activeJob !== null}
                  type="button"
                >
                  {activeJob === `${report.type}-PDF` ? 'Exporting PDF...' : 'Download PDF'}
                </PrimaryButton>
              </div>
            </article>
          )
        })}
      </div>

      {REPORTS.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="No reports configured"
            message="Add at least one export definition before using this screen."
          />
        </div>
      ) : null}
    </PagePanel>
  )
}

export default ReportsPage
