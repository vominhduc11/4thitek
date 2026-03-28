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
  selectClass,
  tableActionSelectClass,
  tableCardClass,
  tableMetaClass,
} from "../components/ui-kit";

const USER_STATUS_OPTIONS: UserStatus[] = ["active", "pending"];
const DEFAULT_ROLE_OPTIONS = [
  "Admin hệ thống",
  "Quản lý sản phẩm",
  "Marketing & Nội dung",
  "CSKH & Bảo hành",
] as const;

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

const roleDescriptionKeys = {
  "Admin hệ thống":
    "Quyền quản trị toàn diện, bao gồm tài khoản nội bộ và cài đặt nhạy cảm.",
  "Quản lý sản phẩm":
    "Phù hợp cho đội phụ trách danh mục, nội dung sản phẩm và trạng thái xuất bản.",
  "Marketing & Nội dung":
    "Dành cho quản lý bài viết, truyền thông và nội dung hiển thị.",
  "CSKH & Bảo hành":
    "Phục vụ theo dõi hỗ trợ, bảo hành và các đầu việc sau bán hàng.",
} as const;

const copyKeys = {
  title: "Người dùng nội bộ",
  description:
    "Quản lý tài khoản admin, vai trò phụ trách và trạng thái kích hoạt một cách nhất quán.",
  searchLabel: "Tìm người dùng",
  searchPlaceholder: "Tìm theo tên, vai trò, email hoặc mã...",
  addUser: "Mời người dùng",
  total: "Tổng tài khoản",
  active: "Đang hoạt động",
  pending: "Chờ duyệt",
  createTitle: "Mời tài khoản mới",
  createDescription:
    "Tài khoản mới sẽ bắt đầu ở trạng thái chờ duyệt cho đến khi được kích hoạt.",
  email: "Email",
  name: "Họ và tên",
  role: "Vai trò",
  rolePlaceholder: "Chọn vai trò",
  save: "Gửi lời mời",
  cancel: "Hủy",
  emailRequired: "Vui lòng nhập email.",
  emailInvalid: "Email không đúng định dạng.",
  nameRequired: "Vui lòng nhập họ và tên.",
  nameShort: "Họ và tên cần có ít nhất 2 ký tự.",
  roleRequired: "Vui lòng chọn vai trò.",
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
  const roleDescriptions = translateCopy(roleDescriptionKeys, t);
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

  const roleOptions = useMemo(() => {
    const existingRoles = users.map((user) => user.role.trim()).filter(Boolean);

    const merged = [...DEFAULT_ROLE_OPTIONS, ...existingRoles];
    return Array.from(new Set(merged));
  }, [users]);

  const searchableUsers = useMemo(
    () =>
      users.map((user) => ({
        user,
        searchText:
          `${user.name} ${user.email} ${user.role} ${user.id}`.toLowerCase(),
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

  const selectedRoleDescription =
    roleDescriptions[form.role as keyof typeof roleDescriptions];

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
              <select
                className={`${selectClass} w-full`}
                onChange={(event) => {
                  clearFieldError("role");
                  setForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }));
                }}
                value={form.role}
              >
                <option value="">{copy.rolePlaceholder}</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {t(role)}
                  </option>
                ))}
              </select>
              {selectedRoleDescription ? (
                <p className="text-sm text-[var(--muted)]">
                  {selectedRoleDescription}
                </p>
              ) : null}
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
                    <p className={`${tableMetaClass} mt-1`}>
                      {user.id} · {t(user.role)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge tone={userStatusTone[user.status]}>
                        {t(userStatusLabel[user.status])}
                      </StatusBadge>
                      <select
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
                        {USER_STATUS_OPTIONS.map((option) => (
                          <option key={`${user.id}-${option}`} value={option}>
                            {t(userStatusLabel[option])}
                          </option>
                        ))}
                      </select>
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
