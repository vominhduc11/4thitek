import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BlogResponse, BlogIntroductionItem } from "@/types";

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: BlogResponse | null;
}

const resolveImageUrl = (image: BlogResponse["image"]): string => {
  if (!image) return "/placeholder.svg";
  if (typeof image === "string") {
    try {
      const parsed = JSON.parse(image);
      if (parsed?.imageUrl) return parsed.imageUrl;
      if (parsed?.url) return parsed.url;
    } catch {
      return image;
    }
    return image;
  }
  if (typeof image === "object" && image !== null) {
    // @ts-expect-error legacy format
    return image.imageUrl || image.url || "/placeholder.svg";
  }
  return "/placeholder.svg";
};

export function BlogDetailModal({ isOpen, onClose, blog }: BlogDetailModalProps) {
  if (!blog) return null;

  const intro: BlogIntroductionItem[] = (() => {
    if (!blog.introduction) return [];
    if (Array.isArray(blog.introduction)) return blog.introduction;
    try {
      const parsed = typeof blog.introduction === "string" ? JSON.parse(blog.introduction) : blog.introduction;
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
    return [];
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{blog.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4 sm:gap-6">
            <img
              src={resolveImageUrl(blog.image)}
              alt={blog.title}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-lg object-cover border"
            />
            <div className="space-y-2">
              <p className="text-muted-foreground">{blog.description}</p>
              <div className="text-sm text-muted-foreground">
                Danh mục: <span className="font-medium">{blog.category || "—"}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Hiển thị trang chủ: <span className="font-medium">{blog.showOnHomepage ? "Có" : "Không"}</span>
              </div>
            </div>
          </div>

          {intro.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Giới thiệu</h3>
                <div className="space-y-3">
                  {intro.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      {item.type === "title" && <h4 className="font-semibold">{item.text}</h4>}
                      {item.type === "description" && (
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{item.text}</p>
                      )}
                      {item.type === "image" && item.imageUrl && (
                        <img src={item.imageUrl} alt={`intro-${idx}`} className="w-full rounded border" />
                      )}
                      {item.type === "images" && item.images && (
                        <div className="grid grid-cols-2 gap-2">
                          {item.images.map((img, i) => (
                            <img key={i} src={img.url} alt={`intro-${idx}-${i}`} className="w-full rounded border" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
