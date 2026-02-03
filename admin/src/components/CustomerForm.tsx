
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
  customer?: Customer;
  mode: "add" | "edit";
}

export function CustomerForm({ isOpen, onClose, onSave, customer, mode }: CustomerFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: "",
    fullName: "",
    taxCode: "",
    avatarUrl: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    city: "",
  });

  // Update form data when customer prop changes
  useEffect(() => {
    if (customer && mode === "edit") {
      setFormData({
        companyName: customer.companyName || "",
        fullName: customer.fullName || "",
        taxCode: customer.taxCode || "",
        avatarUrl: customer.avatarUrl || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        district: customer.district || "",
        city: customer.city || "",
      });
    } else {
      // Reset form when adding new customer
      setFormData({
        companyName: "",
        fullName: "",
        taxCode: "",
        avatarUrl: "",
        email: "",
        phone: "",
        address: "",
        district: "",
        city: "",
      });
    }
  }, [customer, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.email || !formData.phone || !formData.address) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    const customerData = {
      ...formData,
    };

    onSave(customerData);
    
    // Don't close form and show toast here - let parent component handle it
    // The parent component will handle closing form and showing toast after API success
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
            {mode === "add" ? "Thêm đại lý mới" : "Chỉnh sửa đại lý"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="companyName">Tên công ty *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="Nhập tên công ty"
            />
          </div>

          <div>
            <Label htmlFor="fullName">Họ và tên người đại diện</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Nhập họ và tên"
            />
          </div>

          <div>
            <Label htmlFor="taxCode">Mã số thuế</Label>
            <Input
              id="taxCode"
              value={formData.taxCode}
              onChange={(e) => handleChange("taxCode", e.target.value)}
              placeholder="Nhập mã số thuế"
            />
          </div>

          <div>
            <Label htmlFor="avatarUrl">URL hình đại diện</Label>
            <Input
              id="avatarUrl"
              value={formData.avatarUrl}
              onChange={(e) => handleChange("avatarUrl", e.target.value)}
              placeholder="https://example.com/avatar.jpg"
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
            <Label htmlFor="phone">Số điện thoại *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="0901234567"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Địa chỉ *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Nhập địa chỉ..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="district">Quận/Huyện</Label>
            <Input
              id="district"
              value={formData.district}
              onChange={(e) => handleChange("district", e.target.value)}
              placeholder="Nhập quận/huyện"
            />
          </div>
          
          <div>
            <Label htmlFor="city">Thành phố</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Nhập thành phố"
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
