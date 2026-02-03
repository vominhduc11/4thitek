import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Archive, Download, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ProductsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onFilter: () => void;
  onExport: () => void;
  viewMode: "active" | "deleted";
  onToggleViewMode: () => void;
  layout: "grid" | "list";
  onLayoutChange: (value: "grid" | "list") => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  stockFilter: "all" | "in-stock" | "low-stock" | "out-of-stock";
  onStockFilterChange: (value: "all" | "in-stock" | "low-stock" | "out-of-stock") => void;
  selectedCount: number;
  onBulkDelete?: () => void;
  onBulkRestore?: () => void;
}

export function ProductsToolbar({
  searchTerm,
  onSearchChange,
  onAdd,
  onFilter,
  onExport,
  viewMode,
  onToggleViewMode,
  layout,
  onLayoutChange,
  sortBy,
  onSortChange,
  stockFilter,
  onStockFilterChange,
  selectedCount,
  onBulkDelete,
  onBulkRestore,
}: ProductsToolbarProps) {
  const sortLabels: Record<string, string> = {
    "name-asc": "Tên A→Z",
    "name-desc": "Tên Z→A",
    "price-asc": "Giá tăng",
    "price-desc": "Giá giảm",
    "stock-desc": "Kho nhiều → ít",
    "stock-asc": "Kho ít → nhiều",
  };

  const stockLabels: Record<ProductsToolbarProps["stockFilter"], string> = {
    all: "Tất cả kho",
    "in-stock": "Còn hàng",
    "low-stock": "Sắp hết",
    "out-of-stock": "Hết hàng",
  };

  const activeBadges: string[] = [];
  if (sortBy && sortLabels[sortBy]) activeBadges.push(`Sắp xếp: ${sortLabels[sortBy]}`);
  if (stockFilter !== "all") activeBadges.push(`Kho: ${stockLabels[stockFilter]}`);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 sticky top-0 z-20 w-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 rounded-md p-3 border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="relative w-full sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm tên, mô tả..."
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap sm:justify-end">
          <Button
            variant={viewMode === "deleted" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={onToggleViewMode}
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">
              {viewMode === "deleted" ? "Đang xem đã xóa" : "Đã xóa"}
            </span>
          </Button>
          <div className="flex gap-1" aria-label="Chế độ hiển thị sản phẩm">
            <Button
              variant={layout === "grid" ? "default" : "outline"}
              size="sm"
              className="px-2"
              onClick={() => onLayoutChange("grid")}
              aria-pressed={layout === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={layout === "list" ? "default" : "outline"}
              size="sm"
              className="px-2"
              onClick={() => onLayoutChange("list")}
              aria-pressed={layout === "list"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" className="gap-2" onClick={onAdd}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Thêm sản phẩm</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="min-w-[170px]" aria-label="Sắp xếp">
            <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Tên A→Z</SelectItem>
            <SelectItem value="name-desc">Tên Z→A</SelectItem>
            <SelectItem value="price-asc">Giá tăng</SelectItem>
            <SelectItem value="price-desc">Giá giảm</SelectItem>
            <SelectItem value="stock-desc">Kho nhiều → ít</SelectItem>
            <SelectItem value="stock-asc">Kho ít → nhiều</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={(v) => onStockFilterChange(v as ProductsToolbarProps["stockFilter"])}>
          <SelectTrigger className="min-w-[150px]" aria-label="Lọc kho">
            <SelectValue placeholder="Kho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả kho</SelectItem>
            <SelectItem value="in-stock">Còn hàng</SelectItem>
            <SelectItem value="low-stock">Sắp hết</SelectItem>
            <SelectItem value="out-of-stock">Hết hàng</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="gap-2" onClick={onFilter}>
          <Filter className="h-4 w-4" /> <span className="hidden sm:inline">Lọc nâng cao</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <Download className="h-4 w-4" /> <span className="hidden sm:inline">Xuất</span>
        </Button>
      </div>

      {activeBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Đang áp dụng:</span>
          {activeBadges.map((label, idx) => (
            <Badge key={idx} variant="secondary">
              {label}
            </Badge>
          ))}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedCount} sản phẩm đã chọn</Badge>
            <span className="text-xs text-muted-foreground">Thao tác nhanh:</span>
          </div>
          <div className="flex gap-2">
            {viewMode === "deleted" ? (
              <Button size="sm" variant="default" onClick={onBulkRestore} disabled={!onBulkRestore}>
                Khôi phục đã chọn
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={onBulkDelete} disabled={!onBulkDelete}>
                Xóa đã chọn
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
