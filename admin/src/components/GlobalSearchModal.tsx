
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Package, ShoppingCart, User, Eye, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { productApi, dealerApi, blogApi } from "@/services/api";
import { orderService } from "@/services/orderService";
import { useDebounce } from "@/hooks/useDebounce";
import { logger } from '@/utils/logger';

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'customer' | 'blog';
  title: string;
  subtitle: string;
  badge?: string;
  data: any;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search all APIs when debounced term changes
  useEffect(() => {
    const searchAll = async () => {
      if (!debouncedSearchTerm.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const allResults: SearchResult[] = [];

      try {
        // Search products
        const productsResponse = await productApi.search(debouncedSearchTerm);
        if (productsResponse.success && productsResponse.data) {
          productsResponse.data.forEach((product: any) => {
            allResults.push({
              id: product.id.toString(),
              type: 'product',
              title: product.name,
              subtitle: `Gi?: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}`,
              badge: product.isDeleted ? 'Đã xóa' : 'Còn hàng',
              data: product
            });
          });
        }
      } catch (error) {
        logger.error('Error searching products:', error);
      }

      try {
        // Search orders
        const ordersResponse = await orderService.searchOrders(debouncedSearchTerm);
        if (ordersResponse.success && ordersResponse.data) {
          ordersResponse.data.forEach((order: any) => {
            allResults.push({
              id: order.id.toString(),
              type: 'order',
              title: `Đơn hàng #${order.orderCode}`,
              subtitle: `${order.dealerName} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}`,
              badge: order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán',
              data: order
            });
          });
        }
      } catch (error) {
        logger.error('Error searching orders:', error);
      }

      try {
        // Search customers (dealers)
        const customersResponse = await dealerApi.search(debouncedSearchTerm);
        if (customersResponse.success && customersResponse.data) {
          customersResponse.data.forEach((dealer: any) => {
            allResults.push({
              id: dealer.accountId.toString(),
              type: 'customer',
              title: dealer.companyName,
              subtitle: `${dealer.email} - ${dealer.phone}`,
              badge: dealer.city,
              data: dealer
            });
          });
        }
      } catch (error) {
        logger.error('Error searching customers:', error);
      }

      try {
        // Search blogs
        const blogsResponse = await blogApi.search(debouncedSearchTerm);
        if (blogsResponse.data) {
          blogsResponse.data.forEach((blog: any) => {
            allResults.push({
              id: blog.id.toString(),
              type: 'blog',
              title: blog.title,
              subtitle: blog.shortDescription || 'Không có mô tả',
              badge: blog.showOnHomepage ? 'Trang chủ' : undefined,
              data: blog
            });
          });
        }
      } catch (error) {
        logger.error('Error searching blogs:', error);
      }

      setResults(allResults);
      setIsSearching(false);
    };

    searchAll();
  }, [debouncedSearchTerm]);

  const filteredResults = results;

  const getIcon = (type: string) => {
    switch (type) {
      case 'product': return Package;
      case 'order': return ShoppingCart;
      case 'customer': return User;
      case 'blog': return FileText;
      default: return Search;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Sản phẩm';
      case 'order': return 'Đơn hàng';
      case 'customer': return 'Đại lý';
      case 'blog': return 'Blog';
      default: return '';
    }
  };

  const handleViewDetail = (result: SearchResult) => {
    setSelectedResult(result);
  };

  const handleCloseDetail = () => {
    setSelectedResult(null);
  };

  return (
    <>
      <Dialog open={isOpen && !selectedResult} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[calc(100vh-4rem)] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Tìm kiếm toàn cục</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Tìm kiếm sản phẩm, đơn hàng, đại lý, blog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
              {isSearching ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Đang tìm kiếm...</span>
                </div>
              ) : filteredResults.length === 0 && searchTerm ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy kết quả nào
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nhập từ khóa để tìm kiếm
                </div>
              ) : (
                filteredResults.map((result) => {
                const Icon = getIcon(result.type);
                return (
                  <div
                    key={result.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                          {result.badge && (
                            <Badge className="text-xs">{result.badge}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(result)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      {selectedResult && (
        <Dialog open={true} onOpenChange={handleCloseDetail}>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Chi tiết {getTypeLabel(selectedResult.type)}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedResult.type === 'product' && (
                <>
                  <div>
                    <h3 className="font-medium">{selectedResult.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Giá:</span>
                      <p className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedResult.data.price)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <p>{selectedResult.data.isDeleted ? 'Đã xóa' : 'Hoạt động'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mô tả:</span>
                    <p className="text-sm">{selectedResult.data.shortDescription || 'Không có mô tả'}</p>
                  </div>
                  <Button
                    onClick={() => {
                      navigate('/products');
                      onClose();
                    }}
                    className="w-full"
                  >
                    Xem chi tiết sản phẩm
                  </Button>
                </>
              )}

              {selectedResult.type === 'order' && (
                <>
                  <div>
                    <h3 className="font-medium">{selectedResult.title}</h3>
                    <p className="text-sm text-muted-foreground">Mã đơn: {selectedResult.data.orderCode}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Đại lý:</span>
                      <span className="font-medium">{selectedResult.data.dealerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng tiền:</span>
                      <span className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedResult.data.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      <Badge>{selectedResult.badge}</Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      navigate('/orders');
                      onClose();
                    }}
                    className="w-full"
                  >
                    Xem chi tiết đơn hàng
                  </Button>
                </>
              )}

              {selectedResult.type === 'customer' && (
                <>
                  <div>
                    <h3 className="font-medium">{selectedResult.title}</h3>
                    <p className="text-sm text-muted-foreground">ID: {selectedResult.data.accountId}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedResult.data.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Điện thoại:</span>
                      <span>{selectedResult.data.phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Địa chỉ:</span>
                      <p className="text-sm mt-1">{selectedResult.data.address}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Khu vực:</span>
                      <Badge variant="outline">{selectedResult.data.city}</Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      navigate('/customers');
                      onClose();
                    }}
                    className="w-full"
                  >
                    Xem chi tiết đại lý
                  </Button>
                </>
              )}

              {selectedResult.type === 'blog' && (
                <>
                  <div>
                    <h3 className="font-medium">{selectedResult.title}</h3>
                    <p className="text-sm text-muted-foreground">ID: {selectedResult.id}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mô tả:</span>
                      <p className="text-sm mt-1">{selectedResult.data.shortDescription || 'Không có mô tả'}</p>
                    </div>
                    {selectedResult.data.showOnHomepage && (
                      <div className="flex items-center gap-2">
                        <Badge>Hiển thị trang chủ</Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      navigate('/blogs');
                      onClose();
                    }}
                    className="w-full"
                  >
                    Xem chi tiết blog
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
