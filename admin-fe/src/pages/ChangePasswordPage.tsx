import { KeyRound, Lock, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoCard from "../assets/images/logo-4t.png";
import {
  FieldErrorMessage,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from "../components/ui-kit";
import { BRAND_NAME } from "../config/businessProfile";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { changeAdminPassword } from "../lib/adminApi";

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { notify } = useToast();
  const { accessToken, completePasswordChange, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("Vui lòng nhập đầy đủ thông tin."));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("Mật khẩu mới phải có ít nhất 8 ký tự."));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("Xác nhận mật khẩu không khớp."));
      return;
    }
    if (!accessToken) {
      setError(t("Phiên đăng nhập không còn hợp lệ."));
      return;
    }

    setIsSubmitting(true);
    try {
      await changeAdminPassword(accessToken, {
        currentPassword,
        newPassword,
      });
      completePasswordChange();
      notify(t("Mật khẩu đã được cập nhật."), {
        title: "Security",
        variant: "success",
      });
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("Không thể cập nhật mật khẩu."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(41,171,226,0.12),transparent_28%),linear-gradient(135deg,var(--app-bg),var(--surface)_46%,rgba(41,171,226,0.08))] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-[16vmax] -top-[20vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(41,171,226,0.18),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[22vmax] -right-[14vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(0,113,188,0.14),transparent_60%)] animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute inset-0 opacity-18 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(63,72,86,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,72,86,0.08)_1px,transparent_1px)]" />
      </div>

      <main className="brand-admin-panel relative w-full max-w-md rounded-[28px] border border-[var(--brand-border)] p-6 shadow-[0_24px_54px_rgba(11,24,38,0.14)] backdrop-blur sm:p-8">
        <header className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img
              src={logoCard}
              alt={BRAND_NAME}
              className="h-auto w-[min(11rem,60vw)] max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,113,188,0.18)] sm:w-48 md:w-52"
            />
          </div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-[var(--brand-border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
            Security setup
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            {t("Đổi mật khẩu lần đầu")}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t(
              "Tài khoản quản trị cần cập nhật mật khẩu trước khi tiếp tục sử dụng hệ thống.",
            )}
          </p>
        </header>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="current-password">
              {t("Mật khẩu hiện tại")}
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="current-password"
                autoComplete="current-password"
                className={`${inputClass} w-full pl-10 pr-4`}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder={t("Nhập mật khẩu hiện tại")}
                type="password"
                value={currentPassword}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="new-password">
              {t("Mật khẩu mới")}
            </label>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="new-password"
                autoComplete="new-password"
                className={`${inputClass} w-full pl-10 pr-4`}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={t("Tối thiểu 8 ký tự")}
                type="password"
                value={newPassword}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="confirm-password">
              {t("Xác nhận mật khẩu mới")}
            </label>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="confirm-password"
                autoComplete="new-password"
                className={`${inputClass} w-full pl-10 pr-4`}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t("Nhập lại mật khẩu mới")}
                type="password"
                value={confirmPassword}
              />
            </div>
          </div>

          {error ? <FieldErrorMessage>{error}</FieldErrorMessage> : null}

          <button
            className={`${primaryButtonClass} w-full`}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t("Đang cập nhật...") : t("Cập nhật mật khẩu")}
          </button>

          <button
            className={`${ghostButtonClass} w-full`}
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {t("Đăng xuất")}
          </button>
        </form>
      </main>
    </div>
  );
}

export default ChangePasswordPage;
