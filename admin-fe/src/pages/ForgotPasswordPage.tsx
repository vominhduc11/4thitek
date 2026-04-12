import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import logoCard from "../assets/images/logo-4t.png";
import { FieldErrorMessage, ghostButtonClass, inputClass, primaryButtonClass } from "../components/ui-kit";
import { BRAND_NAME } from "../config/businessProfile";
import { useLanguage } from "../context/LanguageContext";
import { requestAdminPasswordReset } from "../lib/authApi";

const copyByLanguage = {
  vi: {
    pageLabel: "Khôi phục mật khẩu",
    title: "Yêu cầu liên kết đặt lại mật khẩu",
    description: "Nhập email của tài khoản admin hoặc staff. Nếu tài khoản tồn tại, hệ thống sẽ gửi liên kết đặt lại mật khẩu.",
    email: "Email",
    emailPlaceholder: "admin@example.com",
    emailRequired: "Vui lòng nhập email.",
    emailInvalid: "Email không đúng định dạng.",
    submit: "Gửi liên kết đặt lại",
    submitting: "Đang gửi...",
    success: "Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.",
    back: "Quay lại đăng nhập",
  },
  en: {
    pageLabel: "Password recovery",
    title: "Request a password reset link",
    description: "Enter the admin or staff email. If the account exists, the system will send a password reset link.",
    email: "Email",
    emailPlaceholder: "admin@example.com",
    emailRequired: "Please enter your email.",
    emailInvalid: "Please enter a valid email address.",
    submit: "Send reset link",
    submitting: "Sending...",
    success: "If the email exists in our system, a password reset link has been sent.",
    back: "Back to sign in",
  },
} as const;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function ForgotPasswordPage() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError(copy.emailRequired);
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError(copy.emailInvalid);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await requestAdminPasswordReset(normalizedEmail);
    } catch {
      // Public flow stays intentionally generic and must not reveal account existence.
    } finally {
      setSubmitted(true);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(41,171,226,0.12),transparent_28%),linear-gradient(135deg,var(--app-bg),var(--surface)_46%,rgba(41,171,226,0.08))] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-18 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(63,72,86,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,72,86,0.08)_1px,transparent_1px)]" />

      <main className="brand-admin-panel relative w-full max-w-lg rounded-[28px] border border-[var(--brand-border)] p-8 shadow-[0_24px_54px_rgba(11,24,38,0.14)] backdrop-blur">
        <div className="mx-auto mb-5 flex justify-center">
          <img src={logoCard} alt={BRAND_NAME} className="h-auto w-[min(10rem,56vw)] max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,113,188,0.18)]" />
        </div>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Mail aria-hidden="true" className="h-8 w-8" />
        </div>

        <header className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{copy.pageLabel}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">{copy.title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{copy.description}</p>
        </header>

        {submitted ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-[18px] border border-[rgba(41,171,226,0.28)] bg-[rgba(41,171,226,0.14)] px-4 py-3 text-sm text-[var(--accent)]">
              {copy.success}
            </div>
            <Link className={`${primaryButtonClass} w-full`} to="/login">
              <ArrowLeft className="h-4 w-4" />
              {copy.back}
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="forgot-password-email">{copy.email}</label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  id="forgot-password-email"
                  autoComplete="email"
                  className={`${inputClass} w-full pl-10 pr-4`}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder={copy.emailPlaceholder}
                  type="email"
                  value={email}
                />
              </div>
              {error ? <FieldErrorMessage>{error}</FieldErrorMessage> : null}
            </div>

            <button className={`${primaryButtonClass} w-full`} disabled={isSubmitting} type="submit">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? copy.submitting : copy.submit}
            </button>

            <Link className={`${ghostButtonClass} w-full`} to="/login">
              <ArrowLeft className="h-4 w-4" />
              {copy.back}
            </Link>
          </form>
        )}
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
