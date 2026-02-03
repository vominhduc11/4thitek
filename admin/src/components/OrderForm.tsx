
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  customer: string;
  email: string;
  products: number;
  amount: string;
  status: string;
  date: string;
  shipping: string;
  address: string;
}

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Partial<Order>) => void;
  order?: Order;
  mode: "add" | "edit";
}

export function OrderForm({ isOpen, onClose, onSave, order, mode }: OrderFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customer: order?.customer || "",
    email: order?.email || "",
    products: order?.products || 1,
    amount: order?.amount || "",
    status: order?.status || "pending",
    shipping: order?.shipping || "Giao hàng tiêu chuẩn",
    address: order?.address || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer || !formData.email || !formData.amount || !formData.address) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      ...formData,
      id: order?.id || `#${String(Date.now()).slice(-5)}`,
      date: order?.date || new Date().toISOString().split('T')[0],
    };

    onSave(orderData);
    onClose();
    
    toast({
      title: mode === "add" ? "Thêm thành công" : "Cập nhật thành công",
      description: `Đơn hàng ${orderData.id} đã được ${mode === "add" ? "thêm" : "cập nhật"} thành công`,
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm đơn hàng mới" : "Chỉnh sửa đơn hàng"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer">Tên khách hàng *</Label>
            <Input
              id="customer"
              value={formData.customer}
              onChange={(e) => handleChange("customer", e.target.value)}
              placeholder="Nhập tên khách hàng"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="products">Số sản phẩm</Label>
            <Input
              id="products"
              type="number"
              value={formData.products}
              onChange={(e) => handleChange("products", parseInt(e.target.value) || 1)}
              placeholder="1"
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Tổng tiền *</Label>
            <Input
              id="amount"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="VD: 2,450,000"
            />
          </div>
          
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="shipped">Đang giao</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="shipping">Phương thức giao hàng</Label>
            <Select value={formData.shipping} onValueChange={(value) => handleChange("shipping", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Giao hàng tiêu chuẩn">Giao hàng tiêu chuẩn</SelectItem>
                <SelectItem value="Giao hàng nhanh">Giao hàng nhanh</SelectItem>
                <SelectItem value="Giao hàng hỏa tốc">Giao hàng hỏa tốc</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="address">Địa chỉ giao hàng *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Nhập địa chỉ giao hàng..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button type="submit" className="flex-1">
              {mode === "add" ? "Thêm" : "Cập nhật"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
