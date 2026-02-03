import { Order } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, CheckSquare, Square } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { TableShell } from "../shared/TableShell";

interface OrdersTableProps {
  orders: Order[];
  selectedOrders: Set<number>;
  onSelectOrder: (orderId: number) => void;
  onSelectAll: () => void;
  onViewOrder: (order: Order) => void;
  loading: boolean;
}

export function OrdersTable({
  orders,
  selectedOrders,
  onSelectOrder,
  onSelectAll,
  onViewOrder,
  loading,
}: OrdersTableProps) {
  const allSelected = orders.length > 0 && selectedOrders.size === orders.length;

  const getPaymentStatusBadge = (status: string) => {
    const labels = {
      PAID: "Đã thanh toán",
      UNPAID: "Chưa thanh toán",
      CANCELLED: "Đã hủy",
    };

    const tone =
      status === "PAID"
        ? "success"
        : status === "CANCELLED"
          ? "danger"
          : "warning";

    return (
      <StatusBadge
        label={labels[status as keyof typeof labels] || status}
        tone={tone}
      />
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <TableShell>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="p-0 h-8 w-8"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </Button>
            </TableHead>
            <TableHead>Mã đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Ngày đặt</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Không có đơn hàng nào
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectOrder(order.id!)}
                    className="p-0 h-8 w-8"
                  >
                    {selectedOrders.has(order.id!) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{order.orderCode}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.customer || "N/A"}</div>
                    <div className="text-sm text-gray-500">{order.dealerPhone || ""}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatPrice(order.totalPrice)}
                </TableCell>
                <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => onViewOrder(order)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Xem
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableShell>
  );
}
