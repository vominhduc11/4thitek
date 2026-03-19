import { ArrowLeft, FileText, Pencil, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  DestructiveButton,
  EmptyState,
  ErrorState,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  formCardClass,
  ghostButtonClass,
  inputClass,
  labelClass,
  textareaClass,
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
    published: 'Đã đăng',
    scheduled: 'Hẹn giờ',
    draft: 'Bản nháp',
  },
  en: {
    published: 'Published',
    scheduled: 'Scheduled',
    draft: 'Draft',
  },
} as const satisfies Record<'vi' | 'en', Record<BlogStatus, string>>

const copyByLanguage = {
  vi: {
    back: 'Về danh sách bài viết',
    loadTitle: 'Không thể tải bài viết',
    loadFallback: 'Không tải được chi tiết bài viết',
    notFoundTitle: 'Không tìm thấy bài viết',
    notFoundMessage: 'Bài {id} không tồn tại hoặc đã bị xóa.',
    summaryFallback: 'Chưa có tóm tắt cho bài viết này.',
    contentFallback: 'Bài viết này chưa có nội dung.',
    uncategorized: 'Chưa phân loại',
    summaryLabel: 'Tóm tắt',
    contentLabel: 'Nội dung',
    titleLabel: 'Tiêu đề',
    categoryLabel: 'Danh mục',
    imageLabel: 'Ảnh đại diện (URL)',
    statusTitle: 'Cập nhật trạng thái',
    statusHelp: 'Thay đổi trạng thái hiển thị của bài viết trong khu vực quản trị.',
    changeStatusTitle: 'Xác nhận đổi trạng thái',
    changeStatusMessage: 'Bạn có chắc muốn chuyển bài viết này sang trạng thái "{status}" không?',
    updateFailed: 'Không cập nhật được bài viết',
    metaLabel: 'Cập nhật lần cuối',
    deleteTitle: 'Xóa bài viết',
    deleteMessage: 'Hành động này sẽ xóa bài viết khỏi hệ thống quản trị.',
    deleteHelp: 'Chỉ xóa khi bạn chắc chắn bài viết không còn được sử dụng.',
    confirmDelete: 'Xóa bài',
    deleteLabel: 'Xóa bài',
    deleteFailed: 'Không xóa được bài viết',
    edit: 'Chỉnh sửa',
    save: 'Lưu thay đổi',
    cancel: 'Huỷ',
    saveFailed: 'Không lưu được bài viết',
  },
  en: {
    back: 'Back to posts',
    loadTitle: 'Unable to load the post',
    loadFallback: 'Could not load the post details',
    notFoundTitle: 'Post not found',
    notFoundMessage: 'Post {id} does not exist or has been deleted.',
    summaryFallback: 'This post does not have a summary yet.',
    contentFallback: 'This post has no content yet.',
    uncategorized: 'Uncategorized',
    summaryLabel: 'Summary',
    contentLabel: 'Content',
    titleLabel: 'Title',
    categoryLabel: 'Category',
    imageLabel: 'Cover image (URL)',
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
    edit: 'Edit',
    save: 'Save changes',
    cancel: 'Cancel',
    saveFailed: 'Could not save the post',
  },
} as const

type IntroductionBlock = { type: string; text?: string }

const parseContent = (raw?: string): string[] => {
  if (!raw) return []
  try {
    const blocks = JSON.parse(raw) as IntroductionBlock[]
    if (Array.isArray(blocks)) {
      return blocks.map((b) => b.text ?? '').filter(Boolean)
    }
  } catch {
    // fallback: treat raw string as single paragraph
    if (raw.trim()) return [raw.trim()]
  }
  return []
}

function BlogDetailPageRevamp() {
  const { id = '' } = useParams()
  const postId = decodeURIComponent(id)
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { posts, postsState, updatePost, updatePostStatus, deletePost, reloadResource } =
    useAdminData()

  const copy = copyByLanguage[language]
  const statusLabels = statusLabelsByLanguage[language]
  const post = posts.find((item) => item.id === postId)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editExcerpt, setEditExcerpt] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  const contentParagraphs = parseContent(post.content)

  const handleStartEdit = () => {
    setEditTitle(post.title)
    setEditCategory(post.category)
    setEditExcerpt(post.excerpt)
    setEditImageUrl(post.imageUrl ?? '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updatePost(post.id, {
        title: editTitle,
        category: editCategory,
        excerpt: editExcerpt,
        status: post.status,
        imageUrl: editImageUrl || undefined,
      })
      setIsEditing(false)
    } catch (error) {
      notify(error instanceof Error ? error.message : copy.saveFailed, {
        title: copy.edit,
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
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

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.9fr)] xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,360px)]">
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <p className={labelClass}>{post.id}</p>
            {!isEditing ? (
              <GhostButton
                icon={<Pencil className="h-4 w-4" />}
                onClick={handleStartEdit}
                type="button"
              >
                {copy.edit}
              </GhostButton>
            ) : null}
          </div>

          {isEditing ? (
            <div className="mt-4 space-y-4">
              <label className="block space-y-1">
                <span className={labelClass}>{copy.titleLabel}</span>
                <input
                  className={`${inputClass} w-full`}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>{copy.categoryLabel}</span>
                <input
                  className={`${inputClass} w-full`}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>{copy.imageLabel}</span>
                <input
                  className={`${inputClass} w-full`}
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>{copy.summaryLabel}</span>
                <textarea
                  className={`${textareaClass} w-full`}
                  rows={4}
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <PrimaryButton
                  disabled={isSaving}
                  icon={<Save className="h-4 w-4" />}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {isSaving ? `${copy.save}...` : copy.save}
                </PrimaryButton>
                <GhostButton
                  disabled={isSaving}
                  icon={<X className="h-4 w-4" />}
                  onClick={handleCancelEdit}
                  type="button"
                >
                  {copy.cancel}
                </GhostButton>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">{post.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {post.category || copy.uncategorized}
              </p>
              {post.imageUrl ? (
                <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)]">
                  <img
                    src={resolveBackendAssetUrl(post.imageUrl)}
                    alt={post.title}
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="mt-6 space-y-3">
                <p className={labelClass}>{copy.summaryLabel}</p>
                <p className="text-sm leading-7 text-[var(--ink)]">
                  {post.excerpt || copy.summaryFallback}
                </p>
              </div>
              {contentParagraphs.length > 0 ? (
                <div className="mt-6 space-y-3">
                  <p className={labelClass}>{copy.contentLabel}</p>
                  <div className="space-y-4">
                    {contentParagraphs.map((paragraph, index) => (
                      <p key={index} className="text-sm leading-7 text-[var(--ink)]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

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
