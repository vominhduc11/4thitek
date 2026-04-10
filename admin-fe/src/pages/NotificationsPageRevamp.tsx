import { Megaphone, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAdminNotificationDispatch,
  fetchAllAdminNotifications,
  fetchAdminNotifications,
  type BackendNotificationCreateRequest,
  type BackendNotificationResponse,
  type BackendNotifyType,
} from "../lib/adminApi";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { formatDateTime } from "../lib/formatters";
import {
  EmptyState,
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PaginationNav,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
  fieldErrorClass,
  formCardClass,
  inputClass,
  labelClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  textareaClass,
} from "../components/ui-kit";
import { subscribeAdminRealtimeNotification } from "../lib/adminRealtime";

const AUDIENCE_OPTIONS: BackendNotificationCreateRequest["audience"][] = [
  "DEALERS",
  "ALL_ACCOUNTS",
  "ACCOUNTS",
];

const TYPE_OPTIONS: BackendNotifyType[] = [
  "SYSTEM",
  "PROMOTION",
  "ORDER",
  "WARRANTY",
];

const typeTone = {
  SYSTEM: "neutral",
  PROMOTION: "warning",
  ORDER: "info",
  WARRANTY: "success",
} as const;

const audienceLabelsKeys = {
  DEALERS: "Đại lý",
  ALL_ACCOUNTS: "Tất cả tài khoản",
  ACCOUNTS: "Tài khoản cụ thể",
} as const;

const typeLabelsKeys = {
  SYSTEM: "Hệ thống",
  PROMOTION: "Khuyến mãi",
  ORDER: "Đơn hàng",
  WARRANTY: "Bảo hành",
} as const;

const TITLE_MAX = 120;
const CONTENT_MAX = 500;

type NotificationFormState = {
  audience: BackendNotificationCreateRequest["audience"];
  type: BackendNotifyType;
  title: string;
  content: string;
  link: string;
  deepLink: string;
  accountIdsText: string;
};

const createInitialForm = (): NotificationFormState => ({
  audience: "DEALERS",
  type: "SYSTEM",
  title: "",
  content: "",
  link: "",
  deepLink: "",
  accountIdsText: "",
});

const copyKeys = {
  title: "Thông báo",
  description:
    "Gửi thông báo chủ động theo nhóm nhận và kiểm tra lịch sử thông báo đã phát đi.",
  searchLabel: "Tìm thông báo",
  searchPlaceholder: "Tìm tiêu đề, tài khoản, nội dung...",
  audience: "Đối tượng",
  type: "Loại",
  content: "Nội dung",
  link: "Liên kết",
  deepLink: "Deep link",
  accountIds: "Danh sách ID tài khoản",
  send: "Gửi thông báo",
  currentPage: "Trang hiện tại",
  unread: "Chưa đọc",
  promotions: "Khuyến mãi",
  emptyTitle: "Chưa có thông báo",
  emptyMessage: "Tạo thông báo đầu tiên hoặc tải lại dữ liệu.",
  loadTitle: "Không tải được thông báo",
  loadFallback: "Danh sách thông báo chưa thể tải.",
  createTitle: "Tạo chiến dịch thông báo",
  titleLabel: "Tiêu đề",
  account: "Tài khoản",
  created: "Tạo lúc",
  next: "Tiếp",
  previous: "Trước",
  statusRead: "Đã đọc",
  statusUnread: "Chưa đọc",
  validationError: "Vui lòng nhập đủ tiêu đề và nội dung.",
  titleRequired: "Vui lòng nhập tiêu đề.",
  contentRequired: "Vui lòng nhập nội dung.",
  accountIdsRequired: "Vui lòng nhập ít nhất một ID tài khoản hợp lệ.",
  contentError: "Tiêu đề hoặc nội dung vượt quá giới hạn cho phép.",
  reload: "Tải lại",
  openLink: "Mở liên kết",
} as const;

const renderNavigationLink = (
  value: string | null | undefined,
  label: string,
  className: string,
) => {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return (
      <a className={className} href={value} rel="noreferrer" target="_blank">
        {label}: {value}
      </a>
    );
  }

  return (
    <Link className={className} to={value}>
      {label}: {value}
    </Link>
  );
};

function NotificationsPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const audienceLabels = translateCopy(audienceLabelsKeys, t);
  const typeLabels = translateCopy(typeLabelsKeys, t);
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState<BackendNotificationResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [allItems, setAllItems] = useState<BackendNotificationResponse[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NotificationFormState>(createInitialForm);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof NotificationFormState, string>>
  >({});
  const toolbarSearchClass = "w-full sm:max-w-sm lg:w-72 xl:w-80";
  const hasSearchQuery = query.trim().length > 0;

  const validateForm = (value: NotificationFormState) => {
    const errors: Partial<Record<keyof NotificationFormState, string>> = {};
    const accountIds =
      value.audience === "ACCOUNTS"
        ? value.accountIdsText
            .split(/[,\n]+/)
            .map((entry) => Number(entry.trim()))
            .filter((entry) => Number.isFinite(entry))
        : [];

    if (!value.title.trim()) {
      errors.title = copy.titleRequired;
    } else if (value.title.trim().length > TITLE_MAX) {
      errors.title = copy.contentError;
    }

    if (!value.content.trim()) {
      errors.content = copy.contentRequired;
    } else if (value.content.trim().length > CONTENT_MAX) {
      errors.content = copy.contentError;
    }

    if (value.audience === "ACCOUNTS" && accountIds.length === 0) {
      errors.accountIdsText = copy.accountIdsRequired;
    }

    return errors;
  };

  const updateFormField = <K extends keyof NotificationFormState>(
    field: K,
    nextValue: NotificationFormState[K],
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: nextValue };
      setFormErrors(validateForm(next));
      return next;
    });
  };

  const loadData = useCallback(
    async (nextPage: number) => {
      if (!accessToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchAdminNotifications(accessToken, {
          page: nextPage,
          size: 25,
        });
        setItems(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
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
    void loadData(page);
  }, [loadData, page]);

  const loadAllItems = useCallback(async () => {
    if (!accessToken) return;
    setIsSearchLoading(true);
    setError(null);
    try {
      const response = await fetchAllAdminNotifications(accessToken, 100);
      setAllItems(response);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : copy.loadFallback,
      );
    } finally {
      setIsSearchLoading(false);
    }
  }, [accessToken, copy.loadFallback]);

  useEffect(() => {
    if (!hasSearchQuery) {
      setAllItems([]);
      setIsSearchLoading(false);
      setError(null);
      return;
    }

    void loadAllItems();
  }, [hasSearchQuery, loadAllItems]);

  useEffect(() => {
    return subscribeAdminRealtimeNotification(() => {
      void loadData(page);
      if (hasSearchQuery) {
        void loadAllItems();
      }
    });
  }, [hasSearchQuery, loadAllItems, loadData, page]);

  const sourceItems = hasSearchQuery ? allItems : items;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sourceItems.filter((item) => {
      const haystack = [
        item.title,
        item.body,
        item.link,
        item.deepLink,
        item.accountName,
        item.accountType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return !normalizedQuery || haystack.includes(normalizedQuery);
    });
  }, [query, sourceItems]);

  const stats = useMemo(
    () => ({
      total: sourceItems.length,
      unread: sourceItems.filter((item) => !item.isRead).length,
      promotions: sourceItems.filter((item) => item.type === "PROMOTION")
        .length,
    }),
    [sourceItems],
  );

  const handleReload = useCallback(async () => {
    await loadData(page);
    if (hasSearchQuery) {
      await loadAllItems();
    }
  }, [hasSearchQuery, loadAllItems, loadData, page]);

  const handleSend = async () => {
    if (!accessToken) return;
    const nextErrors = validateForm(form);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const accountIds =
      form.audience === "ACCOUNTS"
        ? form.accountIdsText
            .split(/[,\n]+/)
            .map((value) => Number(value.trim()))
            .filter((value) => Number.isFinite(value))
        : undefined;

    setIsSending(true);
    try {
      await createAdminNotificationDispatch(accessToken, {
        audience: form.audience,
        title: form.title.trim(),
        body: form.content.trim(),
        type: form.type,
        link: form.link.trim() || undefined,
        deepLink: form.deepLink.trim() || undefined,
        accountIds,
      });
      setForm(createInitialForm());
      setFormErrors({});
      setPage(0);
      await loadData(0);
      if (hasSearchQuery) {
        await loadAllItems();
      }
    } catch (sendError) {
      notify(
        sendError instanceof Error ? sendError.message : copy.loadFallback,
        {
          title: copy.title,
          variant: "error",
        },
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || isSearchLoading) {
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
          onRetry={() => void handleReload()}
        />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        subtitle={copy.description}
        actions={
          <>
            <SearchInput
              id="notifications-search"
              label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={toolbarSearchClass}
            />
            <GhostButton
              aria-label={copy.reload}
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void handleReload()}
              type="button"
            >
              {copy.reload}
            </GhostButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Megaphone}
          label={copy.currentPage}
          value={stats.total}
          tone="neutral"
        />
        <StatCard
          icon={Megaphone}
          label={copy.unread}
          value={stats.unread}
          tone="warning"
        />
        <StatCard
          icon={Megaphone}
          label={copy.promotions}
          value={stats.promotions}
          tone="info"
        />
      </div>

      <div className={`${formCardClass} mt-6`}>
        <p className="text-sm font-semibold text-[var(--ink)]">
          {copy.createTitle}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-2" htmlFor="notification-audience">
            <span className={labelClass}>{copy.audience}</span>
            <select
              id="notification-audience"
              aria-label={copy.audience}
              className={inputClass}
              value={form.audience}
              onChange={(event) =>
                updateFormField(
                  "audience",
                  event.target
                    .value as BackendNotificationCreateRequest["audience"],
                )
              }
            >
              {AUDIENCE_OPTIONS.map((audience) => (
                <option key={audience} value={audience}>
                  {audienceLabels[audience]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2" htmlFor="notification-type">
            <span className={labelClass}>{copy.type}</span>
            <select
              id="notification-type"
              aria-label={copy.type}
              className={inputClass}
              value={form.type}
              onChange={(event) =>
                updateFormField("type", event.target.value as BackendNotifyType)
              }
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label
            className="space-y-2 md:col-span-2"
            htmlFor="notification-title"
          >
            <span className={labelClass}>{copy.titleLabel}</span>
            <input
              id="notification-title"
              aria-describedby={
                formErrors.title ? "notification-title-error" : undefined
              }
              aria-invalid={Boolean(formErrors.title)}
              className={`${inputClass} ${formErrors.title ? "border-rose-300" : ""}`}
              maxLength={TITLE_MAX}
              value={form.title}
              onChange={(event) => updateFormField("title", event.target.value)}
            />
            {formErrors.title ? (
              <FieldErrorMessage
                className={fieldErrorClass}
                id="notification-title-error"
              >
                {formErrors.title}
              </FieldErrorMessage>
            ) : null}
          </label>
          <label
            className="space-y-2 md:col-span-2"
            htmlFor="notification-content"
          >
            <span className={labelClass}>{copy.content}</span>
            <textarea
              id="notification-content"
              aria-describedby={
                formErrors.content ? "notification-content-error" : undefined
              }
              aria-invalid={Boolean(formErrors.content)}
              className={`${textareaClass} ${formErrors.content ? "border-rose-300" : ""}`}
              maxLength={CONTENT_MAX}
              value={form.content}
              onChange={(event) =>
                updateFormField("content", event.target.value)
              }
            />
            {formErrors.content ? (
              <FieldErrorMessage
                className={fieldErrorClass}
                id="notification-content-error"
              >
                {formErrors.content}
              </FieldErrorMessage>
            ) : null}
          </label>
          <label className="space-y-2" htmlFor="notification-link">
            <span className={labelClass}>{copy.link}</span>
            <input
              id="notification-link"
              aria-label={copy.link}
              className={inputClass}
              value={form.link}
              onChange={(event) => updateFormField("link", event.target.value)}
            />
          </label>
          <label className="space-y-2" htmlFor="notification-deep-link">
            <span className={labelClass}>{copy.deepLink}</span>
            <input
              id="notification-deep-link"
              aria-label={copy.deepLink}
              className={inputClass}
              value={form.deepLink}
              onChange={(event) =>
                updateFormField("deepLink", event.target.value)
              }
            />
          </label>
          {form.audience === "ACCOUNTS" ? (
            <label className="space-y-2" htmlFor="notification-account-ids">
              <span className={labelClass}>{copy.accountIds}</span>
              <input
                id="notification-account-ids"
                aria-describedby={
                  formErrors.accountIdsText
                    ? "notification-account-ids-error"
                    : undefined
                }
                aria-invalid={Boolean(formErrors.accountIdsText)}
                className={`${inputClass} ${formErrors.accountIdsText ? "border-rose-300" : ""}`}
                value={form.accountIdsText}
                onChange={(event) =>
                  updateFormField("accountIdsText", event.target.value)
                }
              />
              {formErrors.accountIdsText ? (
                <FieldErrorMessage
                  className={fieldErrorClass}
                  id="notification-account-ids-error"
                >
                  {formErrors.accountIdsText}
                </FieldErrorMessage>
              ) : null}
            </label>
          ) : null}
        </div>
        <p className={`mt-2 ${tableMetaClass}`}>
          {form.title.length}/{TITLE_MAX} · {form.content.length}/{CONTENT_MAX}
        </p>
        <div className="mt-4">
          <PrimaryButton
            aria-label={copy.send}
            disabled={isSending}
            icon={<Send className="h-4 w-4" />}
            onClick={() => void handleSend()}
            type="button"
          >
            {isSending ? `${copy.send}...` : copy.send}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6">
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={copy.emptyTitle}
            message={copy.emptyMessage}
          />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredItems.map((item) => (
                <article key={item.id} className={tableCardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">
                        {item.title}
                      </p>
                      <p className={tableMetaClass}>
                        {item.accountName ?? item.accountType ?? "-"}
                      </p>
                    </div>
                    <StatusBadge tone={typeTone[item.type ?? "SYSTEM"]}>
                      {typeLabels[item.type ?? "SYSTEM"]}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--ink)]">{item.body}</p>
                  {renderNavigationLink(
                    item.link,
                    copy.link,
                    `mt-2 block break-all text-xs ${tableMetaClass} underline-offset-2 hover:underline`,
                  )}
                  {renderNavigationLink(
                    item.deepLink,
                    copy.deepLink,
                    `mt-1 block break-all text-xs ${tableMetaClass} underline-offset-2 hover:underline`,
                  )}
                  {item.deepLink || item.link ? (
                    <div className="mt-3">
                      <Link
                        className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        to={item.deepLink ?? item.link ?? "/notifications"}
                      >
                        {copy.openLink}
                      </Link>
                    </div>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <StatusBadge tone={item.isRead ? "neutral" : "warning"}>
                      {item.isRead ? copy.statusRead : copy.statusUnread}
                    </StatusBadge>
                    <span className={tableMetaClass}>
                      {item.createdAt ? formatDateTime(item.createdAt) : "-"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[58rem] border-separate border-spacing-y-2">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="min-w-64 px-3 py-2 font-semibold">
                      {copy.titleLabel}
                    </th>
                    <th className="min-w-40 px-3 py-2 font-semibold">{copy.account}</th>
                    <th className="w-36 px-3 py-2 font-semibold">{copy.type}</th>
                    <th className="w-36 px-3 py-2 font-semibold">
                      {copy.statusRead}
                    </th>
                    <th className="w-40 px-3 py-2 font-semibold">{copy.created}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={tableRowClass}>
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold text-[var(--ink)]">
                          {item.title}
                        </p>
                        <p className={`${tableMetaClass} line-clamp-2`}>
                          {item.body}
                        </p>
                        {renderNavigationLink(
                          item.link,
                          copy.link,
                          `${tableMetaClass} mt-1 block break-all underline-offset-2 hover:underline`,
                        )}
                        {renderNavigationLink(
                          item.deepLink,
                          copy.deepLink,
                          `${tableMetaClass} mt-1 block break-all underline-offset-2 hover:underline`,
                        )}
                        {item.deepLink || item.link ? (
                          <div className="mt-2">
                            <Link
                              className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                              to={item.deepLink ?? item.link ?? "/notifications"}
                            >
                              {copy.openLink}
                            </Link>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <p>{item.accountName ?? "-"}</p>
                        <p className={tableMetaClass}>
                          {item.accountType ?? "-"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={typeTone[item.type ?? "SYSTEM"]}>
                          {typeLabels[item.type ?? "SYSTEM"]}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={item.isRead ? "neutral" : "warning"}>
                          {item.isRead ? copy.statusRead : copy.statusUnread}
                        </StatusBadge>
                      </td>
                      <td className="rounded-r-2xl px-3 py-3 text-sm">
                        {item.createdAt ? formatDateTime(item.createdAt) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!hasSearchQuery ? (
        <PaginationNav
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={25}
          onPageChange={setPage}
          previousLabel={copy.previous}
          nextLabel={copy.next}
        />
      ) : null}
    </PagePanel>
  );
}

export default NotificationsPageRevamp;
