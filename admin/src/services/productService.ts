import { apiRequest } from "./api";
import {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductResponse,
} from "@/types";
import { BaseResponse } from "@/types/api";

const PRODUCT_BASE = "/api/product";

class ProductService {
  async createProduct(productData: ProductCreateRequest): Promise<ProductResponse> {
    const response = await apiRequest<BaseResponse<ProductResponse>>(`${PRODUCT_BASE}/products`, {
      method: "POST",
      body: JSON.stringify(productData),
    });
    return response.data as ProductResponse;
  }

  async updateProduct(id: string, productData: ProductUpdateRequest): Promise<ProductResponse> {
    const response = await apiRequest<BaseResponse<ProductResponse>>(`${PRODUCT_BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(productData),
    });
    return response.data as ProductResponse;
  }

  async updatePublishStatus(id: string, publishStatus: "PUBLISHED" | "UNPUBLISHED", showOnHomepage?: boolean): Promise<ProductResponse> {
    const body: Partial<ProductUpdateRequest> = { publishStatus };
    if (typeof showOnHomepage === "boolean") {
      body.showOnHomepage = showOnHomepage;
    }
    const response = await apiRequest<BaseResponse<ProductResponse>>(`${PRODUCT_BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return response.data as ProductResponse;
  }

  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<ProductResponse[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const queryString = searchParams.toString();
    const endpoint = queryString ? `${PRODUCT_BASE}/products?${queryString}` : `${PRODUCT_BASE}/products`;
    const response = await apiRequest<BaseResponse<ProductResponse[]>>(endpoint);
    return (response.data as ProductResponse[]) ?? [];
  }

  async getDeletedProducts(): Promise<ProductResponse[]> {
    const response = await apiRequest<BaseResponse<ProductResponse[]>>(`${PRODUCT_BASE}/products/deleted`);
    return (response.data as ProductResponse[]) ?? [];
  }

  async getProductById(id: string): Promise<ProductResponse> {
    const response = await apiRequest<BaseResponse<ProductResponse>>(`${PRODUCT_BASE}/${id}`);
    return response.data as ProductResponse;
  }

  async deleteProduct(id: string): Promise<void> {
    await apiRequest<BaseResponse<null>>(`${PRODUCT_BASE}/${id}`, { method: "DELETE" });
  }

  async restoreProduct(id: string): Promise<BaseResponse<ProductResponse>> {
    return apiRequest<BaseResponse<ProductResponse>>(`${PRODUCT_BASE}/${id}/restore`, { method: "PATCH" });
  }

  async hardDeleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`${PRODUCT_BASE}/${id}/hard`, { method: "DELETE" });
  }

  async syncAllStock(): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`${PRODUCT_BASE}/product-serials/sync-all-stock`, {
      method: "POST",
    });
  }

  async getProductInventory(
    productId: string
  ): Promise<{ success: boolean; data: { availableCount: number; soldCount: number; damagedCount: number; totalCount: number } }> {
    return apiRequest(`/api/product/product-serials/${productId}/inventory`);
  }

  async getProductInfo(
    productId: number,
    fields: string = "name,image",
    _isRetry: boolean = false
  ): Promise<{
    success: boolean;
    message: string;
    data: { name: string; image: string };
  }> {
    try {
      return await apiRequest(`/api/product/${productId}?fields=${encodeURIComponent(fields)}`);
    } catch (error) {
      if (!_isRetry) {
        return this.getProductInfo(productId, fields, true);
      }
      throw error;
    }
  }

  mapFormDataToApiRequest(productData: Partial<Product>): ProductCreateRequest {
    // Basic mapper: forward known fields and normalize numeric values
    const price = Number(productData.price ?? productData.retailPrice ?? 0);
    const stock = Number(productData.stock ?? productData.availability?.quantity ?? 0);

    return {
      ...(productData as ProductCreateRequest),
      retailPrice: price,
      price,
      stock,
    };
  }

  validateProductData(productData: Partial<Product>): string[] {
    const errors: string[] = [];
    if (!productData.name) errors.push("Tên sản phẩm bắt buộc");
    if (productData.price !== undefined && Number(productData.price) < 0) errors.push("Giá phải lớn hơn hoặc bằng 0");
    if (productData.stock !== undefined && Number(productData.stock) < 0) errors.push("Tồn kho phải lớn hơn hoặc bằng 0");
    return errors;
  }
}

export const productService = new ProductService();
