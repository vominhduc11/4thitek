import { Bell, CheckCircle2, Clock3, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ErrorState,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatCard,
  StatusBadge,
  inputClass,
  tableActionSelectClass,
  tableMetaClass,
} from "../components/ui-kit";
import { AdminTable, type AdminTableColumn } from "../components/AdminTable";
import { useAdminData, type Dealer, type DealerStatus } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useAdminList } from "../hooks/useAdminList";
import { usePermissionGate } from "../hooks/usePermissionGate";
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  resolveAllowedDealerStatuses,
} from "../lib/adminLabels";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import {
  fetchAdminDealerAccountsPaged,
  fetchAdminDealerAccountSummary,
} from "../lib/adminApi";
import { mapDealer, toBackendDealerAccountStatus } from "../lib/adminDataMappers";
import { translateCopy } from "../lib/i18n";

const PAGE_SIZE = 25;

const copyKeys = {
  title: "Đại lý",
  description: "Quản lý hồ sơ đại lý, doanh thu và trạng thái kích hoạt tài khoản.",
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
  actions: "Thao tác",
  detail: "Xem chi tiết",
  confirmStatusTitle: "Xác nhận cập nhật trạng thái",
  confirmStatusMessage: 'Bạn có chắc muốn chuyển trạng thái đại lý này sang "{status}" không?',
  updateFailed: "Không cập nhật được trạng thái đại lý",
  suspensionReasonLabel: "Lý do tạm khóa",
  suspensionReasonPlaceholder: "Nhập lý do tạm khóa đại lý...",
  allStatuses: "Tất cả",
  previousLabel: "Trước",
  nextLabel: "Tiếp",
} as const;

function DealersPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const dealerStatusOptions: Array<{ value: "all" | DealerStatus; label: string }> = [
    { value: "all", label: copy.allStatuses },
    { value: "active", label: copy.activeDealers },
    { value: "under_review", label: copy.underReview },
    { value: "suspended", label: copy.suspended },
  ];
  const { notify } = useToast();
  const { accessToken } = useAuth();
  const { updateDealerStatus } = useAdminData();
  const { confirm, prompt, confirmDialog, promptDialog } = useConfirmDialog();
  const dealersWriteGate = usePermissionGate("dealers.write");

  const [stats, setStats] = useState({ total: 0, active: 0, underReview: 0, suspended: 0, totalRevenue: 0 });
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DealerStatus>("all");
  const toolbarSearchClass = "w-full sm:max-w-sm lg:w-72 xl:w-80";
  const summaryRequestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Server-side filtering: status/query are sent to the backend, so a filter
  // change reloads from page 0 (see the effect below).
  const fetchPage = useCallback(
    async ({ page, size }: { page: number; size: number }) => {
      const response = await fetchAdminDealerAccountsPaged(accessToken!, {
        page,
        size,
        status:
          statusFilter === "all"
            ? undefined
            : toBackendDealerAccountStatus(statusFilter),
        query: debouncedQuery || undefined,
      });
      return {
        items: response.items.map(mapDealer),
        page: response.page,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      };
    },
    [accessToken, debouncedQuery, statusFilter],
  );
  const {
    status: pagedStatus,
    items: dealers,
    pagination,
    isFetching,
    error,
    setPage,
    refetch,
  } = useAdminList<Dealer>({
    fetchPage,
    pageSize: PAGE_SIZE,
    enabled: Boolean(accessToken),
    fallbackError: copy.loadFallback,
    // A filter change jumps back to page 0 and reloads (handled by the hook).
    resetKey: `${statusFilter}|${debouncedQuery}`,
  });

  const loadSummary = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const requestId = ++summaryRequestIdRef.current;
    try {
      const summary = await fetchAdminDealerAccountSummary(accessToken);
      if (summaryRequestIdRef.current !== requestId) {
        return;
      }
      setStats({
        total: Number(summary.total ?? 0),
        active: Number(summary.active ?? 0),
        underReview: Number(summary.underReview ?? 0),
        suspended: Number(summary.suspended ?? 0),
        totalRevenue: Number(summary.totalRevenue ?? 0),
      });
    } catch {
      if (summaryRequestIdRef.current !== requestId) {
        return;
      }
      setStats({ total: 0, active: 0, underReview: 0, suspended: 0, totalRevenue: 0 });
    }
  }, [accessToken]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const reloadAll = useCallback(async () => {
    await Promise.all([refetch(), loadSummary()]);
  }, [refetch, loadSummary]);

  const handleStatusUpdate = async (dealer: Dealer, next: DealerStatus, revert: () => void) => {
    if (next === dealer.status) {
      return;
    }

    let reason: string | undefined;
    if (next === "suspended") {
      const input = await prompt({
        title: copy.confirmStatusTitle,
        message: copy.confirmStatusMessage.replace("{status}", t(dealerStatusLabel[next])),
        tone: "danger",
        confirmLabel: t(dealerStatusLabel[next]),
        inputLabel: copy.suspensionReasonLabel,
        inputPlaceholder: copy.suspensionReasonPlaceholder,
      });
      if (input === null) {
        revert();
        return;
      }
      reason = input;
    } else {
      const approved = await confirm({
        title: copy.confirmStatusTitle,
        message: copy.confirmStatusMessage.replace("{status}", t(dealerStatusLabel[next])),
        tone: "warning",
        confirmLabel: t(dealerStatusLabel[next]),
      });
      if (!approved) {
        revert();
        return;
      }
    }

    try {
      await updateDealerStatus(dealer.id, next, reason);
      await reloadAll();
    } catch (updateError) {
      notify(updateError instanceof Error ? updateError.message : copy.updateFailed, {
        title: copy.title,
        variant: "error",
      });
      revert();
    }
  };

  const columns: AdminTableColumn<Dealer>[] = [
    {
      key: "dealer",
      label: copy.title,
      render: (dealer) => (
        <>
          <p className="font-semibold text-[var(--ink)]">
            <Link
              className="rounded-md underline-offset-4 transition hover:text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              to={`/dealers/${encodeURIComponent(dealer.id)}`}
            >
              {dealer.name}
            </Link>
          </p>
          <p className={tableMetaClass}>
            {dealer.id} · {dealer.email}
          </p>
          <p className={tableMetaClass}>{dealer.contactName}</p>
        </>
      ),
    },
    {
      key: "status",
      label: copy.status,
      render: (dealer) => (
        <>
          <StatusBadge tone={dealerStatusTone[dealer.status]}>
            {t(dealerStatusLabel[dealer.status])}
          </StatusBadge>
          <p className={`mt-1 ${tableMetaClass}`}>
            {t(dealerStatusDescription[dealer.status])}
          </p>
        </>
      ),
    },
    {
      key: "orders",
      label: copy.orders,
      render: (dealer) => (
        <>
          <div className="text-sm text-[var(--ink)]">{dealer.orders}</div>
          <div className={tableMetaClass}>{formatDateTime(dealer.lastOrderAt)}</div>
        </>
      ),
    },
    {
      key: "revenue",
      label: copy.revenueShort,
      className: "font-semibold text-[var(--accent)]",
      render: (dealer) => formatCurrency(dealer.revenue),
    },
  ];

  const renderRowActions = (dealer: Dealer) => (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        to={`/dealers/${encodeURIComponent(dealer.id)}`}
      >
        {copy.detail}
      </Link>
      <select
        {...dealersWriteGate.disabledProps}
        aria-label={`${copy.status} ${dealer.id}`}
        className={`w-full sm:w-auto ${tableActionSelectClass}`}
        onChange={(event) =>
          void handleStatusUpdate(
            dealer,
            event.target.value as DealerStatus,
            () => {
              event.currentTarget.value = dealer.status;
            },
          )
        }
        value={dealer.status}
      >
        {resolveAllowedDealerStatuses(dealer.status, dealer.allowedTransitions).map(
          (status) => (
            <option key={`${dealer.id}-${status}`} value={status}>
              {t(dealerStatusLabel[status])}
            </option>
          ),
        )}
      </select>
    </div>
  );

  if (pagedStatus === "idle" || pagedStatus === "loading") {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    );
  }

  if (error) {
    return (
      <PagePanel>
        <ErrorState title={copy.loadTitle} message={error} onRetry={() => void reloadAll()} />
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
              onChange={(event) => setStatusFilter(event.target.value as "all" | DealerStatus)}
              value={statusFilter}
            >
              {dealerStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={copy.totalDealers} value={stats.total} />
        <StatCard icon={CheckCircle2} label={copy.activeDealers} value={stats.active} tone="success" />
        <StatCard icon={Clock3} label={copy.underReview} value={stats.underReview} tone="info" />
        <StatCard icon={Bell} label={copy.suspended} value={stats.suspended} tone="warning" />
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {copy.totalRevenue}: <span className="font-semibold text-[var(--accent)]">{formatCurrency(stats.totalRevenue)}</span>
      </p>

      <div className="mt-6">
        <AdminTable
          columns={columns}
          rows={dealers}
          isFetching={isFetching}
          rowClassName={() => "cursor-default"}
          rowActions={renderRowActions}
          minWidthClass="min-w-full"
          caption={copy.title}
          emptyIcon={Users}
          emptyTitle={copy.emptyTitle}
          emptyMessage={copy.emptyMessage}
        />
        {dealers.length > 0 && (
          <PaginationNav
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            previousLabel={copy.previousLabel}
            nextLabel={copy.nextLabel}
          />
        )}
      </div>
      {confirmDialog}
      {promptDialog}
    </PagePanel>
  );
}

export default DealersPageRevamp;
