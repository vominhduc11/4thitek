import { CheckCircle2, LoaderCircle, MailWarning } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import logoCard from "../assets/images/logo-4t.png";
import { ghostButtonClass, primaryButtonClass } from "../components/ui-kit";
import { BRAND_NAME } from "../config/businessProfile";
import { useLanguage } from "../context/LanguageContext";
import { AuthApiError, verifyAdminEmail } from "../lib/authApi";

const copyByLanguage = {
  vi: {
    expired: "Liên kết xác thực này đã hết hạn. Hãy yêu cầu email xác thực mới từ trang đăng nhập.",
    used: "Liên kết xác thực này đã được sử dụng. Bạn có thể đăng nhập nếu email đã được xác thực.",
    invalid: "Liên kết xác thực không hợp lệ. Hãy yêu cầu email xác thực mới từ trang đăng nhập.",
    genericError: "Không thể xác thực email lúc này. Vui lòng thử lại sau.",
    pageLabel: "Xác thực email admin",
    successTitle: "Email đã được xác thực",
    loadingTitle: "Đang xác thực email",
    errorTitle: "Xác thực thất bại",
    continue: "Tiếp tục đăng nhập",
    back: "Quay lại đăng nhập",
    requestAnother: "Yêu cầu email xác thực khác",
    successMessage: "Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ.",
  },
  en: {
    expired: "This verification link has expired. Request a new verification email from the sign-in page.",
    used: "This verification link has already been used. You can sign in if your email is already verified.",
    invalid: "This verification link is invalid. Request a new verification email from the sign-in page.",
    genericError: "We could not verify your email right now. Please try again later.",
    pageLabel: "Admin email verification",
    successTitle: "Email verified",
    loadingTitle: "Verifying your email",
    errorTitle: "Verification failed",
    continue: "Continue to sign in",
    back: "Back to sign in",
    requestAnother: "Request another verification email",
    successMessage: "Email verification successful. You can now sign in.",
  },
} as const;

type VerifyEmailCopy = Record<keyof (typeof copyByLanguage)["vi"], string>;

const resolveVerificationError = (copy: VerifyEmailCopy, code: string | undefined) => {
  switch (code) {
    case "EMAIL_VERIFICATION_TOKEN_EXPIRED":
      return copy.expired;
    case "EMAIL_VERIFICATION_TOKEN_ALREADY_USED":
      return copy.used;
    case "EMAIL_VERIFICATION_TOKEN_INVALID":
      return copy.invalid;
    default:
      return copy.genericError;
  }
};

function VerifyEmailPage() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token")?.trim();
    if (!token) {
      setStatus("error");
      setMessage(copy.invalid);
      return;
    }

    let active = true;
    setStatus("loading");
    setMessage("");

    void verifyAdminEmail(token)
      .then(() => {
        if (!active) {
          return;
        }
        setStatus("success");
        setMessage(copy.successMessage);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setStatus("error");
        if (error instanceof AuthApiError) {
          setMessage(resolveVerificationError(copy, error.code));
          return;
        }
        setMessage(copy.genericError);
      });

    return () => {
      active = false;
    };
  }, [copy, searchParams]);

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(41,171,226,0.12),transparent_28%),linear-gradient(135deg,var(--app-bg),var(--surface)_46%,rgba(41,171,226,0.08))] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-18 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(63,72,86,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,72,86,0.08)_1px,transparent_1px)]" />

      <main className="brand-admin-panel relative w-full max-w-lg rounded-[28px] border border-[var(--brand-border)] p-8 shadow-[0_24px_54px_rgba(11,24,38,0.14)] backdrop-blur">
        <div className="mx-auto mb-5 flex justify-center">
          <img src={logoCard} alt={BRAND_NAME} className="h-auto w-[min(10rem,56vw)] max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,113,188,0.18)]" />
        </div>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          {isLoading ? (
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-[var(--tone-success-text)]" />
          ) : (
            <MailWarning aria-hidden="true" className="h-8 w-8 text-[var(--tone-warning-text)]" />
          )}
        </div>

        <header className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{copy.pageLabel}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            {isSuccess ? copy.successTitle : isLoading ? copy.loadingTitle : copy.errorTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{message}</p>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className={`${primaryButtonClass} sm:w-auto`} to="/login">
            {isSuccess ? copy.continue : copy.back}
          </Link>
          <Link className={`${ghostButtonClass} sm:w-auto`} to="/login">
            {copy.requestAnother}
          </Link>
        </div>
      </main>
    </div>
  );
}

export default VerifyEmailPage;
