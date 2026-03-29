import { Bell, CheckCircle2, Clock3, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  PagePanel,
  SearchInput,
  StatCard,
  StatusBadge,
  inputClass,
  tableActionSelectClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
} from "../components/ui-kit";
import {
  useAdminData,
  type Dealer,
  type DealerStatus,
} from "../context/AdminDataContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  getAllowedDealerStatuses,
} from "../lib/adminLabels";
import { formatCurrency, formatDateTime } from "../lib/formatters";

const copyKeys = {
  title: "Đại lý",
  description:
    "Quản lý hồ sơ đại lý, hạn mức và trạng thái kích hoạt tài khoản.",
  searchLabel: "Tìm đại lý",
  searchPlaceholder: "Tìm theo tên, mã hoặc email...",
  totalDealers: "Tổng đại lý",
  activeDealers: "Đã kích hoạt",
  underReview: "Chờ duyệt",
  suspended: "Tạm khóa",
  totalRevenue: "Tổng doanh thu",
  emptyTitle: "Không có đại lý",
  emptyMessage: "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.",
  loadTitle: "Không thể tải đại lý",
  loadFallback: "Không tải được danh sách đại lý",
  status: "Trạng thái",
  orders: "Đơn hàng",
  revenueShort: "Doanh thu",
  credit: "Hạn mức",
  actions: "Thao tác",
  notSet: "Chưa đặt",
  confirmStatusTitle: "Xác nhận cập nhật trạng thái",
  confirmStatusMessage:
    'Bạn có chắc muốn chuyển trạng thái đại lý này sang "{status}" không?',
  updateFailed: "Không cập nhật được trạng thái đại lý",
} as const;

function DealersPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const DEALER_STATUS_OPTIONS: Array<{
    value: "all" | DealerStatus;
    label: string;
  }> = [
    { value: "all", label: t("Tất cả") },
    { value: "active", label: copy.activeDealers },
    { value: "under_review", label: copy.underReview },
    { value: "suspended", label: copy.suspended },
  ];
  const navigate = useNavigate();
  const { notify } = useToast();
  const { dealers, dealersState, updateDealerStatus, reloadResource } =
    useAdminData();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DealerStatus>("all");
  const toolbarSearchClass = "w-full sm:max-w-sm lg:w-72 xl:w-80";

  const normalizedQuery = query.trim().toLowerCase();
  const filteredDealers = useMemo(
    () =>
      dealers.filter((dealer) => {
        const matchesStatus =
          statusFilter === "all" ? true : dealer.status === statusFilter;
        const matchesSearch =
          !normalizedQuery ||
          dealer.name.toLowerCase().includes(normalizedQuery) ||
          dealer.contactName.toLowerCase().includes(normalizedQuery) ||
          dealer.id.toLowerCase().includes(normalizedQuery) ||
          dealer.email.toLowerCase().includes(normalizedQuery);
        return matchesStatus && matchesSearch;
      }),
    [dealers, normalizedQuery, statusFilter],
  );

  const handleStatusChange = async (
    dealer: Dealer,
    next: DealerStatus,
    select: HTMLSelectElement,
  ) => {
    if (next === dealer.status) {
      return;
    }

    let suspensionReason: string | undefined;
    if (next === "suspended") {
      const rawReason = window.prompt(t("Mô tả lý do..."), "");
      if (rawReason == null) {
        select.value = dealer.status;
        return;
      }
      suspensionReason = rawReason.trim();
      if (!suspensionReason) {
        notify(t("Vui lòng nhập lý do."), {
          title: copy.title,
          variant: "error",
        });
        select.value = dealer.status;
        return;
      }
    }

    const approved = await confirm({
      title: copy.confirmStatusTitle,
      message: copy.confirmStatusMessage.replace(
        "{status}",
        t(dealerStatusLabel[next]),
      ),
      tone: "warning",
      confirmLabel: t(dealerStatusLabel[next]),
    });

    if (!approved) {
      select.value = dealer.status;
      return;
    }

    try {
      await updateDealerStatus(dealer.id, next, suspensionReason);
    } catch (error) {
      notify(error instanceof Error ? error.message : copy.updateFailed, {
        title: copy.title,
        variant: "error",
      });
      select.value = dealer.status;
    }
  };

  const stats = useMemo(() => {
    const active = dealers.filter((item) => item.status === "active").length;
    const underReview = dealers.filter(
      (item) => item.status === "under_review",
    ).length;
    const attention = dealers.filter(
      (item) => item.status === "suspended",
    ).length;
    const totalRevenue = dealers.reduce((sum, item) => sum + item.revenue, 0);
    return { active, underReview, attention, totalRevenue };
  }, [dealers]);

  if (dealersState.status === "loading" || dealersState.status === "idle") {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    );
  }

  if (dealersState.status === "error") {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={dealersState.error || copy.loadFallback}
          onRetry={() => void reloadResource("dealers")}
        />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        subtitle={copy.description}
        actions={
          <>
            <SearchInput
              id="dealers-search"
              label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={toolbarSearchClass}
            />
            <select
              aria-label={copy.status}
              className={`${inputClass} w-full sm:max-w-[14rem] lg:w-56`}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | DealerStatus)
              }
              value={statusFilter}
            >
              {DEALER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label={copy.totalDealers}
          value={dealers.length}
        />
        <StatCard
          icon={CheckCircle2}
          label={copy.activeDealers}
          value={stats.active}
          tone="success"
        />
        <StatCard
          icon={Clock3}
          label={copy.underReview}
          value={stats.underReview}
          tone="info"
        />
        <StatCard
          icon={Bell}
          label={copy.suspended}
          value={stats.attention}
          tone="warning"
        />
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {copy.totalRevenue}:{" "}
        <span className="font-semibold text-[var(--accent)]">
          {formatCurrency(stats.totalRevenue)}
        </span>
      </p>

      <div className="mt-6">
        {filteredDealers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={copy.emptyTitle}
            message={copy.emptyMessage}
          />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredDealers.map((dealer) => {
                const availableTransitions =
                  dealer.allowedTransitions ??
                  getAllowedDealerStatuses(dealer.status);
                return (
                  <article key={dealer.id} className={tableCardClass}>
                    <button
                      className="w-full text-left"
                      onClick={() =>
                        navigate(`/dealers/${encodeURIComponent(dealer.id)}`)
                      }
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--ink)]">
                            {dealer.name}
                          </p>
                          <p className={tableMetaClass}>
                            {dealer.id} · {dealer.email}
                          </p>
                          <p className={tableMetaClass}>{dealer.contactName}</p>
                        </div>
                        <StatusBadge tone={dealerStatusTone[dealer.status]}>
                          {t(dealerStatusLabel[dealer.status])}
                        </StatusBadge>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-[var(--ink)]">
                        <div className="flex items-center justify-between">
                          <span className={tableMetaClass}>{copy.orders}</span>
                          <span>{dealer.orders}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={tableMetaClass}>
                            {copy.revenueShort}
                          </span>
                          <span className="font-semibold text-[var(--accent)]">
                            {formatCurrency(dealer.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={tableMetaClass}>{copy.credit}</span>
                          <span>
                            {dealer.creditLimit > 0
                              ? formatCurrency(dealer.creditLimit)
                              : copy.notSet}
                          </span>
                        </div>
                      </div>
                    </button>
                    <p className={`${tableMetaClass} mt-3`}>
                      {t(dealerStatusDescription[dealer.status])}
                    </p>
                    <select
                      aria-label={`${copy.status} ${dealer.id}`}
                      className={`mt-4 w-full ${tableActionSelectClass}`}
                      onChange={(event) =>
                        void handleStatusChange(
                          dealer,
                          event.target.value as DealerStatus,
                          event.currentTarget,
                        )
                      }
                      value={dealer.status}
                    >
                      {availableTransitions.map((status) => (
                        <option key={`${dealer.id}-${status}`} value={status}>
                          {t(dealerStatusLabel[status])}
                        </option>
                      ))}
                    </select>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[64rem] border-separate border-spacing-y-2">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="min-w-64 px-3 py-2 font-semibold">
                      {copy.title}
                    </th>
                    <th className="w-48 px-3 py-2 font-semibold">
                      {copy.status}
                    </th>
                    <th className="w-36 px-3 py-2 font-semibold">
                      {copy.orders}
                    </th>
                    <th className="px-3 py-2 font-semibold">
                      {copy.revenueShort}
                    </th>
                    <th className="w-40 px-3 py-2 font-semibold">
                      {copy.credit}
                    </th>
                    <th className="w-48 px-3 py-2 font-semibold">
                      {copy.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDealers.map((dealer) => {
                    const availableTransitions =
                      dealer.allowedTransitions ??
                      getAllowedDealerStatuses(dealer.status);
                    return (
                      <tr
                        className={tableRowClass}
                        key={dealer.id}
                        onClick={() =>
                          navigate(`/dealers/${encodeURIComponent(dealer.id)}`)
                        }
                      >
                        <td className="rounded-l-2xl px-3 py-3">
                          <p className="font-semibold text-[var(--ink)]">
                            {dealer.name}
                          </p>
                          <p className={tableMetaClass}>
                            {dealer.id} · {dealer.email}
                          </p>
                          <p className={tableMetaClass}>{dealer.contactName}</p>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge tone={dealerStatusTone[dealer.status]}>
                            {t(dealerStatusLabel[dealer.status])}
                          </StatusBadge>
                          <p className={`mt-1 ${tableMetaClass}`}>
                            {t(dealerStatusDescription[dealer.status])}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-[var(--ink)]">
                            {dealer.orders}
                          </div>
                          <div className={tableMetaClass}>
                            {formatDateTime(dealer.lastOrderAt)}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--accent)]">
                          {formatCurrency(dealer.revenue)}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--ink)]">
                          {dealer.creditLimit > 0
                            ? formatCurrency(dealer.creditLimit)
                            : copy.notSet}
                        </td>
                        <td
                          className="rounded-r-2xl px-3 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <select
                            aria-label={`${copy.status} ${dealer.id}`}
                            className={`w-full ${tableActionSelectClass}`}
                            onChange={(event) =>
                              void handleStatusChange(
                                dealer,
                                event.target.value as DealerStatus,
                                event.currentTarget,
                              )
                            }
                            value={dealer.status}
                          >
                            {availableTransitions.map((status) => (
                              <option
                                key={`${dealer.id}-${status}`}
                                value={status}
                              >
                                {t(dealerStatusLabel[status])}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {confirmDialog}
    </PagePanel>
  );
}

export default DealersPageRevamp;
