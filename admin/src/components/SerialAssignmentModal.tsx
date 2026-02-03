import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  SerialAssignmentModalProps,
  AvailableSerialItem,
} from '@/types';
import { serialService } from '@/services/serialService';
import { logger } from '@/utils/logger';
import {
  Hash,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  Info,
  ArrowUp
} from 'lucide-react';

export function SerialAssignmentModal({
  isOpen,
  onClose,
  orderItem,
  orderId,
  dealerAccountId,
  onAssignmentComplete
}: SerialAssignmentModalProps) {
  const { toast } = useToast();
  const [availableSerials, setAvailableSerials] = useState<AvailableSerialItem[]>([]);
  const [allocatedSerials, setAllocatedSerials] = useState<AvailableSerialItem[]>([]);
  const [dealerAllocatedSerials, setDealerAllocatedSerials] = useState<AvailableSerialItem[]>([]);
  const [selectedSerialIds, setSelectedSerialIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAllocated, setLoadingAllocated] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Cleanup ref for async operations
  const [isMounted, setIsMounted] = useState(true);

  // Filter and paginate available serials
  const filteredAvailableSerials = availableSerials.filter(serial =>
    serial.serial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Scroll to top functions
  const scrollToTopSection1 = () => {
    const container = document.getElementById('assigned-serials-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTopSection2 = () => {
    const container = document.getElementById('available-serials-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Toast helper functions wrapped in useCallback
  const showSuccessToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
    });
  }, [toast]);

  const showErrorToast = useCallback((title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, [toast]);

  // Cleanup effect
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const fetchAvailableSerials = useCallback(async () => {
    if (!orderItem.productId) return;

    try {
      setLoading(true);
      logger.debug('🔍 Fetching IN_STOCK serials for productId:', orderItem.productId);

      // Gọi API với status IN_STOCK (default)
      const serials = await serialService.getAvailableSerialsByProduct(orderItem.productId, 'IN_STOCK');
      setAvailableSerials(serials);

      logger.debug('📦 Found', serials.length, 'IN_STOCK serials');
    } catch (error) {
      logger.error('❌ Failed to fetch available serials:', error);
      if (isMounted) {
        showErrorToast("Lỗi tải dữ liệu", "Không thể tải danh sách serial có sẵn");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [orderItem.productId, showErrorToast, isMounted]);

  const fetchAllocatedSerials = useCallback(async () => {
    if (!orderItem.id) return;

    try {
      setLoadingAllocated(true);
      logger.debug('🔍 Fetching assigned serials for orderItemId:', orderItem.id);

      // Gọi API lấy serials đã gán cho order item này (ASSIGNED_TO_ORDER_ITEM)
      const serials = await serialService.getSerialsByOrderItem(orderItem.id);

      // Transform to match AvailableSerialItem interface
      const allocatedSerials = serials.map(serial => ({
        id: serial.id,
        serial: serial.serial,
        productId: serial.productId,
        productName: serial.productName,
        status: 'assigned' as const
      }));

      setAllocatedSerials(allocatedSerials);

      logger.debug('📦 Found', serials.length, 'assigned serials for order item');

      // Gọi API lấy serials đã phân bổ cho đại lý (ALLOCATED_TO_DEALER)
      try {
        logger.debug('🔍 Fetching allocated serials for orderItemId:', orderItem.id);
        const dealerSerials = await serialService.getAllocatedSerialsByOrderItem(orderItem.id);

        const dealerAllocatedSerials = dealerSerials.map(serial => ({
          id: serial.id,
          serial: serial.serial,
          productId: serial.productId,
          productName: serial.productName,
          status: 'allocated' as const
        }));

        setDealerAllocatedSerials(dealerAllocatedSerials);
        logger.debug('🏢 Found', dealerSerials.length, 'allocated serials for order item');
      } catch {
        logger.warn('No allocated serials found for order item:', orderItem.id);
        setDealerAllocatedSerials([]);
      }

    } catch (error) {
      logger.error('❌ Failed to fetch assigned serials:', error);
      // Không hiển thị toast error vì có thể chưa có serial assigned
      if (isMounted) {
        setAllocatedSerials([]);
        setDealerAllocatedSerials([]);
      }
    } finally {
      if (isMounted) {
        setLoadingAllocated(false);
      }
    }
  }, [orderItem.id, isMounted]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && orderItem.productId) {
      fetchAvailableSerials();
      fetchAllocatedSerials();
      setSearchTerm('');
      setShowScrollToTop(false);
    } else if (!isOpen) {
      setAvailableSerials([]);
      setAllocatedSerials([]);
      setDealerAllocatedSerials([]);
      setSelectedSerialIds([]);
      setSearchTerm('');
      setShowScrollToTop(false);
    }
  }, [isOpen, orderItem.productId, fetchAvailableSerials, fetchAllocatedSerials]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSerialIds([]);
    }
  }, [isOpen]);

  const handleSelectSerial = (serialId: number, checked: boolean) => {
    if (checked) {
      // Tính toán số serial hiện tại sau khi tính cả unassign và assign
      const serialsToUnassign = selectedSerialIds.filter(id =>
        allocatedSerials.some(s => s.id === id)
      ).length;
      const serialsToAssign = selectedSerialIds.filter(id =>
        availableSerials.some(s => s.id === id)
      ).length;

      // Số serial thực tế sẽ có sau khi thực hiện tất cả operations
      const finalAssignedCount = (allocatedSerials.length - serialsToUnassign) + (serialsToAssign + 1); // +1 cho serial đang được chọn
      const totalFinalCount = dealerAllocatedSerials.length + finalAssignedCount;

      // Check if we've reached the quantity limit
      if (totalFinalCount > orderItem.quantity) {
        showErrorToast("Vượt quá số lượng", `Order item này chỉ cần ${orderItem.quantity} serial. Hiện đã có ${dealerAllocatedSerials.length + allocatedSerials.length} serial.`);
        return;
      }
      setSelectedSerialIds(prev => [...prev, serialId]);
    } else {
      setSelectedSerialIds(prev => prev.filter(id => id !== serialId));
    }
  };

  const handleAssignSerials = useCallback(async () => {
    if (selectedSerialIds.length === 0) {
      showErrorToast("Chưa chọn serial", "Vui lòng chọn ít nhất 1 serial để tiếp tục");
      return;
    }

    try {
      setAssigning(true);

      // Phân tách serials cần assign và unassign
      const serialsToUnassign = selectedSerialIds.filter(id =>
        allocatedSerials.some(s => s.id === id)
      );
      const serialsToAssign = selectedSerialIds.filter(id =>
        filteredAvailableSerials.some(s => s.id === id)
      );

      logger.debug('🚀 Processing serials:', {
        serialsToUnassign,
        serialsToAssign,
        orderItemId: orderItem.id
      });

      // Xử lý unassign trước
      if (serialsToUnassign.length > 0) {
        await serialService.unassignSerialsFromOrderItem(orderItem.id, serialsToUnassign);

        showSuccessToast("Bỏ gán serial thành công", `Đã bỏ gán ${serialsToUnassign.length} serial`);
      }

      // Xử lý assign sau
      if (serialsToAssign.length > 0) {
        const assignmentResult = await serialService.assignSerialsToOrder({
          orderId,
          orderItemId: orderItem.id,
          productId: orderItem.productId!,
          serialIds: serialsToAssign
        });

        if (assignmentResult.success) {
          showSuccessToast("Gán serial thành công", `Đã gán ${serialsToAssign.length} serial cho ${orderItem.name}`);
        } else {
          throw new Error(assignmentResult.message || 'Assignment failed');
        }
      }

      // Refresh data và notify parent
      await fetchAllocatedSerials();
      await fetchAvailableSerials();

      // Clear selection
      setSelectedSerialIds([]);

      // Tính toán serial numbers mới để trả về parent
      const newAssignedSerials = await serialService.getSerialsByOrderItem(orderItem.id);
      const serialNumbers = newAssignedSerials.map(s => s.serial);

      onAssignmentComplete(orderItem.id, serialNumbers);

    } catch (error) {
      logger.error('Failed to process serials:', error);
      if (isMounted) {
        showErrorToast("Lỗi xử lý serial", "Không thể xử lý serial. Vui lòng thử lại.");
      }
    } finally {
      if (isMounted) {
        setAssigning(false);
      }
    }
  }, [selectedSerialIds, allocatedSerials, availableSerials, orderItem.id, orderItem.name, orderItem.productId, orderId, onAssignmentComplete, showErrorToast, showSuccessToast, fetchAllocatedSerials, fetchAvailableSerials, isMounted]);

  // Xử lý phân phối cho đại lý
  const handleAllocateToDealer = useCallback(async () => {
    const serialsToAllocate = selectedSerialIds.filter(id =>
      allocatedSerials.some(s => s.id === id)
    );

    if (serialsToAllocate.length === 0) {
      showErrorToast("Chưa chọn serial", "Vui lòng chọn ít nhất 1 serial đã gán để phân phối");
      return;
    }

    try {
      setAssigning(true);

      logger.debug('🏢 Allocating serials to dealer:', {
        dealerId: dealerAccountId,
        serialIds: serialsToAllocate,
        count: serialsToAllocate.length
      });

      const result = await serialService.allocateSerialToDealer(serialsToAllocate, dealerAccountId);

      if (result.success) {
        showSuccessToast("Phân phối thành công", `Đã phân phối ${serialsToAllocate.length} serial cho đại lý. Order item được cập nhật trạng thái "Đã phân phối".`);

        // Notify parent về thay đổi trước (để trigger refresh)
        onAssignmentComplete(orderItem.id, []);

        // Clear selection và đóng modal
        setSelectedSerialIds([]);

        // Đóng modal sau một chút để user thấy thành công
        setTimeout(() => {
          onClose();
        }, 1000);

      } else {
        throw new Error(result.message || 'Allocation failed');
      }

    } catch (error) {
      logger.error('Failed to allocate serials:', error);
      if (isMounted) {
        showErrorToast("Lỗi phân phối", "Không thể phân phối serial. Vui lòng thử lại.");
      }
    } finally {
      if (isMounted) {
        setAssigning(false);
      }
    }
  }, [selectedSerialIds, allocatedSerials, orderItem.id, dealerAccountId, onAssignmentComplete, onClose, showErrorToast, showSuccessToast, isMounted]);



  // Early validation checks
  if (!orderItem.productId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Không thể gán Serial</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Sản phẩm này không có Product ID để gán serial</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if order item is already COMPLETED
  if (orderItem.status === 'COMPLETED') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Order Item Đã Hoàn Tất
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-purple-600">
              <Info className="h-5 w-5" />
              <span>Order item này đã được phân phối cho đại lý và không thể thay đổi</span>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Thông tin sản phẩm:</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">{orderItem.name}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Số lượng: {orderItem.quantity}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Trạng thái: Đã phân phối cho đại lý</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[calc(100vh-4rem)] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Gán Serial cho Sản phẩm
          </DialogTitle>
        </DialogHeader>

        {/* Product Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <Package className="h-8 w-8 text-gray-400" />
          <div>
            <h3 className="font-medium dark:text-gray-100">{orderItem.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cần gán: {orderItem.quantity} serial</p>
          </div>
        </div>

        {/* Simple Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600">
              Đã chọn: {selectedSerialIds.length}
            </Badge>

            {(() => {
              // Tính toán số lượng sau khi thực hiện các operations đã chọn
              const serialsToUnassign = selectedSerialIds.filter(id =>
                allocatedSerials.some(s => s.id === id)
              ).length;
              const serialsToAssign = selectedSerialIds.filter(id =>
                availableSerials.some(s => s.id === id)
              ).length;

              const finalAssignedCount = (allocatedSerials.length - serialsToUnassign) + serialsToAssign;
              const totalFinalCount = dealerAllocatedSerials.length + finalAssignedCount;

              return (
                <>
                  <Badge variant="outline" className="text-purple-600">
                    Hiện có: {dealerAllocatedSerials.length + allocatedSerials.length}/{orderItem.quantity}
                  </Badge>

                  {selectedSerialIds.length > 0 && (
                    <Badge variant="outline" className="text-orange-600">
                      Sau thao tác: {totalFinalCount}/{orderItem.quantity}
                    </Badge>
                  )}

                  {totalFinalCount === orderItem.quantity && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Sẽ đủ
                    </Badge>
                  )}
                </>
              );
            })()}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm serial..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="pl-8 w-40"
            />
          </div>
        </div>



        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Loading State */}
          {loading || loadingAllocated ? (
            <div className="flex items-center justify-center py-8 border rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải...</span>
            </div>
          ) : (
            <>
              {/* Section 0: Serials đã phân bổ cho đại lý */}
              {dealerAllocatedSerials.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        Serials đã phân bổ cho đại lý ({dealerAllocatedSerials.length}/{orderItem.quantity})
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Những serial này đã được giao cho đại lý và không thể thay đổi
                      </p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">
                      {dealerAllocatedSerials.length} đã phân bổ
                    </Badge>
                  </div>

                  <div className="border rounded-lg overflow-hidden bg-purple-50 dark:bg-purple-900/10">
                    <Table>
                      <TableHeader className="bg-purple-100 dark:bg-purple-900/20">
                        <TableRow>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>Product ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Đại lý</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dealerAllocatedSerials.map((serial) => (
                          <TableRow key={serial.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {serial.serial}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                  Đã phân bổ
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">{serial.productId}</TableCell>
                            <TableCell>
                              <Badge className="bg-purple-100 text-purple-800">
                                ALLOCATED_TO_DEALER
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <Package className="h-4 w-4 inline mr-1" />
                              Đại lý
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Section 1: Serials đã gán */}
              <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    Serials đã gán cho order item này ({allocatedSerials.length})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Có thể bỏ gán hoặc phân bổ cho đại lý. Còn cần: {Math.max(0, orderItem.quantity - dealerAllocatedSerials.length - allocatedSerials.length)} serial
                  </p>
                </div>
                {allocatedSerials.length > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    {allocatedSerials.length} đã gán
                  </Badge>
                )}
              </div>

              {allocatedSerials.length === 0 ? (
                <div className="text-center py-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Hash className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Chưa có serial nào được gán</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden relative">
                  <div
                    id="assigned-serials-scroll-container"
                    className="overflow-auto max-h-[200px] sm:max-h-[250px] md:max-h-[300px] scroll-smooth scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 dark:scrollbar-track-gray-800 dark:scrollbar-thumb-gray-600"
                    onScroll={(e) => {
                      const target = e.target as HTMLDivElement;
                      setShowScrollToTop(target.scrollTop > 100);
                    }}
                  >
                    <Table>
                      <TableHeader className="sticky top-0 bg-green-50 dark:bg-green-900/20 z-10">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={allocatedSerials.length > 0 && allocatedSerials.every(serial => selectedSerialIds.includes(serial.id))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSerialIds(prev => [...new Set([...prev, ...allocatedSerials.map(s => s.id)])]);
                                } else {
                                  const assignedIds = allocatedSerials.map(s => s.id);
                                  setSelectedSerialIds(prev => prev.filter(id => !assignedIds.includes(id)));
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>Product ID</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocatedSerials.map((serial) => {
                          const isSelected = selectedSerialIds.includes(serial.id);
                          return (
                            <TableRow
                              key={serial.id}
                              className={isSelected ? 'bg-red-50 dark:bg-red-900/20' : ''}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectSerial(serial.id, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono">
                                    {serial.serial}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    Đã gán
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">{serial.productId}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">
                                  ASSIGNED
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Scroll to Top Button for Section 1 */}
                  {showScrollToTop && allocatedSerials.length > 5 && (
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg z-20"
                      onClick={scrollToTopSection1}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Serials có thể gán thêm */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    Serials có thể gán thêm ({filteredAvailableSerials.length} có sẵn)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Chọn serial để gán cho order item này
                  </p>
                </div>
                {filteredAvailableSerials.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-800">
                    {filteredAvailableSerials.length} có sẵn
                  </Badge>
                )}
              </div>

              {filteredAvailableSerials.length === 0 ? (
                <div className="text-center py-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Hash className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Không có serial nào có sẵn để gán</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden relative">
                  <div
                    id="available-serials-scroll-container"
                    className="overflow-auto max-h-[250px] sm:max-h-[300px] md:max-h-[350px] scroll-smooth scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 dark:scrollbar-track-gray-800 dark:scrollbar-thumb-gray-600"
                    onScroll={(e) => {
                      const target = e.target as HTMLDivElement;
                      setShowScrollToTop(target.scrollTop > 100);
                    }}
                  >
                    <Table className="w-full">
                      <TableHeader className="sticky top-0 bg-blue-50 dark:bg-blue-900/20 z-10">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={filteredAvailableSerials.length > 0 && filteredAvailableSerials.every(serial => selectedSerialIds.includes(serial.id))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // Tính toán slots còn lại
                                  const serialsToUnassign = selectedSerialIds.filter(id =>
                                    allocatedSerials.some(s => s.id === id)
                                  ).length;
                                  const currentAssigned = allocatedSerials.length - serialsToUnassign;
                                  const currentlySelectedFromAvailable = selectedSerialIds.filter(id =>
                                    filteredAvailableSerials.some(s => s.id === id)
                                  ).length;
                                  const remainingSlots = orderItem.quantity - currentAssigned - currentlySelectedFromAvailable;

                                  // Chỉ chọn số lượng serials còn lại được phép
                                  const availableIds = filteredAvailableSerials
                                    .filter(s => !selectedSerialIds.includes(s.id))
                                    .slice(0, remainingSlots)
                                    .map(s => s.id);

                                  if (availableIds.length > 0) {
                                    setSelectedSerialIds(prev => [...new Set([...prev, ...availableIds])]);
                                  }
                                } else {
                                  const availableIds = filteredAvailableSerials.map(s => s.id);
                                  setSelectedSerialIds(prev => prev.filter(id => !availableIds.includes(id)));
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>Product ID</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAvailableSerials.map((serial) => {
                          const isSelected = selectedSerialIds.includes(serial.id);

                          // Tính toán chính xác số lượng sau operations
                          const serialsToUnassign = selectedSerialIds.filter(id =>
                            allocatedSerials.some(s => s.id === id)
                          ).length;
                          const serialsToAssign = selectedSerialIds.filter(id =>
                            availableSerials.some(s => s.id === id)
                          ).length;

                          // Số serial cuối cùng sẽ có
                          const finalAssignedCount = (allocatedSerials.length - serialsToUnassign) + serialsToAssign;
                          const totalFinalCount = dealerAllocatedSerials.length + finalAssignedCount;

                          // Có thể select nếu chưa vượt quá limit hoặc đã được select rồi
                          const canSelect = totalFinalCount < orderItem.quantity || isSelected;

                          return (
                            <TableRow
                              key={serial.id}
                              className={isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleSelectSerial(serial.id, checked as boolean)}
                                  disabled={!canSelect}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono">
                                    {serial.serial}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">{serial.productId}</TableCell>
                              <TableCell>
                                <Badge className="bg-blue-100 text-blue-800">
                                  IN_STOCK
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Scroll to Top Button for Section 2 */}
                  {showScrollToTop && availableSerials.length > 8 && (
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-20"
                      onClick={scrollToTopSection2}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose} disabled={assigning}>
            Đóng
          </Button>

          {selectedSerialIds.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Nút Gán/Bỏ gán */}
              <Button
                onClick={handleAssignSerials}
                disabled={assigning}
                variant={selectedSerialIds.some(id => allocatedSerials.some(s => s.id === id)) ? "destructive" : "default"}
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {(() => {
                      const toUnassign = selectedSerialIds.filter(id => allocatedSerials.some(s => s.id === id)).length;
                      const toAssign = selectedSerialIds.filter(id => availableSerials.some(s => s.id === id)).length;

                      if (toUnassign > 0 && toAssign > 0) {
                        return `Bỏ gán ${toUnassign} và gán ${toAssign} serial`;
                      } else if (toUnassign > 0) {
                        return `Bỏ gán ${toUnassign} serial`;
                      } else {
                        return `Gán ${toAssign} serial`;
                      }
                    })()}
                  </>
                )}
              </Button>

              {/* Nút Phân phối cho đại lý - chỉ hiện khi có serials đã gán được chọn */}
              {selectedSerialIds.filter(id => allocatedSerials.some(s => s.id === id)).length > 0 && (
                <Button
                  onClick={handleAllocateToDealer}
                  disabled={assigning}
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 hover:bg-purple-200"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang phân phối...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Phân phối cho đại lý ({selectedSerialIds.filter(id => allocatedSerials.some(s => s.id === id)).length})
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}
