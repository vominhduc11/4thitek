import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Archive, ArrowUpDown, Tags } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface BlogsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onFilter: () => void;
  onManageCategories: () => void;
  viewMode: "active" | "trash";
  onToggleViewMode: () => void;
  categories: Array<{ id: number | string; name: string }>;
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  homepageFilter: "all" | "home" | "hidden";
  onHomepageFilterChange: (value: "all" | "home" | "hidden") => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  selectedCount: number;
  onBulkDelete?: () => void;
  onBulkRestore?: () => void;
}

export function BlogsToolbar({
  searchTerm,
  onSearchChange,
  onAdd,
  onFilter,
  onManageCategories,
  viewMode,
  onToggleViewMode,
  categories,
  selectedCategory,
  onSelectCategory,
  homepageFilter,
  onHomepageFilterChange,
  sortBy,
  onSortChange,
  selectedCount,
  onBulkDelete,
  onBulkRestore,
}: BlogsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 sticky top-0 z-20 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 rounded-md p-3 border">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm tiêu đề, mô tả..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="min-w-[170px]">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="title-asc">Tiêu đề A→Z</SelectItem>
              <SelectItem value="title-desc">Tiêu đề Z→A</SelectItem>
            </SelectContent>
          </Select>
          <Select value={homepageFilter} onValueChange={(v) => onHomepageFilterChange(v as any)}>
            <SelectTrigger className="min-w-[150px]">
              <SelectValue placeholder="Trang chủ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="home">Hiển thị trang chủ</SelectItem>
              <SelectItem value="hidden">Ẩn trang chủ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={onSelectCategory}>
            <SelectTrigger className="min-w-[150px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2" onClick={onFilter}>
            <Filter className="h-4 w-4" /> <span className="hidden sm:inline">Làm mới danh mục</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={onManageCategories}>
            <Tags className="h-4 w-4" /> <span className="hidden sm:inline">Quản lý danh mục</span>
          </Button>
          <Button
            variant={viewMode === "trash" ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={onToggleViewMode}
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">
              {viewMode === "trash" ? "Đang xem đã xóa" : "Đã xóa"}
            </span>
          </Button>
          <Button size="sm" className="gap-2" onClick={onAdd}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Thêm bài viết</span>
          </Button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedCount} bài viết đã chọn</Badge>
          </div>
          <div className="flex gap-2">
            {viewMode === "trash" ? (
              <>
                <Button size="sm" variant="default" onClick={onBulkRestore} disabled={!onBulkRestore}>
                  Khôi phục
                </Button>
                <Button size="sm" variant="destructive" onClick={onBulkDelete} disabled={!onBulkDelete}>
                  Xóa vĩnh viễn
                </Button>
              </>
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
