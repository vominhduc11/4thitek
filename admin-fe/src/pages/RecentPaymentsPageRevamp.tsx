import { BadgeAlert, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { translateCopy } from "../lib/i18n";
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
  PagePanel,
  PaginationNav,
  PrimaryButton,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  inputClass,
  softCardClass,
} from "../components/ui-kit";

const PAGE_SIZE = 20;

const copyKeys = {
  title: "Đối soát chuyển khoản",
  description:
    "Theo dõi các giao dịch chuyển khoản gần đây, lọc theo đại lý, thời gian và chứng từ để ưu tiên các khoản cần rà soát.",
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
  emptyTitle: "Không có payment phù hợp",
  emptyMessage: "Thử nới bộ lọc hoặc tải lại dữ liệu.",
  loadFallback: "Không tải được danh sách giao dịch chuyển khoản.",
  statTotal: "Tổng payment",
  statFlagged: "Cần review",
  order: "Đơn hàng",
  amount: "Số tiền",
  channel: "Kênh",
  proofFile: "Chứng từ",
  note: "Ghi chú",
  transactionCode: "Mã giao dịch",
  paidAt: "Thanh toán lúc",
  createdAt: "Tạo lúc",
  reviewFlag: "Cần rà soát",
  missing: "Chưa có",
  noSelection: "Chọn một payment để xem chi tiết",
  flaggedYes: "Có",
  flaggedNo: "Không",
  markReviewed: "Đánh dấu đã xem xét",
  markReviewedSuccess: "Đã đánh dấu xem xét.",
  markReviewedFailed: "Không thể đánh dấu xem xét.",
} as const;

const toIsoDateTime = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

