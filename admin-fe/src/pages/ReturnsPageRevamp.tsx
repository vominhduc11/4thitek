import { ClipboardCheck, Filter, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatusBadge,
  inputClass,
  tableMetaClass,
  toolbarCardClass,
  toolbarGroupClass,
} from "../components/ui-kit";
import { AdminTable, type AdminTableColumn } from "../components/AdminTable";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAdminList } from "../hooks/useAdminList";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  fetchAdminReturnsPaged,
  type BackendReturnRequestStatus,
  type BackendReturnRequestSummaryResponse,
  type BackendReturnRequestType,
} from "../lib/adminApi";
import { formatDateTime } from "../lib/formatters";
import { returnRequestStatusLabel, returnRequestTypeLabel } from "../lib/adminLabels";

const STATUS_OPTIONS: BackendReturnRequestStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "AWAITING_RECEIPT",
  "RECEIVED",
  "INSPECTING",
  "PARTIALLY_RESOLVED",
  "COMPLETED",
  "CANCELLED",
];

const TYPE_OPTIONS: BackendReturnRequestType[] = [
  "COMMERCIAL_RETURN",
  "DEFECTIVE_RETURN",
  "WARRANTY_RMA",
];

const statusTone: Record<
  BackendReturnRequestStatus,
  "neutral" | "warning" | "info" | "success" | "danger"
> = {
  SUBMITTED: "warning",
  UNDER_REVIEW: "info",
  APPROVED: "success",
  REJECTED: "danger",
  AWAITING_RECEIPT: "info",
  RECEIVED: "info",
  INSPECTING: "warning",
  PARTIALLY_RESOLVED: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

const statusLabel = (status?: BackendReturnRequestStatus | null) => {
  if (!status) return "-";
  return returnRequestStatusLabel[status] ?? status.replaceAll("_", " ");
};

const typeLabel = (type?: BackendReturnRequestType | null) => {
  if (!type) return "-";
  return returnRequestTypeLabel[type] ?? type.replaceAll("_", " ");
};

const resolvedCount = (item: BackendReturnRequestSummaryResponse) =>
  item.resolvedItems ??
  (item.approvedItems ?? 0) + (item.rejectedItems ?? 0);

const filterInputClass = `${inputClass} w-full sm:w-auto`;

type FilterToolbarProps = {
  status: BackendReturnRequestStatus | "ALL";
  setStatus: (value: BackendReturnRequestStatus | "ALL") => void;
  type: BackendReturnRequestType | "ALL";
  setType: (value: BackendReturnRequestType | "ALL") => void;
  dealerInput: string;
  setDealerInput: (value: string) => void;
  orderCodeInput: string;
  setOrderCodeInput: (value: string) => void;
  serialInput: string;
  setSerialInput: (value: string) => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (value: boolean) => void;
  hasActiveFilters: boolean;
  onReload: () => void;
  onReset: () => void;
};

const FilterToolbar = ({
  status,
  setStatus,
  type,
  setType,
  dealerInput,
  setDealerInput,
  orderCodeInput,
  setOrderCodeInput,
  serialInput,
  setSerialInput,
  isFiltersOpen,
  setIsFiltersOpen,
  hasActiveFilters,
  onReload,
  onReset,
}: FilterToolbarProps) => (
  <section className={toolbarCardClass} aria-label="Return filters">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Filters
        </p>
        <p className="text-sm text-[var(--muted)]">
          Narrow by dealer, order, serial, status, and return type.
        </p>
      </div>
      <GhostButton
        type="button"
        icon={<Filter className="h-4 w-4" />}
        className="sm:hidden"
        aria-expanded={isFiltersOpen}
        aria-controls="returns-filter-fields"
        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
      >
        {isFiltersOpen ? "Hide" : "Show"}
      </GhostButton>
    </div>

    <div
      id="returns-filter-fields"
      className={`w-full gap-2 ${isFiltersOpen ? "flex flex-col" : "hidden sm:flex sm:flex-col"}`}
    >
      <div className={toolbarGroupClass}>
        <SearchInput
          id="returns-dealer-search"
          label="Dealer"
          placeholder="Dealer"
          value={dealerInput}
          onChange={(event) => setDealerInput(event.target.value)}
          className="w-full sm:max-w-[13rem]"
        />
        <SearchInput
          id="returns-order-search"
          label="Order code"
          placeholder="Order code"
          value={orderCodeInput}
          onChange={(event) => setOrderCodeInput(event.target.value)}
          className="w-full sm:max-w-[12rem]"
        />
        <SearchInput
          id="returns-serial-search"
          label="Serial"
          placeholder="Serial"
          value={serialInput}
          onChange={(event) => setSerialInput(event.target.value)}
          className="w-full sm:max-w-[12rem]"
        />
      </div>
      <div className={toolbarGroupClass}>
        <select
          aria-label="Return status filter"
          className={filterInputClass}
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as BackendReturnRequestStatus | "ALL")
          }
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {statusLabel(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Return type filter"
          className={filterInputClass}
          value={type}
          onChange={(event) =>
            setType(event.target.value as BackendReturnRequestType | "ALL")
          }
        >
          <option value="ALL">All types</option>
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {typeLabel(option)}
            </option>
          ))}
        </select>
        <GhostButton
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={onReload}
          type="button"
          className="w-full sm:w-auto"
        >
          Reload
        </GhostButton>
        <GhostButton
          onClick={onReset}
          type="button"
          className="w-full sm:w-auto"
          disabled={!hasActiveFilters}
        >
          Reset filters
        </GhostButton>
      </div>
    </div>
  </section>
);

