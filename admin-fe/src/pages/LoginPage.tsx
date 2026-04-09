import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logoCard from "../assets/images/logo-4t.png";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { FieldErrorMessage, ghostButtonClass, inputClass, primaryButtonClass } from "../components/ui-kit";
import { ADMIN_APP_NAME, BRAND_NAME } from "../config/businessProfile";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { AuthApiError, resendAdminEmailVerification } from "../lib/authApi";

type LocationState = {
  from?: string;
};

const copyByLanguage = {
  vi: {
    adminEmailRequired: "Vui lòng liên hệ chủ hệ thống để bổ sung email cho tài khoản admin.",
    adminEmailUnverified: "Email admin cần được xác thực trước khi bạn có thể đăng nhập.",
    loginFailed: "Đăng nhập thất bại",
    resendIdentityRequired: "Nhập tên đăng nhập hoặc email để gửi lại email xác thực.",
    resendSuccess:
      "Nếu định danh này tương ứng với một tài khoản admin chưa xác thực, email xác thực đã được gửi.",
    resendFailed: "Không thể gửi lại email xác thực. Vui lòng thử lại.",
    adminNeedsEmail:
      "Tài khoản admin cần có email trước khi có thể tiếp tục đăng nhập. Vui lòng liên hệ chủ hệ thống.",
    verificationHint:
      "Kiểm tra hộp thư đến và thư rác để tìm email xác thực, sau đó thử đăng nhập lại.",
    sendingVerification: "Đang gửi email xác thực...",
    resendVerification: "Gửi lại email xác thực",
    verificationRequired:
      "Nếu chủ hệ thống yêu cầu xác thực email, bạn phải xác thực email admin trước khi đăng nhập thành công.",
    dashboard: "Bảng điều hành",
    heading: "Đăng nhập để truy cập hệ thống quản lý phân phối của 4T HITEK",
    username: "Tên đăng nhập",
    usernamePlaceholder: "Nhập tên đăng nhập",
    password: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu",
    showPassword: "Hiển thị mật khẩu",
    hidePassword: "Ẩn mật khẩu",
    remember: "Ghi nhớ đăng nhập",
    usernameRequired: "Vui lòng nhập tên đăng nhập",
    passwordRequired: "Vui lòng nhập mật khẩu",
    loginSuccess: "Đăng nhập thành công",
    loginButton: "Đăng nhập",
    loggingIn: "Đang đăng nhập...",
  },
  en: {
    adminEmailRequired: "Please contact your system owner to add an email address to your admin account.",
    adminEmailUnverified: "Your admin email address must be verified before you can sign in.",
    loginFailed: "Sign-in failed",
    resendIdentityRequired: "Enter your username or email to resend the verification email.",
    resendSuccess:
      "If an unverified admin account exists for this identity, a verification email has been sent.",
    resendFailed: "Could not resend the verification email. Please try again.",
    adminNeedsEmail:
      "Your admin account needs an email address before sign-in can continue. Please contact your system owner.",
    verificationHint:
      "Check your inbox and spam folder for the verification email, then try signing in again.",
    sendingVerification: "Sending verification email...",
    resendVerification: "Resend verification email",
    verificationRequired:
      "If your system owner requires email verification, you must verify your admin email before sign-in succeeds.",
    dashboard: "Admin workspace",
    heading: "Sign in to access the 4T HITEK distribution admin system",
    username: "Username",
    usernamePlaceholder: "Enter your username",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    remember: "Remember this device",
    usernameRequired: "Please enter your username",
    passwordRequired: "Please enter your password",
    loginSuccess: "Signed in successfully",
    loginButton: "Sign in",
    loggingIn: "Signing in...",
  },
} as const;

type LoginCopy = Record<keyof (typeof copyByLanguage)["vi"], string>;

const resolveLoginErrorMessage = (copy: LoginCopy, code: string | undefined, fallbackMessage: string | undefined) => {
  switch (code) {
    case "ADMIN_EMAIL_REQUIRED":
      return copy.adminEmailRequired;
    case "ADMIN_EMAIL_UNVERIFIED":
      return copy.adminEmailUnverified;
    default:
      return fallbackMessage || copy.loginFailed;
  }
};

