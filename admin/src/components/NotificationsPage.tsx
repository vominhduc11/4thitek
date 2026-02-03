import { useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, CheckCheck, Trash2, UserCheck } from "lucide-react";
import { NotificationDetailModal } from "./NotificationDetailModal";
import { ListSkeleton } from "@/components/ui/skeleton-loader";
import { ApprovalModal } from "./ApprovalModal";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/api";
import { Notification } from "@/services/notificationService";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { logger } from '@/utils/logger';

export function NotificationsPage() {
  type NotificationWithAccount = Notification & { accountId?: string };
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [pendingApprovalNotification, setPendingApprovalNotification] = useState<NotificationWithAccount | null>(null);
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount, isLoading, refreshNotifications } = useNotifications();

  const getTypeColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-100 text-blue-800";
      case "inventory":
        return "bg-yellow-100 text-yellow-800";
      case "report":
        return "bg-green-100 text-green-800";
      case "customer":
        return "bg-purple-100 text-purple-800";
      case "system":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "order":
        return "Đơn hàng";
      case "inventory":
        return "Kho hàng";
      case "report":
        return "Báo cáo";
      case "customer":
        return "Khách hàng";
      case "system":
        return "Hệ thống";
      default:
        return "Khác";
    }
  };

  const openNotificationDetail = async (notification: Notification) => {
    // Tự động đánh dấu là đã đọc khi click vào thông báo
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Kiểm tra nếu là thông báo đăng ký đại lý thì chuyển sang trang quản lý đại lý
    if (notification.title && 
        (notification.title.toLowerCase().includes('đăng ký') && 
         notification.title.toLowerCase().includes('đại lý')) ||
        (notification.message && 
         notification.message.toLowerCase().includes('đăng ký') && 
         notification.message.toLowerCase().includes('đại lý'))) {
      navigate('/customers');
      return;
    }
    
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const isResellerRegistration = (notification: Notification) => {
    return notification.title && 
           (notification.title.toLowerCase().includes('đăng ký') && 
            notification.title.toLowerCase().includes('đại lý')) ||
           (notification.message && 
            notification.message.toLowerCase().includes('đăng ký') && 
            notification.message.toLowerCase().includes('đại lý'));
  };

  const handleApprovalClick = (notification: NotificationWithAccount, e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setPendingApprovalNotification(notification);
    setIsApprovalModalOpen(true);
  };

  const handleApprove = async (notificationId: string, reason?: string) => {
    try {
      // Giả sử notification có chứa accountId, nếu không thì cần lấy từ notification data
      const accountId = pendingApprovalNotification?.accountId || notificationId;
      
      await apiRequest(`/user/reseller/${accountId}/approve`, {
        method: 'PUT',
        body: reason ? { reason } : {}
      });

      toast({
        title: "Thành công",
        description: "Đã chấp nhận đăng ký đại lý",
      });

      await refreshNotifications();
    } catch (error) {
      logger.error('Error approving registration:', error);
      toast({
        title: "Lỗi",
        description: "Không thể chấp nhận đăng ký",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (notificationId: string, reason: string) => {
    try {
      const accountId = pendingApprovalNotification?.accountId || notificationId;
      
      await apiRequest(`/user/reseller/${accountId}/reject`, {
        method: 'PUT',
        body: { reason }
      });

      toast({
        title: "Thành công",
        description: "Đã từ chối đăng ký đại lý",
      });

      await refreshNotifications();
    } catch (error) {
      logger.error('Error rejecting registration:', error);
      toast({
        title: "Lỗi",
        description: "Không thể từ chối đăng ký",
        variant: "destructive",
      });
    }
  };

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setPendingApprovalNotification(null);
  };

  const filteredNotifications = notifications
    .filter(notification =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(notification => {
      if (statusFilter === "unread") return !notification.read;
      if (statusFilter === "read") return notification.read;
      return true;
    });

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <motion.div
        className="flex justify-between items-center"
        variants={fadeInUp}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Thông báo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Quản lý tất cả thông báo của hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
          <Button variant="outline" onClick={refreshNotifications} disabled={isLoading}>
            <Bell className="h-4 w-4 mr-2" />
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={staggerContainer}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Chưa đọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Đã đọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm thông báo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "unread", "read"] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status === "all" && "Tất cả"}
                  {status === "unread" && "Chưa đọc"}
                  {status === "read" && "Đã đọc"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && notifications.length === 0 ? (
              <div className="space-y-4">
                <ListSkeleton count={5} />
              </div>
            ) : filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                  !notification.read 
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => openNotificationDetail(notification)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      <Badge className={getTypeColor(notification.type)}>
                        {getTypeLabel(notification.type)}
                      </Badge>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <span className="text-xs text-gray-400">{notification.time}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {/* Button phê duyệt cho đăng ký đại lý */}
                    {isResellerRegistration(notification) && !notification.approved && !notification.rejected && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => handleApprovalClick(notification, e)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Phê duyệt
                      </Button>
                    )}
                    
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Đánh dấu đã đọc
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredNotifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Không tìm thấy thông báo nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={closeApprovalModal}
        notification={pendingApprovalNotification}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </motion.div>
  );
}
