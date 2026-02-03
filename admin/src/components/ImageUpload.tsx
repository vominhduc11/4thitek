import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadService } from "@/services/uploadService";
import { BlogImageData } from "@/types";
import { logger } from '@/utils/logger';

interface ImageUploadProps {
  value: string | BlogImageData;
  onChange: (value: string | BlogImageData) => void;
  onFileSelect?: (file: File) => void;
  onRemove?: (data: string | BlogImageData) => void;
  placeholder?: string;
  maxSizeInMB?: number;
  className?: string;
  showPreview?: boolean;
  previewSize?: "small" | "medium" | "large";
  folder?: string;
  useObjectFormat?: boolean; // New prop to enable object format
}

export function ImageUpload({
  value,
  onChange,
  onFileSelect,
  onRemove,
  placeholder = "Chọn hoặc kéo thả hình ảnh",
  maxSizeInMB = 10,
  className = "",
  showPreview = true,
  previewSize = "medium",
  folder = "products",
  useObjectFormat = false
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sizeClasses = {
    small: "w-20 h-20",
    medium: "w-40 h-40", 
    large: "w-60 h-60"
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file
    const validation = uploadService.validateImageFile(file, { maxSizeMB: maxSizeInMB });
    if (!validation.valid) {
      toast({
        title: "Lỗi file",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    // Call the optional callback with the file (before upload for immediate feedback)
    if (onFileSelect) {
      onFileSelect(file);
    }

    try {
      // Upload file to server with specified folder
      const uploadResponse = await uploadService.uploadImage(file, folder);

      // Delete old file if exists (AFTER successful upload)
      if (value && onRemove) {
        await onRemove(value);
      }

      // Update with uploaded data (URL or object based on useObjectFormat)
      if (useObjectFormat) {
        onChange({
          url: uploadResponse.url,
          public_id: uploadResponse.publicId
        });
      } else {
        onChange(uploadResponse.url);
      }

      toast({
        title: "Upload thành công",
        description: "Hình ảnh đã được upload lên server",
      });
    } catch (error) {
      logger.error('Upload failed:', error);
      toast({
        title: "Upload thất bại",
        description: "Không thể upload hình ảnh. Vui lòng thử lại.",
        variant: "destructive",
      });
      // Reset on upload failure
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async () => {
    setIsDeleting(true);

    try {
      // Delete file from server if exists
      if (value && onRemove) {
        await onRemove(value);
        toast({
          title: "Xóa thành công",
          description: "Hình ảnh đã được xóa khỏi server",
        });
      }

      setSelectedFile(null);
      onChange(useObjectFormat ? { url: "", public_id: "" } : "");
    } catch (error) {
      logger.error('Failed to delete file:', error);
      toast({
        title: "Lỗi xóa file",
        description: "Có lỗi khi xóa file trên server",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
      handleFile(files[0]);
    }
  };

  const inputId = `image-upload-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      {(typeof value === 'string' ? value : value?.url) && showPreview ? (
        /* Image Preview */
        <div className="mb-3">
          <div className="relative inline-block">
            <img
              src={typeof value === 'string' ? value : value?.url || ''}
              alt="Preview"
              loading="lazy"
              className={`${sizeClasses[previewSize]} object-cover rounded-lg border border-border shadow-sm`}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={removeImage}
              disabled={isDeleting || isUploading}
            >
              {isDeleting || isUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          {selectedFile && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p><strong>File:</strong> {selectedFile.name}</p>
              <p><strong>Kích thước:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(inputId)?.click()}
            className="mt-3 flex items-center gap-2"
            size="sm"
            disabled={isUploading || isDeleting}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang upload...
              </>
            ) : isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xóa...
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
        /* Upload Area */
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isUploading || isDeleting
              ? 'border-muted bg-muted cursor-not-allowed'
              : isDragOver
                ? 'border-primary bg-primary/10 cursor-pointer'
                : 'border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
          }`}
          onDragOver={isUploading || isDeleting ? undefined : handleDragOver}
          onDragLeave={isUploading || isDeleting ? undefined : handleDragLeave}
          onDrop={isUploading || isDeleting ? undefined : handleDrop}
          onClick={isUploading || isDeleting ? undefined : () => document.getElementById(inputId)?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-primary mb-4 animate-spin" />
              <p className="text-lg font-medium text-foreground mb-2">
                Đang upload hình ảnh...
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Vui lòng đợi
              </p>
            </>
          ) : isDeleting ? (
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
                {isDragOver ? 'Thả hình ảnh vào đây' : placeholder}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Hỗ trợ: JPG, PNG, GIF. Tối đa {maxSizeInMB}MB
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
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}
