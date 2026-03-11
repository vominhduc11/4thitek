import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logoCard from '../assets/images/logo-4t.png'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { FieldErrorMessage } from '../components/ui-kit'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'

type LocationState = {
  from?: string
}

function LoginPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const { notify } = useToast()
  const { login, isLoggingIn } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const [showPassword, setShowPassword] = useState(false)

  const target = ((location.state as LocationState | null)?.from || '/') as string

  const validateFields = (nextUsername: string, nextPassword: string) => {
    const nextErrors: { username?: string; password?: string } = {}
    if (!nextUsername.trim()) {
      nextErrors.username = t('Vui lòng nhập tên đăng nhập')
    }
    if (!nextPassword.trim()) {
      nextErrors.password = t('Vui lòng nhập mật khẩu')
    }
    return nextErrors
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const nextErrors = validateFields(username, password)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const result = await login({ username, password, remember })
    if (!result.ok) {
      setError(result.message ?? 'Đăng nhập thất bại')
      return
    }

    notify('Đăng nhập thành công', { title: 'Auth', variant: 'success' })
    navigate(target, { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--app-bg)] via-[var(--surface)] to-[var(--accent-soft)] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-[16vmax] -top-[20vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.35),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[22vmax] -right-[14vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.35),transparent_60%)] animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute inset-0 opacity-25 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)]" />
      </div>

      <main className="relative w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/95 p-8 shadow-[0_32px_80px_rgba(15,23,42,0.18)] backdrop-blur animate-card-enter motion-reduce:animate-none">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <header className="text-center">
          <div className="mx-auto mb-4 flex justify-center animate-pop-in motion-reduce:animate-none">
            <img
              src={logoCard}
              alt="4ThiTek"
              className="h-auto w-[min(11rem,60vw)] max-w-full object-contain drop-shadow-[0_14px_28px_rgba(37,99,235,0.2)] sm:w-48 md:w-52"
            />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('Bảng điều hành')}</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-slate-900">
            {t('4ThiTek Quản trị')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('Đăng nhập để truy cập hệ thống quản lý phân phối tai nghe SCS')}
          </p>
        </header>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="username">
              {t('Tên đăng nhập')}
            </label>
            <div className="relative mt-2">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="username"
                aria-describedby={fieldErrors.username ? 'login-username-error' : undefined}
                aria-invalid={Boolean(fieldErrors.username)}
                className={`w-full rounded-2xl border bg-slate-50 px-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                  fieldErrors.username ? 'border-rose-300' : 'border-slate-200'
                }`}
                type="text"
                placeholder={t('Nhập tên đăng nhập')}
                autoComplete="username"
                disabled={isLoggingIn}
                value={username}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setUsername(nextValue)
                  setFieldErrors(validateFields(nextValue, password))
                }}
              />
            </div>
            {fieldErrors.username ? (
              <FieldErrorMessage id="login-username-error">
                {fieldErrors.username}
              </FieldErrorMessage>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="password">
              {t('Mật khẩu')}
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`w-full rounded-2xl border bg-slate-50 px-10 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 ${
                  fieldErrors.password ? 'border-rose-300' : 'border-slate-200'
                }`}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('Nhập mật khẩu')}
                autoComplete="current-password"
                disabled={isLoggingIn}
                value={password}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setPassword(nextValue)
                  setFieldErrors(validateFields(username, nextValue))
                }}
              />
              <button
                aria-label={showPassword ? t('Ẩn mật khẩu') : t('Hiển thị mật khẩu')}
                className="absolute right-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
                disabled={isLoggingIn}
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <FieldErrorMessage id="login-password-error">
                {fieldErrors.password}
              </FieldErrorMessage>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input
              className="h-4 w-4 accent-[var(--accent)]"
              type="checkbox"
              checked={remember}
              disabled={isLoggingIn}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>{t('Ghi nhớ đăng nhập')}</span>
          </label>

          {error ? <FieldErrorMessage>{error}</FieldErrorMessage> : null}

          <button
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Đang đăng nhập...' : t('Đăng nhập')}
          </button>

          <p className="text-center text-xs text-slate-500">
            {t('Hệ thống có thể yêu cầu xác thực email sau khi đăng nhập.')}
          </p>
        </form>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
          <span>(c) 2026 4ThiTek</span>
          <span>{t('Phiên bản 1.0')}</span>
        </footer>
      </main>
    </div>
  )
}

export default LoginPage
