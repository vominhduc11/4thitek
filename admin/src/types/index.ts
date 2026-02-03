export interface ProductImage {
  url: string;
  alt: string;
  type: 'main' | 'angle' | 'detail' | 'gallery';
  order: number;
}

export type PublishStatus = 'PUBLISHED' | 'UNPUBLISHED';

export interface ProductVideo {
  title: string;
  descriptions: string;
  url: string;
  thumbnail: string;
  type: 'review' | 'unboxing' | 'demo' | 'tutorial';
}

// Interface cho Specification Item
export interface SpecificationItem {
  label: string;
  value: string;
}

// Updated specifications structure - simple array format to match API
export interface ProductSpecifications extends Array<SpecificationItem> {}

// Updated to match your format - simple key-value object  
export interface ProductFeatures {
  [key: string]: string | number | boolean;
}

// Updated to match your format
export interface ProductAvailability {
  inStock: boolean;
  quantity: number;
  status?: 'available' | 'pre-order' | 'out-of-stock' | 'discontinued';
  releaseDate?: string;
  estimatedDelivery?: string;
}

// Updated to match your format
export interface ProductWarranty {
  period: string;
  type: string;
  coverage?: string[];
  conditions?: string[];
  excludes?: string[];
  registrationRequired?: boolean;
}

export interface Product {
  id?: string;
  name: string;
  sku?: string;
  subtitle?: string;
  descriptions?: string;
  longDescription?: string;
  categoryId: string;

  specifications: ProductSpecifications;
  features: ProductFeatures;

  availability: ProductAvailability;
  warranty?: ProductWarranty;

  highlights: string[];
  targetAudience?: string[];
  useCases?: string[];

  tags: string[];
  relatedProductIds?: string[];
  accessories?: string[];

  popularity?: number;
  rating?: number;
  reviewCount?: number;

  seoTitle?: string;
  seoDescription?: string;

  images?: string;
  videos?: ProductVideo[];

  publishedAt?: string;

  // Backend entity fields
  shortDescription?: string;
  image?: string;
  retailPrice?: number;
  showOnHomepage?: boolean;
  isFeatured?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Legacy fields for backward compatibility
  price?: string | number;
  stock?: number;
  status?: string;
  sold?: number;
  model?: string;
  description?: string;
  publishStatus?: PublishStatus;
}

export interface ProductFormData extends Partial<Product> {}

export interface ProductCreateRequest {
  id?: string;
  name: string;
  sku?: string;
  subtitle?: string;
  descriptions?: string;
  longDescription?: string;
  categoryId: string;
  
  specifications: ProductSpecifications;
  features: ProductFeatures;
  
  availability: ProductAvailability;
  warranty?: ProductWarranty;
  
  highlights: string[];
  targetAudience?: string[];
  useCases?: string[];
  
  tags: string[];
  relatedProductIds?: string[];
  accessories?: string[];
  
  popularity?: number;
  rating?: number;
  reviewCount?: number;
  
  seoTitle?: string;
  seoDescription?: string;

  images?: string;
  videos?: ProductVideo[];

  publishedAt?: string;
  publishStatus?: PublishStatus;
  showOnHomepage?: boolean;
  isFeatured?: boolean;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {}

export interface ProductResponse extends Product {
  id: string;
  publishedAt?: string;
}

export interface ProductListResponse {
  products: ProductResponse[];
  total: number;
  page: number;
  limit: number;
}

// API Response từ server - match với backend entity
export interface ApiProductResponse {
  id: number;
  sku?: string;
  name: string;
  shortDescription?: string;
  image: string | null; // JSON string
  descriptions: string | null; // JSON string
  videos: string | null; // JSON string
  specifications: string | null; // JSON string
  price: number; // retail_price
  showOnHomepage: boolean;
  isFeatured: boolean;
  isDeleted: boolean;
  publishStatus?: PublishStatus;
  createdAt: string;
  updateAt: string;
  categoryId?: string;
  status?: string; // for compatibility
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Interfaces cho Description JSONB structure
export interface ProductFeature {
  title: string;
  subtitle: string;
  descriptions: string;
}

export interface ProductOverviewItem {
  type: "title" | "image" | "images" | "description" | "video";
  text?: string;         // Only for type "title" and "description"
  public_id?: string;    // Only for type "image" (single)
  imageUrl?: string;     // Only for type "image" (single)
  images?: Array<{ url: string; public_id: string }>;  // Only for type "images" (multiple)
  videoUrl?: string;     // Only for type "video"
  caption?: string;      // Caption/note for image, images, and video types
}

export interface ProductDescription {
  ProductFeatures: ProductFeature[];
  KeyFeatures: string[];
  ProductOverview: ProductOverviewItem[];
}

// Interface for API format with simple descriptions array
export interface ApiProductDescription {
  ProductFeatures: ProductFeature[];
  KeyFeatures: string[];
  descriptions: Array<{
    type: "title" | "image" | "description" | "title_feature";
    content?: string;
    url?: string;
  }>;
}

// Interface cho Videos JSONB structure
export interface ProductVideo {
  // Google Drive fields
  file_id?: string;

