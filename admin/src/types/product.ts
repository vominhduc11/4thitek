export interface ProductSpecifications {
  driver: string;
  frequencyResponse: string;
  impedance: string;
  sensitivity: string;
  maxPower: string;
  cable: string;
  weight: string;
  dimensions: string;
  connector: string;
  compatibility: string[];
}

export interface ProductImage {
  url: string;
  alt: string;
  type: 'main' | 'angle' | 'detail' | 'gallery';
  order: number;
}

export interface ProductFeature {
  title: string;
  subtitle: string;
  descriptions: string;
}

export interface ProductWarranty {
  period: string;
  coverage: string[];
  conditions: string[];
  excludes: string[];
  registrationRequired: boolean;
}

export type PublishStatus = 'PUBLISHED' | 'UNPUBLISHED';

export interface CreateProductRequest {
  name: string;
  subtitle: string;
  descriptions: string;
  longDescription: string;
  categoryId: string;
  specifications: ProductSpecifications;
  images: ProductImage[];
  features: ProductFeature[];
  warranty: ProductWarranty;
  highlights: string[];
  targetAudience: string[];
  useCases: string[];
  tags: string[];
  popularity: number;
  rating: number;
  reviewCount: number;
  seoTitle: string;
  seoDescription: string;
  status: 'available' | 'discontinued' | 'coming_soon';
  publishStatus?: PublishStatus;
}

export interface Product extends CreateProductRequest {
  id: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductResponse {
  success: boolean;
  data: Product;
  message: string;
}
