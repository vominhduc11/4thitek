import { useState, useEffect, useMemo, useCallback } from "react";
import { Order } from "@/types";
import { ApiOrderResponse, orderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { logger } from "@/utils/logger";

interface FilterOptions {
  paymentStatus?: string;
  amountFrom?: string;
  amountTo?: string;
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  itemsFrom?: string;
  itemsTo?: string;
}

export const useOrders = (showDeletedOrders: boolean = false) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [updatingOrderIds, setUpdatingOrderIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = showDeletedOrders
        ? await orderService.getDeletedOrders()
        : await orderService.getAllOrders();

      const ordersData: ApiOrderResponse[] | undefined = showDeletedOrders
        ? (response.success && Array.isArray(response.data) ? response.data : [])
        : (response.success && response.data?.content ? response.data.content : []);

      const normalizedOrders: Order[] = (ordersData ?? []).map((order) => ({
        ...order,
        createdAt: order.createdAt ?? null,
        customer: order.dealerName,
        orderItems: order.orderItems || [],
        totalPrice: order.totalPrice ?? 0,
      }));

      setOrders(normalizedOrders);
    } catch (error) {
      logger.error("Error loading orders:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn hàng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [showDeletedOrders, toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !debouncedSearchTerm ||
        (order.orderCode &&
          order.orderCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (order.customer &&
          order.customer.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (order.dealerPhone &&
          order.dealerPhone.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (order.dealerEmail &&
          order.dealerEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      const matchesPaymentStatus =
        !appliedFilters.paymentStatus ||
        order.paymentStatus === appliedFilters.paymentStatus;

      const matchesAmountRange =
        (!appliedFilters.amountFrom ||
          order.totalPrice >= parseInt(appliedFilters.amountFrom)) &&
        (!appliedFilters.amountTo ||
          order.totalPrice <= parseInt(appliedFilters.amountTo));

      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0);
      const matchesDateRange =
        (!appliedFilters.dateFrom ||
          orderDate >= new Date(appliedFilters.dateFrom)) &&
        (!appliedFilters.dateTo ||
          orderDate <= new Date(appliedFilters.dateTo + "T23:59:59"));

      const matchesCustomer =
        !appliedFilters.customer ||
        (order.customer &&
          order.customer.toLowerCase().includes(appliedFilters.customer.toLowerCase())) ||
        (order.dealerName &&
          order.dealerName.toLowerCase().includes(appliedFilters.customer.toLowerCase()));

      const itemsCount = order.orderItems?.length || 0;
      const matchesItemsRange =
        (!appliedFilters.itemsFrom ||
          itemsCount >= parseInt(appliedFilters.itemsFrom)) &&
        (!appliedFilters.itemsTo || itemsCount <= parseInt(appliedFilters.itemsTo));

      return (
        matchesSearch &&
        matchesPaymentStatus &&
        matchesAmountRange &&
        matchesDateRange &&
        matchesCustomer &&
        matchesItemsRange
      );
    });
  }, [orders, debouncedSearchTerm, appliedFilters]);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const { totalPages, displayedOrders } = useMemo(() => {
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const displayedOrders = showAll
      ? filteredOrders
      : filteredOrders.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        );

    return { totalPages, displayedOrders };
  }, [filteredOrders, currentPage, showAll]);

  // Statistics
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
    const unpaidOrders = orders.filter((order) => order.paymentStatus === "UNPAID");

    return {
      total: orders.length,
      totalRevenue,
      paid: paidOrders.length,
      unpaid: unpaidOrders.length,
    };
  }, [orders]);

  const updatePaymentStatus = useCallback(
    async (orderId: number, paymentStatus: Order["paymentStatus"]) => {
      setUpdatingOrderIds((prev) => {
        const next = new Set(prev);
        next.add(orderId);
        return next;
      });

      try {
        const response = await orderService.updatePaymentStatus(orderId, paymentStatus);

        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to update payment status");
        }

        const updatedOrder = response.data;
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  ...updatedOrder,
                  createdAt: updatedOrder.createdAt ?? order.createdAt ?? null,
                  customer: updatedOrder.dealerName ?? order.customer,
                  orderItems: updatedOrder.orderItems || order.orderItems || [],
                  totalPrice: updatedOrder.totalPrice ?? order.totalPrice,
                }
              : order
          )
        );

        toast({
          title: "Cập nhật thành công",
          description:
            paymentStatus === "PAID"
              ? "Đã đánh dấu đơn hàng là đã thanh toán."
              : "Đã đánh dấu đơn hàng là chưa thanh toán.",
        });

        return updatedOrder;
      } catch (error) {
        logger.error("Error updating payment status:", error);
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật trạng thái thanh toán",
          variant: "destructive",
        });
        throw error;
      } finally {
        setUpdatingOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    [toast]
  );

  return {
    orders,
    filteredOrders,
    displayedOrders,
    loading,
    searchTerm,
    setSearchTerm,
    appliedFilters,
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
  };
};
