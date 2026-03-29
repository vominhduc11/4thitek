import { ArrowLeft, FileText, Pencil, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
} from "../components/ui-kit";
import { useAdminData, type BlogStatus } from "../context/AdminDataContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { blogStatusTone } from "../lib/adminLabels";
import { resolveBackendAssetUrl } from "../lib/backendApi";
import { formatDateTime } from "../lib/formatters";

const BLOG_STATUS_ORDER: BlogStatus[] = ["published", "scheduled", "draft"];

const statusLabelsKeys = {
  published: "Da dang",
  scheduled: "Hen gio",
  draft: "Ban nhap",
} as const;

const copyKeys = {
  back: "Ve danh sach bai viet",
  loadTitle: "Không thể tải bài viết",
  loadFallback: "Không tải được chi tiết bài viết",
  notFoundTitle: "Không tìm thấy bài viết",
  notFoundMessage: "Bài {id} không tồn tại hoặc đã bị xóa.",
  summaryFallback: "Chua co tom tat cho bai viet nay.",
  contentFallback: "Bai viet nay chua co noi dung.",
  uncategorized: "Chua phan loai",
  summaryLabel: "Tom tat",
  contentLabel: "Noi dung",
  homepageLabel: "Hien tren trang chu",
  titleLabel: "Tieu de",
  categoryLabel: "Danh muc",
  imageLabel: "Anh dai dien (URL)",
  statusTitle: "Cap nhat trang thai",
  statusHelp: "Thay doi trang thai va kha nang xuat hien tren public site.",
  changeStatusTitle: "Xac nhan doi trang thai",
  changeStatusMessage: 'Chuyen bai viet nay sang trang thai "{status}"?',
  updateFailed: "Không cập nhật được bài viết",
  metaLabel: "Cap nhat lan cuoi",
  deleteTitle: "Xoa bai viet",
  deleteMessage: "Hanh dong nay se xoa bai viet khoi he thong quan tri.",
  deleteHelp: "Chỉ xóa khi bạn chắc chắn bài viết không còn được sử dụng.",
  confirmDelete: "Xoa bai",
  deleteLabel: "Xoa bai",
  deleteFailed: "Không xóa được bài viết",
  edit: "Chinh sua",
  save: "Luu thay doi",
  cancel: "Huy",
  saveFailed: "Không lưu được bài viết",
  yes: "Co",
  no: "Khong",
} as const;

type IntroductionBlock = { type: string; text?: string };

const parseContent = (raw?: string): string[] => {
  if (!raw) return [];
  try {
    const blocks = JSON.parse(raw) as IntroductionBlock[];
    if (Array.isArray(blocks)) {
      return blocks.map((block) => block.text ?? "").filter(Boolean);
    }
  } catch {
    if (raw.trim()) return [raw.trim()];
  }
  return [];
};

