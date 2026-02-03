/**
 * Utility functions for image processing
 */

/**
 * Parse image URL from various formats
 */
export const parseImageUrl = (imageData: string | { url: string } | null | undefined): string => {
  if (!imageData) {
    return '/placeholder.svg';
  }

  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData);
      return parsed.url || imageData;
    } catch {
      return imageData;
    }
  }

  if (typeof imageData === 'object' && 'url' in imageData) {
    return imageData.url;
  }

  return '/placeholder.svg';
};

/**
 * Parse multiple images from JSON string or array
 */
export const parseImages = (
  imagesData: string | Array<{ url: string; public_id?: string }> | null | undefined
): Array<{ url: string; public_id?: string }> => {
  if (!imagesData) {
    return [];
  }

  if (typeof imagesData === 'string') {
    try {
      const parsed = JSON.parse(imagesData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(imagesData)) {
    return imagesData;
  }

  return [];
};

/**
 * Extract image URLs from an array of image objects
 */
export const extractImageUrls = (images: Array<{ url: string }>): string[] => {
  return images.map((img) => img.url);
};

/**
 * Get first image from images array or return default
 */
export const getFirstImage = (
  images: string | Array<{ url: string }> | null | undefined,
  defaultUrl: string = '/placeholder.svg'
): string => {
  const parsed = parseImages(images);
  return parsed.length > 0 ? parsed[0].url : defaultUrl;
};

/**
 * Validate image file type
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Validate image file size
 */
export const isValidImageSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Get image dimensions from file
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};
