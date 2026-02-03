import { useMemo, useState, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { useOrders } from "@/hooks/useOrders";
import { OrdersStats } from "./orders/OrdersStats";
import { OrdersToolbar } from "./orders/OrdersToolbar";
import { OrdersTable } from "./orders/OrdersTable";
import { OrdersPagination } from "./orders/OrdersPagination";
import { FilterModal } from "./FilterModal";
import { OrderDetailModal } from "./OrderDetailModal";
import { OrderDeleteDialog } from "./OrderDeleteDialog";
import { Order, OrderItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { orderService } from "@/services/orderService";
import { logger } from "@/utils/logger";
import { PageContainer } from "./shared/PageContainer";

const mapOrderForDetail = (order: Order): Order => {
  // Ensure modal receives items array for backward compatibility
  const items = (order.items || order.orderItems || []).map((item) => {
    const rawItem = item as OrderItem & {
      idProduct?: number;
      unitPrice?: number;
      subtotal?: number;
    };

    return {
      ...item,
      productId: item.productId ?? rawItem.idProduct,
      price: item.price ?? rawItem.unitPrice ?? item.price,
      total: item.total ?? rawItem.subtotal ?? item.total,
    };
  });
  return {
    id: order.id,
    dealerId: order.dealerId,
    dealerName: order.dealerName,
    createdAt: order.createdAt ?? order.date ?? null,
    orderCode: order.orderCode,
    paymentStatus: order.paymentStatus,
    orderItems: items,
    totalPrice: order.totalPrice,
    customer: order.customer,
    date: order.date,
    items,
    subtotal: order.subtotal,
    vat: order.vat,
    total: order.total,
  };
};

export function OrdersPage() {
  const { toast } = useToast();
  const [showDeletedOrders, setShowDeletedOrders] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    orders,
    filteredOrders,
    displayedOrders,
    loading,
    searchTerm,
    setSearchTerm,
    setAppliedFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    showAll,
    setShowAll,
    stats,
    loadOrders,
    updatePaymentStatus,
    updatingOrderIds,
  } = useOrders(showDeletedOrders);

  const selectedCount = selectedOrders.size;
  const detailOrderId = detailOrder?.id;

  useEffect(() => {
    if (!detailOrderId) return;
    const latestOrder = orders.find((order) => order.id === detailOrderId);
    if (latestOrder) {
      setDetailOrder(mapOrderForDetail(latestOrder));
    }
  }, [orders, detailOrderId]);

  const handlePaymentStatusChange = useCallback(
    async (orderId: number, status: Order["paymentStatus"]) => {
      await updatePaymentStatus(orderId, status);
    },
    [updatePaymentStatus]
  );

  const handleSelectOrder = useCallback((orderId: number) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedOrders((prev) => {
      const allIds = displayedOrders.map((o) => o.id).filter(Boolean) as number[];
      if (prev.size === allIds.length) {
        return new Set();
      }
      return new Set(allIds);
    });
  }, [displayedOrders]);

  const handleApplyFilter = (filters: Record<string, unknown>) => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleToggleDeleted = async () => {
    setShowDeletedOrders((prev) => !prev);
    setSelectedOrders(new Set());
    await loadOrders();
  };

  const handleExport = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      XLSX.writeFile(
        workbook,
        `orders-${showDeletedOrders ? "deleted" : "active"}.xlsx`
      );
      toast({
        title: "Xuất Excel thành công",
        description: `Đã xuất ${filteredOrders.length} đơn hàng`,
      });
    } catch (error) {
      logger.error("Export orders failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể xuất Excel. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrders = async () => {
    if (selectedOrders.size === 0) return;
    const orderIds = Array.from(selectedOrders);
    try {
      await orderService.bulkSoftDeleteOrders(orderIds);
      toast({
        title: "Đã xóa",
        description: `Đã xóa ${orderIds.length} đơn hàng`,
      });
      setDeleteDialogOpen(false);
      setSelectedOrders(new Set());
      await loadOrders();
    } catch (error) {
      logger.error("Delete orders failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreOrders = async () => {
    if (!showDeletedOrders || selectedOrders.size === 0) return;
    const orderIds = Array.from(selectedOrders);

    try {
      const results = await Promise.allSettled(
        orderIds.map((orderId) => orderService.restoreOrder(orderId))
      );
      const successCount = results.filter((result) => result.status === "fulfilled").length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: "Đã khôi phục",
          description: `Đã khôi phục ${successCount} đơn hàng`,
        });
      }

      if (failCount > 0) {
        toast({
          title: "Lỗi",
          description: `${failCount} đơn hàng không thể khôi phục.`,
          variant: "destructive",
        });
      }

      setSelectedOrders(new Set());
      await loadOrders();
    } catch (error) {
      logger.error("Restore orders failed", error);
      toast({
        title: "Lỗi",
        description: "Không thể khôi phục đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const currentDeleteOrder = useMemo((): Order | undefined => {
    if (selectedOrders.size === 0) return undefined;
    const firstId = Array.from(selectedOrders)[0];
    const order = orders.find((o) => o.id === firstId);
    return order
      ? {
          id: order.id?.toString() ?? "",
          customer: order.customer ?? "Khách hàng",
          email: order.dealerEmail ?? "",
          products: order.orderItems?.length ?? 0,
          amount: order.totalPrice?.toString() ?? "",
          status: order.paymentStatus ?? "",
          date: order.createdAt ?? "",
          shipping: "",
          address: "",
        }
      : undefined;
  }, [orders, selectedOrders]);

  return (
    <PageContainer
      title="Quản lý đơn hàng"
      description="Theo dõi, tìm kiếm và xử lý đơn hàng của đại lý."
    >
      <div className="space-y-6 animate-fade-in">
      <OrdersStats stats={stats} loading={loading} />

      <OrdersToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => setIsFilterOpen(true)}
        onExportClick={handleExport}
        onToggleDeleted={handleToggleDeleted}
        showDeletedOrders={showDeletedOrders}
        selectedCount={selectedCount}
        onBulkDelete={() => setDeleteDialogOpen(true)}
        onRestore={handleRestoreOrders}
      />

      <OrdersTable
        orders={displayedOrders}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAll={handleSelectAll}
        onViewOrder={(order) => setDetailOrder(mapOrderForDetail(order))}
        loading={loading}
      />

      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        onPageChange={setCurrentPage}
        showAll={showAll}
        onToggleShowAll={() => setShowAll((prev) => !prev)}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        type="orders"
        onApplyFilter={handleApplyFilter}
      />

      <OrderDetailModal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        order={detailOrder}
        onUpdatePaymentStatus={handlePaymentStatusChange}
        isUpdatingPayment={detailOrderId ? updatingOrderIds.has(detailOrderId) : false}
        disablePaymentUpdate={showDeletedOrders}
      />

      <OrderDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteOrders}
        order={currentDeleteOrder}
      />
    </div>
    </PageContainer>
  );
}
