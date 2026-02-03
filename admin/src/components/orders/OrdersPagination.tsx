import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OrdersPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}

export function OrdersPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  showAll,
  onToggleShowAll,
}: OrdersPaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Hiển thị {totalItems} đơn hàng
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleShowAll}
            variant="outline"
            size="sm"
          >
            {showAll ? "Phân trang" : "Hiện tất cả"}
          </Button>

          {!showAll && (
            <>
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm">
                Trang {currentPage} / {totalPages}
              </span>

              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
