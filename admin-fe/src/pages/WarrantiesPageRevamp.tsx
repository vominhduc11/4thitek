import { Loader2, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAllAdminWarranties,
  fetchAdminWarranties,
  updateAdminWarrantyStatus,
  type BackendWarrantyResponse,
  type BackendWarrantyStatus,
} from "../lib/adminApi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { formatDateOnly } from "../lib/formatters";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useAdminList } from "../hooks/useAdminList";
import { usePermissionGate } from "../hooks/usePermissionGate";
import { AdminTable, type AdminTableColumn } from "../components/AdminTable";
import {
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatCard,
  StatusBadge,
  inputClass,
  tableMetaClass,
} from "../components/ui-kit";

const STATUS_FILTER_OPTIONS: BackendWarrantyStatus[] = [
  "ACTIVE",
  "EXPIRED",
  "VOID",
];

const statusTone = {
  ACTIVE: "success",
  EXPIRED: "warning",
  VOID: "neutral",
} as const;

const copyKeys = {
  title: "Bảo hành",
  description:
    "Theo dõi thời hạn bảo hành, đại lý liên quan và xử lý ngoại lệ trực tiếp từ admin.",
  searchLabel: "Tìm bảo hành",
  searchPlaceholder: "Tìm mã bảo hành, serial, khách hàng, đại lý...",
  status: "Trạng thái",
  all: "Tất cả",
  active: "Đang hiệu lực",
  expired: "Hết hạn",
  voided: "Đã hủy",
  code: "Mã bảo hành",
  product: "Sản phẩm",
  customer: "Khách hàng",
  dealer: "Đại lý",
  startDate: "Ngày bắt đầu",
  endDate: "Ngày hết hạn",
  remaining: "Còn lại",
  days: "ngày",
  notAvailable: "-",
  emptyTitle: "Không có bảo hành phù hợp",
  emptyMessage: "Thử đổi bộ lọc hoặc tải lại dữ liệu.",
  loadTitle: "Không tải được bảo hành",
  loadFallback: "Hệ thống chưa lấy được danh sách bảo hành.",
  next: "Tiếp",
  previous: "Trước",
  reload: "Tải lại",
  loadingStats: "Đang tải...",
  results: "kết quả",
  voidWarranty: "Hủy bảo hành",
  confirmVoidTitle: "Xác nhận hủy bảo hành",
  confirmVoidMessage:
    'Bảo hành "{code}" sẽ bị hủy vĩnh viễn. Khách hàng sẽ mất quyền bảo hành còn lại.',
  statusLabels: {
    ACTIVE: "Đang hiệu lực",
    EXPIRED: "Hết hạn",
    VOID: "Đã hủy",
  } as Record<BackendWarrantyStatus, string>,
} as const;

const getRemainingLabel = (
  status: BackendWarrantyStatus | null | undefined,
  remainingDays: number | null | undefined,
  labels: { expired: string; days: string; notAvailable: string },
) =>
  status === "VOID"
    ? labels.notAvailable
    : status === "EXPIRED" || (remainingDays ?? 0) <= 0
      ? labels.expired
      : `${remainingDays} ${labels.days}`;

function WarrantiesPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const warrantiesWriteGate = usePermissionGate("warranties.write");
  const noPermissionTitle = t("Bạn không có quyền thực hiện thao tác này");

  // Paged source (server pagination). The paged endpoint takes no filter params,
  // so filtering runs client-side against `allItems` below.
  const fetchPage = useCallback(
    ({ page, size }: { page: number; size: number }) =>
      fetchAdminWarranties(accessToken!, { page, size }),
    [accessToken],
  );
  const {
    status: pagedStatus,
    items,
    setItems,
    pagination,
    isFetching,
    error: pagedError,
    setPage,
    refetch,
  } = useAdminList<BackendWarrantyResponse>({
    fetchPage,
    pageSize: 25,
    enabled: Boolean(accessToken),
    fallbackError: copy.loadFallback,
  });

  // Full dataset kept in parallel so stats stay accurate across all pages and
  // filtering can span the whole list, not just the current page.
  const [allItems, setAllItems] = useState<BackendWarrantyResponse[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [allItemsError, setAllItemsError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | BackendWarrantyStatus
  >("ALL");
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== "ALL";

  const loadAllItems = useCallback(async () => {
    if (!accessToken) return;
    setIsFilterLoading(true);
    setAllItemsError(null);
    try {
      const response = await fetchAllAdminWarranties(accessToken, 100);
      setAllItems(response);
    } catch (loadError) {
      setAllItemsError(
        loadError instanceof Error ? loadError.message : copy.loadFallback,
      );
    } finally {
      setIsFilterLoading(false);
    }
  }, [accessToken, copy.loadFallback]);

  // Always load all items so stats are always accurate across all pages
  useEffect(() => {
    void loadAllItems();
  }, [loadAllItems]);

  const sourceItems = hasActiveFilters ? allItems : items;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sourceItems.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;
      const haystack = [
        item.warrantyCode,
        item.serial,
        item.productName,
        item.productSku,
        item.customerName,
        item.customerEmail,
        item.customerPhone,
        item.dealerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        matchesStatus &&
        (!normalizedQuery || haystack.includes(normalizedQuery))
      );
    });
  }, [query, sourceItems, statusFilter]);

  const stats = useMemo(
    () => ({
      active: allItems.filter((item) => item.status === "ACTIVE").length,
      expired: allItems.filter((item) => item.status === "EXPIRED").length,
      voided: allItems.filter((item) => item.status === "VOID").length,
    }),
    [allItems],
  );

  const handleReload = useCallback(async () => {
    await Promise.all([refetch(), loadAllItems()]);
  }, [loadAllItems, refetch]);

  const handleVoidWarranty = async (item: BackendWarrantyResponse) => {
    const code = item.warrantyCode ?? `#${item.id}`;
    const approved = await confirm({
      title: copy.confirmVoidTitle,
      message: copy.confirmVoidMessage.replace("{code}", code),
      tone: "danger",
      confirmLabel: copy.voidWarranty,
    });
    if (!approved) return;
    try {
      const updated = await updateAdminWarrantyStatus(
        accessToken!,
        item.id,
        "VOID",
      );
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      setAllItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : copy.loadFallback, {
        title: copy.title,
        variant: "error",
      });
    }
  };

  const columns = useMemo<AdminTableColumn<BackendWarrantyResponse>[]>(
    () => [
      {
        key: "code",
        label: copy.code,
        headClassName: "w-44",
        render: (item) => (
          <>
            <p className="font-semibold text-[var(--ink)]">
              {item.warrantyCode ?? `#${item.id}`}
            </p>
            <p className={tableMetaClass}>{item.serial ?? copy.notAvailable}</p>
          </>
        ),
      },
      {
        key: "product",
        label: copy.product,
        headClassName: "min-w-44",
        render: (item) => (
          <>
            <p>{item.productName ?? copy.notAvailable}</p>
            <p className={tableMetaClass}>{item.productSku ?? ""}</p>
          </>
        ),
      },
      {
        key: "customer",
        label: copy.customer,
        headClassName: "min-w-44",
        render: (item) => (
          <>
            <p>{item.customerName ?? copy.notAvailable}</p>
            <p className={tableMetaClass}>
              {item.customerPhone ?? item.customerEmail ?? ""}
            </p>
          </>
        ),
      },
      {
        key: "dealer",
        label: copy.dealer,
        headClassName: "min-w-36",
        render: (item) => item.dealerName ?? copy.notAvailable,
      },
      {
        key: "status",
        label: copy.status,
        headClassName: "w-44",
        render: (item) => (
          <>
            <StatusBadge tone={statusTone[item.status ?? "ACTIVE"]}>
              {copy.statusLabels[item.status ?? "ACTIVE"]}
            </StatusBadge>
            <p className={`mt-1 ${tableMetaClass}`}>
              {getRemainingLabel(item.status, item.remainingDays, copy)}
            </p>
          </>
        ),
      },
      {
        key: "endDate",
        label: copy.endDate,
        headClassName: "w-44",
        className: "text-sm",
        render: (item) => (
          <>
            <p>
              {item.warrantyEnd
                ? formatDateOnly(item.warrantyEnd)
                : copy.notAvailable}
            </p>
            {item.warrantyStart && (
              <p className={tableMetaClass}>
                {copy.startDate}: {formatDateOnly(item.warrantyStart)}
              </p>
            )}
          </>
        ),
      },
    ],
    [copy],
  );

  if (pagedStatus === "idle" || pagedStatus === "loading") {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    );
  }

  const displayError = pagedError ?? allItemsError;
  if (displayError) {
    return (
      <PagePanel>
        <ErrorState
          title={t("Không tải được dữ liệu")}
          message={t("Vui lòng kiểm tra kết nối và thử lại.")}
          onRetry={() => void handleReload()}
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
              id="warranties-search"
              label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full sm:max-w-sm lg:w-72 xl:w-80"
            />
            <select
              aria-label={copy.status}
              className={`${inputClass} w-full sm:w-auto`}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "ALL" | BackendWarrantyStatus,
                )
              }
            >
              <option value="ALL">{copy.all}</option>
              {STATUS_FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {copy.statusLabels[status]}
                </option>
              ))}
            </select>
            <GhostButton
              aria-label={copy.reload}
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void handleReload()}
              type="button"
            >
              {copy.reload}
            </GhostButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={ShieldCheck}
          label={copy.active}
          value={isFilterLoading ? copy.loadingStats : stats.active}
          tone="success"
        />
        <StatCard
          icon={ShieldCheck}
          label={copy.expired}
          value={isFilterLoading ? copy.loadingStats : stats.expired}
          tone="warning"
        />
        <StatCard
          icon={ShieldCheck}
          label={copy.voided}
          value={isFilterLoading ? copy.loadingStats : stats.voided}
          tone="neutral"
        />
      </div>

      {/* Results area */}
      <div className="mt-6">
        {isFilterLoading && hasActiveFilters ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{copy.loadingStats}</span>
          </div>
        ) : (
          <>
            {hasActiveFilters && filteredItems.length > 0 && (
              <p className="mb-3 text-sm text-slate-500">
                {filteredItems.length} {copy.results}
              </p>
            )}
            <AdminTable
              columns={columns}
              rows={filteredItems}
              isFetching={isFetching}
              minWidthClass="min-w-[68rem]"
              caption={copy.title}
              emptyIcon={ShieldCheck}
              emptyTitle={copy.emptyTitle}
              emptyMessage={copy.emptyMessage}
              rowActions={(item) =>
                item.status !== "VOID" ? (
                  <button
                    type="button"
                    disabled={!warrantiesWriteGate.allowed}
                    aria-disabled={!warrantiesWriteGate.allowed || undefined}
                    title={
                      warrantiesWriteGate.allowed ? copy.voidWarranty : noPermissionTitle
                    }
                    onClick={() => void handleVoidWarranty(item)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    {copy.voidWarranty}
                  </button>
                ) : null
              }
            />
          </>
        )}
      </div>

      {/* Pagination (chỉ khi không filter) */}
      {!hasActiveFilters && (
        <PaginationNav
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          previousLabel={copy.previous}
          nextLabel={copy.next}
        />
      )}

      {confirmDialog}
    </PagePanel>
  );
}

export default WarrantiesPageRevamp;
