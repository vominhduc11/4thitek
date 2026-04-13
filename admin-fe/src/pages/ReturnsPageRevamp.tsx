import { ClipboardCheck, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../lib/formatters";
import {
  fetchAdminReturnsPaged,
  type BackendReturnRequestStatus,
  type BackendReturnRequestSummaryResponse,
  type BackendReturnRequestType,
} from "../lib/adminApi";
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
} from "../components/ui-kit";

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

function ReturnsPageRevamp() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState<BackendReturnRequestSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [status, setStatus] = useState<BackendReturnRequestStatus | "ALL">(
    "ALL",
  );
  const [type, setType] = useState<BackendReturnRequestType | "ALL">("ALL");
  const [dealerQuery, setDealerQuery] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [serial, setSerial] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          status: status === "ALL" ? undefined : status,
          type: type === "ALL" ? undefined : type,
          dealer: dealerQuery.trim() || undefined,
          orderCode: orderCode.trim() || undefined,
          serial: serial.trim() || undefined,
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
    [accessToken, dealerQuery, orderCode, serial, status, type],
  );

  useEffect(() => {
    void loadData(page);
  }, [loadData, page]);

  useEffect(() => {
    setPage(0);
  }, [status, type, dealerQuery, orderCode, serial]);

  const hasResults = items.length > 0;
  const hasActiveFilters =
    status !== "ALL" ||
    type !== "ALL" ||
    dealerQuery.trim().length > 0 ||
    orderCode.trim().length > 0 ||
    serial.trim().length > 0;

  const counts = useMemo(() => {
    const submitted = items.filter((item) => item.status === "SUBMITTED").length;
    const inFlight = items.filter((item) =>
      ["UNDER_REVIEW", "APPROVED", "AWAITING_RECEIPT", "RECEIVED", "INSPECTING", "PARTIALLY_RESOLVED"].includes(
        item.status ?? "",
      ),
    ).length;
    const closed = items.filter((item) =>
      ["COMPLETED", "REJECTED", "CANCELLED"].includes(item.status ?? ""),
    ).length;
    return { submitted, inFlight, closed };
  }, [items]);

  const handleReload = async () => {
    await loadData(page);
    notify("Return requests refreshed.", {
      title: "Returns",
      variant: "info",
    });
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
        actions={
          <>
            <SearchInput
              id="returns-dealer-search"
              label="Dealer"
              placeholder="Dealer"
              value={dealerQuery}
              onChange={(event) => setDealerQuery(event.target.value)}
              className="w-full sm:max-w-[12rem]"
            />
            <SearchInput
              id="returns-order-search"
              label="Order code"
              placeholder="Order code"
              value={orderCode}
              onChange={(event) => setOrderCode(event.target.value)}
              className="w-full sm:max-w-[11rem]"
            />
            <SearchInput
              id="returns-serial-search"
              label="Serial"
              placeholder="Serial"
              value={serial}
              onChange={(event) => setSerial(event.target.value)}
              className="w-full sm:max-w-[11rem]"
            />
            <select
              aria-label="Return status filter"
              className={`${inputClass} w-full sm:w-auto`}
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
              className={`${inputClass} w-full sm:w-auto`}
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
              onClick={() => void handleReload()}
              type="button"
            >
              Reload
            </GhostButton>
          </>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <article className={tableCardClass}>
          <p className={tableMetaClass}>Submitted</p>
          <p className="mt-1 text-xl font-semibold text-[var(--ink)]">
            {counts.submitted}
          </p>
        </article>
        <article className={tableCardClass}>
          <p className={tableMetaClass}>In Progress</p>
          <p className="mt-1 text-xl font-semibold text-[var(--ink)]">
            {counts.inFlight}
          </p>
        </article>
        <article className={tableCardClass}>
          <p className={tableMetaClass}>Closed</p>
          <p className="mt-1 text-xl font-semibold text-[var(--ink)]">
            {counts.closed}
          </p>
        </article>
      </div>

      {!hasResults ? (
        <EmptyState
          icon={ClipboardCheck}
          title={
            hasActiveFilters ? "No return requests match filters" : "No return requests yet"
          }
          message="Try adjusting filters or check back once dealers submit requests."
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${tableCardClass} text-left`}
                onClick={() => navigate(`/returns/${item.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {item.requestCode ?? `#${item.id}`}
                    </p>
                    <p className={tableMetaClass}>
                      {item.dealerName ?? "-"} • {item.orderCode ?? "-"}
                    </p>
                  </div>
                  <StatusBadge tone={statusTone[item.status ?? "SUBMITTED"]}>
                    {statusLabel(item.status)}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-sm text-[var(--ink)]">
                  {typeLabel(item.type)} • {item.totalItems ?? 0} item(s)
                </p>
                <p className={tableMetaClass}>
                  Requested:{" "}
                  {item.requestedAt ? formatDateTime(item.requestedAt) : "-"}
                </p>
              </button>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[74rem] border-separate border-spacing-y-2">
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
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={tableRowClass}
                    onClick={() => navigate(`/returns/${item.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
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
                      <StatusBadge tone={statusTone[item.status ?? "SUBMITTED"]}>
                        {statusLabel(item.status)}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3">
                      {item.totalItems ?? 0}
                      <p className={tableMetaClass}>
                        {item.resolvedItems ?? 0} resolved
                      </p>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      {item.requestedAt ? formatDateTime(item.requestedAt) : "-"}
                    </td>
                  </tr>
                ))}
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
