import { ArrowLeft, FileText, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  DestructiveButton,
  EmptyState,
  ErrorState,
  LoadingRows,
  PagePanel,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  formCardClass,
  ghostButtonClass,
  inputClass,
  labelClass,
} from '../components/ui-kit'
import { useAdminData, type BlogStatus } from '../context/AdminDataContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { blogStatusTone } from '../lib/adminLabels'
import { resolveBackendAssetUrl } from '../lib/backendApi'
import { formatDateTime } from '../lib/formatters'

const BLOG_STATUS_ORDER: BlogStatus[] = ['published', 'scheduled', 'draft']

const statusLabelsByLanguage = {
  vi: {
    published: '\u0110\u00e3 \u0111\u0103ng',
    scheduled: 'H\u1eb9n gi\u1edd',
    draft: 'B\u1ea3n nh\u00e1p',
  },
  en: {
    published: 'Published',
    scheduled: 'Scheduled',
    draft: 'Draft',
  },
} as const satisfies Record<'vi' | 'en', Record<BlogStatus, string>>

const copyByLanguage = {
  vi: {
    back: 'V\u1ec1 danh s\u00e1ch b\u00e0i vi\u1ebft',
    loadTitle: 'Kh\u00f4ng th\u1ec3 t\u1ea3i b\u00e0i vi\u1ebft',
    loadFallback: 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c chi ti\u1ebft b\u00e0i vi\u1ebft',
    notFoundTitle: 'Kh\u00f4ng t\u00ecm th\u1ea5y b\u00e0i vi\u1ebft',
    notFoundMessage: 'B\u00e0i {id} kh\u00f4ng t\u1ed3n t\u1ea1i ho\u1eb7c \u0111\u00e3 b\u1ecb x\u00f3a.',
    summaryFallback: 'Ch\u01b0a c\u00f3 t\u00f3m t\u1eaft cho b\u00e0i vi\u1ebft n\u00e0y.',
    uncategorized: 'Ch\u01b0a ph\u00e2n lo\u1ea1i',
    summaryLabel: 'T\u00f3m t\u1eaft',
    statusTitle: 'C\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i',
    statusHelp:
      'Thay \u0111\u1ed5i tr\u1ea1ng th\u00e1i hi\u1ec3n th\u1ecb c\u1ee7a b\u00e0i vi\u1ebft trong khu v\u1ef1c qu\u1ea3n tr\u1ecb.',
    changeStatusTitle: 'X\u00e1c nh\u1eadn \u0111\u1ed5i tr\u1ea1ng th\u00e1i',
    changeStatusMessage:
      'B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n chuy\u1ec3n b\u00e0i vi\u1ebft n\u00e0y sang tr\u1ea1ng th\u00e1i "{status}" kh\u00f4ng?',
    updateFailed: 'Kh\u00f4ng c\u1eadp nh\u1eadt \u0111\u01b0\u1ee3c b\u00e0i vi\u1ebft',
    metaLabel: 'C\u1eadp nh\u1eadt l\u1ea7n cu\u1ed1i',
    deleteTitle: 'X\u00f3a b\u00e0i vi\u1ebft',
    deleteMessage:
      'H\u00e0nh \u0111\u1ed9ng n\u00e0y s\u1ebd x\u00f3a b\u00e0i vi\u1ebft kh\u1ecfi h\u1ec7 th\u1ed1ng qu\u1ea3n tr\u1ecb.',
    deleteHelp:
      'Ch\u1ec9 x\u00f3a khi b\u1ea1n ch\u1eafc ch\u1eafn b\u00e0i vi\u1ebft kh\u00f4ng c\u00f2n \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng.',
    confirmDelete: 'X\u00f3a b\u00e0i',
    deleteLabel: 'X\u00f3a b\u00e0i',
    deleteFailed: 'Kh\u00f4ng x\u00f3a \u0111\u01b0\u1ee3c b\u00e0i vi\u1ebft',
  },
  en: {
    back: 'Back to posts',
    loadTitle: 'Unable to load the post',
    loadFallback: 'Could not load the post details',
    notFoundTitle: 'Post not found',
    notFoundMessage: 'Post {id} does not exist or has been deleted.',
    summaryFallback: 'This post does not have a summary yet.',
    uncategorized: 'Uncategorized',
    summaryLabel: 'Summary',
    statusTitle: 'Update status',
    statusHelp: 'Change how this post is surfaced in the admin workspace.',
    changeStatusTitle: 'Confirm status change',
    changeStatusMessage: 'Change this post to "{status}"?',
    updateFailed: 'Could not update the post',
    metaLabel: 'Last updated',
    deleteTitle: 'Delete post',
    deleteMessage: 'This action removes the post from the admin system.',
    deleteHelp: 'Only delete when you are sure the post is no longer needed.',
    confirmDelete: 'Delete post',
    deleteLabel: 'Delete post',
    deleteFailed: 'Could not delete the post',
  },
} as const

