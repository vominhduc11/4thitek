
import { useState, useEffect } from "react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Product, PublishStatus } from "@/types";
import { productService } from "@/services/productService";
import { Loader2 } from "lucide-react";
import { logger } from '@/utils/logger';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  product?: Product;
  mode: "add" | "edit";
}

export function ProductForm({ isOpen, onClose, onSave, product, mode }: ProductFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    shortDescription: product?.shortDescription || "",
    model: product?.model || "",
    price: product?.price || "",
    stock: product?.stock || 0,
    status: product?.status || "active",
    publishStatus: (product?.publishStatus || "UNPUBLISHED") as PublishStatus,
    images: product?.images || [],
    description: product?.description || "",
    wholesaleDiscount: product?.wholesaleDiscount || 0,
    minWholesaleQty: product?.minWholesaleQty || 10,
  });

  // Reset form data when mode changes or product changes
  useEffect(() => {
    setFormData({
      name: product?.name || "",
      sku: product?.sku || "",
      shortDescription: product?.shortDescription || "",
      model: product?.model || "",
      price: product?.price || "",
      stock: product?.stock || 0,
      status: product?.status || "active",
      publishStatus: (product?.publishStatus || "UNPUBLISHED") as PublishStatus,
      images: product?.images || [],
      description: product?.description || "",
      wholesaleDiscount: product?.wholesaleDiscount || 0,
      minWholesaleQty: product?.minWholesaleQty || 10,
    });
  }, [product, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Basic validation
      if (!formData.name || !formData.model || !formData.price) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin bắt buộc",
          variant: "destructive",
        });
        return;
      }

      if (formData.shortDescription.length > 500) {
        toast({
          title: "Lỗi",
          description: "Mô tả ngắn không được vượt quá 500 ký tự",
          variant: "destructive",
        });
        return;
      }

      if (formData.wholesaleDiscount < 0 || formData.wholesaleDiscount > 100) {
        toast({
          title: "Lỗi",
          description: "Chiết khấu phải từ 0% đến 100%",
          variant: "destructive",
        });
        return;
      }

      // Prepare product data for API (new format)
      const productData: Partial<Product> = {
        id: product?.id,
        name: formData.name,
        sku: formData.sku,
        shortDescription: formData.shortDescription,
        description: formData.description,
        categoryId: "gaming-headsets", // Default category
        publishStatus: formData.publishStatus,

        // New format: specifications as key-value object
        specifications: {
          model: formData.model,
          price: formData.price,
          stock: formData.stock.toString(),
          wholesaleDiscount: formData.wholesaleDiscount.toString(),
          minWholesaleQty: formData.minWholesaleQty.toString()
        },

        // New format: features as key-value object
        features: {
          quality: "Chất lượng âm thanh cao",
          design: "Thiết kế ergonomic",
          description: formData.description || "Tai nghe gaming chất lượng cao"
        },

        // New format: availability with inStock and quantity
        availability: {
          inStock: formData.status === "active",
          quantity: formData.stock,
          status: formData.status === "active" ? "available" as const : "out-of-stock" as const
        },

        // Optional warranty in new format
        warranty: {
          period: "12 months",
          type: "manufacturer"
        },

        highlights: ["Âm thanh chất lượng cao", "Thiết kế ergonomic", "Bảo hành 12 tháng"],
        targetAudience: ["Game thủ", "Người dùng văn phòng"],
        useCases: ["Gaming", "Làm việc", "Giải trí"],
        tags: ["gaming", "headset", formData.model.toLowerCase()],

        // Optional images
        images: formData.images.length > 0 ? formData.images : [
          {
            url: '/placeholder.svg',
            alt: formData.name,
            type: "main" as const,
            order: 1
          }
        ],

        // Legacy fields for backward compatibility
        model: formData.model,
        price: formData.price,
        stock: formData.stock,
        status: formData.status,
        wholesaleDiscount: formData.wholesaleDiscount,
        minWholesaleQty: formData.minWholesaleQty,
      };

      if (mode === "add") {
        // Call API to create product
        const apiRequestData = productService.mapFormDataToApiRequest(productData);
        
        // Validate data before sending
        const validationErrors = productService.validateProductData(apiRequestData);
        if (validationErrors.length > 0) {
          toast({
            title: "Lỗi validation",
            description: validationErrors[0],
            variant: "destructive",
          });
          return;
        }

        const createdProduct = await productService.createProduct(apiRequestData);
        onSave(createdProduct);
        
        toast({
          title: "Thêm thành công",
          description: `Tai nghe ${formData.name} đã được thêm thành công`,
        });
      } else if (product?.id) {
        // Call API to update product
        const updatedProduct = await productService.updateProduct(product.id, productData);
        onSave(updatedProduct);
        
        toast({
          title: "Cập nhật thành công",
          description: `Tai nghe ${formData.name} đã được cập nhật thành công`,
        });
      }

      onClose();
    } catch (error) {
      logger.error('API Error:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu sản phẩm",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm tai nghe mới" : "Chỉnh sửa tai nghe"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Điền thông tin cơ bản để tạo sản phẩm tai nghe mới"
              : "Cập nhật thông tin sản phẩm tai nghe"
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên sản phẩm *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nhập tên tai nghe"
            />
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              placeholder="Mã SKU (tuỳ chọn)"
            />
          </div>

          <div>
            <Label htmlFor="shortDescription">Mô tả ngắn</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleChange("shortDescription", e.target.value)}
              placeholder="Mô tả ngắn gọn về sản phẩm (tối đa 500 ký tự)"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.shortDescription.length}/500 ký tự
            </p>
          </div>

          <div>
            <Label htmlFor="model">Mẫu *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value)}
              placeholder="Nhập tên mẫu"
            />
          </div>
          
          <div>
            <Label htmlFor="price">Giá bán *</Label>
            <Input
              id="price"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              placeholder="VD: 2,990,000"
            />
          </div>
          
          <div>
            <Label htmlFor="stock">Số lượng tồn kho</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) => handleChange("stock", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang bán</SelectItem>
                <SelectItem value="inactive">Ngừng bán</SelectItem>
                <SelectItem value="out_of_stock">Hết hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="publishStatus">Trạng thái xuất bản</Label>
            <Select value={formData.publishStatus} onValueChange={(value) => handleChange("publishStatus", value as PublishStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
                <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Chỉ sản phẩm đã xuất bản mới hiển thị trên trang web
            </p>
          </div>

          <div className="border-t dark:border-gray-700 pt-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Chính sách bán sỉ</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="wholesaleDiscount">Chiết khấu (%)</Label>
                <Input
                  id="wholesaleDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.wholesaleDiscount}
                  onChange={(e) => handleChange("wholesaleDiscount", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="minWholesaleQty">Số lượng tối thiểu</Label>
                <Input
                  id="minWholesaleQty"
                  type="number"
                  min="1"
                  value={formData.minWholesaleQty}
                  onChange={(e) => handleChange("minWholesaleQty", parseInt(e.target.value) || 1)}
                  placeholder="10"
                />
              </div>
            </div>
            
            {formData.wholesaleDiscount > 0 && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Đại lý sẽ được giảm {formData.wholesaleDiscount}% khi mua từ {formData.minWholesaleQty} sản phẩm trở lên
                </p>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="images">Hình ảnh sản phẩm</Label>
            <Input
              id="images"
              value={formData.images?.[0]?.url || ''}
              onChange={(e) => {
                const newImages = [{url: e.target.value, alt: formData.name, type: "main" as const, order: 1}];
                setFormData(prev => ({...prev, images: newImages}));
              }}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Nên chọn hình ảnh có nền trong suốt và tỷ lệ 1:1 (vuông) để hiển thị đẹp nhất
            </p>
          </div>
          
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Mô tả sản phẩm..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "add" ? "Đang thêm..." : "Đang cập nhật..."}
                </>
              ) : (
                mode === "add" ? "Thêm" : "Cập nhật"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
