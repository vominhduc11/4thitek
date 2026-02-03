import { apiRequest } from './api';
import type {
  BulkDiscount,
  BulkDiscountCreateRequest,
  BulkDiscountUpdateRequest,
  ApiResponse
} from '../types';

export const bulkDiscountService = {
  // Get all bulk discounts
  getAll: async (): Promise<BulkDiscount[]> => {
    const response = await apiRequest<ApiResponse<BulkDiscount[]>>(
      '/api/product/bulk-discounts',
      { method: 'GET' }
    );
    return response.data;
  },

  // Get bulk discount by ID
  getById: async (id: number): Promise<BulkDiscount> => {
    const response = await apiRequest<ApiResponse<BulkDiscount>>(
      `/api/product/bulk-discounts/${id}`,
      { method: 'GET' }
    );
    return response.data;
  },

  // Create bulk discount
  create: async (data: BulkDiscountCreateRequest): Promise<BulkDiscount> => {
    const response = await apiRequest<ApiResponse<BulkDiscount>>(
      '/api/product/bulk-discounts',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  // Update bulk discount
  update: async (id: number, data: BulkDiscountUpdateRequest): Promise<BulkDiscount> => {
    const response = await apiRequest<ApiResponse<BulkDiscount>>(
      `/api/product/bulk-discounts/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  // Delete bulk discount
  delete: async (id: number): Promise<void> => {
    await apiRequest<ApiResponse<null>>(
      `/api/product/bulk-discounts/${id}`,
      { method: 'DELETE' }
    );
  },
};
