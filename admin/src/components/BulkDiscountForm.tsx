import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { BulkDiscount, BulkDiscountFormData } from '../types';
import { useToast } from '../hooks/use-toast';

interface BulkDiscountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkDiscountFormData) => Promise<void>;
  initialData?: BulkDiscount;
  mode: 'add' | 'edit';
}

export function BulkDiscountForm({ isOpen, onClose, onSubmit, initialData, mode }: BulkDiscountFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BulkDiscountFormData>({
    minQuantity: 1,
    maxQuantity: null,
    discountPercent: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        minQuantity: initialData.minQuantity,
        maxQuantity: initialData.maxQuantity,
        discountPercent: initialData.discountPercent,
      });
    } else {
      setFormData({
        minQuantity: 1,
        maxQuantity: null,
        discountPercent: 0,
      });
    }
  }, [initialData, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.minQuantity < 1) {
      toast({
        title: 'Lỗi',
        description: 'Số lượng tối thiểu phải lớn hơn 0',
        variant: 'destructive',
      });
      return;
    }

    if (formData.maxQuantity !== null && formData.maxQuantity < formData.minQuantity) {
      toast({
        title: 'Lỗi',
        description: 'Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu',
        variant: 'destructive',
      });
      return;
    }

    if (formData.discountPercent <= 0 || formData.discountPercent > 100) {
      toast({
        title: 'Lỗi',
        description: 'Chiết khấu phải từ 0.01% đến 100%',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu chiết khấu',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof BulkDiscountFormData, value: number | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Thêm' : 'Chỉnh sửa'} chiết khấu bán sỉ</DialogTitle>
          <DialogDescription>
            Thiết lập mức chiết khấu dựa trên tổng số lượng sản phẩm trong đơn hàng
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="minQuantity">
                Số lượng tối thiểu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="minQuantity"
                type="number"
                min="1"
                value={formData.minQuantity}
                onChange={(e) => handleChange('minQuantity', parseInt(e.target.value))}
                required
                placeholder="Ví dụ: 10"
              />
              <p className="text-xs text-muted-foreground">
                Số lượng tối thiểu để áp dụng chiết khấu này
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxQuantity">Số lượng tối đa</Label>
              <Input
                id="maxQuantity"
                type="number"
                min="1"
                value={formData.maxQuantity || ''}
                onChange={(e) =>
                  handleChange('maxQuantity', e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="Để trống nếu không giới hạn"
              />
              <p className="text-xs text-muted-foreground">
                Để trống để áp dụng cho tất cả đơn hàng từ số lượng tối thiểu trở lên
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="discountPercent">
                Phần trăm chiết khấu (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="discountPercent"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={formData.discountPercent}
                onChange={(e) => handleChange('discountPercent', parseFloat(e.target.value))}
                required
                placeholder="Ví dụ: 10.5"
              />
              <p className="text-xs text-muted-foreground">
                Phần trăm giảm giá cho đơn hàng đủ điều kiện
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : mode === 'add' ? 'Thêm mới' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
