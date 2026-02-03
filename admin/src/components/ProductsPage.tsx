import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { ProductsStats } from "./products/ProductsStats";
import { ProductsToolbar } from "./products/ProductsToolbar";
import { ProductsGrid } from "./products/ProductsGrid";
import { ProductsPagination } from "./products/ProductsPagination";
import { EnhancedProductForm } from "./EnhancedProductForm";
import { ProductDetailModal } from "./ProductDetailModal";
import { FilterModal } from "./FilterModal";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types";
import { productService } from "@/services/productService";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_ITEMS_PER_PAGE } from "@/constants/business";
import { logger } from "@/utils/logger";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductDeleteDialog } from "./ProductDeleteDialog";
import { PageContainer } from "./shared/PageContainer";

export function ProductsPage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ product?: Product; hard?: boolean; bulk?: boolean }>({});
  const [publishLoadingId, setPublishLoadingId] = useState<string | null>(null);

  const {
    filteredProducts,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    stats,
    loadProducts,
    setSelectedCategory,
    setSelectedStatus,
    setStockFilter,
    setShowFeatured,
    setShowOnHomepage,
    stockFilter,
    sortBy,
    setSortBy,
  } = useProducts(viewMode);

  const effectivePageSize = DEFAULT_ITEMS_PER_PAGE || 12;

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * effectivePageSize;
    const end = start + effectivePageSize;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage, effectivePageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / effectivePageSize));

  const handleExport = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredProducts);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      XLSX.writeFile(workbook, `products-${viewMode}.xlsx`);
      toast({
        title: "Đã xuất Excel",
        description: `Đã xuất ${filteredProducts.length} sản phẩm`,
      });
    } catch (error) {
      logger.error("Export products failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể xuất danh sách sản phẩm.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublish = async (product: Product, nextStatus: "PUBLISHED" | "UNPUBLISHED") => {
    if (!product.id) return;
    try {
      setPublishLoadingId(product.id.toString());
      await productService.updatePublishStatus(product.id.toString(), nextStatus, product.showOnHomepage);
      toast({
        title: nextStatus === "PUBLISHED" ? "Đã xuất bản" : "Đã chuyển về nháp",
        description: `${product.name} đã được ${nextStatus === "PUBLISHED" ? "xuất bản" : "ẩn khỏi công khai"}.`,
      });
      await loadProducts();
    } catch (error) {
      logger.error("Toggle publish failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái xuất bản.",
        variant: "destructive",
      });
    } finally {
      setPublishLoadingId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!product.id) return;
    try {
      const isHard = viewMode === "deleted";
      if (isHard) {
        await productService.hardDeleteProduct(product.id.toString());
        toast({
          title: "Đã xóa vĩnh viễn",
          description: `Đã xóa sản phẩm ${product.name}`,
        });
      } else {
        await productService.deleteProduct(product.id.toString());
        toast({
          title: "Đã xóa",
          description: `Đã chuyển sản phẩm ${product.name} vào thùng rác`,
        });
      }
      await loadProducts();
    } catch (error) {
      logger.error("Delete product failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (product: Product) => {
    if (!product.id) return;
    try {
      await productService.restoreProduct(product.id.toString());
      toast({
        title: "Đã khôi phục",
        description: `Đã khôi phục sản phẩm ${product.name}`,
      });
      await loadProducts();
    } catch (error) {
      logger.error("Restore product failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể khôi phục sản phẩm.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProduct = async (data: Partial<Product>) => {
    try {
      if (formMode === "add") {
        await productService.createProduct(data as any);
        toast({ title: "Thành công", description: "Đã tạo sản phẩm mới" });
      } else if (selectedProduct?.id) {
        await productService.updateProduct(selectedProduct.id.toString(), data as any);
        toast({ title: "Thành công", description: "Đã cập nhật sản phẩm" });
      }
      setIsFormOpen(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (error) {
      logger.error("Save product failed", error);
      throw error;
    }
  };

  const handleApplyFilter = (filters: any) => {
    if (filters.status) setSelectedStatus(filters.status);
    if (filters.priceFrom || filters.priceTo) {
      // price filtering can be handled client-side; left as future enhancement
    }
    if (filters.lowStock !== undefined || filters.outOfStock !== undefined) {
      if (filters.lowStock) setStockFilter("low-stock");
      if (filters.outOfStock) setStockFilter("out-of-stock");
    }
    if (filters.featured !== undefined) setShowFeatured(filters.featured as boolean);
    if (filters.homepage !== undefined) setShowOnHomepage(filters.homepage as boolean);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedStatus("all");
    setStockFilter("all");
    setShowFeatured(null);
    setShowOnHomepage(null);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          viewMode === "deleted" ? productService.hardDeleteProduct(id) : productService.deleteProduct(id)
        )
      );
      toast({
        title: "Thành công",
        description: viewMode === "deleted" ? "Đã xóa vĩnh viễn sản phẩm đã chọn" : "Đã chuyển sản phẩm vào thùng rác",
      });
      clearSelection();
      await loadProducts();
    } catch (error) {
      logger.error("Bulk delete failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể xử lý thao tác hàng loạt.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (product?: Product) => {
    if (product) {
      setPendingDelete({ product, hard: viewMode === "deleted", bulk: false });
      setDeleteDialogOpen(true);
      return;
    }
    // bulk
    if (selectedIds.size === 0) {
      toast({
        title: "Chưa chọn sản phẩm",
        description: "Hãy chọn ít nhất một sản phẩm để xóa.",
        variant: "destructive",
      });
      return;
    }
    setPendingDelete({ hard: viewMode === "deleted", bulk: true });
    setDeleteDialogOpen(true);
  };

  const handleBulkRestore = async () => {
    if (viewMode !== "deleted" || selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => productService.restoreProduct(id)));
      toast({
        title: "Đã khôi phục",
        description: "Đã khôi phục các sản phẩm đã chọn.",
      });
      clearSelection();
      await loadProducts();
    } catch (error) {
      logger.error("Bulk restore failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể khôi phục sản phẩm.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer
      title="Quản lý sản phẩm"
      description="Theo dõi, chỉnh sửa và xuất danh sách sản phẩm."
      actions={viewMode === "deleted" ? (
        <div className="px-3 py-1.5 rounded-full bg-warning-50 text-warning-800 border border-warning-200 text-sm">
          Đang xem sản phẩm đã xóa – Xóa trong chế độ này là vĩnh viễn
        </div>
      ) : undefined}
    >
      <div className="space-y-6 animate-fade-in">
      <ProductsStats stats={stats} loading={loading} />

      <ProductsToolbar
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onAdd={() => {
          setFormMode("add");
          setSelectedProduct(null);
          setIsFormOpen(true);
        }}
        onFilter={() => setIsFilterOpen(true)}
        onExport={handleExport}
        viewMode={viewMode}
        onToggleViewMode={() => {
          setViewMode((prev) => (prev === "active" ? "deleted" : "active"));
          setCurrentPage(1);
          clearSelection();
        }}
        layout={layout}
        onLayoutChange={setLayout}
        sortBy={sortBy}
        onSortChange={(value) => setSortBy(value as any)}
        stockFilter={stockFilter}
        onStockFilterChange={(value) => {
          setStockFilter(value);
          setCurrentPage(1);
        }}
        selectedCount={selectedIds.size}
        onBulkDelete={() => openDeleteDialog()}
        onBulkRestore={viewMode === "deleted" ? handleBulkRestore : undefined}
      />

      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={loadProducts}>
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ProductsGrid
        products={pagedProducts}
        onView={(product) => setDetailProduct(product)}
        onEdit={(product) => {
          setSelectedProduct(product);
          setFormMode("edit");
          setIsFormOpen(true);
        }}
        onDelete={(product) => openDeleteDialog(product)}
        onRestore={viewMode === "deleted" ? handleRestore : undefined}
        onTogglePublish={handleTogglePublish}
        publishLoadingId={publishLoadingId}
        loading={loading}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        layout={layout}
      />

      <ProductsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredProducts.length}
        pageSize={effectivePageSize}
        onPageChange={setCurrentPage}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        type="products"
        onApplyFilter={handleApplyFilter}
      />

      <EnhancedProductForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct || undefined}
        mode={formMode}
      />

      <ProductDetailModal
        isOpen={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
      />

      <ProductDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          setDeleteDialogOpen(false);
          if (pendingDelete.bulk) {
            await handleBulkDelete();
          } else if (pendingDelete.product) {
            await handleDelete(pendingDelete.product);
          }
        }}
        hardDelete={pendingDelete.hard}
        count={pendingDelete.bulk ? selectedIds.size : 1}
        name={pendingDelete.product?.name}
      />

      <div className="flex justify-end">
        <button
          className="text-sm text-muted-foreground underline"
          onClick={resetFilters}
        >
          Đặt lại bộ lọc
        </button>
      </div>
    </div>
    </PageContainer>
  );
}
