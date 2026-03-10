import { Download, FileText, LineChart, PackageCheck, ShieldCheck, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  exportAdminReport,
  type BackendReportExportType,
  type BackendReportFormat,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { PagePanel, PrimaryButton, StatCard, bodyTextClass, cardTitleClass, softCardClass } from '../components/ui-kit'

type ReportDefinition = {
  type: BackendReportExportType
  title: string
  description: string
  icon: typeof ShoppingCart
}

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

const copyByLanguage = {
  vi: {
    title: 'Báo cáo xuất file',
    description: 'Tải các báo cáo vận hành dành cho kế toán, kho vận và chăm sóc sau bán.',
    statsSets: 'Bộ báo cáo',
    statsFormats: 'Định dạng',
    statsReady: 'Sẵn sàng',
    readyValue: 'XLSX + PDF',
    exporting: 'Đang xuất',
    xlsx: 'Tải XLSX',
    pdf: 'Tải PDF',
    reports: [
      {
        type: 'ORDERS',
        title: 'Báo cáo đơn hàng',
        description: 'Xuất số lượng đơn, trạng thái thanh toán và số lượng sản phẩm theo đơn.',
        icon: ShoppingCart,
      },
      {
        type: 'REVENUE',
        title: 'Báo cáo doanh thu',
        description: 'Xuất doanh thu đại lý, tiền đã thu và dư nợ còn lại.',
        icon: LineChart,
      },
      {
        type: 'WARRANTIES',
        title: 'Báo cáo bảo hành',
        description: 'Xuất vòng đời bảo hành cho bộ phận hỗ trợ và hậu mãi.',
        icon: ShieldCheck,
      },
      {
        type: 'SERIALS',
        title: 'Báo cáo serial',
        description: 'Xuất trạng thái serial, chủ sở hữu và snapshot kho hiện tại.',
        icon: PackageCheck,
      },
    ] as ReportDefinition[],
  },
  en: {
    title: 'Report exports',
    description: 'Download operational exports for accounting, warehouse, and after-sales teams.',
    statsSets: 'Report sets',
    statsFormats: 'Formats',
    statsReady: 'Available',
    readyValue: 'XLSX + PDF',
    exporting: 'Exporting',
    xlsx: 'Download XLSX',
    pdf: 'Download PDF',
    reports: [
      {
        type: 'ORDERS',
        title: 'Orders report',
        description: 'Export order volume, payment status, and item counts per order.',
        icon: ShoppingCart,
      },
      {
        type: 'REVENUE',
        title: 'Revenue report',
        description: 'Export dealer revenue, paid amount, and outstanding balance.',
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
        title: 'Serial report',
        description: 'Export serial status, ownership, and warehouse snapshots.',
        icon: PackageCheck,
      },
    ] as ReportDefinition[],
  },
} as const

function ReportsPageRevamp() {
  const { language } = useLanguage()
  const copy = copyByLanguage[language]
  const { accessToken } = useAuth()
  const { notify } = useToast()
  const [activeJob, setActiveJob] = useState<string | null>(null)

  const stats = useMemo(
    () => ({
      total: copy.reports.length,
      formats: 2,
      ready: copy.readyValue,
    }),
    [copy.readyValue, copy.reports.length],
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
    } catch (error) {
      notify(error instanceof Error ? error.message : copy.title, {
        title: copy.title,
        variant: 'error',
      })
    } finally {
      setActiveJob(null)
    }
  }

  return (
    <PagePanel>
      <div>
        <h3 className={cardTitleClass}>{copy.title}</h3>
        <p className={bodyTextClass}>{copy.description}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label={copy.statsSets} value={stats.total} tone="neutral" />
        <StatCard icon={Download} label={copy.statsFormats} value={stats.formats} tone="info" />
        <StatCard icon={FileText} label={copy.statsReady} value={stats.ready} tone="success" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {copy.reports.map((report) => {
          const Icon = report.icon
          return (
            <article key={report.type} className={softCardClass}>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-[var(--ink)]">{report.title}</h4>
              <p className="mt-2 text-sm text-[var(--muted)]">{report.description}</p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton
                  className="w-full sm:w-auto"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => void handleExport(report.type, 'XLSX')}
                  disabled={activeJob !== null}
                  type="button"
                >
                  {activeJob === `${report.type}-XLSX` ? `${copy.exporting}...` : copy.xlsx}
                </PrimaryButton>
                <PrimaryButton
                  className="w-full bg-slate-900 shadow-[0_16px_30px_rgba(15,23,42,0.22)] hover:bg-slate-800 sm:w-auto"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => void handleExport(report.type, 'PDF')}
                  disabled={activeJob !== null}
                  type="button"
                >
                  {activeJob === `${report.type}-PDF` ? `${copy.exporting}...` : copy.pdf}
                </PrimaryButton>
              </div>
            </article>
          )
        })}
      </div>
    </PagePanel>
  )
}

export default ReportsPageRevamp
