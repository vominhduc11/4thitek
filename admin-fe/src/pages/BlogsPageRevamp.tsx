import { Clock3, FileText, ImagePlus, Plus, Tag, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DestructiveButton,
  EmptyState,
  ErrorState,
  FieldErrorMessage,
  GhostButton,
  LoadingRows,
  PagePanel,
  PrimaryButton,
  SearchInput,
  StatCard,
  StatusBadge,
  bodyTextClass,
  cardTitleClass,
  formCardClass,
  inputClass,
  labelClass,
  tableActionSelectClass,
  tableCardClass,
  tableHeadClass,
  tableMetaClass,
  tableRowClass,
  tableValueClass,
  textareaClass,
} from '../components/ui-kit'
import { useAdminData, type BlogStatus } from '../context/AdminDataContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { blogStatusTone } from '../lib/adminLabels'
import { resolveBackendAssetUrl } from '../lib/backendApi'
import { formatDateTime } from '../lib/formatters'
import { deleteStoredFileReference, storeFileReference } from '../lib/upload'

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
    title: 'Bài viết',
    description:
      'Quản lý bài viết, lịch đăng, hình ảnh đại diện và tóm tắt SEO.',
    searchLabel: 'Tìm bài viết',
    searchPlaceholder: 'Tìm theo mã bài, tiêu đề hoặc danh mục...',
    filterLabel: 'Lọc trạng thái bài viết',
    allStatuses: 'Tất cả',
    newPost: 'Tạo bài mới',
    hideComposer: 'Ẩn form tạo',
    totalPosts: 'Tổng bài viết',
    publishedPosts: 'Đã đăng',
    queuedPosts: 'Lên lịch / bản nháp',
    emptyTitle: 'Không có bài viết',
    emptyMessage: 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.',
    loadTitle: 'Không thể tải bài viết',
    loadFallback: 'Không tải được danh sách bài viết',
    composerTitle: 'Tạo bài viết mới',
    composerDescription: 'Điền thông tin cơ bản để khởi tạo bài viết.',
    titleField: 'Tiêu đề',
    titlePlaceholder: 'Nhập tiêu đề bài viết',
    categoryField: 'Danh mục',
    categoryPlaceholder: 'Nhập danh mục',
    excerptField: 'Tóm tắt',
    excerptPlaceholder: 'Viết đoạn mô tả ngắn cho bài viết',
    statusField: 'Trạng thái',
    coverField: 'Ảnh đại diện',
    uploadImage: 'Tải ảnh đại diện',
    uploadingImage: 'Đang tải ảnh...',
    savePost: 'Lưu bài viết',
    cancel: 'Hủy',
    requiredError: 'Vui lòng nhập đầy đủ tiêu đề và danh mục.',
    uploadFailed: 'Không thể tải ảnh bài viết.',
    createFailed: 'Không thể tạo bài viết',
    createSuccess: 'Đã tạo bài {id}.',
    postColumn: 'Bài viết',
    categoryColumn: 'Danh mục',
    statusColumn: 'Trạng thái',
    updatedColumn: 'Cập nhật',
    actionsColumn: 'Thao tác',
    noCategory: 'Chưa phân loại',
    noExcerpt: 'Chưa có tóm tắt.',
    changeStatusTitle: 'Xác nhận đổi trạng thái',
    changeStatusMessage:
      'Bạn có chắc muốn chuyển bài viết này sang trạng thái "{status}" không?',
    updateFailed: 'Không cập nhật được bài viết',
    deleteTitle: 'Xóa bài viết',
    deleteMessage:
      'Hành động này sẽ xóa bài viết khỏi danh sách quản trị.',
    confirmDelete: 'Xóa bài',
    deleteLabel: 'Xóa',
    deleteFailed: 'Không xóa được bài viết',
    previewAlt: 'Xem trước bài viết',
  },
  en: {
    title: 'Posts',
    description: 'Manage posts, publish schedules, cover images, and SEO-friendly summaries.',
    searchLabel: 'Search posts',
    searchPlaceholder: 'Search by ID, title, or category...',
    filterLabel: 'Filter post status',
    allStatuses: 'All',
    newPost: 'Create post',
    hideComposer: 'Hide composer',
    totalPosts: 'Total posts',
    publishedPosts: 'Published',
    queuedPosts: 'Scheduled / drafts',
    emptyTitle: 'No posts found',
    emptyMessage: 'Try adjusting filters or your search keywords.',
    loadTitle: 'Unable to load posts',
    loadFallback: 'Could not load the posts list',
    composerTitle: 'Create a new post',
    composerDescription: 'Fill in the basics to bootstrap a post draft.',
    titleField: 'Title',
    titlePlaceholder: 'Enter the post title',
    categoryField: 'Category',
    categoryPlaceholder: 'Enter a category',
    excerptField: 'Summary',
    excerptPlaceholder: 'Write a short summary for this post',
    statusField: 'Status',
    coverField: 'Cover image',
    uploadImage: 'Upload cover image',
    uploadingImage: 'Uploading image...',
    savePost: 'Save post',
    cancel: 'Cancel',
    requiredError: 'Please provide both a title and category.',
    uploadFailed: 'Could not upload the post image.',
    createFailed: 'Could not create the post',
    createSuccess: 'Created post {id}.',
    postColumn: 'Post',
    categoryColumn: 'Category',
    statusColumn: 'Status',
    updatedColumn: 'Updated',
    actionsColumn: 'Actions',
    noCategory: 'Uncategorized',
    noExcerpt: 'No summary yet.',
    changeStatusTitle: 'Confirm status change',
    changeStatusMessage: 'Change this post to "{status}"?',
    updateFailed: 'Could not update the post',
    deleteTitle: 'Delete post',
    deleteMessage: 'This action removes the post from the admin list.',
    confirmDelete: 'Delete post',
    deleteLabel: 'Delete',
    deleteFailed: 'Could not delete the post',
    previewAlt: 'Post preview',
  },
} as const

