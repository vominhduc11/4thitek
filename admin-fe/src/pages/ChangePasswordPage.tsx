import { KeyRound, Lock, LogOut, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoCard from '../assets/images/logo.png'
import { changeAdminPassword } from '../lib/adminApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function ChangePasswordPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { accessToken, completePasswordChange, logout } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin.')
      return
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.')
      return
    }
    if (!accessToken) {
      setError('Phiên đăng nhập không còn hợp lệ.')
      return
    }

    setIsSubmitting(true)
    try {
      await changeAdminPassword(accessToken, {
        currentPassword,
        newPassword,
      })
      completePasswordChange()
      notify('Mật khẩu đã được cập nhật.', { title: 'Security', variant: 'success' })
      navigate('/', { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Không thể cập nhật mật khẩu.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-[16vmax] -top-[20vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.28),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[22vmax] -right-[14vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.24),transparent_60%)] animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute inset-0 opacity-20 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      </div>

      <main className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/75 p-8 text-slate-100 shadow-[0_32px_80px_rgba(15,23,42,0.45)] backdrop-blur">
        <header className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img
              src={logoCard}
              alt="4ThiTek"
              className="h-auto w-52 max-w-full object-contain drop-shadow-[0_14px_28px_rgba(14,165,233,0.22)]"
            />
          </div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.35em] text-sky-200/70">
            Security setup
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Đổi mật khẩu lần đầu</h1>
          <p className="mt-2 text-sm text-slate-300">
            Tài khoản quản trị cần cập nhật mật khẩu trước khi tiếp tục sử dụng hệ thống.
          </p>
        </header>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-slate-200" htmlFor="current-password">
              Mật khẩu hiện tại
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="current-password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                type="password"
                value={currentPassword}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-200" htmlFor="new-password">
              Mật khẩu mới
            </label>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="new-password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                type="password"
                value={newPassword}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-200" htmlFor="confirm-password">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="confirm-password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                type="password"
                value={confirmPassword}
              />
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-rose-300">{error}</p> : null}

          <button
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_32px_rgba(14,165,233,0.35)] transition hover:-translate-y-0.5 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </form>
      </main>
    </div>
  )
}

export default ChangePasswordPage
