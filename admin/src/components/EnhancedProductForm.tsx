import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Product, ProductSpecifications, SpecificationItem, ProductOverviewItem, ProductVideo, PublishStatus } from "@/types";
import { logger } from "@/utils/logger";
import { uploadService } from "@/services/uploadService";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { SpecificationEditor } from "./SpecificationEditor";
import { ProductDescriptionEditor } from "./ProductDescriptionEditor";

interface EnhancedProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  product?: Product;
  mode: "add" | "edit";
}

export function EnhancedProductForm({ isOpen, onClose, onSave, product, mode }: EnhancedProductFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  type TabValue = "basic" | "description" | "videos" | "specs";
  const [activeTab, setActiveTab] = useState<TabValue>("basic");

  // Helpers
  const parseJsonSafe = useCallback(<T,>(value: unknown): T | null => {
    if (typeof value !== "string") return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }, []);

  const parseImage = useCallback((image?: unknown) => {
    if (!image) return { data: null, preview: "" };
    if (typeof image === "string") {
      const parsed = parseJsonSafe<any>(image);
      if (parsed?.imageUrl) return { data: parsed, preview: parsed.imageUrl };
      if (parsed?.url) return { data: parsed, preview: parsed.url };
      return { data: null, preview: image };
    }
    if (typeof image === "object" && image !== null) {
      // @ts-expect-error allow optional keys
      const url = image.imageUrl || image.url;
      return { data: url ? image : null, preview: url || "" };
    }
    return { data: null, preview: "" };
  }, [parseJsonSafe]);

  // Tab validation state - only required fields gate submission
  const validateTab = (tabName: string): boolean => {
    switch (tabName) {
      case 'basic':
        return !!(
          basicData.name && basicData.name.trim() !== "" &&
          basicData.price > 0
        );
      default:
        return true; // description and videos are optional
    }
  };

  // Calculate form completion progress
  const getFormProgress = (): { completed: number; total: number; percentage: number } => {
    const requiredTabs = ['basic'];
    const completed = requiredTabs.filter(tab => validateTab(tab)).length;
    const total = requiredTabs.length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  };

  // Check if form is ready for submission
  const isFormValid = (): boolean => {
    // Validate all required tabs for both add and edit modes
    return validateTab('basic');
  };

  // Check if any upload/delete operations are in progress
  const isAnyOperationInProgress = (): boolean => {
    return isImageUploading || isImageDeleting;
  };

  const PRODUCT_IMAGE_MAX_SIZE_MB = 5;
  
  // Basic info - only fields needed for API
  const [basicData, setBasicData] = useState({
    name: "",
    sku: "",
    shortDescription: "",
    price: 0,
    showOnHomepage: false,
    isFeatured: false,
    publishStatus: "UNPUBLISHED" as PublishStatus,
  });

  // Descriptions JSONB structure - simplified to array directly
  const [descriptions, setDescriptions] = useState<ProductOverviewItem[]>([
    { type: "title", text: "" }
  ]);


  // Videos JSONB structure
  const [productVideos, setProductVideos] = useState<ProductVideo[]>([
    { videoUrl: "", title: "", description: "" }
  ]);

  // Image file handling - updated for new API format
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageData, setImageData] = useState<{file_id?: string; public_id?: string; imageUrl: string} | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);

  // Specifications as simple array
  const [specifications, setSpecifications] = useState<ProductSpecifications>([]);


  // Track original values for dirty checking in edit mode
  const [originalData, setOriginalData] = useState<any>(null);

  // Check if form has changes for edit mode
  const hasChanges = () => {
    if (mode !== "edit" || !originalData) return true; // Allow submit for add mode
    const changedFields = getOnlyChangedFields();
    return Object.keys(changedFields).length > 0;
  };

  // Reset form when switching to add mode
  useEffect(() => {
    if (mode === "add") {
      setBasicData({
        name: "",
        sku: "",
            shortDescription: "",
        price: 0,
        showOnHomepage: false,
        isFeatured: false,
        publishStatus: "UNPUBLISHED" as PublishStatus,
      });
      setDescriptions([{ type: "title", text: "" }]);
      setProductVideos([{ videoUrl: "", title: "", description: "" }]);
      setSpecifications([]);
      setSelectedImage(null);
      setImagePreview("");
      setImageData(null);
      setOriginalData(null);
    }
  }, [mode]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("basic");
    }
  }, [isOpen]);

  // Load data when product changes (for edit mode)
  useEffect(() => {
    if (product && mode === "edit") {
      setBasicData({
        name: product.name || "",
        sku: product.sku || "",
        shortDescription: product.shortDescription || "",
        price: typeof product.price === "string" ? Number(product.price) || 0 : product.price || 0,
        showOnHomepage: product.showOnHomepage || false,
        isFeatured: product.isFeatured || false,
        publishStatus: (product as any).publishStatus || "UNPUBLISHED",
      });

      // Handle image formats (URL string, JSON string, object)
      const parsedImage = parseImage(product.image);
      setImageData(parsedImage.data);
      setImagePreview(parsedImage.preview);

      // Descriptions: accept array or JSON string/object with descriptions
      if (product.descriptions) {
        if (Array.isArray(product.descriptions)) {
          setDescriptions(product.descriptions as ProductOverviewItem[]);
        } else {
          const parsedDesc = parseJsonSafe<any>(product.descriptions);
          if (parsedDesc?.descriptions && Array.isArray(parsedDesc.descriptions)) {
            setDescriptions(parsedDesc.descriptions as ProductOverviewItem[]);
          } else if (Array.isArray(parsedDesc)) {
            setDescriptions(parsedDesc as ProductOverviewItem[]);
          }
        }
      }

      // Videos: accept array or JSON string
      if (product.videos) {
        if (Array.isArray(product.videos)) {
          setProductVideos(product.videos);
        } else {
          const parsedVideos = parseJsonSafe<ProductVideo[]>(product.videos as any);
          if (parsedVideos && Array.isArray(parsedVideos)) {
            setProductVideos(parsedVideos);
          }
        }
      }

      // Specifications: accept array or JSON string
      if (product.specifications) {
        if (Array.isArray(product.specifications)) {
          setSpecifications(product.specifications as ProductSpecifications);
        } else {
          const parsedSpecs = parseJsonSafe<ProductSpecifications>(product.specifications as any);
          if (parsedSpecs) setSpecifications(parsedSpecs);
        }
      }

      // Warranty might not be in response, keep default values for edit mode

      // Store original data for dirty checking
      // Parse image from string to object for proper comparison
      let originalImageData = null;
      if (product.image) {
        if (typeof product.image === 'string') {
          const parsed = parseJsonSafe<any>(product.image);
          if (parsed) originalImageData = parsed;
          else originalImageData = { imageUrl: product.image };
        } else {
          originalImageData = product.image;
        }
      }

      setOriginalData({
        name: product.name || "",
        sku: product.sku || "",
        shortDescription: product.shortDescription || "",
        image: originalImageData,
        price: typeof product.price === "string" ? Number(product.price) || 0 : product.price || 0,
        showOnHomepage: product.showOnHomepage || false,
        isFeatured: product.isFeatured || false,
        publishStatus: (product as any).publishStatus || "UNPUBLISHED",
        descriptions: product.descriptions && Array.isArray(product.descriptions) ? product.descriptions : [],
        specifications: Array.isArray(product.specifications) ? product.specifications : [],
        videos: product.videos && Array.isArray(product.videos) ? product.videos : []
      });
    }
  }, [mode, parseImage, parseJsonSafe, product]);

  // Helper function to get only changed fields for PATCH
  const getChangedFields = () => {
    // For add mode, return all required fields
    if (mode === "add") {
      const allFields: any = {
        name: basicData.name,
        sku: basicData.sku,
        shortDescription: basicData.shortDescription,
        price: basicData.price,
        descriptions: JSON.stringify(descriptions),
        specifications: JSON.stringify(specifications),
        videos: JSON.stringify(productVideos.filter(v => v.videoUrl.trim() !== "" || v.title.trim() !== "")),
        showOnHomepage: basicData.showOnHomepage,
        isFeatured: basicData.isFeatured,
        publishStatus: basicData.publishStatus,
      };

      // Only include image if there's actual data
      if (imageData) {
        allFields.image = JSON.stringify(imageData);
      }

      return allFields;
    }

    // For edit mode, only return changed fields
    if (mode === "edit" && originalData) {
      return getOnlyChangedFields();
    }

    return {};
  };

  // Separate function to get only changed fields for edit mode
  const getOnlyChangedFields = () => {
    const changedFields: any = {};

    // Check basic fields
    if (basicData.name !== originalData.name) {
      changedFields.name = basicData.name;
    }
    if (basicData.sku !== originalData.sku) {
      changedFields.sku = basicData.sku;
    }
    if (basicData.shortDescription !== originalData.shortDescription) {
      changedFields.shortDescription = basicData.shortDescription;
    }
    if (basicData.price !== originalData.price) {
      changedFields.price = basicData.price;
    }
    if (basicData.showOnHomepage !== originalData.showOnHomepage) {
      changedFields.showOnHomepage = basicData.showOnHomepage;
    }
    if (basicData.isFeatured !== originalData.isFeatured) {
      changedFields.isFeatured = basicData.isFeatured;
    }
    if (basicData.publishStatus !== originalData.publishStatus) {
      changedFields.publishStatus = basicData.publishStatus;
    }

    // Check image - only include if actually changed AND has value
    const originalImageStr = JSON.stringify(originalData.image || null);
    const currentImageStr = JSON.stringify(imageData || null);
    if (currentImageStr !== originalImageStr) {
      if (imageData) {
        changedFields.image = JSON.stringify(imageData);
      }
    }

    // Check descriptions - only include if has meaningful content
    const originalDescStr = JSON.stringify(originalData.descriptions || []);
    const currentDescStr = JSON.stringify(descriptions);
    if (currentDescStr !== originalDescStr) {
      if (descriptions && descriptions.length > 0) {
        changedFields.descriptions = JSON.stringify(descriptions);
      }
    }

    // Check specifications - only include if has meaningful content
    const originalSpecStr = JSON.stringify(originalData.specifications || []);
    const currentSpecStr = JSON.stringify(specifications);
    if (currentSpecStr !== originalSpecStr) {
      const hasSpecs = specifications.length > 0;
      if (hasSpecs) {
        changedFields.specifications = JSON.stringify(specifications);
      }
    }

    // Check videos - only include if has valid videos
    const currentVideos = productVideos.filter(v => v.videoUrl.trim() !== "" || v.title.trim() !== "");
    const originalVideoStr = JSON.stringify(originalData.videos || []);
    const currentVideoStr = JSON.stringify(currentVideos);
    if (currentVideoStr !== originalVideoStr) {
      if (currentVideos.length > 0) {
        changedFields.videos = JSON.stringify(currentVideos);
      }
    }

    return changedFields;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const hasBasicErrors = !basicData.name || !basicData.price || basicData.price <= 0;
    
    try {
      // Basic validation
      if (hasBasicErrors) {
        setActiveTab("basic");
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Giá bán)",
          variant: "destructive",
        });
        return;
      }

      if (basicData.shortDescription.length > 500) {
        toast({
          title: "Lỗi",
          description: "Mô tả ngắn không được vượt quá 500 ký tự",
          variant: "destructive",
        });
        return;
      }

      // Get only changed fields for efficient PATCH or all fields for POST
      const productData = getChangedFields();

      // Debug log body
      logger.debug('Product form submission', {
        mode,
        productData,
        descriptions,
        specifications,
        imageData
      });

      // For edit mode, check if there are any changes
      if (mode === "edit" && Object.keys(productData).length === 0) {
        toast({
          title: "Không có thay đổi",
          description: "Không có thông tin nào được thay đổi.",
          variant: "default",
        });
        setIsLoading(false);
        return;
      }

      // Final debug log before sending to API

      // Call the parent's onSave function which will handle the API call
      await onSave(productData);
      
    } catch (error) {
      logger.error('Product form submission failed', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu sản phẩm",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Helper functions for Specifications
  const addSpecification = (group: 'general' | 'technical') => {
    setSpecifications(prev => ({
      ...prev,
      [group]: [...prev[group], { label: "", value: "" }]
    }));
  };

  const removeSpecification = (group: 'general' | 'technical', index: number) => {
    setSpecifications(prev => ({
      ...prev,
      [group]: prev[group].filter((_, i) => i !== index)
    }));
  };

  const updateSpecification = (group: 'general' | 'technical', index: number, field: keyof SpecificationItem, value: string) => {
    setSpecifications(prev => ({
      ...prev,
      [group]: prev[group].map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }));
  };




  // Helper functions for Descriptions
  const addDescriptionsItem = (type: ProductOverviewItem['type']) => {
    const newItem: ProductOverviewItem = { type };
    if (type === 'title' || type === 'description') {
      newItem.text = '';
    } else if (type === 'image') {
      newItem.imageUrl = '';
      newItem.public_id = '';
    }

    setDescriptions(prev => [...prev, newItem]);
  };

  const removeDescriptionsItem = (index: number) => {
    setDescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateDescriptionsItem = (index: number, field: string, value: any) => {
    setDescriptions(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Helper functions for Videos
  const addVideo = () => {
    setProductVideos(prev => [...prev, { videoUrl: "", title: "", description: "" }]);
  };

  const removeVideo = (index: number) => {
    setProductVideos(prev => prev.filter((_, i) => i !== index));
  };

  const updateVideo = (index: number, field: keyof ProductVideo, value: string) => {
    setProductVideos(prev => prev.map((video, i) =>
      i === index ? { ...video, [field]: value } : video
    ));
  };

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    // eslint-disable-next-line no-useless-escape
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Helper function to get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  // Helper function to get YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };


  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const removeImage = async () => {
    setIsImageDeleting(true);

    try {
      // Delete file from server if exists - check imageData first, then basicData.image
      const imageToDelete = imageData?.file_id || imageData?.public_id || basicData.image;

      if (imageToDelete) {
        logger.debug('Deleting image', imageToDelete);
        const deleteSuccess = await uploadService.deleteFile(imageToDelete);

        if (deleteSuccess) {
          toast({
            title: "Xóa thành công",
            description: "Hình ảnh đã được xóa khỏi server",
          });
        } else {
          toast({
            title: "Cảnh báo",
            description: "Không thể xóa file trên server, nhưng đã xóa khỏi form",
            variant: "destructive",
          });
        }
      } else {
        logger.warn('No image URL or public_id to delete');
      }

      logger.debug('Clearing image from form');
      setSelectedImage(null);
      setImagePreview("");
      setImageData(null);
      setBasicData(prev => ({ ...prev, image: "" }));
    } catch (error) {
      logger.error('Failed to delete file', error);
      toast({
        title: "Lỗi xóa file",
        description: "Có lỗi khi xóa file trên server",
        variant: "destructive",
      });
    } finally {
      setIsImageDeleting(false);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Reuse the same validation logic
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      } else {
        toast({
          title: "Lỗi file",
          description: "Vui lòng chọn file hình ảnh",
          variant: "destructive",
        });
      }
    }
  };

  const handleImageFile = async (file: File) => {
    // Validate file
    const validation = uploadService.validateImageFile(file, { maxSizeMB: PRODUCT_IMAGE_MAX_SIZE_MB });
    if (!validation.valid) {
      toast({
        title: "Lỗi file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsImageUploading(true);
    setSelectedImage(file);

    // Create preview URL for immediate display
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Upload file to server with "products" folder
      const uploadResponse = await uploadService.uploadImage(file, 'products');

      // Delete old file if exists
      if (imageData?.public_id || imageData?.file_id) {
        await uploadService.deleteFile(imageData.public_id || imageData.file_id);
      }

      // Update image data with uploaded response
      setImageData({
        public_id: uploadResponse.publicId,
        file_id: uploadResponse.publicId, // For backward compatibility
        imageUrl: uploadResponse.url
      });
      setImagePreview(uploadResponse.url);

      toast({
        title: "Upload thành công",
        description: "Hình ảnh đã được upload lên server",
      });
    } catch (error) {
      logger.error('Image upload failed', error);
      toast({
        title: "Upload thất bại",
        description: "Không thể upload hình ảnh. Vui lòng thử lại.",
        variant: "destructive",
      });
      // Reset on upload failure
      setSelectedImage(null);
      setImagePreview("");
    } finally {
      setIsImageUploading(false);
    }
  };

  const tabOrder: TabValue[] = ["basic", "description", "videos", "specs"];
  const goToTab = (direction: "next" | "prev") => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const nextIndex =
      direction === "next"
        ? Math.min(tabOrder.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
    setActiveTab(tabOrder[nextIndex]);
  };

  const basicFieldErrors = {
    name: !basicData.name,
    price: !basicData.price || basicData.price <= 0,
  };

  return (
    <>
      {/* Fixed notification overlay - outside dialog */}
      {isAnyOperationInProgress() && (
        <div className="fixed top-4 right-4 z-[9999] bg-primary text-primary-foreground rounded-lg px-4 py-2 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Đang xử lý file...</span>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={isAnyOperationInProgress() ? undefined : onClose}>
        <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[calc(100vh-4rem)] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Điền thông tin chi tiết để tạo sản phẩm mới trong hệ thống"
              : "Cập nhật thông tin sản phẩm và lưu thay đổi"
            }
          </DialogDescription>

          {/* Progress Indicator */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Tiến độ hoàn thành: {getFormProgress().completed}/{getFormProgress().total} bước bắt buộc
              </span>
              <span className="font-medium text-primary">
                {getFormProgress().percentage}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  getFormProgress().percentage === 100
                    ? 'bg-green-500 dark:bg-green-400'
                    : 'bg-primary'
                }`}
                style={{ width: `${getFormProgress().percentage}%` }}
              ></div>
            </div>
            {!isFormValid() && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-amber-500 dark:bg-amber-400 rounded-full"></span>
                Vui lòng hoàn thành các tab có dấu đỏ trước khi lưu
              </p>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
            <TabsList className={`grid w-full grid-cols-4 ${isAnyOperationInProgress() ? 'pointer-events-none opacity-50' : ''}`}>
              <TabsTrigger value="basic" className="relative">
                <span className="flex items-center gap-2">
                  {validateTab('basic') ? (
                    <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></span>
                  ) : (
                    <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse"></span>
                  )}
                  Cơ bản
                  {!validateTab('basic') && <span className="text-xs">*</span>}
                </span>
              </TabsTrigger>

              <TabsTrigger value="description" className="relative">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Mô tả
                </span>
              </TabsTrigger>

              <TabsTrigger value="videos" className="relative">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Videos
                </span>
              </TabsTrigger>

              <TabsTrigger value="specs" className="relative">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Thông số
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              {/* Product Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>Thông tin sản phẩm</CardTitle>
                      <p className="text-sm text-muted-foreground">Hoàn thành các trường bắt buộc trước khi chuyển tab.</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Dấu * là bắt buộc</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      id="name"
                      value={basicData.name}
                      onChange={(e) => setBasicData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập tên sản phẩm"
                    />
                    {basicFieldErrors.name && (
                      <p className="text-xs text-destructive mt-1">Vui lòng nhập tên sản phẩm.</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={basicData.sku}
                      onChange={(e) => setBasicData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="Mã SKU (tuỳ chọn)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shortDescription">Mô tả ngắn</Label>
                    <Textarea
                      id="shortDescription"
                      value={basicData.shortDescription}
                      onChange={(e) => setBasicData(prev => ({ ...prev, shortDescription: e.target.value }))}
                      placeholder="Mô tả ngắn gọn về sản phẩm (tối đa 500 ký tự)"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {basicData.shortDescription.length}/500 ký tự
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="price">Giá bán (VND) *</Label>
                      <Input
                        id="price"
                        value={basicData.price}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBasicData(prev => ({
                            ...prev,
                            price: value === '' ? 0 : parseFloat(value) || 0
                          }));
                        }}
                        placeholder="0"
                      />
                      {basicFieldErrors.price && (
                        <p className="text-xs text-destructive mt-1">Giá bán phải lớn hơn 0.</p>
                      )}
                          {basicData.price > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Preview: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(basicData.price)}
                            </p>
                          )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="publishStatus">Trạng thái xuất bản</Label>
                      <Select
                        value={basicData.publishStatus}
                        onValueChange={(value) => setBasicData(prev => ({ ...prev, publishStatus: value as PublishStatus }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
                          <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chỉ sản phẩm đã xuất bản mới hiển thị công khai.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <Label className="text-sm">Hiển thị trên trang chủ</Label>
                          <p className="text-xs text-muted-foreground">Bật nếu muốn xuất hiện ở section homepage.</p>
                        </div>
                        <Switch
                          checked={basicData.showOnHomepage}
                          onCheckedChange={(checked) => setBasicData(prev => ({ ...prev, showOnHomepage: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <Label className="text-sm">Sản phẩm nổi bật</Label>
                          <p className="text-xs text-muted-foreground">Đưa vào nhóm “featured products”.</p>
                        </div>
                        <Switch
                          checked={basicData.isFeatured}
                          onCheckedChange={(checked) => setBasicData(prev => ({ ...prev, isFeatured: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Hình ảnh sản phẩm</CardTitle>
                </CardHeader>
                <CardContent>

                    
                    {imagePreview ? (
                      /* Image Preview */
                      <div className="mt-2 mb-3">
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-40 h-40 object-cover rounded-lg border border-gray-200 shadow-sm"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={removeImage}
                            disabled={isImageDeleting || isImageUploading}
                          >
                            {isImageDeleting || isImageUploading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {selectedImage && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p><strong>File:</strong> {selectedImage.name}</p>
                            <p><strong>Kích thước:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          className="mt-3 flex items-center gap-2"
                          size="sm"
                          disabled={isImageUploading || isImageDeleting}
                        >
                          {isImageUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang upload...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Thay đổi hình ảnh
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      /* Drag & Drop Upload Area */
                      <div
                        className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isImageUploading || isImageDeleting
                            ? 'border-muted bg-muted cursor-not-allowed'
                            : isDragOver
                              ? 'border-primary bg-primary/10 cursor-pointer'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
                        }`}
                        onDragOver={isImageUploading || isImageDeleting ? undefined : handleDragOver}
                        onDragLeave={isImageUploading || isImageDeleting ? undefined : handleDragLeave}
                        onDrop={isImageUploading || isImageDeleting ? undefined : handleDrop}
                        onClick={isImageUploading || isImageDeleting ? undefined : () => document.getElementById('image-upload')?.click()}
                      >
                        {isImageUploading ? (
                          <>
                            <Loader2 className="mx-auto h-12 w-12 text-primary mb-4 animate-spin" />
                            <p className="text-lg font-medium text-foreground mb-2">
                              Đang upload hình ảnh...
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Vui lòng đợi
                            </p>
                          </>
                        ) : isImageDeleting ? (
                          <>
                            <Loader2 className="mx-auto h-12 w-12 text-destructive mb-4 animate-spin" />
                            <p className="text-lg font-medium text-destructive mb-2">
                              Đang xóa hình ảnh...
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Vui lòng đợi
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-foreground mb-2">
                              {isDragOver ? 'Thả hình ảnh vào đây' : 'Chọn hoặc kéo thả hình ảnh'}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Hỗ trợ: JPG, PNG, GIF. Tối đa {PRODUCT_IMAGE_MAX_SIZE_MB}MB
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                              💡 Nên chọn hình ảnh có nền trong suốt và tỷ lệ 1:1 (vuông) để hiển thị đẹp nhất
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="pointer-events-none"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Chọn file
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    

                    {/* Hidden File Input */}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                </CardContent>
              </Card>

            </TabsContent>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Product Overview</CardTitle>
                    <p className="text-sm text-muted-foreground">Thêm đoạn giới thiệu, bullet, heading để nội dung rõ ràng.</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ProductDescriptionEditor
                    value={descriptions}
                    onChange={setDescriptions}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Videos sản phẩm</CardTitle>
                    <p className="text-sm text-muted-foreground">Dán link YouTube và thêm tiêu đề để hiển thị preview.</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {productVideos.map((video, index) => (
                    <div key={index} className="border p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Video {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeVideo(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* YouTube URL Input */}
                      <div>
                        <Label>YouTube URL *</Label>
                        <Input
                          value={video.videoUrl}
                          onChange={(e) => updateVideo(index, 'videoUrl', e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Hỗ trợ URL từ YouTube (youtube.com hoặc youtu.be)
                        </p>
                      </div>

                      {/* YouTube Preview */}
                      {video.videoUrl && getYouTubeVideoId(video.videoUrl) && (
                        <div className="mt-3">
                          <Label className="text-sm font-medium">Preview</Label>
                          <div className="mt-2 relative">
                            <iframe
                              src={getYouTubeEmbedUrl(video.videoUrl)}
                              className="w-full h-64 rounded-lg border border-border"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={video.title || `Video ${index + 1}`}
                            ></iframe>
                          </div>
                        </div>
                      )}

                      {/* Invalid URL Warning */}
                      {video.videoUrl && !getYouTubeVideoId(video.videoUrl) && (
                        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            ⚠️ URL không hợp lệ. Vui lòng nhập URL YouTube hợp lệ.
                          </p>
                        </div>
                      )}

                      {/* Video Details */}
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label>Tiêu đề *</Label>
                          <Input
                            value={video.title}
                            onChange={(e) => updateVideo(index, 'title', e.target.value)}
                            placeholder="Tiêu đề video"
                          />
                        </div>
                        <div>
                          <Label>Mô tả</Label>
                          <Textarea
                            value={video.description}
                            onChange={(e) => updateVideo(index, 'description', e.target.value)}
                            placeholder="Mô tả video (tùy chọn)"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addVideo}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Video
                  </Button>

                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <h5 className="font-medium text-foreground mb-2">💡 Hướng dẫn Videos</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Nhập URL YouTube (youtube.com hoặc youtu.be)</li>
                      <li>• Video sẽ được hiển thị dưới dạng embed iframe</li>
                      <li>• Tiêu đề là bắt buộc, mô tả tùy chọn</li>
                      <li>• Có thể xem preview video ngay trên form</li>
                      <li>• Hỗ trợ cả URL dạng đầy đủ và rút gọn</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Specifications */}
            <TabsContent value="specs" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Thông số sản phẩm</CardTitle>
                      <p className="text-sm text-muted-foreground">Tùy chọn, có thể bỏ trống nếu chưa có thông tin.</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SpecificationEditor
                    value={specifications}
                    onChange={setSpecifications}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Summary & Submit buttons */}
          <div className="pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur">
            {mode === "edit" && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  ℹ️ Chế độ chỉnh sửa
                </h4>
                <p className="text-sm text-muted-foreground">
                  Bạn có thể chỉnh sửa tất cả thông tin sản phẩm. Hệ thống sẽ chỉ cập nhật những trường dữ liệu đã thay đổi.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-3 text-sm">
              <div className="text-muted-foreground">
                {!isFormValid()
                  ? "Cần hoàn thành các trường bắt buộc trước khi lưu."
                  : "Đã sẵn sàng lưu."}
              </div>
              <div className="flex gap-2">
                {activeTab !== "basic" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => goToTab("prev")}>
                    Tab trước
                  </Button>
                )}
                {activeTab !== "specs" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => goToTab("next")}>
                    Tab tiếp
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className={`flex-1 ${
                  isFormValid() && !isAnyOperationInProgress() && hasChanges()
                    ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                    : 'bg-muted-foreground/50 hover:bg-muted-foreground/60'
                }`}
                disabled={isLoading || !isFormValid() || isAnyOperationInProgress() || !hasChanges()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === "add" ? "Đang thêm..." : "Đang cập nhật..."}
                  </>
                ) : isAnyOperationInProgress() ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý file...
                  </>
                ) : isFormValid() && hasChanges() ? (
                  <>
                    {mode === "add" ? "✓ Thêm sản phẩm" : "✓ Cập nhật sản phẩm"}
                  </>
                ) : isFormValid() && !hasChanges() && mode === "edit" ? (
                  <>
                    Không có thay đổi
                  </>
                ) : (
                  <>
                    {mode === "add" ? "Hoàn thành form để thêm" : "Hoàn thành form để cập nhật"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
