
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'products' | 'orders' | 'customers';
  onApplyFilter: (filters: Record<string, unknown>) => void;
}

export function FilterModal({ isOpen, onClose, type, onApplyFilter }: FilterModalProps) {
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const handleApply = () => {
    onApplyFilter(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Lọc {type === 'products' ? 'sản phẩm' : type === 'orders' ? 'đơn hàng' : 'khách hàng'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {type === 'products' && (
            <>
              <div>
                <Label>Trạng thái</Label>
                <Select value={filters.status as string} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Đang bán</SelectItem>
                    <SelectItem value="deleted">Đã xóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Khoảng giá</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Từ"
                    value={filters.priceFrom || ''}
                    onChange={(e) => setFilters({...filters, priceFrom: e.target.value})}
                  />
                  <Input
                    placeholder="Đến"
                    value={filters.priceTo || ''}
                    onChange={(e) => setFilters({...filters, priceTo: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Tồn kho</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="lowStock"
                      checked={filters.lowStock || false}
                      onCheckedChange={(checked) => setFilters({...filters, lowStock: checked})}
                    />
                    <Label htmlFor="lowStock">Sắp hết hàng (&lt; 20)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="outOfStock"
                      checked={filters.outOfStock || false}
                      onCheckedChange={(checked) => setFilters({...filters, outOfStock: checked})}
                    />
                    <Label htmlFor="outOfStock">Hết hàng</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={Boolean(filters.featured)}
                    onCheckedChange={(checked) => setFilters({...filters, featured: checked})}
                  />
                  <Label htmlFor="featured">Nổi bật</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homepage"
                    checked={Boolean(filters.homepage)}
                    onCheckedChange={(checked) => setFilters({...filters, homepage: checked})}
                  />
                  <Label htmlFor="homepage">Hiển thị trang chủ</Label>
                </div>
              </div>
            </>
          )}

          {type === 'orders' && (
            <>
              <div>
                <Label>Trạng thái thanh toán</Label>
                <Select value={filters.paymentStatus} onValueChange={(value) => setFilters({...filters, paymentStatus: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Đã trả</SelectItem>
                    <SelectItem value="UNPAID">Chưa trả</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Khoảng giá trị đơn hàng</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Từ (VNĐ)"
                    type="number"
                    value={filters.amountFrom || ''}
                    onChange={(e) => setFilters({...filters, amountFrom: e.target.value})}
                  />
                  <Input
                    placeholder="Đến (VNĐ)"
                    type="number"
                    value={filters.amountTo || ''}
                    onChange={(e) => setFilters({...filters, amountTo: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Thời gian tạo đơn</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  />
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Khách hàng</Label>
                <Input
                  placeholder="Tìm theo tên công ty hoặc mã đại lý"
                  value={filters.customer || ''}
                  onChange={(e) => setFilters({...filters, customer: e.target.value})}
                />
              </div>

              <div>
                <Label>Số lượng sản phẩm</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Từ"
                    type="number"
                    value={filters.itemsFrom || ''}
                    onChange={(e) => setFilters({...filters, itemsFrom: e.target.value})}
                  />
                  <Input
                    placeholder="Đến"
                    type="number"
                    value={filters.itemsTo || ''}
                    onChange={(e) => setFilters({...filters, itemsTo: e.target.value})}
                  />
                </div>
              </div>
            </>
          )}

          {type === 'customers' && (
            <>
              <div>
                <Label>Trạng thái khách hàng</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Số đơn hàng</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Từ"
                    type="number"
                    value={filters.ordersFrom || ''}
                    onChange={(e) => setFilters({...filters, ordersFrom: e.target.value})}
                  />
                  <Input
                    placeholder="Đến"
                    type="number"
                    value={filters.ordersTo || ''}
                    onChange={(e) => setFilters({...filters, ordersTo: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Tổng chi tiêu</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Từ"
                    value={filters.spentFrom || ''}
                    onChange={(e) => setFilters({...filters, spentFrom: e.target.value})}
                  />
                  <Input
                    placeholder="Đến"
                    value={filters.spentTo || ''}
                    onChange={(e) => setFilters({...filters, spentTo: e.target.value})}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Đặt lại
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Áp dụng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