function RecentPaymentsPageRevamp() {
  const { t, language } = useLanguage();
  const copy = translateCopy(copyKeys, t);
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

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (!accessToken) {
        return;
      }
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
        setItems(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
        setSelectedId((current) => response.items.find((item) => item.id === current)?.id ?? response.items[0]?.id ?? null);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : copy.loadFallback;
        setError(message);
        notify(message, { title: copy.title, variant: "error" });
      } finally {
        setIsLoading(false);
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

  const handleApply = () => {
    void loadPage(0);
  };

  const handleMarkReviewed = async (paymentId: number) => {
    if (!accessToken) return;
    setReviewingId(paymentId);
    try {
      const updated = await markAdminRecentPaymentReviewed(accessToken, paymentId);
      setItems((previous) =>
        previous.map((item) => (item.id === paymentId ? { ...item, ...updated } : item)),
      );
      notify(copy.markReviewedSuccess, { title: copy.title, variant: "success" });
    } catch (markError) {
      notify(
        markError instanceof Error ? markError.message : copy.markReviewedFailed,
        { title: copy.title, variant: "error" },
      );
    } finally {
      setReviewingId(null);
    }
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
          title={t("Không tải được dữ liệu")}
          message={error}
          onRetry={() => void loadPage(page)}
        />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <GhostButton onClick={() => void loadPage(page)} aria-label={copy.reload}>
          <RefreshCw className="h-4 w-4" />
        </GhostButton>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BadgeAlert}
          label={copy.statTotal}
          value={String(totalItems)}
          hint={`${items.length} / ${totalItems}`}
          tone="info"
        />
        <StatCard
          icon={BadgeAlert}
          label={copy.statFlagged}
          value={String(flaggedCount)}
          hint={copy.reviewFlag}
          tone="warning"
        />
      </div>

      <div className={`${softCardClass} mt-6`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.dealer}</span>
            <select className={inputClass} value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
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
            <select
              className={inputClass}
              value={proofFilter}
              onChange={(e) => setProofFilter(e.target.value as "ALL" | "WITH_PROOF" | "WITHOUT_PROOF")}
            >
              <option value="ALL">{copy.allProof}</option>
              <option value="WITH_PROOF">{copy.withProof}</option>
              <option value="WITHOUT_PROOF">{copy.withoutProof}</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.minAmount}</span>
            <input className={inputClass} type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.maxAmount}</span>
            <input className={inputClass} type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.from}</span>
            <input className={inputClass} type="datetime-local" value={fromValue} onChange={(e) => setFromValue(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--muted)]">{copy.to}</span>
            <input className={inputClass} type="datetime-local" value={toValue} onChange={(e) => setToValue(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <PrimaryButton type="button" onClick={handleApply}>
            {copy.apply}
          </PrimaryButton>
          <GhostButton type="button" onClick={() => void loadPage(page)}>
            {copy.reload}
          </GhostButton>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1">
            <div className={`${softCardClass} overflow-hidden`}>
              <div className="divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={[
                        "w-full px-4 py-3 text-left transition",
                        isSelected ? "bg-[var(--accent-soft)]/40" : "hover:bg-[var(--surface)]",
                      ].join(" ")}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">
                            {item.dealerName ?? copy.missing}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {(item.orderCode ?? "—") + " · " + (item.channel ?? copy.missing)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-sm font-semibold text-[var(--ink)]">
                            {item.amount != null ? formatCurrency(Number(item.amount)) : "—"}
                          </span>
                          <StatusBadge tone={item.reviewSuggested ? "warning" : "neutral"}>
                            {item.reviewSuggested ? copy.flaggedYes : copy.flaggedNo}
                          </StatusBadge>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {copy.paidAt}: {item.paidAt ? formatDateTime(item.paidAt) : "—"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="mt-4">
                <PaginationNav
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  onPageChange={(nextPage) => void loadPage(nextPage)}
                  previousLabel={language === "vi" ? "Trước" : "Previous"}
                  nextLabel={language === "vi" ? "Tiếp" : "Next"}
                />
              </div>
            )}
          </div>

          <div className={`${softCardClass} w-full xl:w-96 xl:shrink-0`}>
            {selectedItem ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {selectedItem.dealerName ?? copy.missing}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {selectedItem.orderCode ?? copy.missing}
                    </p>
                  </div>
                  <StatusBadge tone={selectedItem.reviewSuggested ? "warning" : "success"}>
                    {selectedItem.reviewSuggested ? copy.reviewFlag : copy.flaggedNo}
                  </StatusBadge>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  {[
                    { label: copy.order, value: selectedItem.orderCode ?? "—" },
                    {
                      label: copy.amount,
                      value:
                        selectedItem.amount != null
                          ? formatCurrency(Number(selectedItem.amount))
                          : "—",
                    },
                    { label: copy.channel, value: selectedItem.channel ?? "—" },
                    {
                      label: copy.proofFile,
                      value: selectedItem.proofFileName?.trim() || copy.missing,
                    },
                    {
                      label: copy.transactionCode,
                      value: selectedItem.transactionCode?.trim() || copy.missing,
                    },
                    {
                      label: copy.note,
                      value: selectedItem.note?.trim() || copy.missing,
                    },
                    {
                      label: copy.paidAt,
                      value: selectedItem.paidAt ? formatDateTime(selectedItem.paidAt) : "—",
                    },
                    {
                      label: copy.createdAt,
                      value: selectedItem.createdAt
                        ? formatDateTime(selectedItem.createdAt)
                        : "—",
                    },
                  ].map((entry) => (
                    <div key={entry.label} className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-2">
                      <dt className="text-[var(--muted)]">{entry.label}</dt>
                      <dd className="text-right font-medium text-[var(--ink)]">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
                {selectedItem.reviewSuggested && (
                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    <PrimaryButton
                      className="w-full"
                      disabled={reviewingId === selectedItem.id}
                      onClick={() => void handleMarkReviewed(selectedItem.id)}
                      type="button"
                    >
                      {reviewingId === selectedItem.id ? "..." : copy.markReviewed}
                    </PrimaryButton>
                  </div>
                )}
              </>
            ) : (
              <EmptyState title={copy.noSelection} message={copy.description} />
            )}
          </div>
        </div>
      )}
    </PagePanel>
  );
}

export default RecentPaymentsPageRevamp;
