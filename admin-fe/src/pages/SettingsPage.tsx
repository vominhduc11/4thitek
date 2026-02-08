import { Bell, Save, Shield } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

function SettingsPage() {
  const { t } = useLanguage()
  const panelClass =
    'rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]'
  const ghostButtonClass =
    'btn-stable inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-slate-900 hover:shadow-[0_12px_26px_rgba(15,23,42,0.12)]'

  return (
    <section className={`${panelClass} animate-card-enter`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t('Cài đặt')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Cấu hình bảo mật, thông báo và chính sách mặc định.')}
          </p>
        </div>
        <button className={ghostButtonClass} type="button">
          <Save className="h-4 w-4" />
          {t('Lưu thay đổi')}
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Shield className="h-4 w-4 text-[var(--accent-strong)]" />
            {t('Bảo mật')}
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('Xác nhận email')}
                </p>
                <p className="text-xs text-slate-500">
                  {t('Yêu cầu admin xác nhận đăng nhập qua email.')}
                </p>
              </div>
              <button className={ghostButtonClass} type="button">
                {t('Cấu hình')}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('Hết phiên đăng nhập')}
                </p>
                <p className="text-xs text-slate-500">
                  {t('Tự động đăng xuất sau 30 phút.')}
                </p>
              </div>
              <button className={ghostButtonClass} type="button">
                {t('Điều chỉnh')}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-[var(--accent-cool)]" />
            {t('Thông báo')}
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('Cảnh báo đơn hàng')}
                </p>
                <p className="text-xs text-slate-500">
                  {t('Thông báo khi có đơn hàng giá trị cao.')}
                </p>
              </div>
              <button className={ghostButtonClass} type="button">
                {t('Chỉnh sửa')}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('Cảnh báo tồn kho')}
                </p>
                <p className="text-xs text-slate-500">
                  {t('Gửi thông báo khi tồn kho thấp.')}
                </p>
              </div>
              <button className={ghostButtonClass} type="button">
                {t('Chỉnh sửa')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SettingsPage
