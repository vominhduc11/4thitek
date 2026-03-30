import { CheckCircle2, LoaderCircle, MailWarning } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthApiError, verifyAdminEmail } from '../lib/authApi'
import { useLanguage } from '../context/LanguageContext'

const resolveVerificationError = (code: string | undefined, t: (key: string) => string) => {
  switch (code) {
    case 'EMAIL_VERIFICATION_TOKEN_EXPIRED':
      return t('This verification link has expired. Request a new verification email from the sign-in page.')
    case 'EMAIL_VERIFICATION_TOKEN_ALREADY_USED':
      return t('This verification link has already been used. You can sign in if your email is already verified.')
    case 'EMAIL_VERIFICATION_TOKEN_INVALID':
      return t('This verification link is invalid. Request a new verification email from the sign-in page.')
    default:
      return t('We could not verify your email right now. Please try again later.')
  }
}

function VerifyEmailPage() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')?.trim()
    if (!token) {
      setStatus('error')
      setMessage(t('This verification link is invalid. Request a new verification email from the sign-in page.'))
      return
    }

    let active = true
    setStatus('loading')
    setMessage('')

    void verifyAdminEmail(token)
      .then((response) => {
        if (!active) {
          return
        }
        setStatus('success')
        setMessage(t(response.message || 'Email verification successful. You can now sign in.'))
      })
      .catch((error: unknown) => {
        if (!active) {
          return
        }
        setStatus('error')
        if (error instanceof AuthApiError) {
          setMessage(resolveVerificationError(error.code, t))
          return
        }
        setMessage(t('We could not verify your email right now. Please try again later.'))
      })

    return () => {
      active = false
    }
  }, [searchParams, t])

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--app-bg)] via-[var(--surface)] to-[var(--accent-soft)] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)]" />

      <main className="relative w-full max-w-lg rounded-3xl border border-slate-200/70 bg-white/95 p-8 shadow-[0_32px_80px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          {isLoading ? (
            <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-emerald-600" />
          ) : (
            <MailWarning aria-hidden="true" className="h-8 w-8 text-amber-600" />
          )}
        </div>

        <header className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t('Admin Email Verification')}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900">
            {isSuccess ? t('Email verified') : isLoading ? t('Verifying your email') : t('Verification failed')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            to="/login"
          >
            {isSuccess ? t('Continue to sign in') : t('Back to sign in')}
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            to="/login"
          >
            {t('Request another verification email')}
          </Link>
        </div>
      </main>
    </div>
  )
}

export default VerifyEmailPage
