import { Landmark, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAdminFinancialSettlements,
  resolveAdminFinancialSettlement,
  type BackendFinancialSettlementResponse,
  type BackendFinancialSettlementStatus,
  type BackendFinancialSettlementType,
} from "../lib/adminApi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import {
  EmptyState,
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PrimaryButton,
  StatCard,
  StatusBadge,
  bodyTextClass,
  inputClass,
  softCardClass,
  tableActionSelectClass,
  textareaClass,
} from "../components/ui-kit";
import { subscribeAdminRealtimeNotification } from "../lib/adminRealtime";

const STATUS_OPTIONS: BackendFinancialSettlementStatus[] = [
  "PENDING",
  "REFUNDED",
  "WRITTEN_OFF",
  "CREDITED",
];

const RESOLUTION_OPTIONS: BackendFinancialSettlementStatus[] = [
  "REFUNDED",
  "WRITTEN_OFF",
  "CREDITED",
];

const statusTone = {
  PENDING: "warning",
  REFUNDED: "info",
  WRITTEN_OFF: "neutral",
  CREDITED: "success",
} as const;

const copyByLanguage = {
  vi: {
    title: "Quyết toán tài chính",
    description:
      "Xử lý các mục hoàn tiền, ghi có hoặc xóa sổ từ một workspace rõ ràng thay vì chỉ xem danh sách.",
    status: "Trạng thái",
    all: "Tất cả",
    pending: "Chờ xử lý",
    refunded: "Đã hoàn tiền",
    writtenOff: "Đã xóa sổ",
    credited: "Đã ghi có",
    queueTitle: "Danh sách quyết toán",
    queueHint: "Chọn một mục để xem đầy đủ bối cảnh và ra quyết định.",
    detailTitle: "Chi tiết xử lý",
    detailHint: "Xem loại quyết toán, lịch sử và chốt kết quả ngay tại panel này.",
    type: "Loại",
    amount: "Số tiền",
    orderCode: "Mã đơn",
    createdBy: "Tạo bởi",
    createdAt: "Tạo lúc",
    resolvedBy: "Xử lý bởi",
    resolvedAt: "Xử lý lúc",
    resolution: "Ghi chú xử lý",
    newStatus: "Trạng thái mới",
    resolutionNote: "Ghi chú bắt buộc",
    resolutionPlaceholder: "Mô tả cách bạn đã xử lý mục quyết toán này...",
    resolutionRequired: "Ghi chú xử lý là bắt buộc.",
    save: "Lưu quyết định",
    reload: "Tải lại",
    emptyTitle: "Không có mục quyết toán phù hợp",
    emptyMessage: "Thử thay đổi bộ lọc hoặc tải lại dữ liệu.",
    loadTitle: "Không tải được danh sách quyết toán",
    loadMessage: "Vui lòng kiểm tra kết nối và thử lại.",
    loadFallback: "Danh sách quyết toán chưa thể tải.",
    saveError: "Không lưu được thay đổi.",
    saveSuccess: "Đã cập nhật quyết toán.",
    noSelectionTitle: "Chưa chọn mục quyết toán",
    noSelectionMessage: "Hãy chọn một mục ở danh sách để xem đầy đủ chi tiết và xử lý.",
    summaryOpen: "Mục đang mở",
    summaryPending: "Chờ xử lý",
    summaryResolved: "Đã giải quyết",
    pendingBanner: "Mục này vẫn đang chờ quyết định",
    pendingHint: "Luôn ghi rõ lý do để đội vận hành theo dõi lại sau này.",
    typeCancellationRefund: "Hoàn hoặc điều chỉnh khi hủy đơn",
    typeStaleOrderReview: "Rà soát đơn quá hạn",
    previousLabel: "Trước",
    nextLabel: "Tiếp",
    missing: "Chưa có",
  },
  en: {
    title: "Financial settlements",
    description:
      "Handle refunds, credits, and write-offs from a focused workspace instead of a passive list.",
    status: "Status",
    all: "All",
    pending: "Pending",
    refunded: "Refunded",
    writtenOff: "Written off",
    credited: "Credited",
    queueTitle: "Settlement queue",
    queueHint: "Select an item to review the full context and make a decision.",
    detailTitle: "Resolution details",
    detailHint: "Review the settlement type, audit trail, and finalize the outcome from this panel.",
    type: "Type",
    amount: "Amount",
    orderCode: "Order code",
    createdBy: "Created by",
    createdAt: "Created at",
    resolvedBy: "Resolved by",
    resolvedAt: "Resolved at",
    resolution: "Resolution note",
    newStatus: "New status",
    resolutionNote: "Required note",
    resolutionPlaceholder: "Describe how this settlement item was handled...",
    resolutionRequired: "A resolution note is required.",
    save: "Save decision",
    reload: "Reload",
    emptyTitle: "No settlement items found",
    emptyMessage: "Try a different filter or reload the data.",
    loadTitle: "Unable to load settlements",
    loadMessage: "Please check your connection and try again.",
    loadFallback: "The settlement list could not be loaded.",
    saveError: "Could not save changes.",
    saveSuccess: "Settlement updated.",
    noSelectionTitle: "No settlement selected",
    noSelectionMessage: "Choose an item from the queue to inspect details and resolve it.",
    summaryOpen: "Open items",
    summaryPending: "Pending",
    summaryResolved: "Resolved",
    pendingBanner: "This item still needs a decision",
    pendingHint: "Always record the reasoning so operations can review it later.",
    typeCancellationRefund: "Cancellation refund or adjustment",
    typeStaleOrderReview: "Stale order review",
    previousLabel: "Previous",
    nextLabel: "Next",
    missing: "Not provided",
  },
} as const;

