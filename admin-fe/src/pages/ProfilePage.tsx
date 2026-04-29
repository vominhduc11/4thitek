import { KeyRound, ShieldCheck, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader, PagePanel, ghostButtonClass, softCardClass } from "../components/ui-kit";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";

const copyKeys = {
  title: "Hồ sơ tài khoản",
  description: "Thông tin tài khoản quản trị của bạn.",
  username: "Tên đăng nhập",
  role: "Vai trò",
  accountType: "Loại tài khoản",
  roles: "Quyền hạn",
  changePassword: "Đổi mật khẩu",
  security: "Bảo mật",
  securityHint: "Hãy đặt mật khẩu mạnh và không chia sẻ tài khoản với người khác.",
} as const;

function ProfilePage() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { user } = useAuth();

  return (
    <PagePanel>
      <PageHeader title={copy.title} subtitle={copy.description} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section>
          <div className={`${softCardClass} p-5`}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]">
                <UserCircle className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-[var(--ink)]">
                  {user?.username ?? "—"}
                </p>
                <p className="mt-0.5 text-sm text-[var(--muted)]">{user?.role ?? "—"}</p>
              </div>
            </div>

            <dl className="mt-5 divide-y divide-[var(--border)]">
              <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <dt className="text-sm text-[var(--muted)]">{copy.username}</dt>
                <dd className="text-sm font-medium text-[var(--ink)]">{user?.username ?? "—"}</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <dt className="text-sm text-[var(--muted)]">{copy.role}</dt>
                <dd className="text-sm font-medium text-[var(--ink)]">{user?.role ?? "—"}</dd>
              </div>
              {user?.accountType ? (
                <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="text-sm text-[var(--muted)]">{copy.accountType}</dt>
                  <dd className="text-sm font-medium text-[var(--ink)]">{user.accountType}</dd>
                </div>
              ) : null}
              {user?.roles && user.roles.length > 0 ? (
                <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="text-sm text-[var(--muted)]">{copy.roles}</dt>
                  <dd className="flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink)]"
                      >
                        {r}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        <section>
          <div className={`${softCardClass} p-5`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{copy.security}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{copy.securityHint}</p>
              </div>
            </div>
            <div className="mt-5">
              <Link to="/change-password" className={ghostButtonClass}>
                <KeyRound className="h-4 w-4" />
                {copy.changePassword}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PagePanel>
  );
}

export default ProfilePage;
