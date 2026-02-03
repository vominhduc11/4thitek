import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadService } from "@/services/uploadService";
import { logger } from '@/utils/logger';

interface ImageData {
  url: string;
  public_id: string;
}

interface MultipleImageUploadProps {
  value: ImageData[];
  onChange: (images: ImageData[]) => void;
  placeholder?: string;
  maxSizeInMB?: number;
  maxImages?: number;
  folder?: string;
}

export function MultipleImageUpload({
  value,
  onChange,
  placeholder = "Chọn hoặc kéo thả nhiều hình ảnh",
  maxSizeInMB = 10,
  maxImages = 10,
  folder = "products"
}: MultipleImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      await handleFiles(files);
    }
    // Reset input value to allow selecting the same files again
    event.target.value = '';
  };

  const handleFiles = async (files: File[]) => {
    // Check if adding these files would exceed max limit
    if (value.length + files.length > maxImages) {
      toast({
        title: "Vượt quá giới hạn",
        description: `Bạn chỉ có thể upload tối đa ${maxImages} hình ảnh`,
        variant: "destructive",
      });
      return;
    }

    setUploadingCount(files.length);

    const uploadPromises = files.map(async (file) => {
      // Validate file
      const validation = uploadService.validateImageFile(file, { maxSizeMB: maxSizeInMB });
      if (!validation.valid) {
        toast({
          title: "Lỗi file",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
        return null;
      }

      try {
        // Upload file to server
        const uploadResponse = await uploadService.uploadImage(file, folder);
        return {
          url: uploadResponse.url,
          public_id: uploadResponse.publicId
        };
      } catch (error) {
        logger.error('Upload failed:', error);
        toast({
          title: "Upload thất bại",
          description: `Không thể upload ${file.name}`,
          variant: "destructive",
        });
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is ImageData => r !== null);

      if (successfulUploads.length > 0) {
        onChange([...value, ...successfulUploads]);
        toast({
          title: "Upload thành công",
          description: `Đã upload ${successfulUploads.length}/${files.length} hình ảnh`,
        });
      }
    } finally {
      setUploadingCount(0);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = value[index];

    try {
      // Delete from server
      await uploadService.deleteFile(imageToRemove.public_id, 'image');

      // Remove from state
      const newImages = value.filter((_, i) => i !== index);
      onChange(newImages);

      toast({
        title: "Xóa thành công",
        description: "Hình ảnh đã được xóa",
      });
    } catch (error) {
      logger.error('Failed to delete file:', error);
      toast({
        title: "Lỗi xóa file",
        description: "Có lỗi khi xóa file trên server",
        variant: "destructive",
      });
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const inputId = `multiple-image-upload-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploadingCount > 0
            ? 'border-muted bg-muted cursor-not-allowed'
            : isDragOver
              ? 'border-primary bg-primary/10 cursor-pointer'
              : 'border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
        }`}
        onDragOver={uploadingCount > 0 ? undefined : handleDragOver}
        onDragLeave={uploadingCount > 0 ? undefined : handleDragLeave}
        onDrop={uploadingCount > 0 ? undefined : handleDrop}
        onClick={uploadingCount > 0 ? undefined : () => document.getElementById(inputId)?.click()}
      >
        {uploadingCount > 0 ? (
          <>
            <Loader2 className="mx-auto h-12 w-12 text-primary mb-4 animate-spin" />
            <p className="text-lg font-medium text-foreground mb-2">
              Đang upload {uploadingCount} hình ảnh...
            </p>
            <p className="text-sm text-muted-foreground">
              Vui lòng đợi
            </p>
          </>
        ) : (
          <>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              {isDragOver ? 'Thả hình ảnh vào đây' : placeholder}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Hỗ trợ: JPG, PNG, GIF. Tối đa {maxSizeInMB}MB mỗi file
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Đã chọn: {value.length}/{maxImages} hình ảnh
            </p>
            <Button
              type="button"
              variant="outline"
              className="pointer-events-none"
            >
              <Upload className="h-4 w-4 mr-2" />
              Chọn nhiều file
            </Button>
          </>
        )}
      </div>

      {/* Hidden File Input - Allow multiple selection */}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploadingCount > 0}
      />

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((image, index) => (
            <div key={image.public_id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border shadow-sm">
                <img
                  src={image.url}
                  alt={`Image ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded truncate">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state when no images */}
      {value.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-30" />
          <p className="text-sm">Chưa có hình ảnh nào được chọn</p>
        </div>
      )}
    </div>
  );
}