function FinancialSettlementsPageRevamp() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const { accessToken } = useAuth();
  const { notify } = useToast();

  const [items, setItems] = useState<BackendFinancialSettlementResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | BackendFinancialSettlementStatus>("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusDraft, setStatusDraft] = useState<BackendFinancialSettlementStatus>("REFUNDED");
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const statusLabels: Record<BackendFinancialSettlementStatus, string> = {
    PENDING: copy.pending,
    REFUNDED: copy.refunded,
    WRITTEN_OFF: copy.writtenOff,
    CREDITED: copy.credited,
  };

  const typeLabels: Record<BackendFinancialSettlementType, string> = {
    CANCELLATION_REFUND: copy.typeCancellationRefund,
    STALE_ORDER_REVIEW: copy.typeStaleOrderReview,
  };

  const settlementTypeLabel = (type?: BackendFinancialSettlementType | null) =>
    type ? typeLabels[type] ?? type : copy.missing;

  const load = useCallback(
    async (nextStatus: "ALL" | BackendFinancialSettlementStatus) => {
      if (!accessToken) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      setSaveError(null);

      try {
        const data = await fetchAdminFinancialSettlements(accessToken, {
          status: nextStatus === "ALL" ? undefined : nextStatus,
        });

        if (requestIdRef.current !== requestId) {
          return;
        }

        setItems(data);
        setSelectedId((current) => data.find((item) => item.id === current)?.id ?? data[0]?.id ?? null);
      } catch (loadError) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : copy.loadFallback);
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, copy.loadFallback],
  );

  useEffect(() => {
    void load(statusFilter);
  }, [load, statusFilter]);

  useEffect(() => {
    return subscribeAdminRealtimeNotification(() => {
      void load(statusFilter);
    });
  }, [load, statusFilter]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedItem) {
      setStatusDraft("REFUNDED");
      setResolutionDraft("");
      return;
    }

    setStatusDraft(selectedItem.status === "PENDING" ? "REFUNDED" : selectedItem.status ?? "REFUNDED");
    setResolutionDraft(selectedItem.resolution ?? "");
  }, [selectedItem]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING").length,
    [items],
  );

  const resolvedCount = useMemo(() => Math.max(items.length - pendingCount, 0), [items.length, pendingCount]);

  const handleSave = async () => {
    if (!accessToken || !selectedItem) {
      return;
    }

    const trimmedResolution = resolutionDraft.trim();
    if (!trimmedResolution) {
      setSaveError(copy.resolutionRequired);
      notify(copy.resolutionRequired, { title: copy.title, variant: "error" });
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const updated = await resolveAdminFinancialSettlement(accessToken, selectedItem.id, {
        status: statusDraft,
        resolution: trimmedResolution,
      });
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedId(updated.id);
      notify(copy.saveSuccess, { title: copy.title, variant: "success" });
    } catch (nextError) {
      setSaveError(copy.saveError);
      notify(nextError instanceof Error ? nextError.message : copy.saveError, {
        title: copy.title,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
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
        <ErrorState title={copy.loadTitle} message={copy.loadMessage} onRetry={() => void load(statusFilter)} />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        subtitle={copy.description}
        actions={
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            <select
              aria-label={copy.status}
              className={`${inputClass} w-full min-w-[12rem] lg:w-auto`}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | BackendFinancialSettlementStatus)}
            >
              <option value="ALL">{copy.all}</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <GhostButton onClick={() => void load(statusFilter)} type="button">
              <RefreshCw className="h-4 w-4" />
              {copy.reload}
            </GhostButton>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={Landmark} label={copy.summaryOpen} value={String(items.length)} tone="info" />
        <StatCard icon={Landmark} label={copy.summaryPending} value={String(pendingCount)} tone="warning" />
        <StatCard icon={Landmark} label={copy.summaryResolved} value={String(resolvedCount)} tone="success" />
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.95fr)] xl:items-start">
          <section className="min-w-0 space-y-4">
            <div className={`${softCardClass} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{copy.queueTitle}</p>
                  <p className={bodyTextClass}>{copy.queueHint}</p>
                </div>
                <StatusBadge tone="warning">{pendingCount} {copy.pending}</StatusBadge>
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
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[var(--ink)]">
                              {item.orderCode ?? `#${item.id}`}
                            </p>
                            <StatusBadge tone={statusTone[item.status ?? "PENDING"]}>{statusLabels[item.status ?? "PENDING"]}</StatusBadge>
                          </div>
                          <p className="mt-1 text-xs text-[var(--muted)]">{settlementTypeLabel(item.type)}</p>
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            {copy.createdAt}: {item.createdAt ? formatDateTime(item.createdAt) : copy.missing}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-[var(--ink)]">
                            {item.amount != null ? formatCurrency(Number(item.amount)) : copy.missing}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">{item.createdBy ?? copy.missing}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="xl:sticky xl:top-24">
            <div className={`${softCardClass} p-5`}>
              {selectedItem ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{copy.detailTitle}</p>
                      <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">{selectedItem.orderCode ?? `#${selectedItem.id}`}</h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">{copy.detailHint}</p>
                    </div>
                    <StatusBadge tone={statusTone[selectedItem.status ?? "PENDING"]}>{statusLabels[selectedItem.status ?? "PENDING"]}</StatusBadge>
                  </div>

                  {selectedItem.status === "PENDING" ? (
                    <div className="mt-4 rounded-[18px] border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--tone-warning-text)]">{copy.pendingBanner}</p>
                      <p className="mt-1 text-sm text-[var(--tone-warning-text)]/90">{copy.pendingHint}</p>
                    </div>
                  ) : null}

                  <dl className="mt-5 space-y-3 text-sm">
                    {[
                      { label: copy.type, value: settlementTypeLabel(selectedItem.type) },
                      { label: copy.amount, value: selectedItem.amount != null ? formatCurrency(Number(selectedItem.amount)) : copy.missing },
                      { label: copy.orderCode, value: selectedItem.orderCode ?? copy.missing },
                      { label: copy.createdBy, value: selectedItem.createdBy ?? copy.missing },
                      { label: copy.createdAt, value: selectedItem.createdAt ? formatDateTime(selectedItem.createdAt) : copy.missing },
                      { label: copy.resolvedBy, value: selectedItem.resolvedBy ?? copy.missing },
                      { label: copy.resolvedAt, value: selectedItem.resolvedAt ? formatDateTime(selectedItem.resolvedAt) : copy.missing },
                      { label: copy.resolution, value: selectedItem.resolution ?? copy.missing },
                    ].map((entry) => (
                      <div key={entry.label} className="grid gap-1 border-b border-[var(--border)] pb-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start">
                        <dt className="text-[var(--muted)]">{entry.label}</dt>
                        <dd className="font-medium text-[var(--ink)] sm:text-right">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5">
                    <div>
                      <label htmlFor="settlement-status" className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {copy.newStatus}
                      </label>
                      <select
                        id="settlement-status"
                        className={`${tableActionSelectClass} w-full`}
                        value={statusDraft}
                        onChange={(event) => {
                          setSaveError(null);
                          setStatusDraft(event.target.value as BackendFinancialSettlementStatus);
                        }}
                      >
                        {RESOLUTION_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="settlement-resolution" className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {copy.resolutionNote}
                      </label>
                      <textarea
                        id="settlement-resolution"
                        className={textareaClass}
                        placeholder={copy.resolutionPlaceholder}
                        value={resolutionDraft}
                        onChange={(event) => {
                          setSaveError(null);
                          setResolutionDraft(event.target.value);
                        }}
                      />
                    </div>
                    {saveError ? <FieldErrorMessage message={saveError} /> : null}
                    <PrimaryButton className="w-full" disabled={isSaving} onClick={() => void handleSave()} type="button">
                      {isSaving ? "..." : copy.save}
                    </PrimaryButton>
                  </div>
                </>
              ) : (
                <EmptyState title={copy.noSelectionTitle} message={copy.noSelectionMessage} />
              )}
            </div>
          </section>
        </div>
      )}
    </PagePanel>
  );
}

export default FinancialSettlementsPageRevamp;