function BlogDetailPageRevamp() {
  const { id = "" } = useParams();
  const postId = decodeURIComponent(id);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { notify } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();
  const {
    posts,
    postsState,
    updatePost,
    updatePostStatus,
    deletePost,
    reloadResource,
  } = useAdminData();

  const copy = translateCopy(copyKeys, t);
  const statusLabels = translateCopy(statusLabelsKeys, t);
  const post = posts.find((item) => item.id === postId);

  const contentParagraphs = useMemo(
    () => parseContent(post?.content),
    [post?.content],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editShowOnHomepage, setEditShowOnHomepage] = useState(false);
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (postsState.status === "loading" || postsState.status === "idle") {
    return (
      <PagePanel>
        <LoadingRows rows={4} />
      </PagePanel>
    );
  }

  if (postsState.status === "error") {
    return (
      <PagePanel>
        <ErrorState
          title={copy.loadTitle}
          message={postsState.error || t("Không tải được chi tiết bài viết")}
          onRetry={() => void reloadResource("posts")}
        />
      </PagePanel>
    );
  }

  if (!post) {
    return (
      <PagePanel>
        <EmptyState
          icon={FileText}
          title={copy.notFoundTitle}
          message={copy.notFoundMessage.replace("{id}", postId)}
        />
      </PagePanel>
    );
  }

  const handleStartEdit = () => {
    setEditTitle(post.title);
    setEditCategory(post.category);
    setEditExcerpt(post.excerpt);
    setEditContent(contentParagraphs.join("\n\n"));
    setEditImageUrl(post.imageUrl ?? "");
    setEditShowOnHomepage(Boolean(post.showOnHomepage));
    setEditScheduledAt(post.scheduledAt ? post.scheduledAt.slice(0, 16) : "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePost(post.id, {
        title: editTitle,
        category: editCategory,
        excerpt: editExcerpt,
        content: editContent,
        status: post.status,
        imageUrl: editImageUrl || undefined,
        showOnHomepage: editShowOnHomepage,
        scheduledAt: editScheduledAt
          ? new Date(editScheduledAt).toISOString()
          : undefined,
      });
      setIsEditing(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : copy.saveFailed, {
        title: copy.edit,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PagePanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className={ghostButtonClass} to="/blogs">
          <ArrowLeft className="h-4 w-4" />
          {copy.back}
        </Link>
        <StatusBadge tone={blogStatusTone[post.status]}>
          {statusLabels[post.status]}
        </StatusBadge>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.95fr)] xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)]">
        <article className="min-w-0 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
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
                  onChange={(event) => setEditTitle(event.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>{copy.categoryLabel}</span>
                <input
                  className={`${inputClass} w-full`}
                  value={editCategory}
                  onChange={(event) => setEditCategory(event.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>{copy.imageLabel}</span>
                <input
                  className={`${inputClass} w-full`}
                  value={editImageUrl}
                  onChange={(event) => setEditImageUrl(event.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>{copy.summaryLabel}</span>
                <textarea
                  className={`${textareaClass} w-full`}
                  rows={4}
                  value={editExcerpt}
                  onChange={(event) => setEditExcerpt(event.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className={labelClass}>{copy.contentLabel}</span>
                <textarea
                  className={`${textareaClass} w-full`}
                  rows={8}
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <span className="text-sm font-semibold text-[var(--ink)]">
                  {copy.homepageLabel}
                </span>
                <input
                  checked={editShowOnHomepage}
                  className="h-5 w-5 accent-[var(--accent)]"
                  onChange={(event) =>
                    setEditShowOnHomepage(event.target.checked)
                  }
                  type="checkbox"
                />
              </label>
              {(post.status === "scheduled" || editScheduledAt) && (
                <label className="block space-y-1">
                  <span className={labelClass}>Lên lịch đăng</span>
                  <input
                    className={`${inputClass} w-full`}
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(event) => setEditScheduledAt(event.target.value)}
                  />
                </label>
              )}
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
                  onClick={() => setIsEditing(false)}
                  type="button"
                >
                  {copy.cancel}
                </GhostButton>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {post.category || copy.uncategorized}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {copy.homepageLabel}: {post.showOnHomepage ? copy.yes : copy.no}
              </p>
              {post.scheduledAt && (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Lên lịch: {formatDateTime(post.scheduledAt)}
                </p>
              )}
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
              <div className="mt-6 space-y-3">
                <p className={labelClass}>{copy.contentLabel}</p>
                {contentParagraphs.length > 0 ? (
                  <div className="space-y-4">
                    {contentParagraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-sm leading-7 text-[var(--ink)]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-[var(--ink)]">
                    {copy.contentFallback}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            <span>
              {copy.metaLabel}: {formatDateTime(post.updatedAt)}
            </span>
          </div>
        </article>

        <aside className={`${formCardClass} min-w-0 space-y-6`}>
          <div className="space-y-2">
            <p className={cardTitleClass}>{copy.statusTitle}</p>
            <p className={bodyTextClass}>{copy.statusHelp}</p>
            <select
              aria-label={`${copy.statusTitle} ${post.id}`}
              className={`${inputClass} mt-2 w-full`}
              onChange={async (event) => {
                const next = event.target.value as BlogStatus;
                if (next === post.status) return;

                const approved = await confirm({
                  title: copy.changeStatusTitle,
                  message: copy.changeStatusMessage.replace(
                    "{status}",
                    statusLabels[next],
                  ),
                  tone: next === "draft" ? "warning" : "info",
                  confirmLabel: statusLabels[next],
                });

                if (!approved) {
                  event.currentTarget.value = post.status;
                  return;
                }

                try {
                  await updatePostStatus(post.id, next);
                } catch (error) {
                  notify(
                    error instanceof Error ? error.message : copy.updateFailed,
                    {
                      title: copy.statusTitle,
                      variant: "error",
                    },
                  );
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
            <p className="text-sm font-semibold text-rose-700">
              {copy.deleteTitle}
            </p>
            <p className="mt-2 text-sm text-rose-600">{copy.deleteHelp}</p>
            <DestructiveButton
              className="mt-4 w-full"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={async () => {
                const approved = await confirm({
                  title: copy.deleteTitle,
                  message: copy.deleteMessage,
                  tone: "danger",
                  confirmLabel: copy.confirmDelete,
                });
                if (!approved) return;

                try {
                  await deletePost(post.id);
                  navigate("/blogs");
                } catch (error) {
                  notify(
                    error instanceof Error ? error.message : copy.deleteFailed,
                    {
                      title: copy.deleteTitle,
                      variant: "error",
                    },
                  );
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
  );
}

export default BlogDetailPageRevamp;
