import { Lock, User } from 'lucide-react'

function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--app-bg)] via-[var(--surface)] to-[var(--accent-soft)] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-[20vmax] -left-[16vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.35),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[22vmax] -right-[14vmax] h-[56vmax] w-[56vmax] rounded-full bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.35),transparent_60%)] animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute inset-0 opacity-25 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)]" />
      </div>

      <main className="relative w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/95 p-8 shadow-[0_32px_80px_rgba(15,23,42,0.18)] backdrop-blur animate-card-enter motion-reduce:animate-none">
        <header className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[radial-gradient(circle_at_top,#60a5fa,#3b82f6_60%,#1d4ed8)] text-lg font-semibold tracking-[0.2em] text-white shadow-[0_16px_32px_rgba(37,99,235,0.35)] animate-pop-in motion-reduce:animate-none">
            <span>4T</span>
          </div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
            Admin Console
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-slate-900">
            4ThiTek Admin
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Dang nhap de truy cap he thong quan ly phan phoi tai nghe SCS
          </p>
        </header>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => event.preventDefault()}
        >
          <div>
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="username"
            >
              Ten dang nhap
            </label>
            <div className="relative mt-2">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                id="username"
                type="text"
                placeholder="Nhap ten dang nhap"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="password"
            >
              Mat khau
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)]"
                id="password"
                type="password"
                placeholder="Nhap mat khau"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <label className="flex items-center gap-2">
              <input className="h-4 w-4 accent-[var(--accent)]" type="checkbox" />
              <span>Ghi nho dang nhap</span>
            </label>
            <span className="inline-flex items-center rounded-full bg-[var(--accent-cool-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-cool)]">
              Bao mat qua email
            </span>
          </div>

          <button
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0"
            type="submit"
          >
            Dang nhap
          </button>

          <p className="text-center text-xs text-slate-500">
            He thong co the yeu cau xac thuc email sau khi dang nhap.
          </p>
        </form>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
          <span>(c) 2026 4ThiTek</span>
          <span>Version 1.0</span>
        </footer>
      </main>
    </div>
  )
}

export default LoginPage
