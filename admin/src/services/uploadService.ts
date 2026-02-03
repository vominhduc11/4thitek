import { apiRequest } from "./api";
import { logger } from "@/utils/logger";

export interface UploadResponse {
  success: boolean;
  url: string;
  publicId: string;
  message?: string;
  filename?: string;
  size?: number;
  type?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

class UploadService {
  async uploadImage(file: File, folder: string = "products"): Promise<UploadResponse> {
    logger.debug("Uploading image", { fileName: file.name, fileSize: file.size, folder });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "image");
    formData.append("folder", folder);

    const response = await apiRequest<{
      success: boolean;
      data: { secure_url?: string; url?: string; public_id: string };
      message?: string;
    }>("/api/media/upload", {
      method: "POST",
      body: formData,
      headers: {},
    });

    if (!response.success) {
      throw new Error(response.message || "Upload failed");
    }

    return {
      success: true,
      url: response.data.secure_url || response.data.url || "",
      publicId: response.data.public_id,
      filename: file.name,
      size: file.size,
      type: file.type,
    };
  }

  async deleteFile(publicId: string): Promise<boolean> {
    logger.debug("Deleting media", { publicId });
    const response = await apiRequest<{ success: boolean; message?: string }>(
      `/api/media/delete?publicId=${encodeURIComponent(publicId)}`,
      {
        method: "DELETE",
      }
    );
    if (!response.success) {
      throw new Error(response.message || "Delete failed");
    }
    return true;
  }

  extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(urlObj.pathname.lastIndexOf("/") + 1);
    } catch {
      return url;
    }
  }

  validateImageFile(
    file: File,
    options: { maxSizeMB?: number; allowedTypes?: string[] } = {}
  ): FileValidationResult {
    const { maxSizeMB = 10, allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] } = options;

    if (!file) {
      return { valid: false, error: "Không có file nào được chọn" };
    }

    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "Vui lòng chọn file hình ảnh" };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "Định dạng không hỗ trợ. Chỉ hỗ trợ JPG, PNG, GIF hoặc WEBP" };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `Kích thước tối đa ${maxSizeMB}MB` };
    }

    return { valid: true };
  }
}

export const uploadService = new UploadService();
