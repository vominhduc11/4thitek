import { ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const users = [
  { name: 'Nguyễn Thảo', role: 'Admin hệ thống', status: 'Đang hoạt động' },
  { name: 'Minh Phan', role: 'Quản lý sản phẩm', status: 'Đang hoạt động' },
  { name: 'Linh Phạm', role: 'Marketing & Nội dung', status: 'Đang hoạt động' },
  { name: 'Quang Vũ', role: 'CSKH & Bảo hành', status: 'Chờ duyệt' },
]

function UsersPage() {
  const { t } = useLanguage()
  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const primaryButtonClass =
    'btn-stable inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0'

  return (
    <section className={`${panelClass} animate-card-enter`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t('Quản trị')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Quản lý nhân sự và phân quyền truy cập hệ thống.')}
          </p>
        </div>
        <button className={primaryButtonClass} type="button">
          <UserPlus className="h-4 w-4" />
          {t('Mời nhân sự')}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <div
            className="flex items-center gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur"
            key={user.name}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]">
              {user.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                {user.name}
              </h4>
              <p className="text-xs text-slate-500">{t(user.role)}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <Users className="h-3.5 w-3.5" />
                {t('Truy cập nhóm')}
              </div>
            </div>
            <span
              className={
                user.status === 'Đang hoạt động'
                  ? 'ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700'
                  : 'ml-auto inline-flex items-center gap-2 rounded-full bg-[var(--accent-cool-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-cool)]'
              }
            >
              {user.status === 'Đang hoạt động' && (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              {t(user.status)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default UsersPage
