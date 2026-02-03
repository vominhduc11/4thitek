import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, RotateCcw, Archive } from "lucide-react";
import { Toolbar } from "../shared/Toolbar";

interface OrdersToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  onExportClick: () => void;
  onToggleDeleted: () => void;
  showDeletedOrders: boolean;
  selectedCount: number;
  onBulkDelete?: () => void;
  onRestore?: () => void;
}

export function OrdersToolbar({
  searchTerm,
  onSearchChange,
  onFilterClick,
  onExportClick,
  onToggleDeleted,
  showDeletedOrders,
  selectedCount,
  onBulkDelete,
  onRestore,
}: OrdersToolbarProps) {
  return (
    <Toolbar
      left={
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo mã đơn, khách hàng, SĐT, email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      }
      right={
        <>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 pr-2 text-sm text-muted-foreground">
              <span>{selectedCount} đã chọn</span>
              {showDeletedOrders ? (
                <Button
                  onClick={onRestore}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Khôi phục
                </Button>
              ) : (
                <Button
                  onClick={onBulkDelete}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Xóa
                </Button>
              )}
            </div>
          )}
          <Button
            onClick={onFilterClick}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Lọc</span>
          </Button>
          <Button
            onClick={onExportClick}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </Button>
          <Button
            onClick={onToggleDeleted}
            variant={showDeletedOrders ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">
              {showDeletedOrders ? "Đơn hàng" : "Đã xóa"}
            </span>
          </Button>
        </>
      }
    />
  );
}