function LoginPage() {
  const { language } = useLanguage();
  const copy = copyByLanguage[language];
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const { login, isLoggingIn } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [authErrorCode, setAuthErrorCode] = useState<string | undefined>();
  const [resendNotice, setResendNotice] = useState("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const target = ((location.state as LocationState | null)?.from || "/") as string;

  const validateFields = (nextUsername: string, nextPassword: string) => {
    const nextErrors: { username?: string; password?: string } = {};
    if (!nextUsername.trim()) {
      nextErrors.username = copy.usernameRequired;
    }
    if (!nextPassword.trim()) {
      nextErrors.password = copy.passwordRequired;
    }
    return nextErrors;
  };

  const clearAuthFeedback = () => {
    setError("");
    setAuthErrorCode(undefined);
    setResendNotice("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthFeedback();

    const nextErrors = validateFields(username, password);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = await login({ username, password, remember });
    if (!result.ok) {
      setAuthErrorCode(result.code);
      setError(resolveLoginErrorMessage(copy, result.code, result.message));
      return;
    }

    notify(copy.loginSuccess, { title: ADMIN_APP_NAME, variant: "success" });
    navigate(target, { replace: true });
  };

  const handleResendVerification = async () => {
    const identity = username.trim();
    if (!identity) {
      setError(copy.resendIdentityRequired);
      return;
    }

    setIsResendingVerification(true);
    setResendNotice("");

    try {
      const response = await resendAdminEmailVerification(identity);
      setResendNotice(response.status ? copy.resendSuccess : response.message || copy.resendSuccess);
    } catch (nextError) {
      if (nextError instanceof AuthApiError) {
        setError(nextError.message);
      } else {
        setError(copy.resendFailed);
      }
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(41,171,226,0.12),transparent_28%),linear-gradient(135deg,var(--app-bg),var(--surface)_46%,rgba(41,171,226,0.08))] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-[16vmax] -top-[20vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(41,171,226,0.18),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[22vmax] -right-[14vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(0,113,188,0.14),transparent_60%)] animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute inset-0 opacity-18 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(63,72,86,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,72,86,0.08)_1px,transparent_1px)]" />
      </div>

      <main className="brand-admin-panel relative w-full max-w-md rounded-[28px] border border-[var(--brand-border)] p-8 shadow-[0_24px_54px_rgba(11,24,38,0.14)] backdrop-blur animate-card-enter motion-reduce:animate-none">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <header className="text-center">
          <div className="mx-auto mb-4 flex justify-center animate-pop-in motion-reduce:animate-none">
            <img
              src={logoCard}
              alt={BRAND_NAME}
              className="h-auto w-[min(11rem,60vw)] max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,113,188,0.18)] sm:w-48 md:w-52"
            />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{copy.dashboard}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)]">{ADMIN_APP_NAME}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{copy.heading}</p>
        </header>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="username">{copy.username}</label>
            <div className="relative mt-2">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="username"
                aria-describedby={fieldErrors.username ? "login-username-error" : undefined}
                aria-invalid={Boolean(fieldErrors.username)}
                className={`${inputClass} w-full pl-10 pr-4 ${fieldErrors.username ? "border-rose-300" : ""}`}
                type="text"
                placeholder={copy.usernamePlaceholder}
                autoComplete="username"
                disabled={isLoggingIn || isResendingVerification}
                value={username}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setUsername(nextValue);
                  setFieldErrors(validateFields(nextValue, password));
                  clearAuthFeedback();
                }}
              />
            </div>
            {fieldErrors.username ? <FieldErrorMessage id="login-username-error">{fieldErrors.username}</FieldErrorMessage> : null}
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="password">{copy.password}</label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                id="password"
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`${inputClass} w-full pl-10 pr-12 ${fieldErrors.password ? "border-rose-300" : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder={copy.passwordPlaceholder}
                autoComplete="current-password"
                disabled={isLoggingIn || isResendingVerification}
                value={password}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setPassword(nextValue);
                  setFieldErrors(validateFields(username, nextValue));
                  clearAuthFeedback();
                }}
              />
              <button
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                className="absolute right-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] transition hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
                disabled={isLoggingIn || isResendingVerification}
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? <FieldErrorMessage id="login-password-error">{fieldErrors.password}</FieldErrorMessage> : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input className="h-4 w-4 accent-[var(--accent)]" type="checkbox" checked={remember} disabled={isLoggingIn || isResendingVerification} onChange={(event) => setRemember(event.target.checked)} />
            <span>{copy.remember}</span>
          </label>

          {error ? <FieldErrorMessage>{error}</FieldErrorMessage> : null}

          {authErrorCode === "ADMIN_EMAIL_REQUIRED" ? (
            <div className="rounded-[18px] border border-[rgba(189,249,25,0.34)] bg-[rgba(189,249,25,0.16)] px-4 py-3 text-sm text-[var(--tone-warning-text)]">
              {copy.adminNeedsEmail}
            </div>
          ) : null}

          {authErrorCode === "ADMIN_EMAIL_UNVERIFIED" ? (
            <div className="space-y-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm text-[var(--muted)]">{copy.verificationHint}</p>
              <button className={ghostButtonClass} disabled={isResendingVerification} onClick={() => void handleResendVerification()} type="button">
                {isResendingVerification ? copy.sendingVerification : copy.resendVerification}
              </button>
              <p className="text-xs leading-5 text-[var(--muted)]">{copy.verificationRequired}</p>
            </div>
          ) : null}

          {resendNotice ? (
            <div className="rounded-[18px] border border-[rgba(41,171,226,0.28)] bg-[rgba(41,171,226,0.14)] px-4 py-3 text-sm text-[var(--accent)]">
              {resendNotice}
            </div>
          ) : null}

          <button className={`${primaryButtonClass} w-full`} disabled={isLoggingIn || isResendingVerification} type="submit">
            {isLoggingIn ? copy.loggingIn : copy.loginButton}
          </button>
        </form>
      </main>
    </div>
  );
}

export default LoginPage;
