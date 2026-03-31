import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminData, type UserStatus } from "../context/AdminDataContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { userStatusLabel, userStatusTone } from "../lib/adminLabels";
import {
  EmptyState,
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PageHeader,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  formCardClass,
  inputClass,
  labelClass,
  tableActionSelectClass,
  tableCardClass,
  tableMetaClass,
} from "../components/ui-kit";

const USER_STATUS_OPTIONS: UserStatus[] = ["active", "pending"];

type InviteForm = {
  email: string;
  name: string;
  role: string;
};

type InviteFormErrors = Partial<Record<keyof InviteForm, string>>;

const initialForm: InviteForm = {
  email: "",
  name: "",
  role: "",
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const copyKeys = {
  title: "Người dùng nội bộ",
  description:
    "Quản lý tài khoản admin, chức danh hiển thị nội bộ và trạng thái kích hoạt. Quyền truy cập thật chỉ dựa trên vai trò hệ thống ở backend.",
  searchLabel: "Tìm người dùng",
  searchPlaceholder: "Tìm theo tên, chức danh, vai trò hệ thống, email hoặc mã...",
  addUser: "Mời người dùng",
  total: "Tổng tài khoản",
  active: "Đang hoạt động",
  pending: "Chờ duyệt",
  createTitle: "Mời tài khoản mới",
  createDescription:
    "Tài khoản mới sẽ bắt đầu ở trạng thái chờ duyệt cho đến khi được kích hoạt.",
  email: "Email",
  name: "Họ và tên",
  role: "Chức danh hiển thị",
  systemRole: "Vai trò hệ thống",
  systemRoleDescription:
    "Quyền backend thật. Tài khoản mới tạo từ màn này luôn mang ADMIN; SUPER_ADMIN không được gán tại đây.",
  rolePlaceholder: "Ví dụ: Hỗ trợ đại lý",
  roleHint:
    "Chỉ dùng để hiển thị nội bộ; quyền thật vẫn do role hệ thống ADMIN hoặc SUPER_ADMIN quyết định.",
  displayTitleLabel: "Chức danh",
  save: "Gửi lời mời",
  cancel: "Hủy",
  emailRequired: "Vui lòng nhập email.",
  emailInvalid: "Email không đúng định dạng.",
  nameRequired: "Vui lòng nhập họ và tên.",
  nameShort: "Họ và tên cần có ít nhất 2 ký tự.",
  roleRequired: "Vui lòng nhập chức danh hiển thị.",
  emptyTitle: "Không có người dùng phù hợp",
  emptyMessage: "Thử đổi từ khóa tìm kiếm hoặc mời thêm người dùng.",
  loadTitle: "Không tải được người dùng",
  loadFallback: "Danh sách người dùng chưa thể tải.",
  confirmTitle: "Xác nhận đổi trạng thái người dùng",
  confirmMessage: 'Chuyển tài khoản này sang trạng thái "{status}"?',
  inviteSuccess: "Đã gửi lời mời người dùng mới.",
  inviteFailed: "Không thể gửi lời mời người dùng.",
} as const;

const getInviteFormErrors = (copy: typeof copyKeys, form: InviteForm) => {
  const nextErrors: InviteFormErrors = {};

  if (!form.email.trim()) {
    nextErrors.email = copy.emailRequired;
  } else if (!isValidEmail(form.email.trim())) {
    nextErrors.email = copy.emailInvalid;
  }

  if (!form.name.trim()) {
    nextErrors.name = copy.nameRequired;
  } else if (form.name.trim().length < 2) {
    nextErrors.name = copy.nameShort;
  }

  if (!form.role.trim()) {
    nextErrors.role = copy.roleRequired;
  }

  return nextErrors;
};

function UsersPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const { users, usersState, addUser, updateUserStatus, reloadResource } =
    useAdminData();
  const [query, setQuery] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [formErrors, setFormErrors] = useState<InviteFormErrors>({});
  const [form, setForm] = useState<InviteForm>(initialForm);
  const toolbarSearchClass = "w-full sm:max-w-sm lg:w-72 xl:w-80";

  const normalizedQuery = query.trim().toLowerCase();

  const searchableUsers = useMemo(
    () =>
      users.map((user) => ({
        user,
        searchText:
          `${user.name} ${user.email} ${user.role} ${user.systemRole} ${user.id}`.toLowerCase(),
      })),
    [users],
  );

  const filteredUsers = useMemo(
    () =>
      searchableUsers
        .filter(({ searchText }) =>
          !normalizedQuery ? true : searchText.includes(normalizedQuery),
        )
        .map(({ user }) => user),
    [normalizedQuery, searchableUsers],
  );

  const stats = useMemo(
    () => ({
      active: users.filter((item) => item.status === "active").length,
      pending: users.filter((item) => item.status === "pending").length,
    }),
    [users],
  );

  const clearFieldError = (field: keyof InviteForm) => {
    setFormErrors((previous) => {
      if (!(field in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const resetInviteForm = () => {
    setForm(initialForm);
    setFormErrors({});
  };

  const handleInvite = async () => {
    const nextErrors = getInviteFormErrors(copy, form);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await addUser({
        email: form.email.trim(),
        name: form.name.trim(),
        role: form.role.trim(),
      });
      notify(copy.inviteSuccess, { title: copy.title, variant: "success" });
      setShowInvite(false);
      resetInviteForm();
    } catch (saveError) {
      notify(
        saveError instanceof Error ? saveError.message : copy.inviteFailed,
        {
          title: copy.title,
          variant: "error",
        },
      );
    }
  };

  if (usersState.status === "loading" || usersState.status === "idle") {
    return (
      <PagePanel>
        <LoadingRows rows={5} />
      </PagePanel>
    );
  }

  if (usersState.status === "error") {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={usersState.error || copy.loadFallback}
          onRetry={() => void reloadResource("users")}
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
              id="users-search"
              label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={toolbarSearchClass}
            />
            <PrimaryButton
              icon={<UserPlus className="h-4 w-4" />}
              onClick={() => {
                setShowInvite((current) => {
                  const nextValue = !current;
                  if (!nextValue) {
                    resetInviteForm();
                  }
                  return nextValue;
                });
              }}
              type="button"
            >
              {copy.addUser}
            </PrimaryButton>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label={copy.total} value={users.length} />
        <StatCard
          icon={ShieldCheck}
          label={copy.active}
          value={stats.active}
          tone="success"
        />
        <StatCard label={copy.pending} value={stats.pending} tone="info" />
      </div>

      {showInvite ? (
        <div className={`${formCardClass} mt-6`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={cardTitleClass}>{copy.createTitle}</p>
              <p className={bodyTextClass}>{copy.createDescription}</p>
            </div>
            <StatusBadge tone="warning">
              {t(userStatusLabel.pending)}
            </StatusBadge>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 md:col-span-2">
              <p className={labelClass}>{copy.systemRole}</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">ADMIN</p>
              <p className={`${tableMetaClass} mt-1`}>
                {copy.systemRoleDescription}
              </p>
            </div>

            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>{copy.email}</span>
              <input
                autoComplete="email"
                className={inputClass}
                onChange={(event) => {
                  clearFieldError("email");
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }));
                }}
                placeholder="name@example.com"
                type="email"
                value={form.email}
              />
              {formErrors.email ? (
                <FieldErrorMessage>{formErrors.email}</FieldErrorMessage>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className={labelClass}>{copy.name}</span>
              <input
                autoComplete="name"
                className={inputClass}
                onChange={(event) => {
                  clearFieldError("name");
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
                }}
                value={form.name}
              />
              {formErrors.name ? (
                <FieldErrorMessage>{formErrors.name}</FieldErrorMessage>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className={labelClass}>{copy.role}</span>
              <input
                className={inputClass}
                onChange={(event) => {
                  clearFieldError("role");
                  setForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }));
                }}
                placeholder={copy.rolePlaceholder}
                type="text"
                value={form.role}
              />
              <p className="text-sm text-[var(--muted)]">{copy.roleHint}</p>
              {formErrors.role ? (
                <FieldErrorMessage>{formErrors.role}</FieldErrorMessage>
              ) : null}
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <PrimaryButton
              className="w-full sm:w-auto"
              onClick={() => void handleInvite()}
              type="button"
            >
              {copy.save}
            </PrimaryButton>
            <GhostButton
              className="w-full sm:w-auto"
              onClick={() => {
                setShowInvite(false);
                resetInviteForm();
              }}
              type="button"
            >
              {copy.cancel}
            </GhostButton>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={copy.emptyTitle}
            message={copy.emptyMessage}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => (
              <article key={user.id} className={tableCardClass}>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--ink)]">
                      {user.name}
                    </p>
                    <p className={tableMetaClass}>{user.email}</p>
                    <p className={`${tableMetaClass} mt-1`}>{user.id}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge tone="info">
                        {copy.systemRole}: {user.systemRole}
                      </StatusBadge>
                      <StatusBadge tone="neutral">
                        {copy.displayTitleLabel}: {user.role}
                      </StatusBadge>
                      <StatusBadge tone={userStatusTone[user.status]}>
                        {t(userStatusLabel[user.status])}
                      </StatusBadge>
                      {user.systemRole !== "SUPER_ADMIN" && <select
                        aria-label={`${copy.title} ${user.id}`}
                        className={tableActionSelectClass}
                        onChange={async (event) => {
                          const next = event.target.value as UserStatus;
                          if (next === user.status) return;

                          const approved = await confirm({
                            title: copy.confirmTitle,
                            message: copy.confirmMessage.replace(
                              "{status}",
                              t(userStatusLabel[next]),
                            ),
                            tone: next === "pending" ? "warning" : "info",
                            confirmLabel: t(userStatusLabel[next]),
                          });

                          if (!approved) {
                            event.currentTarget.value = user.status;
                            return;
                          }

                          try {
                            await updateUserStatus(user.id, next);
                          } catch (updateError) {
                            notify(
                              updateError instanceof Error
                                ? updateError.message
                                : copy.loadFallback,
                              {
                                title: copy.title,
                                variant: "error",
                              },
                            );
                          }
                        }}
                        value={user.status}
                      >
                        {USER_STATUS_OPTIONS.filter(
                          (option) => !(user.status === "active" && option === "pending"),
                        ).map((option) => (
                          <option key={`${user.id}-${option}`} value={option}>
                            {t(userStatusLabel[option])}
                          </option>
                        ))}
                      </select>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {confirmDialog}
    </PagePanel>
  );
}

export default UsersPageRevamp;
