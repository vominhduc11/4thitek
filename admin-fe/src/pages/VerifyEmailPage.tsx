import { CheckCircle2, LoaderCircle, MailWarning } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import logoCard from "../assets/images/logo-4t.png";
import { ghostButtonClass, primaryButtonClass } from "../components/ui-kit";
import { BRAND_NAME } from "../config/businessProfile";
import { useLanguage } from "../context/LanguageContext";
import { AuthApiError, verifyAdminEmail } from "../lib/authApi";

const resolveVerificationError = (
  code: string | undefined,
  t: (key: string) => string,
) => {
  switch (code) {
    case "EMAIL_VERIFICATION_TOKEN_EXPIRED":
      return t(
        "This verification link has expired. Request a new verification email from the sign-in page.",
      );
    case "EMAIL_VERIFICATION_TOKEN_ALREADY_USED":
      return t(
        "This verification link has already been used. You can sign in if your email is already verified.",
      );
    case "EMAIL_VERIFICATION_TOKEN_INVALID":
      return t(
        "This verification link is invalid. Request a new verification email from the sign-in page.",
      );
    default:
      return t("We could not verify your email right now. Please try again later.");
  }
};

function VerifyEmailPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token")?.trim();
    if (!token) {
      setStatus("error");
      setMessage(
        t(
          "This verification link is invalid. Request a new verification email from the sign-in page.",
        ),
      );
      return;
    }

    let active = true;
    setStatus("loading");
    setMessage("");

    void verifyAdminEmail(token)
      .then((response) => {
        if (!active) {
          return;
        }
        setStatus("success");
        setMessage(
          t(response.message || "Email verification successful. You can now sign in."),
        );
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setStatus("error");
        if (error instanceof AuthApiError) {
          setMessage(resolveVerificationError(error.code, t));
          return;
        }
        setMessage(t("We could not verify your email right now. Please try again later."));
      });

    return () => {
      active = false;
    };
  }, [searchParams, t]);

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(41,171,226,0.12),transparent_28%),linear-gradient(135deg,var(--app-bg),var(--surface)_46%,rgba(41,171,226,0.08))] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-18 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(63,72,86,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,72,86,0.08)_1px,transparent_1px)]" />

      <main className="brand-admin-panel relative w-full max-w-lg rounded-[28px] border border-[var(--brand-border)] p-8 shadow-[0_24px_54px_rgba(11,24,38,0.14)] backdrop-blur">
        <div className="mx-auto mb-5 flex justify-center">
          <img
            src={logoCard}
            alt={BRAND_NAME}
            className="h-auto w-[min(10rem,56vw)] max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,113,188,0.18)]"
          />
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
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            {t("Admin Email Verification")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            {isSuccess
              ? t("Email verified")
              : isLoading
                ? t("Verifying your email")
                : t("Verification failed")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{message}</p>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className={`${primaryButtonClass} sm:w-auto`} to="/login">
            {isSuccess ? t("Continue to sign in") : t("Back to sign in")}
          </Link>
          <Link className={`${ghostButtonClass} sm:w-auto`} to="/login">
            {t("Request another verification email")}
          </Link>
        </div>
      </main>
    </div>
  );
}

export default VerifyEmailPage;