type CreateFormState = {
  title: string
  category: string
  excerpt: string
  status: BlogStatus
  imageUrl: string
  imageName: string
}

const createInitialForm = (): CreateFormState => ({
  title: '',
  category: '',
  excerpt: '',
  status: 'draft',
  imageUrl: '',
  imageName: '',
})

function BlogsPageRevamp() {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const { language } = useLanguage()
  const { notify } = useToast()
  const { confirm, confirmDialog } = useConfirmDialog()
  const { posts, postsState, addPost, updatePostStatus, deletePost, reloadResource } =
    useAdminData()

  const copy = copyByLanguage[language]
  const statusLabels = statusLabelsByLanguage[language]

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BlogStatus>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const composerUploadedAssetUrlsRef = useRef<Set<string>>(new Set())
  const [form, setForm] = useState<CreateFormState>(createInitialForm)
  const toolbarSearchClass = 'w-full sm:max-w-sm lg:w-72 xl:w-80'

  const normalizedQuery = query.trim().toLowerCase()
  const searchablePosts = useMemo(
    () =>
      posts.map((post) => ({
        post,
        searchText: `${post.id} ${post.title} ${post.category}`.toLowerCase(),
      })),
    [posts],
  )
  const filteredPosts = useMemo(
    () =>
      searchablePosts.filter(({ post, searchText }) => {
        const matchesStatus = statusFilter === 'all' ? true : post.status === statusFilter
        const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery)
        return matchesStatus && matchesQuery
      }).map(({ post }) => post),
    [normalizedQuery, searchablePosts, statusFilter],
  )

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.status === 'published').length
    const scheduled = posts.filter((post) => post.status === 'scheduled').length
    const draft = posts.filter((post) => post.status === 'draft').length
    return { published, queued: scheduled + draft }
  }, [posts])

  const statusOptions = useMemo(
    () => [
      { value: 'all' as const, label: copy.allStatuses },
      ...BLOG_STATUS_ORDER.map((status) => ({
        value: status,
        label: statusLabels[status],
      })),
    ],
    [copy.allStatuses, statusLabels],
  )

  const cleanupComposerUploadedAssets = useCallback(
    async (urls: Array<string | null | undefined>) => {
      const trackedUrls = Array.from(
        new Set(
          urls
            .map((url) => String(url ?? '').trim())
            .filter((url) => url && composerUploadedAssetUrlsRef.current.has(url)),
        ),
      )

      if (trackedUrls.length === 0) {
        return
      }

      const results = await Promise.allSettled(
        trackedUrls.map(async (url) => {
          await deleteStoredFileReference({
            url,
            accessToken,
          })
          return url
        }),
      )

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          composerUploadedAssetUrlsRef.current.delete(trackedUrls[index])
        }
      })
    },
    [accessToken],
  )

  const closeComposer = () => {
    void cleanupComposerUploadedAssets(Array.from(composerUploadedAssetUrlsRef.current))
    setShowCreate(false)
    setCreateError('')
    setForm(createInitialForm())
  }

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      return
    }

    const previousImageUrl = form.imageUrl.trim()
    setCreateError('')
    setIsUploadingImage(true)
    try {
      const stored = await storeFileReference({
        file,
        category: 'blogs',
        accessToken,
      })
      composerUploadedAssetUrlsRef.current.add(stored.url)
      setForm((previous) => ({
        ...previous,
        imageUrl: stored.url,
        imageName: file.name,
      }))
      void cleanupComposerUploadedAssets([previousImageUrl])
    } catch {
      setCreateError(copy.uploadFailed)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleCreate = async () => {
    setCreateError('')
    if (!form.title.trim() || !form.category.trim()) {
      setCreateError(copy.requiredError)
      return
    }

    try {
      const created = await addPost({
        title: form.title.trim(),
        category: form.category.trim(),
        excerpt: form.excerpt.trim(),
        status: form.status,
        imageUrl: form.imageUrl,
      })
      notify(copy.createSuccess.replace('{id}', created.id), {
        title: copy.title,
        variant: 'success',
      })
      composerUploadedAssetUrlsRef.current.clear()
      closeComposer()
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : copy.createFailed)
    }
  }

  if (postsState.status === 'loading' || postsState.status === 'idle') {
    return (
      <PagePanel>
        <LoadingRows rows={6} />
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

  return (
    <PagePanel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <SearchInput
            id="blogs-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={toolbarSearchClass}
          />
          <select
            aria-label={copy.filterLabel}
            className={`${inputClass} w-full sm:max-w-[14rem] lg:w-56`}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | BlogStatus)}
            value={statusFilter}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <PrimaryButton
            aria-label={showCreate ? copy.hideComposer : copy.newPost}
            className="w-full sm:w-auto"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreate((value) => !value)}
            type="button"
          >
            {showCreate ? copy.hideComposer : copy.newPost}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label={copy.totalPosts} value={posts.length} tone="neutral" />
        <StatCard
          icon={Tag}
          label={copy.publishedPosts}
          value={stats.published}
          tone="success"
        />
        <StatCard
          icon={Clock3}
          label={copy.queuedPosts}
          value={stats.queued}
          tone="warning"
        />
      </div>

      {showCreate ? (
        <section className={`${formCardClass} mt-6 space-y-4`}>
          <div>
            <p className={cardTitleClass}>{copy.composerTitle}</p>
            <p className={bodyTextClass}>{copy.composerDescription}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 lg:col-span-2">
              <span className={labelClass}>{copy.titleField}</span>
              <input
                className={`${inputClass} w-full`}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, title: event.target.value }))
                }
                placeholder={copy.titlePlaceholder}
                value={form.title}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.categoryField}</span>
              <input
                className={`${inputClass} w-full`}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, category: event.target.value }))
                }
                placeholder={copy.categoryPlaceholder}
                value={form.category}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>{copy.statusField}</span>
              <select
                aria-label={copy.statusField}
                className={`${inputClass} w-full`}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    status: event.target.value as BlogStatus,
                  }))
                }
                value={form.status}
              >
                {BLOG_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className={labelClass}>{copy.excerptField}</span>
              <textarea
                className={textareaClass}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, excerpt: event.target.value }))
                }
                placeholder={copy.excerptPlaceholder}
                rows={4}
                value={form.excerpt}
              />
            </label>
            <div className="space-y-2 lg:col-span-2">
              <span className={labelClass}>{copy.coverField}</span>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <ImagePlus className="h-4 w-4" />
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
                  type="file"
                />
                {isUploadingImage ? copy.uploadingImage : form.imageName || copy.uploadImage}
              </label>
              {form.imageUrl ? (
                <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
                  <img
                    src={resolveBackendAssetUrl(form.imageUrl)}
                    alt={form.title || copy.previewAlt}
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
          {createError ? <FieldErrorMessage>{createError}</FieldErrorMessage> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <GhostButton className="w-full sm:w-auto" onClick={closeComposer} type="button">
              {copy.cancel}
            </GhostButton>
            <PrimaryButton className="w-full sm:w-auto" onClick={handleCreate} type="button">
              {copy.savePost}
            </PrimaryButton>
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        {filteredPosts.length === 0 ? (
          <EmptyState icon={FileText} title={copy.emptyTitle} message={copy.emptyMessage} />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredPosts.map((post) => (
                <article key={post.id} className={tableCardClass}>
                  <button
                    className="w-full text-left"
                    onClick={() => navigate(`/blogs/${encodeURIComponent(post.id)}`)}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      {post.imageUrl ? (
                        <img
                          src={resolveBackendAssetUrl(post.imageUrl)}
                          alt={post.title}
                          className="h-16 w-16 rounded-2xl border border-[var(--border)] bg-[var(--surface)] object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={tableValueClass}>{post.title}</p>
                            <p className={tableMetaClass}>{post.id}</p>
                          </div>
                          <StatusBadge tone={blogStatusTone[post.status]}>
                            {statusLabels[post.status]}
                          </StatusBadge>
                        </div>
                        <p className="mt-3 text-sm text-[var(--ink)]">
                          {post.excerpt || copy.noExcerpt}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                          <span>{post.category || copy.noCategory}</span>
                          <span>{formatDateTime(post.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="mt-4 grid gap-2">
                    <select
                      aria-label={`${copy.statusColumn} ${post.id}`}
                      className={`${inputClass} w-full`}
                      onChange={async (event) => {
                        const next = event.target.value as BlogStatus
                        if (next === post.status) {
                          return
                        }

                        const approved = await confirm({
                          title: copy.changeStatusTitle,
                          message: copy.changeStatusMessage.replace(
                            '{status}',
                            statusLabels[next],
                          ),
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
                            title: copy.title,
                            variant: 'error',
                          })
                        }
                      }}
                      value={post.status}
                    >
                      {BLOG_STATUS_ORDER.map((status) => (
                        <option key={`${post.id}-${status}`} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <DestructiveButton
                      className="w-full"
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
                        } catch (error) {
                          notify(error instanceof Error ? error.message : copy.deleteFailed, {
                            title: copy.title,
                            variant: 'error',
                          })
                        }
                      }}
                      type="button"
                    >
                      {copy.deleteLabel}
                    </DestructiveButton>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-2" role="table">
                <thead>
                  <tr className={tableHeadClass}>
                    <th className="px-3 py-2 font-semibold">{copy.postColumn}</th>
                    <th className="px-3 py-2 font-semibold">{copy.categoryColumn}</th>
                    <th className="px-3 py-2 font-semibold">{copy.statusColumn}</th>
                    <th className="px-3 py-2 font-semibold">{copy.updatedColumn}</th>
                    <th className="px-3 py-2 font-semibold">{copy.actionsColumn}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className={tableRowClass}
                      onClick={() => navigate(`/blogs/${encodeURIComponent(post.id)}`)}
                      role="row"
                    >
                      <td className="rounded-l-2xl px-3 py-3">
                        <div className="flex items-center gap-3">
                          {post.imageUrl ? (
                            <img
                              src={resolveBackendAssetUrl(post.imageUrl)}
                              alt={post.title}
                              className="h-16 w-16 rounded-2xl border border-[var(--border)] bg-[var(--surface)] object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={tableValueClass}>{post.title}</p>
                            <p className={tableMetaClass}>{post.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">{post.category || copy.noCategory}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={blogStatusTone[post.status]}>
                          {statusLabels[post.status]}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-xs text-[var(--muted)]">
                        {formatDateTime(post.updatedAt)}
                      </td>
                      <td
                        className="rounded-r-2xl px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label={`${copy.statusColumn} ${post.id}`}
                            className={tableActionSelectClass}
                            onChange={async (event) => {
                              const next = event.target.value as BlogStatus
                              if (next === post.status) {
                                return
                              }

                              const approved = await confirm({
                                title: copy.changeStatusTitle,
                                message: copy.changeStatusMessage.replace(
                                  '{status}',
                                  statusLabels[next],
                                ),
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
                                  title: copy.title,
                                  variant: 'error',
                                })
                              }
                            }}
                            value={post.status}
                          >
                            {BLOG_STATUS_ORDER.map((status) => (
                              <option key={`${post.id}-${status}`} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                          <DestructiveButton
                            className="min-h-11 min-w-0 px-3"
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
                              } catch (error) {
                                notify(error instanceof Error ? error.message : copy.deleteFailed, {
                                  title: copy.title,
                                  variant: 'error',
                                })
                              }
                            }}
                            type="button"
                          >
                            {copy.deleteLabel}
                          </DestructiveButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {confirmDialog}
    </PagePanel>
  )
}

export default BlogsPageRevamp
