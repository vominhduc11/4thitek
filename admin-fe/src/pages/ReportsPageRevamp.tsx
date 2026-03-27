import {
  Download,
  FileText,
  LineChart,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  exportAdminReport,
  type BackendReportExportType,
  type BackendReportFormat,
} from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import {
  GhostButton,
  PageHeader,
  PagePanel,
  PrimaryButton,
  StatCard,
  StatusBadge,
  softCardClass,
} from '../components/ui-kit'

type ReportDefinition = {
  type: BackendReportExportType
  title: string
  description: string
  icon: typeof ShoppingCart
}

const downloadFile = (fileName: string, blob: Blob) => {
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
    description:
      'Tải nhanh các bộ báo cáo vận hành dành cho kế toán, kho vận và hậu mãi, với phản hồi rõ ràng trong suốt quá trình xuất.',
    statsSets: 'Bộ báo cáo',
    statsFormats: 'Định dạng',
    statsReady: 'Sẵn sàng',
    readyValue: 'XLSX + PDF',
    exporting: 'Đang xuất',
    preparing: 'Đang chuẩn bị tệp',
    ready: 'Sẵn sàng tải',
    downloaded: 'Đã tải gần đây',
    queueNotice: 'Một báo cáo khác đang được xuất. Vui lòng đợi hoàn tất trước khi tải tiếp.',
    formatsHint: 'Mỗi bộ báo cáo hiện hỗ trợ hai định dạng tải nhanh.',
    success: 'Đã tải {title} ({format}).',
    xlsx: 'Tải XLSX',
    pdf: 'Tải PDF',
    reports: [
      {
        type: 'ORDERS',
        title: 'Báo cáo đơn hàng',
        description:
          'Xuất số lượng đơn, trạng thái thanh toán và số lượng sản phẩm theo từng đơn hàng.',
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
        description:
          'Xuất vòng đời bảo hành cho bộ phận hỗ trợ và hậu mãi.',
        icon: ShieldCheck,
      },
      {
        type: 'SERIALS',
        title: 'Báo cáo serial',
        description: 'Xuất trạng thái serial, chủ sở hữu và snapshot tồn kho hiện tại.',
        icon: PackageCheck,
      },
    ] as ReportDefinition[],
  },
  en: {
    title: 'Report exports',
    description:
      'Download operational exports for accounting, warehouse, and after-sales teams with clearer in-flow feedback.',
    statsSets: 'Report sets',
    statsFormats: 'Formats',
    statsReady: 'Available',
    readyValue: 'XLSX + PDF',
    exporting: 'Exporting',
    preparing: 'Preparing file',
    ready: 'Ready to download',
    downloaded: 'Downloaded recently',
    queueNotice: 'Another export is in progress. Please wait for it to finish before starting a new one.',
    formatsHint: 'Each report currently supports both quick-download formats.',
    success: 'Downloaded {title} ({format}).',
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
  const [lastCompletedJob, setLastCompletedJob] = useState<string | null>(null)

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
      downloadFile(response.fileName, response.blob)
      setLastCompletedJob(jobKey)

      const reportTitle = copy.reports.find((item) => item.type === type)?.title ?? type
      notify(
        copy.success.replace('{title}', reportTitle).replace('{format}', format),
        {
          title: copy.title,
          variant: 'success',
        },
      )
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
      <PageHeader title={copy.title} description={copy.description} />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label={copy.statsSets} value={stats.total} tone="neutral" />
        <StatCard icon={Download} label={copy.statsFormats} value={stats.formats} tone="info" />
        <StatCard icon={FileText} label={copy.statsReady} value={stats.ready} tone="success" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {copy.reports.map((report) => {
          const isCardBusy = activeJob?.startsWith(`${report.type}-`) ?? false
          const isXlsxBusy = activeJob === `${report.type}-XLSX`
          const isPdfBusy = activeJob === `${report.type}-PDF`
          const isBlockedByOtherJob = activeJob !== null && !isCardBusy
          const isRecentlyDownloaded = lastCompletedJob?.startsWith(`${report.type}-`) ?? false
          const Icon = report.icon

          return (
            <article
              key={report.type}
              aria-busy={isCardBusy}
              className={softCardClass}
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-[var(--ink)]">{report.title}</h4>
              <p className="mt-2 text-sm text-[var(--muted)]">{report.description}</p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <StatusBadge
                  tone={isCardBusy ? 'info' : isRecentlyDownloaded ? 'success' : 'neutral'}
                >
                  {isCardBusy
                    ? copy.preparing
                    : isRecentlyDownloaded
                      ? copy.downloaded
                      : copy.ready}
                </StatusBadge>
                <p className="text-xs text-[var(--muted)]">{copy.formatsHint}</p>
              </div>

              {isBlockedByOtherJob ? (
                <p className="mt-3 text-sm text-[var(--muted)]">{copy.queueNotice}</p>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton
                  className="w-full sm:w-auto"
                  disabled={activeJob !== null}
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => void handleExport(report.type, 'XLSX')}
                  type="button"
                >
                  {isXlsxBusy ? `${copy.exporting}...` : copy.xlsx}
                </PrimaryButton>
                <GhostButton
                  className="w-full sm:w-auto"
                  disabled={activeJob !== null}
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => void handleExport(report.type, 'PDF')}
                  type="button"
                >
                  {isPdfBusy ? `${copy.exporting}...` : copy.pdf}
                </GhostButton>
              </div>
            </article>
          )
        })}
      </div>
    </PagePanel>
  )
}

export default ReportsPageRevamp
