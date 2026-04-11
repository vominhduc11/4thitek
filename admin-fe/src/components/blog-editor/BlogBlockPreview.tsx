import { resolveBackendAssetUrl } from "../../lib/backendApi";
import {
  isValidRemoteUrl,
  sanitizeRichTextHtml,
} from "../../lib/blogContent";
import type { BlogContentBlock } from "../../types/blogContent";
import { ProductVideoPreview } from "../ProductVideoPreview";

type BlogBlockPreviewProps = {
  blocks: BlogContentBlock[];
  emptyMessage?: string;
  className?: string;
};

const renderParagraph = (html: string, key: string) => {
  const sanitizedHtml = sanitizeRichTextHtml(html);
  if (!sanitizedHtml) return null;

  return (
    <div
      key={key}
      className="blog-block-richtext prose prose-slate max-w-none text-sm leading-8 text-[var(--ink)]"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export const BlogBlockPreview = ({
  blocks,
  emptyMessage = "Chưa có nội dung bài viết.",
  className = "",
}: BlogBlockPreviewProps) => {
  const hasContent = blocks.length > 0;

  return (
    <div className={`space-y-5 ${className}`.trim()}>
      {!hasContent ? (
        <p className="text-sm italic text-[var(--muted)]">{emptyMessage}</p>
      ) : (
        blocks.map((block, index) => {
          const key = `${block.type}-${index}`;
          if (block.type === "paragraph") {
            return renderParagraph(block.text, key);
          }

          if (block.type === "image") {
            if (!block.url.trim()) return null;
            return (
              <figure
                key={key}
                className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)]"
              >
                <img
                  src={resolveBackendAssetUrl(block.url)}
                  alt={block.caption?.trim() || "Ảnh nội dung bài viết"}
                  className="w-full object-cover"
                />
                {block.caption?.trim() ? (
                  <figcaption className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                    {block.caption.trim()}
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          if (block.type === "gallery") {
            if (block.items.length === 0) return null;
            return (
              <figure
                key={key}
                className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {block.items.map((item, itemIndex) => (
                    <div
                      key={`${key}-item-${itemIndex}`}
                      className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)]"
                    >
                      <img
                        src={resolveBackendAssetUrl(item.url)}
                        alt={`Ảnh thư viện ${itemIndex + 1}`}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                {block.caption?.trim() ? (
                  <figcaption className="mt-3 text-sm text-[var(--muted)]">
                    {block.caption.trim()}
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          if (!block.url.trim() || !isValidRemoteUrl(block.url)) {
            return block.caption?.trim() ? (
              <div
                key={key}
                className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)]"
              >
                {block.caption.trim()}
              </div>
            ) : null;
          }

          return (
            <figure
              key={key}
              className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)]"
            >
              <ProductVideoPreview url={block.url} title={block.caption || "Video bài viết"} />
              {block.caption?.trim() ? (
                <figcaption className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                  {block.caption.trim()}
                </figcaption>
              ) : null}
            </figure>
          );
        })
      )}
    </div>
  );
};
