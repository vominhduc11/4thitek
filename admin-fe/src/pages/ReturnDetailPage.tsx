import { ArrowLeft, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  completeAdminReturnRequest,
  fetchAdminReturnDetail,
  inspectAdminReturnItem,
  receiveAdminReturnRequest,
  reviewAdminReturnRequest,
  type BackendAdminInspectReturnItemRequest,
  type BackendReturnRequestDetailResponse,
  type BackendReturnRequestItemFinalResolution,
  type BackendRmaAction,
} from "../lib/adminApi";
import { formatDateTime } from "../lib/formatters";
import {
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

const toDisplay = (value?: string | null) => (value ? value.replaceAll("_", " ") : "-");

const parseAmount = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
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
        (item) => item.id && (item.itemStatus === "REQUESTED" || item.itemStatus === "APPROVED"),
      ),
    [detail?.items],
  );

  const receivableItems = useMemo(
    () => (detail?.items ?? []).filter((item) => item.id && item.itemStatus === "APPROVED"),
    [detail?.items],
  );

  const inspectableItems = useMemo(
    () =>
      (detail?.items ?? []).filter(
        (item) =>
          item.id &&
          (item.itemStatus === "RECEIVED" ||
            item.itemStatus === "INSPECTING" ||
            item.itemStatus === "QC_FAILED" ||
            item.itemStatus === "QC_PASSED"),
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

    const requestPayload: BackendAdminInspectReturnItemRequest = {
      rmaAction: draft.rmaAction,
      reason: draft.reason.trim(),
      proofUrls: draft.proofUrls
        .split(/[\n,]/g)
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
      finalResolution: draft.finalResolution || undefined,
      replacementOrderId: draft.replacementOrderId.trim()
        ? Number(draft.replacementOrderId.trim())
        : undefined,
      refundAmount: parseAmount(draft.refundAmount),
      creditAmount: parseAmount(draft.creditAmount),
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

  return (
    <PagePanel>
      <PageHeader
        title={detail.requestCode ?? `Return #${detail.id}`}
        subtitle={`Dealer: ${detail.dealerName ?? "-"} • Order: ${detail.orderCode ?? "-"}`}
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={softCardClass}>
          <p className={tableMetaClass}>Status</p>
          <div className="mt-2">
            <StatusBadge tone={statusTone[detail.status ?? "SUBMITTED"]}>
              {toDisplay(detail.status)}
            </StatusBadge>
          </div>
        </article>
        <article className={softCardClass}>
          <p className={tableMetaClass}>Type</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">
            {toDisplay(detail.type)}
          </p>
        </article>
        <article className={softCardClass}>
          <p className={tableMetaClass}>Requested Resolution</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">
            {toDisplay(detail.requestedResolution)}
          </p>
        </article>
        <article className={softCardClass}>
          <p className={tableMetaClass}>Requested At</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">
            {detail.requestedAt ? formatDateTime(detail.requestedAt) : "-"}
          </p>
        </article>
      </div>

      <section className={`${softCardClass} mt-4`}>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Request Details
        </h3>
        <div className="mt-3 grid gap-2 text-sm text-[var(--ink)] md:grid-cols-2">
          <p>
            <span className={tableMetaClass}>Reason code:</span>{" "}
            {detail.reasonCode ?? "-"}
          </p>
          <p>
            <span className={tableMetaClass}>Support ticket:</span>{" "}
            {detail.supportTicketId ?? "-"}
          </p>
          <p className="md:col-span-2">
            <span className={tableMetaClass}>Reason detail:</span>{" "}
            {detail.reasonDetail ?? "-"}
          </p>
        </div>
      </section>

      <section className={`${softCardClass} mt-4`}>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Attachments
        </h3>
        <div className="mt-3 space-y-2">
          {(detail.attachments ?? []).length === 0 ? (
            <p className={tableMetaClass}>No attachments.</p>
          ) : (
            (detail.attachments ?? []).map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] hover:border-[var(--accent)]"
              >
                {(attachment.fileName ?? attachment.url ?? "Attachment")} •{" "}
                {toDisplay(attachment.category)}
              </a>
            ))
          )}
        </div>
      </section>

      <section className={`${softCardClass} mt-4`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Review
          </h3>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={awaitingReceipt}
              onChange={(event) => setAwaitingReceipt(event.target.checked)}
            />
            Await physical receipt
          </label>
        </div>
        <div className="mt-3 space-y-3">
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
                      {item.productName ?? "-"} • {item.productSku ?? "-"}
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
      </section>

      <section className={`${softCardClass} mt-4`}>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Receipt
        </h3>
        <div className="mt-3 space-y-2">
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
      </section>

      <section className={`${softCardClass} mt-4`}>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Inspection
        </h3>
        <div className="mt-3 space-y-4">
          {inspectableItems.length === 0 ? (
            <p className={tableMetaClass}>No items available for inspection.</p>
          ) : (
            inspectableItems.map((item) => {
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
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] px-3 py-3"
                >
                  <p className="font-semibold text-[var(--ink)]">
                    {item.serialSnapshot ?? `Item #${item.id}`}
                  </p>
                  <p className={tableMetaClass}>
                    Current status: {toDisplay(item.itemStatus)}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <select
                      className={inputClass}
                      value={draft.rmaAction}
                      onChange={(event) =>
                        setInspectDrafts((current) => ({
                          ...current,
                          [item.id!]: {
                            ...draft,
                            rmaAction: event.target.value as BackendRmaAction,
                          },
                        }))
                      }
                    >
                      <option value="START_INSPECTION">START INSPECTION</option>
                      <option value="PASS_QC">PASS QC</option>
                      <option value="SCRAP">SCRAP</option>
                    </select>
                    <select
                      className={inputClass}
                      value={draft.finalResolution}
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
                      <option value="">Auto from RMA action</option>
                      <option value="RESTOCK">RESTOCK</option>
                      <option value="REPLACE">REPLACE</option>
                      <option value="CREDIT_NOTE">CREDIT NOTE</option>
                      <option value="REFUND">REFUND</option>
                      <option value="SCRAP">SCRAP</option>
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
      </section>

      <section className={`${softCardClass} mt-4`}>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Complete Request
        </h3>
        <textarea
          className={`${textareaClass} mt-3 min-h-[72px]`}
          placeholder="Completion note"
          value={completeNote}
          onChange={(event) => setCompleteNote(event.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <PrimaryButton
            type="button"
            disabled={isSaving}
            onClick={() => void submitComplete()}
          >
            Complete
          </PrimaryButton>
        </div>
      </section>

      <section className={`${softCardClass} mt-4`}>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Timeline
        </h3>
        <div className="mt-3 space-y-2">
          {(detail.events ?? []).length === 0 ? (
            <p className={tableMetaClass}>No timeline events.</p>
          ) : (
            (detail.events ?? []).map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-[var(--border)] px-3 py-3"
              >
                <p className="font-semibold text-[var(--ink)]">
                  {event.eventType ?? "-"}
                </p>
                <p className={tableMetaClass}>
                  {(event.actorRole ?? "SYSTEM")} • {event.actor ?? "-"} •{" "}
                  {event.createdAt ? formatDateTime(event.createdAt) : "-"}
                </p>
                {event.payloadJson ? (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-[var(--muted)]">
                    {event.payloadJson}
                  </pre>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </PagePanel>
  );
}

export default ReturnDetailPage;
