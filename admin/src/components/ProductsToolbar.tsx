import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, LayoutList, Download, Loader2, Search } from "lucide-react";
import { ViewMode, DisplayMode } from "@/hooks/useProductsPage";
import { Toolbar } from "./shared/Toolbar";

type ProductsToolbarProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchLoading: boolean;
  sortBy: string;
  onSortChange: (value: string) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  exporting: boolean;
  onExport: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenFilterSheet: () => void;
};

export const ProductsToolbar = ({
  searchTerm,
  onSearchChange,
  searchLoading,
  sortBy,
  onSortChange,
  displayMode,
  onDisplayModeChange,
  exporting,
  onExport,
  viewMode: _viewMode,
  onViewModeChange: _onViewModeChange,
  onOpenFilterSheet,
}: ProductsToolbarProps) => {
  return (
    <Toolbar
      left={
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      }
      right={
        <>
          <div className="md:hidden">
            <Button variant="outline" size="sm" onClick={onOpenFilterSheet}>
              Bộ lọc
            </Button>
          </div>

          <div className="hidden md:flex">
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full sm:w-40 md:w-48">
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

          <div className="hidden md:flex rounded-lg border border-border bg-muted/50 p-1">
            <Button
              variant={displayMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onDisplayModeChange("grid")}
              title="Hiển thị dạng lưới"
              className="px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onDisplayModeChange("list")}
              title="Hiển thị dạng danh sách"
              className="px-3"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={onExport} className="hidden sm:flex" disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Xuất Excel
          </Button>
        </>
      }
    />
  );
};
