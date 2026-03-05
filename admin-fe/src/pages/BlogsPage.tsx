import { Clock3, FileText, Plus, Tag, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminData, type BlogStatus } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import { blogStatusLabel, blogStatusTone } from '../lib/adminLabels'
import { formatDateTime, formatNumber } from '../lib/formatters'
import { useSimulatedPageLoad } from '../hooks/useSimulatedPageLoad'
import {
  EmptyState,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
} from '../components/ui-kit'

const BLOG_STATUS_OPTIONS: Array<{ value: 'all' | BlogStatus; label: string }> = [
  { value: 'all', label: 'Tat ca' },
  { value: 'published', label: blogStatusLabel.published },
  { value: 'scheduled', label: blogStatusLabel.scheduled },
  { value: 'draft', label: blogStatusLabel.draft },
]

function BlogsPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { posts, addPost, updatePostStatus, deletePost } = useAdminData()
  const { isLoading } = useSimulatedPageLoad('blogs-page')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BlogStatus>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    title: '',
    category: '',
    author: '',
    excerpt: '',
    status: 'draft' as BlogStatus,
  })

  const normalizedSearch = search.trim().toLowerCase()
  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesStatus = statusFilter === 'all' ? true : post.status === statusFilter
        const matchesSearch =
          !normalizedSearch ||
          post.title.toLowerCase().includes(normalizedSearch) ||
          post.id.toLowerCase().includes(normalizedSearch)
        return matchesStatus && matchesSearch
      }),
    [normalizedSearch, posts, statusFilter],
  )

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.status === 'published').length
    const scheduled = posts.filter((post) => post.status === 'scheduled').length
    const draft = posts.filter((post) => post.status === 'draft').length
    return { published, scheduled, draft }
  }, [posts])

  const handleCreate = () => {
    setCreateError('')
    if (!form.title.trim() || !form.category.trim() || !form.author.trim()) {
      setCreateError('Vui long nhap day du tieu de, danh muc va tac gia')
      return
    }
    const created = addPost(form)
    notify(`Da tao bai ${created.id}`, { title: 'Blogs', variant: 'success' })
    setShowCreate(false)
    setForm({
      title: '',
      category: '',
      author: '',
      excerpt: '',
      status: 'draft',
    })
  }

  if (isLoading) {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Bai viet</h3>
          <p className="text-sm text-slate-500">
            Quan ly bai viet, lich dang va thong tin SEO.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            id="blogs-search"
            label="Search posts"
            placeholder="Tim bai viet..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-60 max-w-full"
          />
          <select
            aria-label="Blog status filter"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onChange={(event) => setStatusFilter(event.target.value as 'all' | BlogStatus)}
            value={statusFilter}
          >
            {BLOG_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <PrimaryButton
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreate((value) => !value)}
            type="button"
          >
            Tao bai moi
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label="Tong bai viet" value={posts.length} tone="neutral" />
        <StatCard
          icon={Tag}
          label="Da dang"
          value={stats.published}
          tone="success"
          hint="Dang hoat dong"
        />
        <StatCard
          icon={Clock3}
          label="Cho lich / ban nhap"
          value={stats.scheduled + stats.draft}
          tone="warning"
          hint="Can theo doi"
        />
      </div>

      {showCreate ? (
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-semibold text-slate-900">Tao bai viet moi</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:col-span-2"
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Tieu de bai viet"
              value={form.title}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
              placeholder="Danh muc"
              value={form.category}
            />
            <input
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
              placeholder="Tac gia"
              value={form.author}
            />
            <textarea
              className="min-h-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:col-span-2"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, excerpt: event.target.value }))
              }
              placeholder="Mo ta ngan"
              value={form.excerpt}
            />
            <select
              aria-label="Create post status"
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value as BlogStatus }))
              }
              value={form.status}
            >
              {BLOG_STATUS_OPTIONS.filter((item) => item.value !== 'all').map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          {createError ? <p className="mt-2 text-sm text-rose-600">{createError}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton onClick={handleCreate} type="button">
              Luu bai
            </PrimaryButton>
            <button
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[var(--accent)]"
              onClick={() => setShowCreate(false)}
              type="button"
            >
              Huy
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {filteredPosts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Khong co bai viet"
            message="Thu doi bo loc hoac tao bai viet moi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2 font-semibold">Bai viet</th>
                  <th className="px-3 py-2 font-semibold">Danh muc</th>
                  <th className="px-3 py-2 font-semibold">Trang thai</th>
                  <th className="px-3 py-2 font-semibold">Luot xem</th>
                  <th className="px-3 py-2 font-semibold">Cap nhat</th>
                  <th className="px-3 py-2 font-semibold">Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr
                    className="cursor-pointer rounded-2xl bg-white/80 text-sm text-slate-700 shadow-sm transition hover:bg-[var(--accent-soft)]/40"
                    key={post.id}
                    onClick={() => navigate(`/blogs/${encodeURIComponent(post.id)}`)}
                  >
                    <td className="rounded-l-2xl px-3 py-3">
                      <p className="font-semibold text-slate-900">{post.title}</p>
                      <p className="text-xs text-slate-500">
                        {post.id} · {post.author}
                      </p>
                    </td>
                    <td className="px-3 py-3">{post.category}</td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={blogStatusTone[post.status]}>
                        {blogStatusLabel[post.status]}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3">{formatNumber(post.views)}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {formatDateTime(post.updatedAt)}
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <div
                        className="flex flex-wrap items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <select
                          aria-label={`Post status ${post.id}`}
                          className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          onChange={(event) => {
                            const next = event.target.value as BlogStatus
                            updatePostStatus(post.id, next)
                            notify(`Cap nhat ${post.id} -> ${blogStatusLabel[next]}`, {
                              title: 'Blogs',
                              variant: 'info',
                            })
                          }}
                          value={post.status}
                        >
                          {BLOG_STATUS_OPTIONS.filter((item) => item.value !== 'all').map(
                            (item) => (
                              <option key={`${post.id}-${item.value}`} value={item.value}>
                                {item.label}
                              </option>
                            ),
                          )}
                        </select>
                        <button
                          aria-label={`Delete ${post.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-700 transition hover:border-rose-500"
                          onClick={() => {
                            deletePost(post.id)
                            notify(`Da xoa bai ${post.id}`, {
                              title: 'Blogs',
                              variant: 'error',
                            })
                          }}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PagePanel>
  )
}

export default BlogsPage
