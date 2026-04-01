import {
  Download,
  FileText,
  LineChart,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  exportAdminReport,
  type BackendReportExportType,
  type BackendReportFormat,
} from "../lib/adminApi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import {
  GhostButton,
  PageHeader,
  PagePanel,
  PrimaryButton,
  StatCard,
  StatusBadge,
  inputClass,
  labelClass,
  softCardClass,
} from "../components/ui-kit";

type ReportDefinition = {
  type: BackendReportExportType;
  title: string;
  description: string;
  icon: typeof ShoppingCart;
};

const downloadFile = (fileName: string, blob: Blob) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const copyKeys = {
  title: "Báo cáo xuất file",
  description:
    "Tải nhanh các bộ báo cáo vận hành dành cho kế toán, kho vận và hậu mãi, với phản hồi rõ ràng trong suốt quá trình xuất.",
  statsSets: "Bộ báo cáo",
  statsFormats: "Định dạng",
  statsReady: "Sẵn sàng",
  readyValue: "XLSX + PDF",
  dateFrom: "Từ ngày",
  dateTo: "Đến ngày",
  dateRangeHint: "Để trống sẽ xuất toàn bộ dữ liệu.",
  exporting: "Đang xuất",
  preparing: "Đang chuẩn bị tệp",
  ready: "Sẵn sàng tải",
  downloaded: "Đã tải gần đây",
  queueNotice:
    "Một báo cáo khác đang được xuất. Vui lòng đợi hoàn tất trước khi tải tiếp.",
  formatsHint: "Mỗi bộ báo cáo hiện hỗ trợ hai định dạng tải nhanh.",
  success: "Đã tải {title} ({format}).",
  xlsx: "Tải XLSX",
  pdf: "Tải PDF",
  reports: [
    {
      type: "ORDERS",
      title: "Báo cáo đơn hàng",
      description:
        "Xuất số lượng đơn, trạng thái thanh toán và số lượng sản phẩm theo từng đơn hàng.",
      icon: ShoppingCart,
    },
    {
      type: "REVENUE",
      title: "Báo cáo doanh thu",
      description: "Xuất doanh thu đại lý, tiền đã thu và dư nợ còn lại.",
      icon: LineChart,
    },
    {
      type: "WARRANTIES",
      title: "Báo cáo bảo hành",
      description: "Xuất vòng đời bảo hành cho bộ phận hỗ trợ và hậu mãi.",
      icon: ShieldCheck,
    },
    {
      type: "SERIALS",
      title: "Báo cáo serial",
      description:
        "Xuất trạng thái serial, chủ sở hữu và snapshot tồn kho hiện tại.",
      icon: PackageCheck,
    },
  ] as ReportDefinition[],
} as const;

function ReportsPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [lastCompletedJob, setLastCompletedJob] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const stats = useMemo(
    () => ({
      total: copy.reports.length,
      formats: 2,
      ready: copy.readyValue,
    }),
    [copy.readyValue, copy.reports.length],
  );

  const handleExport = async (
    type: BackendReportExportType,
    format: BackendReportFormat,
  ) => {
    if (!accessToken) {
      return;
    }

    const jobKey = `${type}-${format}`;
    setActiveJob(jobKey);

    const dateRange =
      dateFrom || dateTo
        ? { from: dateFrom || undefined, to: dateTo || undefined }
        : undefined;

    try {
      const response = await exportAdminReport(accessToken, type, format, dateRange);
      downloadFile(response.fileName, response.blob);
      setLastCompletedJob(jobKey);

      const reportTitle =
        copy.reports.find((item) => item.type === type)?.title ?? type;
      notify(
        copy.success
          .replace("{title}", reportTitle)
          .replace("{format}", format),
        {
          title: copy.title,
          variant: "success",
        },
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : copy.title, {
        title: copy.title,
        variant: "error",
      });
    } finally {
      setActiveJob(null);
    }
  };

  return (
    <PagePanel>
      <PageHeader title={copy.title} subtitle={copy.description} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={FileText}
          label={copy.statsSets}
          value={stats.total}
          tone="neutral"
        />
        <StatCard
          icon={Download}
          label={copy.statsFormats}
          value={stats.formats}
          tone="info"
        />
        <StatCard
          icon={FileText}
          label={copy.statsReady}
          value={stats.ready}
          tone="success"
        />
      </div>

      <div className={`${softCardClass} mt-6`}>
        <p className="text-sm font-semibold text-[var(--ink)]">{t("Khoảng thời gian")}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{copy.dateRangeHint}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={labelClass}>{copy.dateFrom}</span>
            <input
              aria-label={copy.dateFrom}
              className={inputClass}
              max={dateTo || undefined}
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>{copy.dateTo}</span>
            <input
              aria-label={copy.dateTo}
              className={inputClass}
              min={dateFrom || undefined}
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
        </div>
      </div>

      {copy.reports.length === 0 ? (
        <p className="py-8 text-center" style={{ color: "var(--muted)" }}>
          {t("Không có dữ liệu trong kỳ này")}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {copy.reports.map((report) => {
            const isCardBusy =
              activeJob?.startsWith(`${report.type}-`) ?? false;
            const isXlsxBusy = activeJob === `${report.type}-XLSX`;
            const isPdfBusy = activeJob === `${report.type}-PDF`;
            const isBlockedByOtherJob = activeJob !== null && !isCardBusy;
            const isRecentlyDownloaded =
              lastCompletedJob?.startsWith(`${report.type}-`) ?? false;
            const Icon = report.icon;

            return (
              <article
                key={report.type}
                aria-busy={isCardBusy}
                className={softCardClass}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-4 text-base font-semibold text-[var(--ink)]">
                  {report.title}
                </h4>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {report.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge
                    tone={
                      isCardBusy
                        ? "info"
                        : isRecentlyDownloaded
                          ? "success"
                          : "neutral"
                    }
                  >
                    {isCardBusy
                      ? copy.preparing
                      : isRecentlyDownloaded
                        ? copy.downloaded
                        : copy.ready}
                  </StatusBadge>
                  <p className="text-xs text-[var(--muted)]">
                    {copy.formatsHint}
                  </p>
                </div>

                {isBlockedByOtherJob ? (
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {copy.queueNotice}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <PrimaryButton
                    className="w-full sm:w-auto"
                    disabled={activeJob !== null}
                    icon={<Download className="h-4 w-4" />}
                    onClick={() => void handleExport(report.type, "XLSX")}
                    type="button"
                  >
                    {isXlsxBusy ? `${copy.exporting}...` : copy.xlsx}
                  </PrimaryButton>
                  <GhostButton
                    className="w-full sm:w-auto"
                    disabled={activeJob !== null}
                    icon={<Download className="h-4 w-4" />}
                    onClick={() => void handleExport(report.type, "PDF")}
                    type="button"
                  >
                    {isPdfBusy ? `${copy.exporting}...` : copy.pdf}
                  </GhostButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PagePanel>
  );
}

export default ReportsPageRevamp;
