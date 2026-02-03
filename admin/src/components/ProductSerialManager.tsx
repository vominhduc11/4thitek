import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ProductSerial, SerialCreateRequest } from "@/types";
import { serialService } from "@/services/serialService";
import { Plus, Trash2, Loader2, Hash, ListPlus, RotateCcw, CheckSquare, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { logger } from '@/utils/logger';

interface ProductSerialManagerProps {
  productId: string;
  productName: string;
}

export function ProductSerialManager({ productId, productName }: ProductSerialManagerProps) {
  const { toast } = useToast();
  const [serials, setSerials] = useState<ProductSerial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSerial, setNewSerial] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Bulk add states
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkSerials, setBulkSerials] = useState("");
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  // Multi-select states
  const [selectedSerialIds, setSelectedSerialIds] = useState<number[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const fetchSerials = useCallback(async () => {
    try {
      setLoading(true);
      const serialList = await serialService.getSerialsByProduct(productId);
      setSerials(serialList);
    } catch (error) {
      logger.error('Failed to fetch serials:', error);
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách serial. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    fetchSerials();
  }, [fetchSerials]);

  const handleAddSerial = async () => {
    if (!newSerial.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số serial",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const serialData: SerialCreateRequest = {
        serial: newSerial.trim(),
        productId: parseInt(productId)
      };

      const createdSerial = await serialService.createSerial(serialData);
      setSerials(prev => [...prev, createdSerial]);
      setNewSerial("");
      setIsAddDialogOpen(false);
      
      toast({
        title: "Thành công",
        description: `Đã thêm serial ${createdSerial.serial} cho sản phẩm ${productName}`,
      });
    } catch (error) {
      logger.error('Failed to create serial:', error);
      toast({
        title: "Lỗi tạo serial",
        description: "Không thể tạo serial. Có thể serial đã tồn tại.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBulkCreateSerials = async () => {
    if (!bulkSerials.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập danh sách serial numbers",
        variant: "destructive",
      });
      return;
    }

    setIsBulkCreating(true);

    try {
      // Parse serial numbers from textarea (each line is a serial)
      const serialNumbers = bulkSerials
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (serialNumbers.length === 0) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy serial number nào hợp lệ",
          variant: "destructive",
        });
        return;
      }

      // Create serials one by one
      const results = [];
      const errors = [];

      for (const serialNumber of serialNumbers) {
        try {
          const request: SerialCreateRequest = {
            serial: serialNumber,
            productId: parseInt(productId),
          };

          const response = await serialService.createSerial(request);
          results.push(response);
        } catch {
          errors.push(serialNumber);
        }
      }

      if (results.length > 0) {
        setSerials(prev => [...prev, ...results]);
        setBulkSerials("");
        setIsBulkDialogOpen(false);

        toast({
          title: "Thành công",
          description: `Đã tạo ${results.length} serial(s) thành công${errors.length > 0 ? `, ${errors.length} serial(s) bị lỗi` : ''}`,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Một số serial bị lỗi",
          description: `Các serial sau không thể tạo: ${errors.join(', ')}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      logger.error('Failed to create bulk serials:', error);
      toast({
        title: "Lỗi tạo serial",
        description: "Không thể tạo serial numbers. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsBulkCreating(false);
    }
  };

  const handleDeleteSerial = async (serialId: number, serialNumber: string, status?: string) => {
    // Kiểm tra status trước khi xóa
    if (status?.toUpperCase() !== 'IN_STOCK') {
      toast({
        title: "Không thể xóa",
        description: "Chỉ có thể xóa serial có trạng thái IN_STOCK",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa serial ${serialNumber}?`)) {
      return;
    }

    try {
      await serialService.deleteSerial(serialId);
      setSerials(prev => prev.filter(s => s.id !== serialId));

      toast({
        title: "Đã xóa",
        description: `Đã xóa serial ${serialNumber}`,
      });
    } catch (error) {
      logger.error('Failed to delete serial:', error);
      toast({
        title: "Lỗi xóa serial",
        description: "Không thể xóa serial. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleUnassignSerial = async (serialId: number, serialNumber: string) => {
    if (!confirm(`Bạn có chắc muốn hủy gán serial ${serialNumber}? Serial sẽ trở lại trạng thái có sẵn.`)) {
      return;
    }

    try {
      await serialService.unassignSerial(serialId);

      // Update local state
      setSerials(prev => prev.map(s =>
        s.id === serialId
          ? { ...s, status: 'available', orderId: undefined, orderItemId: undefined, soldDate: undefined, soldPrice: undefined }
          : s
      ));

      toast({
        title: "Đã hủy gán",
        description: `Serial ${serialNumber} đã được trả về trạng thái có sẵn`,
      });
    } catch (error) {
      logger.error('Failed to unassign serial:', error);
      toast({
        title: "Lỗi hủy gán",
        description: "Không thể hủy gán serial. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const generateRandomSerial = () => {
    const generated = serialService.generateSerialNumbers(1, 'SN')[0];
    setNewSerial(generated);
  };

  const handleSelectAll = () => {
    // Chỉ select các serial có thể xóa (status = IN_STOCK)
    const selectableSerials = serials.filter(s => s.status?.toUpperCase() === 'IN_STOCK');
    if (selectedSerialIds.length === selectableSerials.length) {
      setSelectedSerialIds([]);
    } else {
      setSelectedSerialIds(selectableSerials.map(s => s.id));
    }
  };

  const handleSelectSerial = (serialId: number) => {
    setSelectedSerialIds(prev =>
      prev.includes(serialId)
        ? prev.filter(id => id !== serialId)
        : [...prev, serialId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedSerialIds.length === 0) return;

    if (!confirm(`Bạn có chắc muốn xóa ${selectedSerialIds.length} serial(s) đã chọn?`)) {
      return;
    }

    try {
      setIsDeletingBulk(true);
      await serialService.deleteBulkSerials(selectedSerialIds);

      setSerials(prev => prev.filter(s => !selectedSerialIds.includes(s.id)));
      setSelectedSerialIds([]);

      toast({
        title: "Đã xóa",
        description: `Đã xóa ${selectedSerialIds.length} serial(s) thành công`,
      });
    } catch (error) {
      logger.error('Failed to bulk delete serials:', error);
      toast({
        title: "Lỗi xóa serial",
        description: "Không thể xóa các serial đã chọn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingBulk(false);
    }
  };


  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'IN_STOCK':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Trong kho</Badge>;
      case 'SOLD':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Đã bán</Badge>;
      case 'ASSIGNED_TO_ORDER_ITEM':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Đã gán đơn hàng</Badge>;
      case 'ALLOCATED_TO_DEALER':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">Đã phân phối</Badge>;
      case 'RESERVED':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">Đã đặt</Badge>;
      case 'DAMAGED':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">Hỏng</Badge>;
      case 'RETURNED':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">Trả lại</Badge>;
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Có sẵn</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">{status || 'Không rõ'}</Badge>;
    }
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Đang tải danh sách serial...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Serial Numbers ({serials.length})
          </CardTitle>

          <div className="flex items-center gap-2">
            {selectedSerialIds.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
              >
                {isDeletingBulk ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa ({selectedSerialIds.length})
                  </>
                )}
              </Button>
            )}
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <ListPlus className="h-4 w-4 mr-2" />
                  Thêm nhiều
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm nhiều Serial Numbers</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulkSerials">
                      Danh sách Serial Numbers (mỗi dòng 1 serial)
                    </Label>
                    <Textarea
                      id="bulkSerials"
                      placeholder="SN001&#10;SN002&#10;SN003&#10;..."
                      value={bulkSerials}
                      onChange={(e) => setBulkSerials(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nhập mỗi serial number trên một dòng riêng biệt
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsBulkDialogOpen(false);
                        setBulkSerials("");
                      }}
                      disabled={isBulkCreating}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleBulkCreateSerials} disabled={isBulkCreating}>
                      {isBulkCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <ListPlus className="h-4 w-4 mr-2" />
                          Tạo tất cả
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Serial
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm Serial Number</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="productInfo">Sản phẩm</Label>
                  <Input
                    id="productInfo"
                    value={`${productName} (ID: ${productId})`}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="serial">Số Serial *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="serial"
                      value={newSerial}
                      onChange={(e) => setNewSerial(e.target.value.toUpperCase())}
                      placeholder="Nhập số serial (VD: ABC123456)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomSerial}
                      title="Tạo serial ngẫu nhiên"
                    >
                      🎲
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Serial phải duy nhất trong hệ thống
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                  disabled={isCreating}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAddSerial}
                  className="flex-1"
                  disabled={isCreating || !newSerial.trim()}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Thêm Serial"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {serials.length === 0 ? (
          <div className="text-center py-8">
            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có serial number nào cho sản phẩm này</p>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm Serial đầu tiên
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSelectAll}
                    className="h-8 w-8"
                    title={selectedSerialIds.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  >
                    {selectedSerialIds.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serials.map((serial) => (
                <TableRow key={serial.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelectSerial(serial.id)}
                      className="h-8 w-8"
                      disabled={serial.status?.toUpperCase() !== 'IN_STOCK'}
                      title={serial.status?.toUpperCase() === 'IN_STOCK' ? "Chọn/Bỏ chọn" : "Chỉ có thể chọn serial IN_STOCK"}
                    >
                      {selectedSerialIds.includes(serial.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{serial.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {serial.serial}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(serial.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {serial.status === 'sold' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-orange-600 hover:text-orange-700"
                          onClick={() => handleUnassignSerial(serial.id, serial.serial)}
                          title="Hủy gán serial"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => handleDeleteSerial(serial.id, serial.serial, serial.status)}
                        title={serial.status?.toUpperCase() === 'IN_STOCK' ? "Xóa serial" : "Chỉ có thể xóa serial IN_STOCK"}
                        disabled={serial.status?.toUpperCase() !== 'IN_STOCK'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {serials.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Ghi chú:</strong> Serial numbers được sử dụng để theo dõi từng sản phẩm cụ thể.
              Mỗi serial phải là duy nhất trong toàn bộ hệ thống.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
