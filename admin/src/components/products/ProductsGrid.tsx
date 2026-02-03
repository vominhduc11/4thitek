import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Eye, Pencil, Trash2, RotateCcw, Globe2 } from "lucide-react";
import { Product } from "@/types";

interface ProductsGridProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onRestore?: (product: Product) => void;
  onTogglePublish: (product: Product, nextStatus: "PUBLISHED" | "UNPUBLISHED") => void;
  publishLoadingId?: string | null;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  loading: boolean;
  layout?: "grid" | "list";
}

const getImageUrl = (product: Product): string => {
  if (product.image) {
    try {
      // Support both plain URL and JSON string containing imageUrl/public_id
      const parsed = typeof product.image === "string" ? JSON.parse(product.image) : product.image;
      if (parsed?.imageUrl) return parsed.imageUrl;
      if (parsed?.url) return parsed.url;
    } catch {
      return (product.image as string) || "/placeholder.svg";
    }
  }
  return (product.image as string) || "/placeholder.svg";
};

const getStockColor = (stock: number) => {
  if (stock === 0) return "text-red-600";
  if (stock < 10) return "text-amber-600";
  return "text-green-600";
};

export function ProductsGrid({
  products,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onTogglePublish,
  publishLoadingId,
  selectable,
  selectedIds,
  onToggleSelect,
  loading,
  layout = "grid",
}: ProductsGridProps) {
  const containerClass =
    layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid grid-cols-1 gap-3";
  const isList = layout === "list";

  if (loading) {
    return (
      <div className={containerClass}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
            <div className="h-8 w-32 bg-muted rounded mb-3" />
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-4 w-2/3 bg-muted rounded" />
          </CardContent>
        </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted p-8 text-center text-muted-foreground">
        Chưa có sản phẩm nào
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {products.map((product) => (
        <Card
          key={product.id}
          className={`overflow-hidden ${isList ? "md:flex md:items-stretch" : ""}`}
        >
          <CardHeader
            className={`flex-row items-start justify-between space-y-0 ${
              isList ? "md:flex-col md:gap-2 md:border-r md:border-border md:min-w-[220px]" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              {selectable && product.id && (
                <Checkbox
                  checked={selectedIds?.has(product.id.toString())}
                  onCheckedChange={() => onToggleSelect?.(product.id!.toString())}
                  className="mt-1"
                  aria-label="Chọn sản phẩm"
                />
              )}
              <div>
                <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.isFeatured && <Badge variant="outline">Nổi bật</Badge>}
                  {product.showOnHomepage && <Badge variant="outline">Trang chủ</Badge>}
                  <Badge variant={product.publishStatus === "PUBLISHED" ? "default" : "outline"}>
                    {product.publishStatus === "PUBLISHED" ? "Đã xuất bản" : "Chưa xuất bản"}
                  </Badge>
                  {product.isDeleted && <Badge variant="destructive">Đã xóa</Badge>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className={isList ? "md:flex md:gap-4 space-y-3 md:space-y-0 md:p-4" : "space-y-3"}>
            <div
              className={`relative w-full ${isList ? "md:w-48 md:flex-shrink-0" : ""} aspect-video rounded-lg overflow-hidden border bg-muted`}
            >
              <img
                src={getImageUrl(product)}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className={isList ? "flex-1 space-y-3" : "space-y-3"}>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {product.shortDescription || "Chưa có mô tả ngắn"}
              </div>

              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Xuất bản</p>
                    <p className="text-xs text-muted-foreground">Hiển thị công khai & homepage (nếu bật)</p>
                  </div>
                </div>
                <Switch
                  checked={product.publishStatus === "PUBLISHED"}
                  onCheckedChange={(checked) => onTogglePublish(product, checked ? "PUBLISHED" : "UNPUBLISHED")}
                  disabled={!!publishLoadingId && publishLoadingId === product.id}
                  aria-label="Chuyển trạng thái xuất bản"
                />
              </div>

              <div
                className={`flex ${isList ? "flex-wrap items-center gap-3 justify-between" : "items-center justify-between"}`}
              >
                <div className="text-lg font-semibold text-primary">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                    Number(product.price || product.retailPrice || 0)
                  )}
                </div>
                <div
                  className={`text-sm font-semibold ${getStockColor(
                    product.stock ?? product.availability?.quantity ?? 0
                  )}`}
                >
                  Kho: {product.stock ?? product.availability?.quantity ?? 0}
                </div>
              </div>

              <div className={`flex flex-wrap gap-2 ${isList ? "justify-end" : ""}`}>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => onView(product)}>
                  <Eye className="h-4 w-4" /> Xem
                </Button>
                {product.isDeleted ? (
                  <>
                    {onRestore && (
                      <Button size="sm" variant="default" className="gap-2" onClick={() => onRestore(product)}>
                        <RotateCcw className="h-4 w-4" /> Khôi phục
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="gap-2" onClick={() => onDelete(product)}>
                      <Trash2 className="h-4 w-4" /> Xóa vĩnh viễn
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => onEdit(product)}>
                      <Pencil className="h-4 w-4" /> Sửa
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-2" onClick={() => onDelete(product)}>
                      <Trash2 className="h-4 w-4" /> Xóa
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
