import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, User, Mail, Phone, MapPin } from "lucide-react";
import { logger } from "@/utils/logger";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    id: string;
    title: string;
    message: string;
    time?: string;
    metadata?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
    };
  } | null;
  onApprove: (notificationId: string, reason?: string) => Promise<void>;
  onReject: (notificationId: string, reason: string) => Promise<void>;
}

export function ApprovalModal({
  isOpen,
  onClose,
  notification,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!action || !notification) return;

    if (action === "reject" && !reason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    setLoading(true);
    try {
      if (action === "approve") {
        await onApprove(notification.id, reason.trim() || undefined);
      } else {
        await onReject(notification.id, reason.trim());
      }
      handleClose();
    } catch (error) {
      logger.error('Error processing dealer approval', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAction(null);
    setReason("");
    onClose();
  };

  if (!notification) return null;

  // Parse thông tin từ notification metadata
  const resellerInfo = notification.metadata || {
    name: notification.message,
    email: "",
    phone: "",
    address: "",
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Phê duyệt đăng ký đại lý
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thông tin thông báo */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{notification.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-800">
                Chờ phê duyệt
              </Badge>
              <span className="text-xs text-gray-400">{notification.time}</span>
            </div>
          </div>

          {/* Thông tin đại lý */}
          <div className="space-y-4">
            <h4 className="font-medium">Thông tin đại lý đăng ký:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tên công ty</p>
                  <p className="font-medium">{resellerInfo.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{resellerInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium">{resellerInfo.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ</p>
                  <p className="font-medium">{resellerInfo.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action selection */}
          {!action && (
            <div className="flex gap-4">
              <Button
                onClick={() => setAction("approve")}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Chấp nhận
              </Button>
              <Button
                onClick={() => setAction("reject")}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Từ chối
              </Button>
            </div>
          )}

          {/* Reason input */}
          {action && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {action === "approve" ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-700">Chấp nhận đăng ký</h4>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-red-700">Từ chối đăng ký</h4>
                  </>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  {action === "approve" ? "Ghi chú (không bắt buộc):" : "Lý do từ chối:"}
                  {action === "reject" && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    action === "approve"
                      ? "Nhập ghi chú cho việc chấp nhận..."
                      : "Nhập lý do từ chối đăng ký..."
                  }
                  rows={3}
                  className="mt-2 w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={
                    action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                >
                  {loading ? "Đang xử lý..." : action === "approve" ? "Xác nhận chấp nhận" : "Xác nhận từ chối"}
                </Button>
                <Button variant="outline" onClick={() => setAction(null)}>
                  Quay lại
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
