import { CheckCircle, Clock, FileText, Plus, Search, Tag } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const posts = [
  {
    id: 'BL-2001',
    title: 'Đánh giá SCS SX Pro Elite: âm thanh vòm 7.1',
    category: 'Đánh giá',
    status: 'Đã đăng',
    updated: '2 ngày trước',
    views: '14.2k',
    author: 'Minh Trần',
  },
  {
    id: 'BL-2002',
    title: 'Hướng dẫn setup phòng thu với SCS Professional Studio',
    category: 'Hướng dẫn',
    status: 'Đã đăng',
    updated: '5 ngày trước',
    views: '6.8k',
    author: 'Linh Phạm',
  },
  {
    id: 'BL-2003',
    title: 'So sánh SCS SX Wireless Pro và SCS Wireless Ultimate',
    category: 'So sánh',
    status: 'Hẹn giờ',
    updated: 'Hôm nay',
    views: '-',
    author: 'Quang Võ',
  },
  {
    id: 'BL-2004',
    title: 'Xu hướng tai nghe 2026: ANC và không dây',
    category: 'Xu hướng',
    status: 'Bản nháp',
    updated: '3 ngày trước',
    views: '-',
    author: 'Hiền Đỗ',
  },
]

function BlogsPage() {
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
            {t('Bài viết')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('Quản lý bài viết, lịch đăng và thông tin SEO.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-56 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:outline-none"
              placeholder={t('Tìm bài viết...')}
              type="search"
            />
          </label>
          <button className={ghostButtonClass} type="button">
            <Tag className="h-4 w-4" />
            {t('Danh mục')}
          </button>
          <button className={ghostButtonClass} type="button">
            <Plus className="h-4 w-4" />
            {t('Tạo bài mới')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Bài viết')}
            </span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">42</p>
          <p className="text-xs text-slate-500">{t('+4 trong tháng này')}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Đang bán')}
            </span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">28</p>
          <p className="text-xs text-slate-500">{t('Hoạt động gần đây')}</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('Chờ duyệt')}
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">3</p>
          <p className="text-xs text-slate-500">{t('Cần xác nhận')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="hidden grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_0.6fr] gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
          <span>{t('Bài viết')}</span>
          <span>{t('Danh mục')}</span>
          <span>{t('Trạng thái')}</span>
          <span>{t('Cập nhật')}</span>
          <span>{t('Lượt xem')}</span>
        </div>
        {posts.map((post) => (
          <div
            className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-4 text-sm text-slate-700 shadow-sm backdrop-blur md:grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_0.6fr] md:items-center"
            key={post.id}
          >
            <div>
              <p className="font-semibold text-slate-900">{post.title}</p>
              <p className="text-xs text-slate-500">
                {post.id} · {post.author}
              </p>
            </div>
            <span className="text-slate-500">{t(post.category)}</span>
            <span
              className={
                post.status === 'Đã đăng'
                  ? 'inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700'
                  : post.status === 'Hẹn giờ'
                    ? 'inline-flex items-center gap-2 rounded-full bg-[var(--accent-cool-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-cool)]'
                  : 'inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700'
              }
            >
              {post.status === 'Đã đăng' ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              {t(post.status)}
            </span>
            <span className="text-slate-500">{t(post.updated)}</span>
            <span className="text-right font-semibold text-[var(--accent)]">
              {post.views}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BlogsPage
