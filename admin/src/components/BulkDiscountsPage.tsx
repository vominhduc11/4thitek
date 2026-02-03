import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Edit, Trash2, Percent, Package, TrendingUp } from 'lucide-react';
import { BulkDiscount, BulkDiscountFormData } from '../types';
import { bulkDiscountService } from '../services/bulkDiscountService';
import { useToast } from '../hooks/use-toast';
import { BulkDiscountForm } from './BulkDiscountForm';
import { Spinner } from './ui/spinner';
import { PageContainer } from "./shared/PageContainer";

export function BulkDiscountsPage() {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<BulkDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<BulkDiscount | undefined>();
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  const loadDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bulkDiscountService.getAll();
      setDiscounts(data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tải danh sách chiết khấu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const handleAdd = () => {
    setSelectedDiscount(undefined);
    setFormMode('add');
    setIsFormOpen(true);
  };

  const handleEdit = (discount: BulkDiscount) => {
    setSelectedDiscount(discount);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleDelete = (discount: BulkDiscount) => {
    setSelectedDiscount(discount);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: BulkDiscountFormData) => {
    if (formMode === 'add') {
      await bulkDiscountService.create(data);
      toast({
        title: 'Thành công',
        description: 'Đã thêm chiết khấu mới',
      });
    } else if (selectedDiscount) {
      await bulkDiscountService.update(selectedDiscount.id, data);
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật chiết khấu',
      });
    }
    await loadDiscounts();
    setIsFormOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDiscount) return;

    try {
      await bulkDiscountService.delete(selectedDiscount.id);
      toast({
        title: 'Thành công',
        description: 'Đã xóa chiết khấu',
      });
      await loadDiscounts();
      setIsDeleteOpen(false);
    } catch (error: unknown) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể xóa chiết khấu',
        variant: 'destructive',
      });
    }
  };

  const formatQuantityRange = (min: number, max: number | null) => {
    if (max === null) {
      return `${min}+ sản phẩm`;
    }
    return `${min} - ${max} sản phẩm`;
  };

  const calculateStats = () => {
    const totalTiers = discounts.length;
    const avgDiscount =
      discounts.length > 0
        ? discounts.reduce((sum, d) => sum + d.discountPercent, 0) / discounts.length
        : 0;
    const maxDiscount =
      discounts.length > 0 ? Math.max(...discounts.map((d) => d.discountPercent)) : 0;

    return { totalTiers, avgDiscount, maxDiscount };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <PageContainer
        title="Quản lý Chiết khấu Bán sỉ"
        description="Thiết lập mức chiết khấu dựa trên tổng số lượng sản phẩm trong đơn hàng"
      >
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Quản lý Chiết khấu Bán sỉ"
      description="Thiết lập mức chiết khấu dựa trên tổng số lượng sản phẩm trong đơn hàng"
      actions={
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm chiết khấu
        </Button>
      }
    >
      <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số mức chiết khấu</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTiers}</div>
            <p className="text-xs text-muted-foreground">Mức giảm giá đang áp dụng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiết khấu trung bình</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDiscount.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Mức giảm giá trung bình</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiết khấu cao nhất</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maxDiscount.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Mức giảm giá tối đa</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách mức chiết khấu</CardTitle>
          <CardDescription>Quản lý các mức chiết khấu theo số lượng sản phẩm</CardDescription>
        </CardHeader>
        <CardContent>
          {discounts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Chưa có chiết khấu nào</h3>
              <p className="text-muted-foreground mt-2">
                Thêm mức chiết khấu đầu tiên để bắt đầu
              </p>
              <Button onClick={handleAdd} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Thêm chiết khấu
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khoảng số lượng</TableHead>
                  <TableHead>Chiết khấu</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Cập nhật lần cuối</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">
                      {formatQuantityRange(discount.minQuantity, discount.maxQuantity)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        {discount.discountPercent}%
                      </span>
                    </TableCell>
                    <TableCell>{new Date(discount.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{new Date(discount.updatedAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(discount)}
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(discount)}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <BulkDiscountForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedDiscount}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa mức chiết khấu{' '}
              {selectedDiscount &&
                formatQuantityRange(selectedDiscount.minQuantity, selectedDiscount.maxQuantity)}{' '}
              ({selectedDiscount?.discountPercent}%)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageContainer>
  );
}
