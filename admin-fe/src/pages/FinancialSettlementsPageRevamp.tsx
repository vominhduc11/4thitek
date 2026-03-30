import { Landmark, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminFinancialSettlements,
  resolveAdminFinancialSettlement,
  type BackendFinancialSettlementResponse,
  type BackendFinancialSettlementStatus,
  type BackendFinancialSettlementType,
} from "../lib/adminApi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import {
  EmptyState,
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  inputClass,
  softCardClass,
  tableActionSelectClass,
  textareaClass,
} from "../components/ui-kit";

const STATUS_OPTIONS: BackendFinancialSettlementStatus[] = [
  "PENDING",
  "REFUNDED",
  "WRITTEN_OFF",
  "CREDITED",
];

const STATUS_RESOLVE_OPTIONS: BackendFinancialSettlementStatus[] = [
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

const copyKeys = {
  title: "Quyết toán tài chính",
  description:
    "Các mục quyết toán tài chính đơn hàng chờ xử lý. Xem xét và giải quyết từng trường hợp.",
  status: "Trạng thái",
  all: "Tất cả",
  pending: "Chờ xử lý",
  refunded: "Đã hoàn tiền",
  writtenOff: "Đã xóa sổ",
  credited: "Đã ghi có",
  orderId: "Mã đơn hàng",
  orderCode: "Mã đơn",
  type: "Loại",
  amount: "Số tiền",
  createdBy: "Tạo bởi",
  createdAt: "Ngày tạo",
  resolution: "Ghi chú xử lý",
  resolvedBy: "Xử lý bởi",
  resolvedAt: "Thời điểm xử lý",
  newStatus: "Trạng thái mới",
  resolutionNote: "Ghi chú (bắt buộc)",
  resolutionPlaceholder: "Mô tả cách xử lý mục quyết toán này...",
  save: "Lưu xử lý",
  reload: "Tải lại",
  emptyTitle: "Không có mục phù hợp",
  emptyMessage: "Thử thay đổi bộ lọc hoặc tải lại dữ liệu.",
  loadTitle: "Không tải được danh sách",
  loadFallback: "Danh sách quyết toán chưa thể tải.",
  saveError: "Không lưu được thay đổi.",
  resolutionRequired: "Ghi chú xử lý là bắt buộc.",
  statPending: "Chờ xử lý",
} as const;

function FinancialSettlementsPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { accessToken } = useAuth();
  const { notify } = useToast();

  const [items, setItems] = useState<BackendFinancialSettlementResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | BackendFinancialSettlementStatus
  >("ALL");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusDraft, setStatusDraft] =
    useState<BackendFinancialSettlementStatus>("REFUNDED");
  const [resolutionDraft, setResolutionDraft] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(
    async (status: "ALL" | BackendFinancialSettlementStatus) => {
      if (!accessToken) return;
      setIsLoading(true);
      setError(null);
      setSaveError(null);
      try {
        const data = await fetchAdminFinancialSettlements(accessToken, {
          status: status === "ALL" ? undefined : status,
        });
        setItems(data);
        setSelectedId(
          (current) => data.find((item) => item.id === current)?.id ?? null,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : copy.loadFallback,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, copy.loadFallback],
  );

  useEffect(() => {
    void load(statusFilter);
  }, [load, statusFilter]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const handleSelect = (item: BackendFinancialSettlementResponse) => {
    setSelectedId(item.id);
    setSaveError(null);
    setStatusDraft(
      item.status === "PENDING" ? "REFUNDED" : (item.status ?? "REFUNDED"),
    );
    setResolutionDraft(item.resolution ?? "");
  };

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING").length,
    [items],
  );
  const statusLabels: Record<BackendFinancialSettlementStatus, string> = {
    PENDING: copy.pending,
    REFUNDED: copy.refunded,
    WRITTEN_OFF: copy.writtenOff,
    CREDITED: copy.credited,
  };
  const typeLabels: Record<BackendFinancialSettlementType, string> = {
    CANCELLATION_REFUND: "Hoàn/điều chỉnh khi hủy đơn",
    STALE_ORDER_REVIEW: "Rà soát đơn quá hạn",
  };
  const settlementTypeLabel = (type?: BackendFinancialSettlementType | null) =>
    type ? typeLabels[type] ?? type : "—";

  const handleSave = async () => {
    if (!accessToken || !selectedItem) return;
    const trimmedResolution = resolutionDraft.trim();
    if (!trimmedResolution) {
      notify(copy.resolutionRequired, { title: copy.title, variant: "error" });
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      const updated = await resolveAdminFinancialSettlement(
        accessToken,
        selectedItem.id,
        {
          status: statusDraft,
          resolution: trimmedResolution,
        },
      );
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedId(updated.id);
    } catch (saveError) {
      setSaveError(t("Lưu không thành công. Vui lòng thử lại."));
      notify(saveError instanceof Error ? saveError.message : copy.saveError, {
        title: copy.title,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
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
          message={t("Vui lòng kiểm tra kết nối và thử lại.")}
          onRetry={() => void load(statusFilter)}
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
        <div className="flex shrink-0 items-center gap-2">
          <select
            aria-label={copy.status}
            className={`${inputClass} w-auto`}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "ALL" | BackendFinancialSettlementStatus,
              )
            }
          >
            <option value="ALL">{copy.all}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s] ?? copy.pending}
              </option>
            ))}
          </select>
          <GhostButton
            onClick={() => void load(statusFilter)}
            aria-label={copy.reload}
          >
            <RefreshCw className="h-4 w-4" />
          </GhostButton>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Landmark}
          label={copy.statPending}
          value={String(items.length)}
          hint={`${pendingCount} ${copy.pending}`}
          tone="warning"
        />
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start">
          {/* List */}
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
                        isSelected
                          ? "bg-[var(--accent-soft)]/40"
                          : "hover:bg-[var(--surface)]",
                      ].join(" ")}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">
                            {item.orderCode ?? `#${item.id}`}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {settlementTypeLabel(item.type)}
                            {item.createdBy ? ` · ${item.createdBy}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-[var(--ink)]">
                            {item.amount != null
                              ? formatCurrency(Number(item.amount))
                              : "—"}
                          </span>
                          <StatusBadge
                            tone={statusTone[item.status ?? "PENDING"]}
                          >
                            {statusLabels[item.status ?? "PENDING"] ??
                              copy.pending}
                          </StatusBadge>
                        </div>
                      </div>
                      {item.createdAt && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {copy.createdAt}: {formatDateTime(item.createdAt)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detail / resolve panel */}
          {selectedItem && (
            <div className={`${softCardClass} w-full xl:w-96 xl:shrink-0`}>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {selectedItem.orderCode ?? `#${selectedItem.id}`}
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                {[
                  {
                    label: copy.type,
                    value: settlementTypeLabel(selectedItem.type),
                  },
                  {
                    label: copy.amount,
                    value:
                      selectedItem.amount != null
                        ? formatCurrency(Number(selectedItem.amount))
                        : "—",
                  },
                  {
                    label: copy.orderCode,
                    value: selectedItem.orderCode ?? "—",
                  },
                  {
                    label: copy.createdBy,
                    value: selectedItem.createdBy ?? "—",
                  },
                  {
                    label: copy.createdAt,
                    value: selectedItem.createdAt
                      ? formatDateTime(selectedItem.createdAt)
                      : "—",
                  },
                  ...(selectedItem.resolution
                    ? [
                        {
                          label: copy.resolution,
                          value: selectedItem.resolution,
                        },
                      ]
                    : []),
                  ...(selectedItem.resolvedBy
                    ? [
                        {
                          label: copy.resolvedBy,
                          value: selectedItem.resolvedBy,
                        },
                      ]
                    : []),
                  ...(selectedItem.resolvedAt
                    ? [
                        {
                          label: copy.resolvedAt,
                          value: formatDateTime(selectedItem.resolvedAt),
                        },
                      ]
                    : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">{label}</dt>
                    <dd className="text-right font-medium text-[var(--ink)]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              {selectedItem.status === "PENDING" && (
                <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
                  <div>
                    <label
                      htmlFor="settle-status"
                      className="mb-1 block text-xs font-semibold text-[var(--muted)]"
                    >
                      {copy.newStatus}
                    </label>
                    <select
                      id="settle-status"
                      className={`${tableActionSelectClass} w-full`}
                      value={statusDraft}
                      onChange={(e) => {
                        setSaveError(null);
                        setStatusDraft(
                          e.target.value as BackendFinancialSettlementStatus,
                        );
                      }}
                    >
                      {STATUS_RESOLVE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s === "REFUNDED"
                            ? copy.refunded
                            : s === "WRITTEN_OFF"
                              ? copy.writtenOff
                              : copy.credited}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="settle-note"
                      className="mb-1 block text-xs font-semibold text-[var(--muted)]"
                    >
                      {copy.resolutionNote}
                    </label>
                    <textarea
                      id="settle-note"
                      className={textareaClass}
                      placeholder={copy.resolutionPlaceholder}
                      value={resolutionDraft}
                      onChange={(e) => {
                        setSaveError(null);
                        setResolutionDraft(e.target.value);
                      }}
                      rows={3}
                    />
                  </div>
                  <PrimaryButton
                    onClick={() => void handleSave()}
                    disabled={isSaving || !resolutionDraft.trim()}
                    className="w-full"
                  >
                    {copy.save}
                  </PrimaryButton>
                  {saveError ? (
                    <FieldErrorMessage>{saveError}</FieldErrorMessage>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PagePanel>
  );
}

export default FinancialSettlementsPageRevamp;
