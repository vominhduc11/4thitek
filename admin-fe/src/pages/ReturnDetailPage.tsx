import { ArrowLeft, Link as LinkIcon, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CollapsibleSection,
  ErrorState,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PrimaryButton,
  StatusBadge,
  inputClass,
  softCardClass,
  tableMetaClass,
  textareaClass,
} from "../components/ui-kit";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  completeAdminReturnRequest,
  fetchAdminReturnDetail,
  inspectAdminReturnItem,
  receiveAdminReturnRequest,
  reviewAdminReturnRequest,
  type BackendAdminInspectReturnItemRequest,
  type BackendReturnRequestAttachmentResponse,
  type BackendReturnRequestDetailResponse,
  type BackendReturnRequestEventResponse,
  type BackendReturnRequestItemFinalResolution,
  type BackendReturnRequestItemResponse,
  type BackendRmaAction,
} from "../lib/adminApi";
import { formatDateTime } from "../lib/formatters";

type ReviewDraft = {
  approved: boolean;
  note: string;
};

type InspectDraft = {
  rmaAction: BackendRmaAction;
  reason: string;
  proofUrls: string;
  finalResolution: "" | BackendReturnRequestItemFinalResolution;
  replacementOrderId: string;
  refundAmount: string;
  creditAmount: string;
};

const statusTone = {
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
} as const;

const itemStatusTone = {
  REQUESTED: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  RECEIVED: "info",
  INSPECTING: "warning",
  QC_PASSED: "success",
  QC_FAILED: "danger",
  RESTOCKED: "success",
  SCRAPPED: "danger",
  REPLACED: "success",
  CREDITED: "neutral",
} as const;

const toDisplay = (value?: string | null) =>
  value ? value.replaceAll("_", " ") : "-";

const parseAmount = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeEventPayload = (payloadJson?: string | null) => {
  if (!payloadJson) {
    return null;
  }
  try {
    const parsed = JSON.parse(payloadJson) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const entries = Object.entries(parsed).filter(([, value]) => value != null);
    return entries.slice(0, 5);
  } catch {
    return null;
  }
};

const inferResolutionFromAction = (
  action: BackendRmaAction,
): BackendReturnRequestItemFinalResolution | "" => {
  if (action === "PASS_QC") return "RESTOCK";
  if (action === "SCRAP") return "SCRAP";
  return "";
};

const allowedResolutionsForAction = (
  action: BackendRmaAction,
): BackendReturnRequestItemFinalResolution[] => {
  if (action === "PASS_QC") {
    return ["RESTOCK"];
  }
  if (action === "SCRAP") {
    return ["SCRAP", "REPLACE", "CREDIT_NOTE", "REFUND"];
  }
  return [];
};

const terminalItemStatuses = new Set<string>([
  "REJECTED",
  "RESTOCKED",
  "SCRAPPED",
  "REPLACED",
  "CREDITED",
]);

const effectiveResolution = (
  draft: InspectDraft,
): BackendReturnRequestItemFinalResolution | "" =>
  draft.finalResolution || inferResolutionFromAction(draft.rmaAction);

const needsReplacementOrder = (
  resolution: BackendReturnRequestItemFinalResolution | "",
) => resolution === "REPLACE";

const needsRefundAmount = (
  resolution: BackendReturnRequestItemFinalResolution | "",
) => resolution === "REFUND";

const needsCreditAmount = (
  resolution: BackendReturnRequestItemFinalResolution | "",
) => resolution === "CREDIT_NOTE";

type SectionLink = {
  id: string;
  label: string;
};

const STEP_LINKS: SectionLink[] = [
  { id: "summary", label: "Summary" },
  { id: "request-details", label: "Request details" },
  { id: "attachments", label: "Attachments" },
  { id: "review", label: "Review" },
  { id: "receipt", label: "Receipt" },
  { id: "inspection", label: "Inspection" },
  { id: "complete", label: "Complete request" },
  { id: "timeline", label: "Timeline" },
];

const DetailStatCard = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <article className={softCardClass}>
    <p className={tableMetaClass}>{label}</p>
    <p className="mt-2 font-semibold text-[var(--ink)]">{value}</p>
  </article>
);

const KeyValueRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <p className={tableMetaClass}>{label}</p>
    <p className="mt-1 text-sm text-[var(--ink)]">{value}</p>
  </div>
);

const AttachmentCard = ({
  attachment,
}: {
  attachment: BackendReturnRequestAttachmentResponse;
}) => {
  const label =
    attachment.fileName?.trim() || attachment.url?.trim() || "Attachment";
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-ghost)] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-[var(--ink)]">{label}</p>
          <p className={tableMetaClass}>{toDisplay(attachment.category)}</p>
          {attachment.itemId ? (
            <p className={tableMetaClass}>Linked item #{attachment.itemId}</p>
          ) : null}
        </div>
        {attachment.url ? (
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--border)] px-2 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Open
          </a>
        ) : null}
      </div>
    </article>
  );
};

const TimelineEventCard = ({ event }: { event: BackendReturnRequestEventResponse }) => {
  const normalizedPayload = normalizeEventPayload(event.payloadJson);
  return (
    <article className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-ghost)] px-4 py-3">
      <span className="absolute -left-1.5 top-5 h-3 w-3 rounded-full bg-[var(--accent)]" />
      <p className="font-semibold text-[var(--ink)]">{toDisplay(event.eventType)}</p>
      <p className={tableMetaClass}>
        {event.actorRole ?? "SYSTEM"} | {event.actor ?? "-"} |{" "}
        {event.createdAt ? formatDateTime(event.createdAt) : "-"}
      </p>
      {normalizedPayload && normalizedPayload.length > 0 ? (
        <dl className="mt-2 grid gap-1 text-xs text-[var(--muted)] sm:grid-cols-2">
          {normalizedPayload.map(([key, value]) => (
            <div key={`${event.id}-${key}`}>
              <dt className="font-semibold text-[var(--ink)]">{key}</dt>
              <dd className="break-words">{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {event.payloadJson ? (
        <details className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--muted)] focus-visible:outline-none">
            Raw details
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-[var(--muted)]">
            {event.payloadJson}
          </pre>
        </details>
      ) : null}
    </article>
  );
};

function ReturnDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const requestId = Number(id);

  const [detail, setDetail] = useState<BackendReturnRequestDetailResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, ReviewDraft>>({});
  const [awaitingReceipt, setAwaitingReceipt] = useState(true);
  const [receiveItemIds, setReceiveItemIds] = useState<Set<number>>(new Set());
  const [inspectDrafts, setInspectDrafts] = useState<Record<number, InspectDraft>>(
    {},
  );
  const [completeNote, setCompleteNote] = useState("");

  const loadDetail = useCallback(async () => {
    if (!accessToken || !Number.isFinite(requestId) || requestId <= 0) {
      setError("Invalid return request id.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchAdminReturnDetail(accessToken, requestId);
      setDetail(response);
      const nextReviewDrafts: Record<number, ReviewDraft> = {};
      const nextInspectDrafts: Record<number, InspectDraft> = {};
      for (const item of response.items ?? []) {
        if (!item.id) continue;
        nextReviewDrafts[item.id] = {
          approved: item.itemStatus !== "REJECTED",
          note: item.adminDecisionNote ?? "",
        };
        nextInspectDrafts[item.id] = {
          rmaAction: "START_INSPECTION",
          reason: item.inspectionNote ?? "",
          proofUrls: "",
          finalResolution: "",
          replacementOrderId: "",
          refundAmount: "",
          creditAmount: "",
        };
      }
      setReviewDrafts(nextReviewDrafts);
      setInspectDrafts(nextInspectDrafts);
      setReceiveItemIds(new Set());
      setCompleteNote("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load return request detail.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, requestId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const reviewableItems = useMemo(
    () =>
      (detail?.items ?? []).filter(
        (item) =>
          item.id &&
          (item.itemStatus === "REQUESTED" || item.itemStatus === "APPROVED"),
      ),
    [detail?.items],
  );

  const receivableItems = useMemo(
    () =>
      (detail?.items ?? []).filter((item) => item.id && item.itemStatus === "APPROVED"),
    [detail?.items],
  );

  const inspectableItems = useMemo(
    () =>
      (detail?.items ?? []).filter(
        (item) =>
          item.id && (item.itemStatus === "RECEIVED" || item.itemStatus === "INSPECTING"),
      ),
    [detail?.items],
  );

  const hasUnresolvedItems = useMemo(
    () =>
      (detail?.items ?? []).some(
        (item) => !item.itemStatus || !terminalItemStatuses.has(item.itemStatus),
      ),
    [detail?.items],
  );

  const outcomeItems = useMemo(
    () =>
      (detail?.items ?? []).filter(
        (item) =>
          item.finalResolution ||
          item.replacementOrderId != null ||
          item.refundAmount != null ||
          item.creditAmount != null ||
          item.orderAdjustmentId != null,
      ),
    [detail?.items],
  );

  const submitReview = async () => {
    if (!accessToken || !detail) return;
    const decisions: Array<{
      itemId: number;
      approved: boolean;
      decisionNote?: string;
    }> = [];
    for (const item of reviewableItems) {
      if (!item.id) continue;
      const draft = reviewDrafts[item.id];
      if (!draft) continue;
      decisions.push({
        itemId: item.id,
        approved: draft.approved,
        decisionNote: draft.note.trim() || undefined,
      });
    }
    if (decisions.length === 0) {
      notify("No reviewable items selected.", {
        title: "Returns",
        variant: "info",
      });
      return;
    }
    setIsSaving(true);
    try {
      const updated = await reviewAdminReturnRequest(accessToken, detail.id, {
        decisions,
        awaitingReceipt,
      });
      setDetail(updated);
      notify("Review saved.", { title: "Returns", variant: "success" });
    } catch (saveError) {
      notify(
        saveError instanceof Error ? saveError.message : "Unable to review return request.",
        { title: "Returns", variant: "error" },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const submitReceive = async () => {
    if (!accessToken || !detail) return;
    setIsSaving(true);
    try {
      const itemIds =
        receiveItemIds.size > 0 ? Array.from(receiveItemIds.values()) : undefined;
      const updated = await receiveAdminReturnRequest(accessToken, detail.id, {
        itemIds,
      });
      setDetail(updated);
      setReceiveItemIds(new Set());
      notify("Receipt recorded.", { title: "Returns", variant: "success" });
    } catch (saveError) {
      notify(
        saveError instanceof Error ? saveError.message : "Unable to mark items as received.",
        { title: "Returns", variant: "error" },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const submitInspect = async (itemId: number) => {
    if (!accessToken || !detail) return;
    const draft = inspectDrafts[itemId];
    if (!draft || draft.reason.trim().length === 0) {
      notify("Inspection reason is required.", {
        title: "Returns",
        variant: "error",
      });
      return;
    }

    const selectedResolution = effectiveResolution(draft);
    const replacementOrderId = draft.replacementOrderId.trim()
      ? Number(draft.replacementOrderId.trim())
      : undefined;
    const refundAmount = parseAmount(draft.refundAmount);
    const creditAmount = parseAmount(draft.creditAmount);

    if (draft.rmaAction === "PASS_QC" && selectedResolution !== "RESTOCK") {
      notify("PASS_QC only supports RESTOCK resolution.", {
        title: "Returns",
        variant: "error",
      });
      return;
    }
    if (draft.rmaAction === "SCRAP" && selectedResolution === "RESTOCK") {
      notify("SCRAP action cannot use RESTOCK resolution.", {
        title: "Returns",
        variant: "error",
      });
      return;
    }
    if (needsReplacementOrder(selectedResolution) && (!replacementOrderId || replacementOrderId <= 0)) {
      notify("Replacement order id must be a positive number.", {
        title: "Returns",
        variant: "error",
      });
      return;
    }
    if (needsRefundAmount(selectedResolution) && (refundAmount == null || refundAmount <= 0)) {
      notify("Refund amount must be greater than 0.", {
        title: "Returns",
        variant: "error",
      });
      return;
    }
    if (needsCreditAmount(selectedResolution) && (creditAmount == null || creditAmount <= 0)) {
      notify("Credit amount must be greater than 0.", {
        title: "Returns",
        variant: "error",
      });
      return;
    }

    const requestPayload: BackendAdminInspectReturnItemRequest = {
      rmaAction: draft.rmaAction,
      reason: draft.reason.trim(),
      proofUrls: draft.proofUrls
        .split(/[\n,]/g)
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
      finalResolution: selectedResolution || undefined,
      replacementOrderId: needsReplacementOrder(selectedResolution)
        ? replacementOrderId
        : undefined,
      refundAmount: needsRefundAmount(selectedResolution) ? refundAmount : undefined,
      creditAmount: needsCreditAmount(selectedResolution) ? creditAmount : undefined,
    };

    setIsSaving(true);
    try {
      const updated = await inspectAdminReturnItem(
        accessToken,
        detail.id,
        itemId,
        requestPayload,
      );
      setDetail(updated);
      notify("Inspection update applied.", {
        title: "Returns",
        variant: "success",
      });
    } catch (saveError) {
      notify(
        saveError instanceof Error ? saveError.message : "Unable to inspect return item.",
        { title: "Returns", variant: "error" },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const submitComplete = async () => {
    if (!accessToken || !detail) return;
    setIsSaving(true);
    try {
      const updated = await completeAdminReturnRequest(accessToken, detail.id, {
        note: completeNote.trim() || undefined,
      });
      setDetail(updated);
      notify("Return request completed.", {
        title: "Returns",
        variant: "success",
      });
    } catch (saveError) {
      notify(
        saveError instanceof Error ? saveError.message : "Unable to complete return request.",
        { title: "Returns", variant: "error" },
      );
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

  if (error || !detail) {
    return (
      <PagePanel>
        <ErrorState
          title="Unable to load return request"
          message={error ?? "The return request was not found."}
          onRetry={() => void loadDetail()}
        />
      </PagePanel>
    );
  }

  const requestStatus = detail.status ?? "SUBMITTED";

  return (
    <PagePanel>
      <PageHeader
        title={detail.requestCode ?? `Return #${detail.id}`}
        subtitle={`Dealer: ${detail.dealerName ?? "-"} | Order: ${detail.orderCode ?? "-"}`}
        actions={
          <>
            <GhostButton
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/returns")}
              type="button"
            >
              Back
            </GhostButton>
            <GhostButton
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void loadDetail()}
              type="button"
            >
              Reload
            </GhostButton>
          </>
        }
      />

      <nav
        aria-label="Return workflow sections"
        className="mb-4 flex gap-2 overflow-x-auto pb-1"
      >
        {STEP_LINKS.map((step) => (
          <a
            key={step.id}
            href={`#${step.id}`}
            className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {step.label}
          </a>
        ))}
      </nav>

      <div className="space-y-4">
        <CollapsibleSection id="summary" title="Summary" defaultExpanded>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className={softCardClass}>
              <p className={tableMetaClass}>Status</p>
              <div className="mt-2">
                <StatusBadge tone={statusTone[requestStatus]}>
                  {toDisplay(detail.status)}
                </StatusBadge>
              </div>
            </article>
            <DetailStatCard label="Type" value={toDisplay(detail.type)} />
            <DetailStatCard
              label="Requested resolution"
              value={toDisplay(detail.requestedResolution)}
            />
            <DetailStatCard
              label="Requested at"
              value={detail.requestedAt ? formatDateTime(detail.requestedAt) : "-"}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="request-details" title="Request details" defaultExpanded>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <KeyValueRow label="Reason code" value={detail.reasonCode ?? "-"} />
            <div>
              <p className={tableMetaClass}>Support ticket</p>
              {detail.supportTicketId ? (
                <button
                  type="button"
                  className="mt-1 text-sm font-semibold text-[var(--accent)] hover:underline"
                  onClick={() => navigate(`/support-tickets?ticketId=${detail.supportTicketId}`)}
                >
                  #{detail.supportTicketId}
                </button>
              ) : (
                <p className="mt-1 text-sm text-[var(--ink)]">-</p>
              )}
            </div>
            <KeyValueRow label="Created by" value={detail.createdBy ?? "-"} />
            <KeyValueRow
              label="Created at"
              value={detail.createdAt ? formatDateTime(detail.createdAt) : "-"}
            />
            <KeyValueRow
              label="Updated at"
              value={detail.updatedAt ? formatDateTime(detail.updatedAt) : "-"}
            />
            <KeyValueRow label="Updated by" value={detail.updatedBy ?? "-"} />
            <div className="md:col-span-2 xl:col-span-3">
              <KeyValueRow label="Reason detail" value={detail.reasonDetail ?? "-"} />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="attachments"
          title="Attachments"
          description="Evidence and request files submitted by dealer/admin"
          defaultExpanded
        >
          {(detail.attachments ?? []).length === 0 ? (
            <p className={tableMetaClass}>No attachments.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(detail.attachments ?? []).map((attachment) => (
                <AttachmentCard key={attachment.id} attachment={attachment} />
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          id="review"
          title="Review"
          description="Approve or reject requested items"
          defaultExpanded
          actions={
            <label className="inline-flex items-center gap-2 text-xs text-[var(--ink)]">
              <input
                type="checkbox"
                checked={awaitingReceipt}
                onChange={(event) => setAwaitingReceipt(event.target.checked)}
              />
              Await physical receipt
            </label>
          }
        >
          <div className="space-y-3">
            {(detail.items ?? []).map((item) => {
              if (!item.id) return null;
              const draft = reviewDrafts[item.id] ?? { approved: true, note: "" };
              const isReviewable =
                item.itemStatus === "REQUESTED" || item.itemStatus === "APPROVED";
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">
                        {item.serialSnapshot ?? `Item #${item.id}`}
                      </p>
                      <p className={tableMetaClass}>
                        {item.productName ?? "-"} | {item.productSku ?? "-"}
                      </p>
                    </div>
                    <StatusBadge tone={itemStatusTone[item.itemStatus ?? "REQUESTED"]}>
                      {toDisplay(item.itemStatus)}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-[12rem_1fr]">
                    <select
                      className={inputClass}
                      value={draft.approved ? "APPROVE" : "REJECT"}
                      disabled={!isReviewable}
                      onChange={(event) =>
                        setReviewDrafts((current) => ({
                          ...current,
                          [item.id!]: {
                            ...draft,
                            approved: event.target.value === "APPROVE",
                          },
                        }))
                      }
                    >
                      <option value="APPROVE">Approve</option>
                      <option value="REJECT">Reject</option>
                    </select>
                    <input
                      className={inputClass}
                      placeholder="Decision note"
                      disabled={!isReviewable}
                      value={draft.note}
                      onChange={(event) =>
                        setReviewDrafts((current) => ({
                          ...current,
                          [item.id!]: { ...draft, note: event.target.value },
                        }))
                      }
                    />
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <PrimaryButton
              type="button"
              disabled={isSaving || reviewableItems.length === 0}
              onClick={() => void submitReview()}
            >
              Save Review
            </PrimaryButton>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="receipt"
          title="Receipt"
          description="Confirm which approved items were physically received"
          defaultExpanded={receivableItems.length > 0}
        >
          <div className="space-y-2">
            {receivableItems.length === 0 ? (
              <p className={tableMetaClass}>No approved items pending receipt.</p>
            ) : (
              receivableItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)]"
                >
                  <input
                    type="checkbox"
                    checked={item.id ? receiveItemIds.has(item.id) : false}
                    onChange={(event) =>
                      setReceiveItemIds((current) => {
                        const next = new Set(current);
                        if (!item.id) return next;
                        if (event.target.checked) {
                          next.add(item.id);
                        } else {
                          next.delete(item.id);
                        }
                        return next;
                      })
                    }
                  />
                  {item.serialSnapshot ?? `Item #${item.id}`}
                </label>
              ))
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <PrimaryButton
              type="button"
              disabled={isSaving || receivableItems.length === 0}
              onClick={() => void submitReceive()}
            >
              Mark Received
            </PrimaryButton>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="inspection"
          title="Inspection"
          description="Apply RMA actions and final outcomes per item"
          defaultExpanded={inspectableItems.length > 0}
        >
          <div className="space-y-4">
            {outcomeItems.length > 0 ? (
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-ghost)] px-3 py-3">
                <p className="font-semibold text-[var(--ink)]">Recorded outcomes</p>
                <div className="mt-2 space-y-2">
                  {outcomeItems.map((item) => (
                    <div
                      key={`outcome-${item.id}`}
                      className="rounded-lg border border-[var(--border)] px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {item.serialSnapshot ?? `Item #${item.id}`}
                      </p>
                      {item.finalResolution ? (
                        <p className={tableMetaClass}>
                          Current resolution: {toDisplay(item.finalResolution)}
                        </p>
                      ) : null}
                      {item.replacementOrderId ? (
                        <p className={tableMetaClass}>
                          Replacement order #{item.replacementOrderId}
                        </p>
                      ) : null}
                      {item.refundAmount != null ? (
                        <p className={tableMetaClass}>Refund amount: {item.refundAmount}</p>
                      ) : null}
                      {item.creditAmount != null ? (
                        <p className={tableMetaClass}>Credit amount: {item.creditAmount}</p>
                      ) : null}
                      {item.orderAdjustmentId ? (
                        <p className={tableMetaClass}>
                          Adjustment reference #{item.orderAdjustmentId}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
            {inspectableItems.length === 0 ? (
              <p className={tableMetaClass}>No items available for inspection.</p>
            ) : (
              inspectableItems.map((item: BackendReturnRequestItemResponse) => {
                if (!item.id) return null;
                const draft = inspectDrafts[item.id] ?? {
                  rmaAction: "START_INSPECTION",
                  reason: "",
                  proofUrls: "",
                  finalResolution: "",
                  replacementOrderId: "",
                  refundAmount: "",
                  creditAmount: "",
                };
                const selectedResolution = effectiveResolution(draft);
                const allowedResolutions = allowedResolutionsForAction(draft.rmaAction);
                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[var(--border)] px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          {item.serialSnapshot ?? `Item #${item.id}`}
                        </p>
                        <p className={tableMetaClass}>
                          Current status: {toDisplay(item.itemStatus)}
                        </p>
                        {item.finalResolution ? (
                          <p className={tableMetaClass}>
                            Current resolution: {toDisplay(item.finalResolution)}
                          </p>
                        ) : null}
                        {item.replacementOrderId ? (
                          <p className={tableMetaClass}>
                            Replacement order #{item.replacementOrderId}
                          </p>
                        ) : null}
                        {item.refundAmount != null ? (
                          <p className={tableMetaClass}>Refund amount: {item.refundAmount}</p>
                        ) : null}
                        {item.creditAmount != null ? (
                          <p className={tableMetaClass}>Credit amount: {item.creditAmount}</p>
                        ) : null}
                        {item.orderAdjustmentId ? (
                          <p className={tableMetaClass}>
                            Adjustment reference #{item.orderAdjustmentId}
                          </p>
                        ) : null}
                      </div>
                      <StatusBadge tone={itemStatusTone[item.itemStatus ?? "REQUESTED"]}>
                        {toDisplay(item.itemStatus)}
                      </StatusBadge>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <select
                        className={inputClass}
                        value={draft.rmaAction}
                        onChange={(event) => {
                          const nextAction = event.target.value as BackendRmaAction;
                          const nextAllowedResolutions = allowedResolutionsForAction(nextAction);
                          const retainedResolution =
                            draft.finalResolution &&
                            nextAllowedResolutions.includes(draft.finalResolution)
                              ? draft.finalResolution
                              : "";
                          const nextResolution =
                            nextAction === "PASS_QC"
                              ? "RESTOCK"
                              : nextAction === "START_INSPECTION"
                                ? ""
                                : retainedResolution;
                          setInspectDrafts((current) => ({
                            ...current,
                            [item.id!]: {
                              ...draft,
                              rmaAction: nextAction,
                              finalResolution: nextResolution,
                              replacementOrderId:
                                nextResolution === "REPLACE"
                                  ? draft.replacementOrderId
                                  : "",
                              refundAmount:
                                nextResolution === "REFUND" ? draft.refundAmount : "",
                              creditAmount:
                                nextResolution === "CREDIT_NOTE"
                                  ? draft.creditAmount
                                  : "",
                            },
                          }));
                        }}
                      >
                        <option value="START_INSPECTION">Start inspection</option>
                        <option value="PASS_QC">Pass QC</option>
                        <option value="SCRAP">Scrap</option>
                      </select>
                      <select
                        className={inputClass}
                        value={draft.finalResolution}
                        disabled={draft.rmaAction === "START_INSPECTION"}
                        onChange={(event) =>
                          setInspectDrafts((current) => ({
                            ...current,
                            [item.id!]: {
                              ...draft,
                              finalResolution:
                                event.target.value as InspectDraft["finalResolution"],
                            },
                          }))
                        }
                      >
                        {draft.rmaAction === "START_INSPECTION" ? (
                          <option value="">Not applicable</option>
                        ) : (
                          <option value="">Auto from RMA action</option>
                        )}
                        {allowedResolutions.map((resolution) => (
                          <option key={`${item.id}-${resolution}`} value={resolution}>
                            {toDisplay(resolution)}
                          </option>
                        ))}
                      </select>
                      <input
                        className={inputClass}
                        placeholder="Reason (required)"
                        value={draft.reason}
                        onChange={(event) =>
                          setInspectDrafts((current) => ({
                            ...current,
                            [item.id!]: { ...draft, reason: event.target.value },
                          }))
                        }
                      />

                      {needsReplacementOrder(selectedResolution) ? (
                        <input
                          className={inputClass}
                          placeholder="Replacement order id"
                          value={draft.replacementOrderId}
                          onChange={(event) =>
                            setInspectDrafts((current) => ({
                              ...current,
                              [item.id!]: {
                                ...draft,
                                replacementOrderId: event.target.value,
                              },
                            }))
                          }
                        />
                      ) : null}

                      {needsRefundAmount(selectedResolution) ? (
                        <input
                          className={inputClass}
                          placeholder="Refund amount"
                          value={draft.refundAmount}
                          onChange={(event) =>
                            setInspectDrafts((current) => ({
                              ...current,
                              [item.id!]: { ...draft, refundAmount: event.target.value },
                            }))
                          }
                        />
                      ) : null}

                      {needsCreditAmount(selectedResolution) ? (
                        <input
                          className={inputClass}
                          placeholder="Credit amount"
                          value={draft.creditAmount}
                          onChange={(event) =>
                            setInspectDrafts((current) => ({
                              ...current,
                              [item.id!]: { ...draft, creditAmount: event.target.value },
                            }))
                          }
                        />
                      ) : null}
                    </div>
                    <textarea
                      className={`${textareaClass} mt-2 min-h-[72px]`}
                      placeholder="Proof URLs (comma or newline separated)"
                      value={draft.proofUrls}
                      onChange={(event) =>
                        setInspectDrafts((current) => ({
                          ...current,
                          [item.id!]: { ...draft, proofUrls: event.target.value },
                        }))
                      }
                    />
                    <div className="mt-3 flex justify-end">
                      <PrimaryButton
                        type="button"
                        disabled={isSaving}
                        onClick={() => void submitInspect(item.id!)}
                      >
                        Apply Inspection
                      </PrimaryButton>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="complete"
          title="Complete request"
          description="Finalize request after review, receipt, and inspection"
          defaultExpanded={requestStatus !== "COMPLETED" && requestStatus !== "CANCELLED"}
        >
          <textarea
            className={`${textareaClass} min-h-[72px]`}
            placeholder="Completion note"
            value={completeNote}
            onChange={(event) => setCompleteNote(event.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <PrimaryButton
              type="button"
              disabled={isSaving || hasUnresolvedItems}
              onClick={() => void submitComplete()}
            >
              Complete
            </PrimaryButton>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="timeline"
          title="Timeline"
          description="Operational history for this request"
          defaultExpanded
        >
          <div className="relative space-y-3 border-l border-[var(--border)] pl-4">
            {(detail.events ?? []).length === 0 ? (
              <p className={tableMetaClass}>No timeline events.</p>
            ) : (
              (detail.events ?? []).map((event) => (
                <TimelineEventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </CollapsibleSection>
      </div>
    </PagePanel>
  );
}

export default ReturnDetailPage;
