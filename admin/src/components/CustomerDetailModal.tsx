
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, ShoppingCart, Loader2, Package } from "lucide-react";
import { orderService } from "@/services/orderService";
import { Order } from "@/types";
import { logger } from '@/utils/logger';

interface Customer {
  accountId: number;
  companyName: string;
  fullName?: string;
  taxCode?: string;
  avatarUrl?: string | null;
  email: string;
  phone: string;
  address: string;
  district: string;
  city: string;
}

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerDetailModal({ isOpen, onClose, customer }: CustomerDetailModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDealerOrders = useCallback(async () => {
    if (!customer) return;

    try {
      setLoading(true);
      // Sử dụng API chuyên biệt để lấy đơn hàng theo dealer ID
      const response = await orderService.getOrdersByDealerId(customer.accountId);

      if (response.success && Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      logger.error('Error fetching dealer orders:', error);
    } finally {
      setLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen && customer) {
      fetchDealerOrders();
    }
  }, [customer, fetchDealerOrders, isOpen]);

  if (!customer) return null;

  // Tính toán thống kê
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID').length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết đại lý</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {customer.avatarUrl && (
                  <img
                    src={customer.avatarUrl}
                    alt={customer.companyName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h2 className="text-xl font-semibold dark:text-gray-100">{customer.companyName}</h2>
                  {customer.fullName && (
                    <p className="text-gray-600 dark:text-gray-400">{customer.fullName}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-500">Account ID: {customer.accountId}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium mb-4 dark:text-gray-100">Thông tin liên hệ</h3>
            <div className="bg-muted/50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              {customer.taxCode && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Mã số thuế:</span>
                  <span className="dark:text-gray-200">{customer.taxCode}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="dark:text-gray-200">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="dark:text-gray-200">{customer.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div>
                  <div className="dark:text-gray-200">{customer.address}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{customer.district}, {customer.city}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order History */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2 dark:text-gray-100">
              <ShoppingCart className="h-5 w-5" />
              Lịch sử đơn hàng
            </h3>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalOrders}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Đã thanh toán</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{paidOrders}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng doanh thu</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {(totalRevenue / 1000000).toFixed(1)}M ₫
                </p>
              </div>
            </div>

            {/* Orders List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 dark:text-gray-200">Đang tải...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Đại lý chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium dark:text-gray-100">{order.orderCode}</p>
                        <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                          {order.paymentStatus === 'PAID' ? 'Đã trả' : 'Chưa trả'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.orderItems?.length || 0} sản phẩm • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {(order.totalPrice || 0).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