function BlogDetailPageRevamp() {
  const { id = '' } = useParams()
  const postId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { posts, postsState, updatePostStatus, deletePost, reloadResource } = useAdminData()

  const copy = copyByLanguage[language]
  const statusLabels = statusLabelsByLanguage[language]
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
          title={copy.loadTitle}
          message={postsState.error || copy.loadFallback}
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
          title={copy.notFoundTitle}
          message={copy.notFoundMessage.replace('{id}', postId)}
        />
      </PagePanel>
    )
  }

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className={ghostButtonClass} to="/blogs">
          <ArrowLeft className="h-4 w-4" />
          {copy.back}
        </Link>
        <StatusBadge tone={blogStatusTone[post.status]}>{statusLabels[post.status]}</StatusBadge>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <p className={labelClass}>{post.id}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">{post.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{post.category || copy.uncategorized}</p>
          {post.imageUrl ? (
            <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)]">
              <img
                src={resolveBackendAssetUrl(post.imageUrl)}
                alt={post.title}
                className="h-80 w-full object-cover"
              />
            </div>
          ) : null}
          <div className="mt-6 space-y-3">
            <p className={labelClass}>{copy.summaryLabel}</p>
            <p className="text-sm leading-7 text-[var(--ink)]">
              {post.excerpt || copy.summaryFallback}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            <span>
              {copy.metaLabel}: {formatDateTime(post.updatedAt)}
            </span>
          </div>
        </article>

        <aside className={`${formCardClass} space-y-6`}>
          <div className="space-y-2">
            <p className={cardTitleClass}>{copy.statusTitle}</p>
            <p className={bodyTextClass}>{copy.statusHelp}</p>
            <select
              aria-label={`${copy.statusTitle} ${post.id}`}
              className={`${inputClass} mt-2 w-full`}
              onChange={async (event) => {
                const next = event.target.value as BlogStatus
                if (next === post.status) {
                  return
                }

                const approved = await confirm({
                  title: copy.changeStatusTitle,
                  message: copy.changeStatusMessage.replace('{status}', statusLabels[next]),
                  tone: next === 'draft' ? 'warning' : 'info',
                  confirmLabel: statusLabels[next],
                })

                if (!approved) {
                  event.currentTarget.value = post.status
                  return
                }

                try {
                  await updatePostStatus(post.id, next)
                } catch (error) {
                  notify(error instanceof Error ? error.message : copy.updateFailed, {
                    title: copy.statusTitle,
                    variant: 'error',
                  })
                }
              }}
              value={post.status}
            >
              {BLOG_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-3xl border border-rose-300/70 bg-rose-50/70 p-4">
            <p className="text-sm font-semibold text-rose-700">{copy.deleteTitle}</p>
            <p className="mt-2 text-sm text-rose-600">{copy.deleteHelp}</p>
            <DestructiveButton
              className="mt-4 w-full"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={async () => {
                const approved = await confirm({
                  title: copy.deleteTitle,
                  message: copy.deleteMessage,
                  tone: 'danger',
                  confirmLabel: copy.confirmDelete,
                })
                if (!approved) {
                  return
                }

                try {
                  await deletePost(post.id)
                  navigate('/blogs')
                } catch (error) {
                  notify(error instanceof Error ? error.message : copy.deleteFailed, {
                    title: copy.deleteTitle,
                    variant: 'error',
                  })
                }
              }}
              type="button"
            >
              {copy.deleteLabel}
            </DestructiveButton>
          </div>
        </aside>
      </div>
      {confirmDialog}
    </PagePanel>
  )
}

export default BlogDetailPageRevamp
