import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logoCard from "../assets/images/logo-4t.png";
import { FieldErrorMessage, ghostButtonClass, inputClass, primaryButtonClass } from "../components/ui-kit";
import { BRAND_NAME } from "../config/businessProfile";
import { useLanguage } from "../context/LanguageContext";
import { AuthApiError, resetAdminPassword, validateAdminPasswordResetToken } from "../lib/authApi";
import { clearStoredAuthSession } from "../lib/authSession";

const copyByLanguage = {
  vi: {
    pageLabel: "Đặt lại mật khẩu",
    loadingTitle: "Đang kiểm tra liên kết",
    loadingMessage: "Hệ thống đang xác thực tính hợp lệ của liên kết đặt lại mật khẩu.",
    formTitle: "Đặt mật khẩu mới",
    formMessage: "Nhập mật khẩu mới cho tài khoản admin hoặc staff của bạn.",
    expiredTitle: "Liên kết đã hết hạn",
    expiredMessage: "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu liên kết mới từ trang đăng nhập.",
    invalidTitle: "Liên kết không hợp lệ",
    invalidMessage: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.",
    successTitle: "Đặt lại mật khẩu thành công",
    successMessage: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu mới",
    newPasswordPlaceholder: "Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu mới",
    passwordRequired: "Vui lòng nhập mật khẩu mới.",
    confirmRequired: "Vui lòng xác nhận mật khẩu mới.",
    passwordMismatch: "Xác nhận mật khẩu không khớp.",
    genericError: "Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại sau.",
    submit: "Cập nhật mật khẩu",
    submitting: "Đang cập nhật...",
    back: "Quay lại đăng nhập",
  },
  en: {
    pageLabel: "Reset password",
    loadingTitle: "Checking your link",
    loadingMessage: "We are validating your password reset link.",
    formTitle: "Set a new password",
    formMessage: "Enter a new password for your admin or staff account.",
    expiredTitle: "Link expired",
    expiredMessage: "This password reset link has expired. Request a new link from the sign-in page.",
    invalidTitle: "Invalid link",
    invalidMessage: "This password reset link is invalid or has already been used.",
    successTitle: "Password updated",
    successMessage: "Your password has been updated. You can now sign in with the new password.",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    newPasswordPlaceholder: "At least 8 characters with uppercase, lowercase, and a number",
    confirmPasswordPlaceholder: "Re-enter your new password",
    passwordRequired: "Please enter a new password.",
    confirmRequired: "Please confirm your new password.",
    passwordMismatch: "Password confirmation does not match.",
    genericError: "We could not reset your password right now. Please try again later.",
    submit: "Update password",
    submitting: "Updating...",
    back: "Back to sign in",
  },
} as const;

type ResetState = "loading" | "valid" | "expired" | "invalid" | "success";

function ResetPasswordPage() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ResetState>("loading");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const resetToken = searchParams.get("token")?.trim();
    if (!resetToken) {
      setState("invalid");
      return;
    }

    let active = true;
    setToken(resetToken);
    setState("loading");
    setError("");

    void validateAdminPasswordResetToken(resetToken)
      .then((response) => {
        if (!active) {
          return;
        }
        setState(response.status === "valid" ? "valid" : response.status);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setState("invalid");
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPassword.trim()) {
      setError(copy.passwordRequired);
      return;
    }
    if (!confirmPassword.trim()) {
      setError(copy.confirmRequired);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(copy.passwordMismatch);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await resetAdminPassword(token, newPassword);
      clearStoredAuthSession();
      setState("success");
      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { notice: copy.successMessage },
        });
      }, 1200);
    } catch (submitError) {
      if (submitError instanceof AuthApiError) {
        const message = submitError.message.toLowerCase();
        if (message.includes("expired")) {
          setState("expired");
          return;
        }
        if (message.includes("invalid")) {
          setState("invalid");
          return;
        }
        setError(submitError.message || copy.genericError);
      } else {
        setError(copy.genericError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTitle = state === "loading"
    ? copy.loadingTitle
    : state === "expired"
      ? copy.expiredTitle
      : state === "invalid"
        ? copy.invalidTitle
        : state === "success"
          ? copy.successTitle
          : copy.formTitle;

  const statusMessage = state === "loading"
    ? copy.loadingMessage
    : state === "expired"
      ? copy.expiredMessage
      : state === "invalid"
        ? copy.invalidMessage
        : state === "success"
          ? copy.successMessage
          : copy.formMessage;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(41,171,226,0.12),transparent_28%),linear-gradient(135deg,var(--app-bg),var(--surface)_46%,rgba(41,171,226,0.08))] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-18 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(63,72,86,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,72,86,0.08)_1px,transparent_1px)]" />

      <main className="brand-admin-panel relative w-full max-w-lg rounded-[28px] border border-[var(--brand-border)] p-8 shadow-[0_24px_54px_rgba(11,24,38,0.14)] backdrop-blur">
        <div className="mx-auto mb-5 flex justify-center">
          <img src={logoCard} alt={BRAND_NAME} className="h-auto w-[min(10rem,56vw)] max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,113,188,0.18)]" />
        </div>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          {state === "loading" ? (
            <LoaderCircle className="h-8 w-8 animate-spin" />
          ) : state === "success" ? (
            <CheckCircle2 className="h-8 w-8 text-[var(--tone-success-text)]" />
          ) : state === "valid" ? (
            <KeyRound className="h-8 w-8" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-[var(--tone-warning-text)]" />
          )}
        </div>

        <header className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{copy.pageLabel}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">{statusTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{statusMessage}</p>
        </header>

        {state === "valid" ? (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="reset-password-new">{copy.newPassword}</label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  id="reset-password-new"
                  autoComplete="new-password"
                  className={`${inputClass} w-full pl-10 pr-4`}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setError("");
                  }}
                  placeholder={copy.newPasswordPlaceholder}
                  type="password"
                  value={newPassword}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="reset-password-confirm">{copy.confirmPassword}</label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  id="reset-password-confirm"
                  autoComplete="new-password"
                  className={`${inputClass} w-full pl-10 pr-4`}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError("");
                  }}
                  placeholder={copy.confirmPasswordPlaceholder}
                  type="password"
                  value={confirmPassword}
                />
              </div>
            </div>

            {error ? <FieldErrorMessage>{error}</FieldErrorMessage> : null}

            <button className={`${primaryButtonClass} w-full`} disabled={isSubmitting} type="submit">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? copy.submitting : copy.submit}
            </button>
          </form>
        ) : (
          <div className="mt-8">
            <Link className={`${state === "success" ? primaryButtonClass : ghostButtonClass} w-full`} to="/login">
              <ArrowLeft className="h-4 w-4" />
              {copy.back}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default ResetPasswordPage;
