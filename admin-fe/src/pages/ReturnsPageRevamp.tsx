import { ClipboardCheck, Filter, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  SearchInput,
  StatusBadge,
  inputClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  toolbarCardClass,
  toolbarGroupClass,
} from "../components/ui-kit";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  fetchAdminReturnsPaged,
  type BackendReturnRequestStatus,
  type BackendReturnRequestSummaryResponse,
  type BackendReturnRequestType,
} from "../lib/adminApi";
import { formatDateTime } from "../lib/formatters";

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
  return status.replaceAll("_", " ");
};

const typeLabel = (type?: BackendReturnRequestType | null) => {
  if (!type) return "-";
  return type.replaceAll("_", " ");
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

  const [items, setItems] = useState<BackendReturnRequestSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [status, setStatus] = useState<BackendReturnRequestStatus | "ALL">("ALL");
  const [type, setType] = useState<BackendReturnRequestType | "ALL">("ALL");
  const [dealerInput, setDealerInput] = useState("");
  const [orderCodeInput, setOrderCodeInput] = useState("");
  const [serialInput, setSerialInput] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const dealerQuery = useDebouncedValue(dealerInput, 320);
  const orderCode = useDebouncedValue(orderCodeInput, 320);
  const serial = useDebouncedValue(serialInput, 320);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadData = useCallback(
    async (targetPage: number) => {
      if (!accessToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchAdminReturnsPaged(accessToken, {
          page: targetPage,
          size: 20,
          sortBy: "createdAt",
          sortDir: "desc",
          ...effectiveFilters,
        });
        setItems(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load return requests.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, effectiveFilters],
  );

  useEffect(() => {
    setPage(0);
  }, [effectiveFilters]);

  useEffect(() => {
    void loadData(page);
  }, [loadData, page]);

  const hasResults = items.length > 0;
  const hasActiveFilters =
    status !== "ALL" ||
    type !== "ALL" ||
    dealerInput.trim().length > 0 ||
    orderCodeInput.trim().length > 0 ||
    serialInput.trim().length > 0;

  const handleReload = async () => {
    await loadData(page);
    notify("Return requests refreshed.", {
      title: "Returns",
      variant: "info",
    });
  };

  const handleResetFilters = () => {
    setStatus("ALL");
    setType("ALL");
    setDealerInput("");
    setOrderCodeInput("");
    setSerialInput("");
  };

  if (isLoading) {
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

      {!hasResults ? (
        <EmptyState
          icon={ClipboardCheck}
          title={
            hasActiveFilters
              ? "No return requests match filters"
              : "No return requests yet"
          }
          message="Try adjusting filters or check back once dealers submit requests."
        />
      ) : (
        <>
          <div className="grid gap-3 2xl:hidden">
            {items.map((item) => {
              const itemStatus = item.status ?? "SUBMITTED";
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${tableCardClass} text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2`}
                  onClick={() => navigate(`/returns/${item.id}`)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--ink)]">
                        {item.requestCode ?? `#${item.id}`}
                      </p>
                      <p className={tableMetaClass}>Dealer: {item.dealerName ?? "-"}</p>
                      <p className={tableMetaClass}>Order: {item.orderCode ?? "-"}</p>
                    </div>
                    <StatusBadge tone={statusTone[itemStatus]}>
                      {statusLabel(item.status)}
                    </StatusBadge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[var(--ink)] sm:grid-cols-4">
                    <div>
                      <p className={tableMetaClass}>Type</p>
                      <p className="font-medium">{typeLabel(item.type)}</p>
                    </div>
                    <div>
                      <p className={tableMetaClass}>Requested</p>
                      <p className="font-medium">
                        {item.requestedAt ? formatDateTime(item.requestedAt) : "-"}
                      </p>
                    </div>
                    <div>
                      <p className={tableMetaClass}>Items</p>
                      <p className="font-medium">
                        {item.totalItems ?? 0} total / {item.requestedItems ?? 0} requested
                      </p>
                    </div>
                    <div>
                      <p className={tableMetaClass}>Resolution</p>
                      <p className="font-medium">
                        {resolvedCount(item)} resolved / {item.rejectedItems ?? 0} rejected
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden 2xl:block">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className={tableHeadClass}>
                  <th className="px-3 py-2">Request</th>
                  <th className="px-3 py-2">Dealer</th>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Items</th>
                  <th className="px-3 py-2">Requested</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const itemStatus = item.status ?? "SUBMITTED";
                  return (
                    <tr
                      key={item.id}
                      className={tableRowClass}
                      onClick={() => navigate(`/returns/${item.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/returns/${item.id}`);
                        }
                      }}
                    >
                      <td className="rounded-l-2xl px-3 py-3 font-semibold text-[var(--ink)]">
                        {item.requestCode ?? `#${item.id}`}
                      </td>
                      <td className="px-3 py-3">
                        <p>{item.dealerName ?? "-"}</p>
                        <p className={tableMetaClass}>#{item.dealerId ?? "-"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{item.orderCode ?? "-"}</p>
                        <p className={tableMetaClass}>#{item.orderId ?? "-"}</p>
                      </td>
                      <td className="px-3 py-3">{typeLabel(item.type)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={statusTone[itemStatus]}>
                          {statusLabel(item.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3">
                        {item.totalItems ?? 0}
                        <p className={tableMetaClass}>
                          {resolvedCount(item)} resolved / {item.rejectedItems ?? 0} rejected
                        </p>
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        {item.requestedAt ? formatDateTime(item.requestedAt) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <PaginationNav
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={20}
        onPageChange={setPage}
        previousLabel="Previous"
        nextLabel="Next"
      />
    </PagePanel>
  );
}

export default ReturnsPageRevamp;
