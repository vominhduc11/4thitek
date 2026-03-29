import { ArrowLeft, Phone, UserCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdminData, type DealerStatus } from "../context/AdminDataContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import {
  dealerStatusDescription,
  dealerStatusLabel,
  dealerStatusTone,
  getAllowedDealerStatuses,
} from "../lib/adminLabels";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import {
  EmptyState,
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  StatusBadge,
  fieldErrorClass,
  inputClass,
  labelClass,
} from "../components/ui-kit";
import { useConfirmDialog } from "../hooks/useConfirmDialog";

function DealerDetailPage() {
  const { id = "" } = useParams();
  const dealerId = decodeURIComponent(id);
  const { t } = useLanguage();
  const { notify } = useToast();
  const {
    dealers,
    dealersState,
    updateDealer,
    updateDealerStatus,
    reloadResource,
  } = useAdminData();
  const { confirm, confirmDialog } = useConfirmDialog();
  const dealer = dealers.find((item) => item.id === dealerId);
  const [form, setForm] = useState({
    creditLimit: "",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<"creditLimit", string>>
  >({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const isDirty = useMemo(
    () =>
      Boolean(
        dealer &&
          form.creditLimit !==
            (dealer.creditLimit > 0 ? String(dealer.creditLimit) : ""),
      ),
    [dealer, form],
  );

  const validateForm = (value: typeof form) => {
    const errors: Partial<Record<"creditLimit", string>> = {};
    if (value.creditLimit.trim()) {
      const nextCreditLimit = Number(value.creditLimit);
      if (Number.isNaN(nextCreditLimit) || nextCreditLimit < 0) {
        errors.creditLimit = t("Hạn mức công nợ phải là số không âm.");
      }
    }
    return errors;
  };

  const updateFormField = <K extends keyof typeof form>(
    field: K,
    nextValue: (typeof form)[K],
  ) => {
    setForm((previous) => {
      const next = { ...previous, [field]: nextValue };
      setFormErrors(validateForm(next));
      return next;
    });
  };

  useEffect(() => {
    if (!dealer) {
      return;
    }
    setForm({
      creditLimit: dealer.creditLimit > 0 ? String(dealer.creditLimit) : "",
    });
  }, [dealer]);

  if (dealersState.status === "loading" || dealersState.status === "idle") {
    return (
      <PagePanel>
        <LoadingRows rows={4} />
      </PagePanel>
    );
  }

  if (dealersState.status === "error") {
    return (
      <PagePanel>
        <ErrorState
          title={t("Không thể tải đại lý")}
          message={dealersState.error || t("Không tải được đại lý")}
          onRetry={() => void reloadResource("dealers")}
        />
      </PagePanel>
    );
  }

  if (!dealer) {
    return (
      <PagePanel>
        <EmptyState
          title={t("Không tìm thấy đại lý")}
          message={t("Đại lý {id} không tồn tại.", { id: dealerId })}
        />
      </PagePanel>
    );
  }
  const availableTransitions =
    dealer.allowedTransitions ?? getAllowedDealerStatuses(dealer.status);

  const handleSaveProfile = async () => {
    const nextErrors = validateForm(form);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const creditLimit = form.creditLimit.trim() ? Number(form.creditLimit) : 0;
    setIsSavingProfile(true);
    try {
      await updateDealer(dealer.id, {
        creditLimit,
      });
      setFormErrors({});
      notify(t("Đã cập nhật {id}", { id: dealer.id }), {
        title: t("Đại lý"),
        variant: "success",
      });
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : t("Không cập nhật được đại lý"),
        {
          title: t("Đại lý"),
          variant: "error",
        },
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900"
          to="/dealers"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Về đại lý")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={dealerStatusTone[dealer.status]}>
            {t(dealerStatusLabel[dealer.status])}
          </StatusBadge>
        </div>
      </div>

      {isDirty ? (
        <div
          className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
          role="status"
        >
          {t("Có thay đổi chưa lưu trong hồ sơ đại lý.")}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <UserCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {dealer.id}
              </p>
              <h3 className="text-xl font-semibold text-slate-900">
                {dealer.businessName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {dealer.contactName}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Email
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {dealer.email}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Phone
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {dealer.phone}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t("Đơn hàng")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {dealer.orders}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t("Doanh thu")}
              </p>
              <p className="mt-1 font-semibold text-[var(--accent)]">
                {formatCurrency(dealer.revenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t("Hạn mức công nợ")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {dealer.creditLimit > 0
                  ? formatCurrency(dealer.creditLimit)
                  : t("Chưa đặt")}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {t("Lần mua gần nhất")}: {formatDateTime(dealer.lastOrderAt)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-sm font-semibold text-slate-900">
            {t("Cập nhật trạng thái hồ sơ")}
          </p>
          <select
            aria-label={t("Trạng thái đại lý {id}", { id: dealer.id })}
            className={`${inputClass} mt-3 w-full bg-white text-slate-700`}
            onChange={async (event) => {
              const next = event.target.value as DealerStatus;
              if (next === dealer.status) {
                return;
              }

              let suspensionReason: string | undefined;
              if (next === "suspended") {
                const rawReason = window.prompt(t("MĂ´ táº£ lĂ½ do..."), "");
                if (rawReason == null) {
                  event.currentTarget.value = dealer.status;
                  return;
                }
                suspensionReason = rawReason.trim();
                if (!suspensionReason) {
                  notify(t("Vui lĂ²ng nháº­p lĂ½ do."), {
                    title: t("Äáº¡i lĂ½"),
                    variant: "error",
                  });
                  event.currentTarget.value = dealer.status;
                  return;
                }
              }

              const approved = await confirm({
                title: t("Xác nhận đổi trạng thái"),
                message: t('Chuyển đại lý này sang trạng thái "{status}"?', {
                  status: t(dealerStatusLabel[next]),
                }),
                tone: next === "suspended" ? "danger" : "info",
                confirmLabel: t(dealerStatusLabel[next]),
              });

              if (!approved) {
                event.currentTarget.value = dealer.status;
                return;
              }

              try {
                await updateDealerStatus(dealer.id, next, suspensionReason);
                notify(
                  t("Cập nhật {id} -> {status}", {
                    id: dealer.id,
                    status: t(dealerStatusLabel[next]),
                  }),
                  {
                    title: t("Đại lý"),
                    variant: "info",
                  },
                );
              } catch (error) {
                notify(
                  error instanceof Error
                    ? error.message
                    : t("Không cập nhật được trạng thái đại lý"),
                  {
                    title: t("Đại lý"),
                    variant: "error",
                  },
                );
              }
            }}
            value={dealer.status}
          >
            {availableTransitions.map((status) => (
              <option key={status} value={status}>
                {t(dealerStatusLabel[status])}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-slate-500">
            {t(dealerStatusDescription[dealer.status])}
          </p>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-sm font-semibold text-slate-900">
              {t("Cài đặt tài khoản đại lý")}
            </p>
            <div className="mt-3 grid gap-3">
              <label className="space-y-2">
                <span className={labelClass}>{t("Hạn mức công nợ (VND)")}</span>
                <input
                  aria-describedby={
                    formErrors.creditLimit ? "dealer-credit-error" : undefined
                  }
                  aria-invalid={Boolean(formErrors.creditLimit)}
                  className={`${inputClass} bg-white text-slate-700 ${formErrors.creditLimit ? "border-rose-300" : ""}`}
                  onChange={(event) =>
                    updateFormField("creditLimit", event.target.value)
                  }
                  type="number"
                  value={form.creditLimit}
                />
                {formErrors.creditLimit ? (
                  <FieldErrorMessage
                    className={fieldErrorClass}
                    id="dealer-credit-error"
                  >
                    {formErrors.creditLimit}
                  </FieldErrorMessage>
                ) : null}
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <PrimaryButton
                disabled={isSavingProfile || !isDirty}
                onClick={() => void handleSaveProfile()}
                type="button"
              >
                {isSavingProfile ? t("Đang lưu...") : t("Lưu thay đổi")}
              </PrimaryButton>
              {isDirty ? (
                <GhostButton
                  onClick={() => {
                    setForm({
                      creditLimit:
                        dealer.creditLimit > 0
                          ? String(dealer.creditLimit)
                          : "",
                    });
                    setFormErrors({});
                  }}
                  type="button"
                >
                  {t("Hoàn tác")}
                </GhostButton>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-[var(--surface-muted)] p-3 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Phone className="h-4 w-4" />
              {t("Liên hệ nhanh")}
            </div>
            <p className="mt-2 text-xs text-slate-500">Email: {dealer.email}</p>
            <p className="text-xs text-slate-500">
              {t("Hotline")}: {dealer.phone}
            </p>
          </div>
        </div>
      </div>
      {confirmDialog}
    </PagePanel>
  );
}

export default DealerDetailPage;
