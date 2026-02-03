import { apiRequest } from "./api";
import { logger } from '@/utils/logger';
import {
  SerialCreateRequest,
  ProductSerial,
  ApiResponse,
  SerialAssignmentRequest,
  SerialAssignmentResponse,
  AvailableSerialItem
} from "@/types";

export const serialService = {
  // Tạo serial mới cho sản phẩm
  async createSerial(serialData: SerialCreateRequest): Promise<ProductSerial> {
    const response = await apiRequest<ApiResponse<ProductSerial>>('/api/product/product-serials/serial', {
      method: 'POST',
      body: JSON.stringify(serialData),
    });
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create serial');
  },

  // Lấy danh sách serial theo product ID
  async getSerialsByProduct(productId: string | number): Promise<ProductSerial[]> {
    const response = await apiRequest<ApiResponse<ProductSerial[]>>(`/api/product/product-serials/${productId}/serials`);
    
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch serials');
  },

  // Xóa serial
  async deleteSerial(serialId: number): Promise<void> {
    const response = await apiRequest<ApiResponse<any>>(`/api/product/product-serials/serial/${serialId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete serial');
    }
  },

  // Xóa nhiều serials cùng lúc (Requires ADMIN role)
  async deleteBulkSerials(serialIds: number[]): Promise<void> {
    const response = await apiRequest<ApiResponse<any>>('/api/product/product-serials/serials', {
      method: 'DELETE',
      body: JSON.stringify(serialIds),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete serials');
    }
  },


  // Lấy tất cả serials (cho admin)
  async getAllSerials(): Promise<ProductSerial[]> {
    const response = await apiRequest<ApiResponse<ProductSerial[]>>('/api/product/product-serials/serials');

    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch all serials');
  },

  // Kiểm tra serial có tồn tại không
  async checkSerialExists(serial: string): Promise<boolean> {
    try {
      const response = await apiRequest<ApiResponse<{exists: boolean}>>(`/api/product/product-serials/serials/check/${serial}`);
      return response.success && response.data.exists;
    } catch (error) {
      return false;
    }
  },

  // Tạo nhiều serials cùng lúc
  async createBulkSerials(productId: number, serials: string[]): Promise<ProductSerial[]> {
    const serialPromises = serials.map(serial => 
      this.createSerial({ serial, productId })
    );
    
    try {
      return await Promise.all(serialPromises);
    } catch (error) {
      throw new Error('Some serials failed to create. Please check for duplicates.');
    }
  },

  // Generate serial numbers tự động
  generateSerialNumbers(count: number, prefix: string = 'SN'): string[] {
    const serials: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < count; i++) {
      let serial = prefix;
      for (let j = 0; j < 6; j++) {
        serial += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Ensure uniqueness in batch
      if (serials.includes(serial)) {
        i--; // Retry this iteration
        continue;
      }

      serials.push(serial);
    }

    return serials;
  },

  // SERIAL ASSIGNMENT APIs

  // Lấy danh sách serial available cho product theo status
  async getAvailableSerialsByProduct(productId: number, status: string = 'IN_STOCK'): Promise<AvailableSerialItem[]> {
    logger.debug('🔍 Fetching serials for product:', productId, 'with status:', status);

    // Sử dụng API mới với status
    const response = await apiRequest<ApiResponse<ProductSerial[]>>(`/api/product/product-serials/${productId}/serials/status/${status}`);

    if (response.success) {
      // Transform data để match AvailableSerialItem interface
      const availableSerials = response.data.map(serial => ({
        id: serial.id,
        serial: serial.serial,
        productId: serial.productId,
        productName: serial.productName,
        status: 'available' as const
      }));

      logger.debug('✅ Available serials:', availableSerials);
      return availableSerials;
    }
    throw new Error(response.message || 'Failed to fetch available serials');
  },

  // Gán serials cho order item
  async assignSerialsToOrder(request: SerialAssignmentRequest): Promise<SerialAssignmentResponse> {
    logger.debug('🚀 Calling assignment API:', {
      url: `/api/product/product-serials/serials/assign-to-order-item/${request.orderItemId}`,
      body: request.serialIds
    });

    try {
      const response = await apiRequest<SerialAssignmentResponse>(
        `/api/product/product-serials/serials/assign-to-order-item/${request.orderItemId}`,
        {
          method: 'POST',
          body: JSON.stringify(request.serialIds), // Body là array của serialIds
        }
      );

      logger.debug('📡 API Response:', response);
      return response; // Return response trực tiếp, không check success ở đây

    } catch (error) {
      logger.error('❌ API call failed:', error);
      throw error;
    }
  },

  // Lấy serials đã gán cho order item cụ thể
  async getSerialsByOrderItem(orderItemId: number): Promise<ProductSerial[]> {
    const response = await apiRequest<ApiResponse<ProductSerial[]>>(`/api/product/product-serials/order-items/${orderItemId}/serials`);

    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch serials for order item');
  },


  // Hủy gán serial (trả về trạng thái available)
  async unassignSerial(serialId: number): Promise<void> {
    const response = await apiRequest<ApiResponse<any>>(`/api/product/product-serials/serial/${serialId}/unassign`, {
      method: 'PATCH',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to unassign serial');
    }
  },

  // Hủy gán nhiều serials từ order item
  async unassignSerialsFromOrderItem(orderItemId: number, serialIds: number[]): Promise<void> {
    logger.debug('🔄 Unassigning serials from order item:', {
      orderItemId,
      serialIds,
      count: serialIds.length
    });

    const response = await apiRequest<ApiResponse<any>>(`/api/product/product-serials/serials/unassign-from-order-item/${orderItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(serialIds),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to unassign serials from order item');
    }

    logger.debug('✅ Successfully unassigned serials from order item');
  },

  // Cập nhật trạng thái serial
  async updateSerialStatus(serialId: number, status: 'available' | 'sold' | 'reserved' | 'damaged' | 'returned'): Promise<void> {
    const response = await apiRequest<ApiResponse<any>>(`/api/product/product-serials/serial/${serialId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update serial status');
    }
  },

  // Lấy lịch sử gán serial cho một serial cụ thể
  async getSerialHistory(serialId: number): Promise<any[]> {
    const response = await apiRequest<ApiResponse<any[]>>(`/api/product/product-serials/serial/${serialId}/history`);

    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch serial history');
  },

  // Phân bổ serial cho đại lý (chuyển từ ASSIGNED_TO_ORDER_ITEM sang ALLOCATED_TO_DEALER)
  async allocateSerialToDealer(serialIds: number[], dealerId: number): Promise<ApiResponse<any>> {
    logger.debug('🏢 Allocating serials to dealer:', {
      serialIds,
      dealerId
    });

    const response = await apiRequest<ApiResponse<any>>(`/api/product/product-serials/serials/allocate-to-dealer/${dealerId}`, {
      method: 'POST',
      body: JSON.stringify(serialIds), // Chỉ gửi array serialIds
    });

    // Sau khi allocate thành công, backend sẽ tự động cập nhật OrderItem status
    // Không cần manual update từ frontend nữa vì logic đã được chuyển sang backend

    return response;
  },

  // Lấy danh sách serial đã phân bổ cho đại lý của một order item
  async getAllocatedSerialsByOrderItem(orderItemId: number): Promise<ProductSerial[]> {
    logger.debug('🔍 Fetching allocated serials for order item:', orderItemId);

    const response = await apiRequest<ApiResponse<ProductSerial[]>>(`/api/product/product-serials/order-items/${orderItemId}/allocated-serials`);

    if (response.success) {
      logger.debug('✅ Allocated serials:', response.data);
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch allocated serials');
  },

};