  // Legacy/compatibility fields
  public_id?: string;
  videoUrl: string;
  title: string;
  description: string;
}

// Interface cho Product Serial
export interface ProductSerial {
  id: number;
  serial: string;
  productId: number;
  productName: string;
  // Serial status and assignment tracking
  status?: 'available' | 'sold' | 'reserved' | 'damaged' | 'returned';
  orderId?: number;        // ID đơn hàng đã bán (nếu có)
  orderItemId?: number;    // ID của OrderItem chứa serial này
  dealerId?: number;       // ID đại lý đã mua
  soldDate?: string;       // Ngày bán
  soldPrice?: number;      // Giá bán thực tế
  notes?: string;          // Ghi chú về serial
}

// API Request/Response cho Serial
export interface SerialCreateRequest {
  serial: string;
  productId: number;
}

export interface SerialResponse extends ProductSerial {}

export interface SerialListResponse {
  success: boolean;
  message: string;
  data: SerialResponse[];
}

// API Request body cho việc tạo/cập nhật sản phẩm
export interface ApiProductRequest {
  sku?: string;
  name: string;
  shortDescription?: string;
  image: string;
  descriptions: Array<{
    type: "title" | "image" | "description" | "title_feature";
    content?: string;
    url?: string;
  }>;
  videos: ProductVideo[];
  specifications: ProductSpecifications;
  price: number;
  showOnHomepage: boolean;
  isFeatured: boolean;
}

export interface ProductValidationRules {
  name: { required: true; minLength: 3; maxLength: 200 };
  categoryId: { required: true };
  specifications: { required: true };
  features: { required: true };
  availability: { required: true };
  highlights: { required: true; minItems: 1 };
  tags: { required: true; minItems: 1 };
}

// Blog interfaces - Updated for new API structure
export interface BlogIntroductionItem {
  type: 'title' | 'description' | 'image' | 'images' | 'video';
  text?: string;         // For title and description
  public_id?: string;    // For image (single)
  imageUrl?: string;     // For image (single)
  images?: Array<{ url: string; public_id: string }>;  // For images (multiple)
  videoUrl?: string;     // For video
  caption?: string;      // Caption/note for image, images, and video types
}

// Image data structure with URL and public_id
export interface BlogImageData {
  // Google Drive fields
  file_id?: string;

  // Legacy/compatibility fields
  url: string;
  public_id: string;
}

// For form data (internal use)
export interface BlogFormData {
  image: BlogImageData | string; // Support both old string format and new object format
  title: string;
  description: string;
  introduction: BlogIntroductionItem[];
  showOnHomepage: boolean;
  categoryId: number;
}

// For API request (introduction as JSON string)
export interface BlogCreateRequest {
  image: string; // JSON string of {public_id, imageUrl}
  title: string;
  description: string;
  introduction: string; // JSON string of BlogIntroductionItem[]
  showOnHomepage: boolean;
  categoryId: number;
}

// API Response structure from GET /api/blog/blogs
export interface ApiBlogResponse {
  id: number;
  title: string;
  description: string;
  image: string; // JSON string of {public_id, imageUrl}
  category: string;
  introduction: string; // JSON string of BlogIntroductionItem[]
  showOnHomepage: boolean;
  createdAt: string;
  updateAt: string;
}

export interface BlogApiResponse {
  success: boolean;
  message: string;
  data: ApiBlogResponse[];
}

// Blog Category interface
export interface BlogCategory {
  id: number;
  name: string;
  description?: string;
}

// Blog Category Create Request
export interface BlogCategoryCreateRequest {
  name: string;
  description?: string;
}

// Internal blog type for the component - Updated for new API structure
export interface BlogResponse {
  id: number;
  image: BlogImageData | string; // Support both formats for backward compatibility
  title: string;
  description: string;
  introduction: BlogIntroductionItem[];
  showOnHomepage: boolean;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

// Order interfaces
export interface OrderItem {
  id: number;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  total: number;
  status?: 'PENDING' | 'COMPLETED' | 'PARTIAL'; // Trạng thái phân bổ serials
  // Serial assignment fields
  productId?: number;
  serialNumbers?: string[]; // Danh sách serial đã được gán cho item này
  assignedSerialIds?: number[]; // IDs của serials đã gán (để tracking)
}

export interface Order {
  id: number;
  dealerId?: number;
  dealerName?: string;
  createdAt: string | null; // Đổi từ createAt thành createdAt
  paymentStatus: 'PAID' | 'UNPAID';
  orderCode?: string;
  orderItems: OrderItem[];
  totalPrice: number;
  // Computed fields for display
  customer?: string;
  date?: string;
  items?: OrderItem[];
  subtotal?: string;
  vat?: string;
  total?: string;
  dealerEmail?: string;
  dealerPhone?: string;
}


// Serial Assignment interfaces
export interface SerialAssignmentRequest {
  orderId: number;
  orderItemId: number;
  productId: number;
  serialIds: number[]; // IDs of serials to assign
}

export interface SerialAssignmentResponse {
  success: boolean;
  message: string;
  data?: any; // API có thể trả về data khác nhau, cho flexible
}

export interface AvailableSerialItem {
  id: number;
  serial: string;
  productId: number;
  productName: string;
  status: 'available';
}

export interface SerialAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItem: OrderItem;
  orderId: number;
  dealerAccountId: number;
  onAssignmentComplete: (orderItemId: number, serialNumbers: string[]) => void;
}

// Extended Order interfaces with serial tracking
export interface OrderWithSerials extends Order {
  serialsAssigned?: boolean; // Có serial nào đã được gán chưa
  totalSerialsNeeded?: number; // Tổng số serial cần gán
  totalSerialsAssigned?: number; // Tổng số serial đã gán
}

// Bulk Discount interfaces
export interface BulkDiscount {
  id: number;
  minQuantity: number;
  maxQuantity: number | null;
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface BulkDiscountCreateRequest {
  minQuantity: number;
  maxQuantity?: number | null;
  discountPercent: number;
}

export interface BulkDiscountUpdateRequest {
  minQuantity?: number;
  maxQuantity?: number | null;
  discountPercent?: number;
}

export interface BulkDiscountResponse extends BulkDiscount {}

export interface BulkDiscountFormData {
  minQuantity: number;
  maxQuantity: number | null;
  discountPercent: number;
}

// Re-export API types for convenience
export * from './api';
