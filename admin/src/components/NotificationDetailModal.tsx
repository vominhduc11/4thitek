
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, Package, Users, FileText, Settings } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
}

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
}: NotificationDetailModalProps) {
  if (!notification) return null;

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "order":
        return Package;
      case "inventory":
        return AlertTriangle;
      case "report":
        return FileText;
      case "customer":
        return Users;
      case "system":
        return Settings;
      default:
        return AlertTriangle;
    }
  };

  const Icon = getTypeIcon(notification.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Chi tiết thông báo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={getTypeColor(notification.type)}>
              {getTypeLabel(notification.type)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span>Đã đọc</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900">
              {notification.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {notification.message}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {notification.time}
          </div>

          {/* Không cần nút đánh dấu đã đọc vì đã tự động đánh dấu khi click vào thông báo */}
          <div className="flex items-center justify-center pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Đã đánh dấu là đã đọc</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