function ReturnsPageRevamp() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { notify } = useToast();

  const [status, setStatus] = useState<BackendReturnRequestStatus | "ALL">("ALL");
  const [type, setType] = useState<BackendReturnRequestType | "ALL">("ALL");
  const [dealerInput, setDealerInput] = useState("");
  const [orderCodeInput, setOrderCodeInput] = useState("");
  const [serialInput, setSerialInput] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const dealerQuery = useDebouncedValue(dealerInput, 320);
  const orderCode = useDebouncedValue(orderCodeInput, 320);
  const serial = useDebouncedValue(serialInput, 320);

  const effectiveFilters = useMemo(
    () => ({
      status: status === "ALL" ? undefined : status,
      type: type === "ALL" ? undefined : type,
      dealer: dealerQuery.trim() || undefined,
      orderCode: orderCode.trim() || undefined,
      serial: serial.trim() || undefined,
    }),
    [dealerQuery, orderCode, serial, status, type],
  );

  // Server-side filtering: the filter values are sent to the backend, so a
  // filter change must reload from page 0 (see the effect below).
  const fetchPage = useCallback(
    ({ page, size }: { page: number; size: number }) =>
      fetchAdminReturnsPaged(accessToken!, {
        page,
        size,
        sortBy: "createdAt",
        sortDir: "desc",
        ...effectiveFilters,
      }),
    [accessToken, effectiveFilters],
  );
  const {
    status: pagedStatus,
    items,
    pagination,
    isFetching,
    error,
    setPage,
    refetch,
  } = useAdminList<BackendReturnRequestSummaryResponse>({
    fetchPage,
    pageSize: 20,
    enabled: Boolean(accessToken),
    fallbackError: "Unable to load return requests.",
    // A filter change jumps back to page 0 and reloads (handled by the hook).
    resetKey: JSON.stringify(effectiveFilters),
  });

  const hasActiveFilters =
    status !== "ALL" ||
    type !== "ALL" ||
    dealerInput.trim().length > 0 ||
    orderCodeInput.trim().length > 0 ||
    serialInput.trim().length > 0;

  const handleReload = async () => {
    await refetch();
    notify("Return requests refreshed.", {
      title: "Returns",
      variant: "info",
    });
  };

  const columns: AdminTableColumn<BackendReturnRequestSummaryResponse>[] = [
    {
      key: "request",
      label: "Request",
      className: "font-semibold text-[var(--ink)]",
      render: (item) => item.requestCode ?? `#${item.id}`,
    },
    {
      key: "dealer",
      label: "Dealer",
      render: (item) => (
        <>
          <p>{item.dealerName ?? "-"}</p>
          <p className={tableMetaClass}>#{item.dealerId ?? "-"}</p>
        </>
      ),
    },
    {
      key: "order",
      label: "Order",
      render: (item) => (
        <>
          <p>{item.orderCode ?? "-"}</p>
          <p className={tableMetaClass}>#{item.orderId ?? "-"}</p>
        </>
      ),
    },
    { key: "type", label: "Type", render: (item) => typeLabel(item.type) },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <StatusBadge tone={statusTone[item.status ?? "SUBMITTED"]}>
          {statusLabel(item.status)}
        </StatusBadge>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (item) => (
        <>
          {item.totalItems ?? 0}
          <p className={tableMetaClass}>
            {resolvedCount(item)} resolved / {item.rejectedItems ?? 0} rejected
          </p>
        </>
      ),
    },
    {
      key: "requested",
      label: "Requested",
      render: (item) =>
        item.requestedAt ? formatDateTime(item.requestedAt) : "-",
    },
  ];

  const handleResetFilters = () => {
    setStatus("ALL");
    setType("ALL");
    setDealerInput("");
    setOrderCodeInput("");
    setSerialInput("");
  };

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
        <ErrorState
          title="Unable to load return requests"
          message={error}
          onRetry={() => void handleReload()}
        />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader
        title="Returns"
        subtitle="Track B2B return requests from submission to completion."
      />

      <FilterToolbar
        status={status}
        setStatus={setStatus}
        type={type}
        setType={setType}
        dealerInput={dealerInput}
        setDealerInput={setDealerInput}
        orderCodeInput={orderCodeInput}
        setOrderCodeInput={setOrderCodeInput}
        serialInput={serialInput}
        setSerialInput={setSerialInput}
        isFiltersOpen={isFiltersOpen}
        setIsFiltersOpen={setIsFiltersOpen}
        hasActiveFilters={hasActiveFilters}
        onReload={() => void handleReload()}
        onReset={handleResetFilters}
      />

      <AdminTable
        columns={columns}
        rows={items}
        isFetching={isFetching}
        onRowClick={(item) => navigate(`/returns/${item.id}`)}
        cardBreakpoint="2xl"
        minWidthClass=""
        caption="Returns"
        emptyIcon={ClipboardCheck}
        emptyTitle={
          hasActiveFilters
            ? "No return requests match filters"
            : "No return requests yet"
        }
        emptyMessage="Try adjusting filters or check back once dealers submit requests."
      />

      <PaginationNav
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        onPageChange={setPage}
        previousLabel="Previous"
        nextLabel="Next"
      />
    </PagePanel>
  );
}

export default ReturnsPageRevamp;
