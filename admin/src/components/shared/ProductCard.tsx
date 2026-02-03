/**
 * @fileoverview Product Card Component for Grid View
 * @module components/shared/ProductCard
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ThemeBadge } from "@/components/ui/theme-badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, RotateCcw, Trash, Package, AlertTriangle } from "lucide-react";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  viewMode: "active" | "deleted";
  onView: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onRestore?: (product: Product) => void;
  onHardDelete?: (product: Product) => void;
  index?: number;
  isDeleted?: boolean;
}

function ProductCardComponent(props: ProductCardProps) {
  const {
    product,
    viewMode,
    onView,
    onEdit,
    onDelete,
    onRestore,
    onHardDelete,
    index = 0,
  } = props;

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price.toString().replace(/[^0-9.-]+/g, ''));
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numPrice);
  };

  const stock = product.stock || 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 ${
        viewMode === "deleted" ? "opacity-60" : ""
      }`}
    >
      {/* Badge Container */}
      <div className="absolute top-2 md:top-3 left-2 md:left-3 right-2 md:right-3 z-10 flex items-start justify-between gap-1 md:gap-2">
        <div className="flex flex-col gap-0.5 md:gap-1">
          {viewMode === "deleted" && (
            <ThemeBadge variant="destructive" className="shadow-sm text-xs md:text-sm">
              <Trash className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
              Đã xóa
            </ThemeBadge>
          )}
          {viewMode === "active" && isOutOfStock && (
            <ThemeBadge variant="destructive" className="shadow-sm text-xs md:text-sm">
              <Package className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
              Hết hàng
            </ThemeBadge>
          )}
          {viewMode === "active" && isLowStock && (
            <ThemeBadge variant="warning" className="shadow-sm text-xs md:text-sm">
              <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
              Sắp hết
            </ThemeBadge>
          )}
          {product.isFeatured && (
            <ThemeBadge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 shadow-sm text-xs md:text-sm">
              ⭐ Nổi bật
            </ThemeBadge>
          )}
        </div>

        {product.showOnHomepage && (
          <ThemeBadge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 shadow-sm text-xs md:text-sm">
            Trang chủ
          </ThemeBadge>
        )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image || "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop";
          }}
        />

        {/* Hover Overlay with Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-2 md:p-3 gap-1 md:gap-2"
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onView(product);
            }}
            className="bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5"
          >
            <Eye className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
            Xem
          </Button>

          {viewMode === "active" && onEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              className="bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5"
            >
              <Edit className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
              Sửa
            </Button>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-2 md:p-3">
        {/* Product Name */}
        <div className="mb-2 md:mb-3">
          <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div>
            <p className="text-base md:text-lg font-bold text-foreground">
              {formatPrice(product.price)}
            </p>
            <div className="flex items-center gap-1 md:gap-1 mt-1">
              <span className="text-xs md:text-sm text-muted-foreground">
                Tồn: <strong className="text-foreground">{stock}</strong>
              </span>
              {viewMode === "active" && (
                <>
                  {isOutOfStock && (
                    <ThemeBadge variant="destructive" className="text-xs md:text-sm">Hết</ThemeBadge>
                  )}
                  {isLowStock && (
                    <ThemeBadge variant="warning" className="text-xs md:text-sm">Thấp</ThemeBadge>
                  )}
                  {!isOutOfStock && !isLowStock && (
                    <ThemeBadge variant="success" className="text-xs md:text-sm">OK</ThemeBadge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {viewMode === "active" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView(product)}
                className="flex-1 text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5"
              >
                <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Xem
              </Button>
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(product)}
                  className="hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-800 p-2 md:p-1.5"
                >
                  <Edit className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(product)}
                  className="hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 p-2 md:p-1.5"
                >
                  <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}
            </>
          ) : (
            <>
              {onRestore && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRestore(product)}
                  className="flex-1 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-800 text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5"
                >
                  <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Khôi phục
                </Button>
              )}
              {onHardDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onHardDelete(product)}
                  className="hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 p-2 md:p-1.5"
                >
                  <Trash className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Deleted Overlay */}
      {viewMode === "deleted" && (
        <div className="absolute inset-0 bg-background/10 dark:bg-background/30 backdrop-blur-[1px] pointer-events-none" />
      )}
    </motion.div>
  );
}

// Export memoized component for better performance
export const ProductCard = memo(ProductCardComponent);
