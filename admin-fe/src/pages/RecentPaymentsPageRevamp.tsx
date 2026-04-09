import { BadgeAlert, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import {
  fetchAdminRecentPayments,
  markAdminRecentPaymentReviewed,
  type BackendRecentPaymentResponse,
} from "../lib/adminApi";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import {
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  PrimaryButton,
  StatCard,
  StatusBadge,
  bodyTextClass,
  inputClass,
  softCardClass,
} from "../components/ui-kit";

const PAGE_SIZE = 20;

const copyByLanguage = {
  vi: {
    title: "Đối soát chuyển khoản",
    description:
      "Theo dõi giao dịch chuyển khoản gần đây, lọc theo đại lý và nhanh chóng đánh dấu các khoản đã được rà soát.",
    dealer: "Đại lý",
    allDealers: "Tất cả đại lý",
    from: "Từ thời điểm",
    to: "Đến thời điểm",
    minAmount: "Số tiền từ",
    maxAmount: "Số tiền đến",
    proof: "Chứng từ",
    allProof: "Tất cả",
    withProof: "Có chứng từ",
    withoutProof: "Thiếu chứng từ",
    apply: "Áp dụng",
    reload: "Tải lại",
    emptyTitle: "Không có giao dịch phù hợp",
    emptyMessage: "Thử thay đổi bộ lọc hoặc tải lại dữ liệu.",
    loadTitle: "Không tải được dữ liệu",
    loadFallback: "Không tải được danh sách giao dịch chuyển khoản.",
    statTotal: "Tổng giao dịch",
    statFlagged: "Cần rà soát",
    queueTitle: "Danh sách giao dịch",
    queueHint: "Chọn một giao dịch để xem chi tiết và cập nhật trạng thái rà soát.",
    detailTitle: "Chi tiết giao dịch",
    detailHint: "Kiểm tra đơn hàng, chứng từ và đánh dấu đã xem xét nếu case đã rõ ràng.",
    order: "Đơn hàng",
    amount: "Số tiền",
    channel: "Kênh",
    proofFile: "Chứng từ",
    note: "Ghi chú",
    transactionCode: "Mã giao dịch",
    paidAt: "Thanh toán lúc",
    createdAt: "Tạo lúc",
    reviewFlag: "Cần rà soát",
    noSelection: "Chọn một giao dịch để xem chi tiết",
    flaggedYes: "Có",
    flaggedNo: "Không",
    markReviewed: "Đánh dấu đã xem xét",
    markReviewedSuccess: "Đã đánh dấu xem xét.",
    markReviewedFailed: "Không thể đánh dấu xem xét.",
    missing: "Chưa có",
    previousLabel: "Trước",
    nextLabel: "Tiếp",
  },
  en: {
    title: "Recent bank transfers",
    description:
      "Track the latest transfer payments, filter by dealer, and quickly mark reviewed items once the case is clear.",
    dealer: "Dealer",
    allDealers: "All dealers",
    from: "From",
    to: "To",
    minAmount: "Min amount",
    maxAmount: "Max amount",
    proof: "Proof",
    allProof: "All",
    withProof: "With proof",
    withoutProof: "Missing proof",
    apply: "Apply",
    reload: "Reload",
    emptyTitle: "No matching payments",
    emptyMessage: "Try a different filter or reload the data.",
    loadTitle: "Unable to load data",
    loadFallback: "Could not load recent transfer payments.",
    statTotal: "Total payments",
    statFlagged: "Needs review",
    queueTitle: "Payment queue",
    queueHint: "Select a payment to inspect details and update its review state.",
    detailTitle: "Payment details",
    detailHint: "Review the order, proof, and mark the case as reviewed once confirmed.",
    order: "Order",
    amount: "Amount",
    channel: "Channel",
    proofFile: "Proof file",
    note: "Note",
    transactionCode: "Transaction code",
    paidAt: "Paid at",
    createdAt: "Created at",
    reviewFlag: "Needs review",
    noSelection: "Select a payment to view details",
    flaggedYes: "Yes",
    flaggedNo: "No",
    markReviewed: "Mark reviewed",
    markReviewedSuccess: "Marked as reviewed.",
    markReviewedFailed: "Could not mark as reviewed.",
    missing: "Not provided",
    previousLabel: "Previous",
    nextLabel: "Next",
  },
} as const;

const toIsoDateTime = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

function RecentPaymentsPageRevamp() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const { dealers } = useAdminData();

  const [items, setItems] = useState<BackendRecentPaymentResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dealerId, setDealerId] = useState("ALL");
  const [proofFilter, setProofFilter] = useState<"ALL" | "WITH_PROOF" | "WITHOUT_PROOF">("ALL");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (!accessToken) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchAdminRecentPayments(accessToken, {
          page: nextPage,
          size: PAGE_SIZE,
          dealerId: dealerId === "ALL" ? undefined : Number(dealerId),
          from: toIsoDateTime(fromValue),
          to: toIsoDateTime(toValue),
          minAmount: minAmount.trim() ? Number(minAmount) : undefined,
          maxAmount: maxAmount.trim() ? Number(maxAmount) : undefined,
          hasProof:
            proofFilter === "WITH_PROOF"
              ? true
              : proofFilter === "WITHOUT_PROOF"
                ? false
                : undefined,
        });

        if (requestIdRef.current !== requestId) {
          return;
        }

        setItems(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
        setSelectedId((current) => response.items.find((item) => item.id === current)?.id ?? response.items[0]?.id ?? null);
      } catch (loadError) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : copy.loadFallback;
        setError(message);
        notify(message, { title: copy.title, variant: "error" });
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, copy.loadFallback, copy.title, dealerId, fromValue, maxAmount, minAmount, notify, proofFilter, toValue],
  );

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const flaggedCount = useMemo(
    () => items.filter((item) => item.reviewSuggested === true).length,
    [items],
  );

  const handleMarkReviewed = async (paymentId: number) => {
    if (!accessToken) {
      return;
    }

    setReviewingId(paymentId);
    try {
      const updated = await markAdminRecentPaymentReviewed(accessToken, paymentId);
      setItems((previous) => previous.map((item) => (item.id === paymentId ? { ...item, ...updated } : item)));
      notify(copy.markReviewedSuccess, { title: copy.title, variant: "success" });
    } catch (markError) {
      notify(markError instanceof Error ? markError.message : copy.markReviewedFailed, {
        title: copy.title,
        variant: "error",
      });
    } finally {
      setReviewingId(null);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    );
  }

  if (error) {
    return (
      <PagePanel>
        <ErrorState title={copy.loadTitle} message={error} onRetry={() => void loadPage(page)} />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        subtitle={copy.description}
        actions={
          <GhostButton onClick={() => void loadPage(page)} type="button">
            <RefreshCw className="h-4 w-4" />
            {copy.reload}
          </GhostButton>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BadgeAlert} label={copy.statTotal} value={String(totalItems)} tone="info" hint={`${items.length} / ${totalItems}`} />
        <StatCard icon={BadgeAlert} label={copy.statFlagged} value={String(flaggedCount)} tone="warning" hint={copy.reviewFlag} />
      </div>

      <div className={`${softCardClass} mt-6 p-4`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.dealer}</span>
            <select className={inputClass} value={dealerId} onChange={(event) => setDealerId(event.target.value)}>
              <option value="ALL">{copy.allDealers}</option>
              {dealers.map((dealer) => (
                <option key={dealer.id} value={dealer.id}>
                  {dealer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.proof}</span>
            <select className={inputClass} value={proofFilter} onChange={(event) => setProofFilter(event.target.value as "ALL" | "WITH_PROOF" | "WITHOUT_PROOF")}>
              <option value="ALL">{copy.allProof}</option>
              <option value="WITH_PROOF">{copy.withProof}</option>
              <option value="WITHOUT_PROOF">{copy.withoutProof}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.minAmount}</span>
            <input className={inputClass} type="number" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.maxAmount}</span>
            <input className={inputClass} type="number" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.from}</span>
            <input className={inputClass} type="datetime-local" value={fromValue} onChange={(event) => setFromValue(event.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.to}</span>
            <input className={inputClass} type="datetime-local" value={toValue} onChange={(event) => setToValue(event.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton onClick={() => void loadPage(0)} type="button">{copy.apply}</PrimaryButton>
          <GhostButton onClick={() => void loadPage(page)} type="button">{copy.reload}</GhostButton>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.9fr)] xl:items-start">
          <section className="min-w-0 space-y-4">
            <div className={`${softCardClass} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{copy.queueTitle}</p>
                  <p className={bodyTextClass}>{copy.queueHint}</p>
                </div>
                <StatusBadge tone="warning">{flaggedCount} {copy.reviewFlag}</StatusBadge>
              </div>
              <div className="mt-4 divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-current={isSelected ? "true" : undefined}
                      className={[
                        "w-full rounded-2xl px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
                        isSelected
                          ? "bg-[var(--accent-soft)]/45 shadow-[inset_0_0_0_1px_rgba(41,171,226,0.32)]"
                          : "hover:bg-[var(--surface)]",
                      ].join(" ")}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">{item.dealerName ?? copy.missing}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">{item.orderCode ?? copy.missing} · {item.channel ?? copy.missing}</p>
                          <p className="mt-2 text-xs text-[var(--muted)]">{copy.paidAt}: {item.paidAt ? formatDateTime(item.paidAt) : copy.missing}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-[var(--ink)]">{item.amount != null ? formatCurrency(Number(item.amount)) : copy.missing}</p>
                          <StatusBadge tone={item.reviewSuggested ? "warning" : "neutral"} className="mt-2">
                            {item.reviewSuggested ? copy.flaggedYes : copy.flaggedNo}
                          </StatusBadge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {totalPages > 1 ? (
              <PaginationNav
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={(nextPage) => void loadPage(nextPage)}
                previousLabel={copy.previousLabel}
                nextLabel={copy.nextLabel}
              />
            ) : null}
          </section>

          <section className="xl:sticky xl:top-24">
            <div className={`${softCardClass} p-5`}>
              {selectedItem ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{copy.detailTitle}</p>
                      <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">{selectedItem.dealerName ?? copy.missing}</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">{copy.detailHint}</p>
                    </div>
                    <StatusBadge tone={selectedItem.reviewSuggested ? "warning" : "success"}>
                      {selectedItem.reviewSuggested ? copy.reviewFlag : copy.flaggedNo}
                    </StatusBadge>
                  </div>

                  <dl className="mt-5 space-y-3 text-sm">
                    {[
                      { label: copy.order, value: selectedItem.orderCode ?? copy.missing },
                      { label: copy.amount, value: selectedItem.amount != null ? formatCurrency(Number(selectedItem.amount)) : copy.missing },
                      { label: copy.channel, value: selectedItem.channel ?? copy.missing },
                      { label: copy.proofFile, value: selectedItem.proofFileName?.trim() || copy.missing },
                      { label: copy.transactionCode, value: selectedItem.transactionCode?.trim() || copy.missing },
                      { label: copy.note, value: selectedItem.note?.trim() || copy.missing },
                      { label: copy.paidAt, value: selectedItem.paidAt ? formatDateTime(selectedItem.paidAt) : copy.missing },
                      { label: copy.createdAt, value: selectedItem.createdAt ? formatDateTime(selectedItem.createdAt) : copy.missing },
                    ].map((entry) => (
                      <div key={entry.label} className="grid gap-1 border-b border-[var(--border)] pb-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-start">
                        <dt className="text-[var(--muted)]">{entry.label}</dt>
                        <dd className="font-medium text-[var(--ink)] sm:text-right">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>

                  {selectedItem.reviewSuggested ? (
                    <div className="mt-5 border-t border-[var(--border)] pt-5">
                      <PrimaryButton
                        className="w-full"
                        disabled={reviewingId === selectedItem.id}
                        onClick={() => void handleMarkReviewed(selectedItem.id)}
                        type="button"
                      >
                        {reviewingId === selectedItem.id ? "..." : copy.markReviewed}
                      </PrimaryButton>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState title={copy.noSelection} message={copy.description} />
              )}
            </div>
          </section>
        </div>
      )}
    </PagePanel>
  );
}

export default RecentPaymentsPageRevamp;
