import { Clock3, FileText, ImagePlus, Plus, Tag, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DestructiveButton,
  EmptyState,
  ErrorState,
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
  selectClass,
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
import { storeFileReference } from '../lib/upload'

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
    title: 'B\u00e0i vi\u1ebft',
    description:
      'Qu\u1ea3n l\u00fd b\u00e0i vi\u1ebft, l\u1ecbch \u0111\u0103ng, h\u00ecnh \u1ea3nh \u0111\u1ea1i di\u1ec7n v\u00e0 t\u00f3m t\u1eaft SEO.',
    searchLabel: 'T\u00ecm b\u00e0i vi\u1ebft',
    searchPlaceholder: 'T\u00ecm theo m\u00e3 b\u00e0i, ti\u00eau \u0111\u1ec1 ho\u1eb7c danh m\u1ee5c...',
    filterLabel: 'L\u1ecdc tr\u1ea1ng th\u00e1i b\u00e0i vi\u1ebft',
    allStatuses: 'T\u1ea5t c\u1ea3',
    newPost: 'T\u1ea1o b\u00e0i m\u1edbi',
    hideComposer: '\u1ea8n form t\u1ea1o',
    totalPosts: 'T\u1ed5ng b\u00e0i vi\u1ebft',
    publishedPosts: '\u0110\u00e3 \u0111\u0103ng',
    queuedPosts: 'L\u00ean l\u1ecbch / b\u1ea3n nh\u00e1p',
    emptyTitle: 'Kh\u00f4ng c\u00f3 b\u00e0i vi\u1ebft',
    emptyMessage: 'Th\u1eed \u0111i\u1ec1u ch\u1ec9nh b\u1ed9 l\u1ecdc ho\u1eb7c t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm.',
    loadTitle: 'Kh\u00f4ng th\u1ec3 t\u1ea3i b\u00e0i vi\u1ebft',
    loadFallback: 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch b\u00e0i vi\u1ebft',
    composerTitle: 'T\u1ea1o b\u00e0i vi\u1ebft m\u1edbi',
    composerDescription: '\u0110i\u1ec1n th\u00f4ng tin c\u01a1 b\u1ea3n \u0111\u1ec3 kh\u1edfi t\u1ea1o b\u00e0i vi\u1ebft.',
    titleField: 'Ti\u00eau \u0111\u1ec1',
    titlePlaceholder: 'Nh\u1eadp ti\u00eau \u0111\u1ec1 b\u00e0i vi\u1ebft',
    categoryField: 'Danh m\u1ee5c',
    categoryPlaceholder: 'Nh\u1eadp danh m\u1ee5c',
    excerptField: 'T\u00f3m t\u1eaft',
    excerptPlaceholder: 'Vi\u1ebft \u0111o\u1ea1n m\u00f4 t\u1ea3 ng\u1eafn cho b\u00e0i vi\u1ebft',
    statusField: 'Tr\u1ea1ng th\u00e1i',
    coverField: '\u1ea2nh \u0111\u1ea1i di\u1ec7n',
    uploadImage: 'T\u1ea3i \u1ea3nh \u0111\u1ea1i di\u1ec7n',
    uploadingImage: '\u0110ang t\u1ea3i \u1ea3nh...',
    savePost: 'L\u01b0u b\u00e0i vi\u1ebft',
    cancel: 'H\u1ee7y',
    requiredError: 'Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 ti\u00eau \u0111\u1ec1 v\u00e0 danh m\u1ee5c.',
    uploadFailed: 'Kh\u00f4ng th\u1ec3 t\u1ea3i \u1ea3nh b\u00e0i vi\u1ebft.',
    createFailed: 'Kh\u00f4ng th\u1ec3 t\u1ea1o b\u00e0i vi\u1ebft',
    createSuccess: '\u0110\u00e3 t\u1ea1o b\u00e0i {id}.',
    postColumn: 'B\u00e0i vi\u1ebft',
    categoryColumn: 'Danh m\u1ee5c',
    statusColumn: 'Tr\u1ea1ng th\u00e1i',
    updatedColumn: 'C\u1eadp nh\u1eadt',
    actionsColumn: 'Thao t\u00e1c',
    noCategory: 'Ch\u01b0a ph\u00e2n lo\u1ea1i',
    noExcerpt: 'Ch\u01b0a c\u00f3 t\u00f3m t\u1eaft.',
    changeStatusTitle: 'X\u00e1c nh\u1eadn \u0111\u1ed5i tr\u1ea1ng th\u00e1i',
    changeStatusMessage:
      'B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n chuy\u1ec3n b\u00e0i vi\u1ebft n\u00e0y sang tr\u1ea1ng th\u00e1i "{status}" kh\u00f4ng?',
    updateFailed: 'Kh\u00f4ng c\u1eadp nh\u1eadt \u0111\u01b0\u1ee3c b\u00e0i vi\u1ebft',
    deleteTitle: 'X\u00f3a b\u00e0i vi\u1ebft',
    deleteMessage:
      'H\u00e0nh \u0111\u1ed9ng n\u00e0y s\u1ebd x\u00f3a b\u00e0i vi\u1ebft kh\u1ecfi danh s\u00e1ch qu\u1ea3n tr\u1ecb.',
    confirmDelete: 'X\u00f3a b\u00e0i',
    deleteLabel: 'X\u00f3a',
    deleteFailed: 'Kh\u00f4ng x\u00f3a \u0111\u01b0\u1ee3c b\u00e0i vi\u1ebft',
    previewAlt: 'Xem tr\u01b0\u1edbc b\u00e0i vi\u1ebft',
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
  const [form, setForm] = useState<CreateFormState>(createInitialForm)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesStatus = statusFilter === 'all' ? true : post.status === statusFilter
        const matchesQuery =
          !normalizedQuery ||
          post.id.toLowerCase().includes(normalizedQuery) ||
          post.title.toLowerCase().includes(normalizedQuery) ||
          post.category.toLowerCase().includes(normalizedQuery)
        return matchesStatus && matchesQuery
      }),
    [normalizedQuery, posts, statusFilter],
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

  const closeComposer = () => {
    setShowCreate(false)
    setCreateError('')
    setForm(createInitialForm())
  }

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      return
    }

    setCreateError('')
    setIsUploadingImage(true)
    try {
      const stored = await storeFileReference({
        file,
        category: 'blogs',
        accessToken,
      })
      setForm((previous) => ({
        ...previous,
        imageUrl: stored.url,
        imageName: file.name,
      }))
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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h3 className={cardTitleClass}>{copy.title}</h3>
          <p className={bodyTextClass}>{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <SearchInput
            id="blogs-search"
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-80"
          />
          <select
            aria-label={copy.filterLabel}
            className={`${inputClass} w-full sm:w-56`}
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
                className={`${selectClass} w-full`}
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
          {createError ? <p className="text-sm font-medium text-rose-600">{createError}</p> : null}
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
                              className="h-12 w-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
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
                            className="h-9 min-w-0 px-3"
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
