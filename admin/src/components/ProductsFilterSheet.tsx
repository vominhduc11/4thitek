import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Filters } from "@/hooks/useProductsPage";

type ProductsFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApplyFilters: (filters: Filters) => void;
  onResetFilters: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
};

export const ProductsFilterSheet = ({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  onResetFilters,
  sortBy,
  onSortChange,
}: ProductsFilterSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Bộ lọc & sắp xếp</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Trạng thái tồn kho</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={filters.status === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onApplyFilters({ ...filters, status: "all" })}
              >
                Tất cả
              </Button>
              <Button
                variant={filters.status === "in_stock" ? "default" : "outline"}
                size="sm"
                onClick={() => onApplyFilters({ ...filters, status: "in_stock" })}
              >
                Còn hàng
              </Button>
              <Button
                variant={filters.status === "low_stock" ? "default" : "outline"}
                size="sm"
                onClick={() => onApplyFilters({ ...filters, status: "low_stock" })}
              >
                Sắp hết
              </Button>
              <Button
                variant={filters.status === "out_of_stock" ? "default" : "outline"}
                size="sm"
                onClick={() => onApplyFilters({ ...filters, status: "out_of_stock" })}
              >
                Hết hàng
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Nổi bật</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={filters.featured === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onApplyFilters({ ...filters, featured: "all" })}
              >
                Tất cả
              </Button>
              <Button
                variant={filters.featured === "featured" ? "default" : "outline"}
                size="sm"
                onClick={() => onApplyFilters({ ...filters, featured: "featured" })}
              >
                Nổi bật
              </Button>
              <Button
                variant={filters.featured === "not_featured" ? "default" : "outline"}
                size="sm"
                onClick={() => onApplyFilters({ ...filters, featured: "not_featured" })}
                className="col-span-2"
              >
                Không nổi bật
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Sắp xếp</p>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="name">Tên A-Z</SelectItem>
                <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                <SelectItem value="stock-desc">Tồn kho: Cao → Thấp</SelectItem>
                <SelectItem value="stock-asc">Tồn kho: Thấp → Cao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onResetFilters();
                onOpenChange(false);
              }}
            >
              Đặt lại
            </Button>
            <Button
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Áp dụng
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
