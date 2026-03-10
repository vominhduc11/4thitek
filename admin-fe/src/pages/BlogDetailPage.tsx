import { ArrowLeft, FileText, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAdminData, type BlogStatus } from '../context/AdminDataContext'
import { useToast } from '../context/ToastContext'
import { blogStatusLabel, blogStatusTone } from '../lib/adminLabels'
import { resolveBackendAssetUrl } from '../lib/backendApi'
import { formatDateTime } from '../lib/formatters'
import { EmptyState, ErrorState, GhostButton, LoadingRows, PagePanel, StatusBadge } from '../components/ui-kit'

const BLOG_STATUS_OPTIONS: BlogStatus[] = ['published', 'scheduled', 'draft']

function BlogDetailPage() {
  const { id = '' } = useParams()
  const postId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { notify } = useToast()
  const { posts, postsState, updatePostStatus, deletePost, reloadResource } = useAdminData()
  const post = posts.find((item) => item.id === postId)

  if (postsState.status === 'loading' || postsState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={4} />
      </PagePanel>
    )
  }

  if (postsState.status === 'error') {
    return (
      <PagePanel>
        <ErrorState
          title="Khong the tai bai viet"
          message={postsState.error || 'Khong tai duoc bai viet'}
          onRetry={() => void reloadResource('posts')}
        />
      </PagePanel>
    )
  }

  if (!post) {
    return (
      <PagePanel>
        <EmptyState
          icon={FileText}
          title="Khong tim thay bai viet"
          message={`Bai ${postId} khong ton tai hoac da bi xoa.`}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--accent)] hover:text-slate-900"
          to="/blogs"
        >
          <ArrowLeft className="h-4 w-4" />
          Ve bai viet
        </Link>
        <StatusBadge tone={blogStatusTone[post.status]}>{blogStatusLabel[post.status]}</StatusBadge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{post.id}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{post.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{post.category || '-'}</p>
          {post.imageUrl ? (
            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
              <img
                src={resolveBackendAssetUrl(post.imageUrl)}
                alt={post.title}
                className="h-72 w-full object-cover"
              />
            </div>
          ) : null}
          <p className="mt-4 text-sm leading-6 text-slate-700">
            {post.excerpt || 'Chua co tom tat cho bai viet nay.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Cap nhat: {formatDateTime(post.updatedAt)}</span>
          </div>
        </article>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
          <p className="text-sm font-semibold text-slate-900">Cap nhat trang thai</p>
          <select
            aria-label={`Post status ${post.id}`}
            className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onChange={async (event) => {
              const next = event.target.value as BlogStatus
              try {
                await updatePostStatus(post.id, next)
                notify(`Cap nhat ${post.id} -> ${blogStatusLabel[next]}`, {
                  title: 'Blogs',
                  variant: 'info',
                })
              } catch (error) {
                notify(error instanceof Error ? error.message : 'Khong the cap nhat bai viet', {
                  title: 'Blogs',
                  variant: 'error',
                })
              }
            }}
            value={post.status}
          >
            {BLOG_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {blogStatusLabel[status]}
              </option>
            ))}
          </select>

          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/70 p-3">
            <p className="text-sm font-semibold text-rose-700">Xoa bai viet</p>
            <p className="mt-1 text-xs text-rose-600">Bai viet se bi xoa khoi he thong.</p>
            <GhostButton
              className="mt-3 border-rose-200 text-rose-700 hover:border-rose-500 hover:text-rose-700"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={async () => {
                try {
                  await deletePost(post.id)
                  notify(`Da xoa bai ${post.id}`, { title: 'Blogs', variant: 'error' })
                  navigate('/blogs')
                } catch (error) {
                  notify(error instanceof Error ? error.message : 'Khong the xoa bai viet', {
                    title: 'Blogs',
                    variant: 'error',
                  })
                }
              }}
              type="button"
            >
              Xoa bai
            </GhostButton>
          </div>
        </div>
      </div>
    </PagePanel>
  )
}

export default BlogDetailPage
