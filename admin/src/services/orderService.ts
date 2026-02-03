import { apiRequest } from "./api";
import { BaseResponse } from "@/types";
import { logger } from "@/utils/logger";

const ORDERS_BASE = "/api/order/orders";

export interface ApiOrderItem {
  id: number;
  productId?: number;
  idProduct?: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  status?: "PENDING" | "COMPLETED" | "PARTIAL";
}

export interface ApiOrderResponse {
  id: number;
  dealerId?: number;
  orderCode: string;
  dealerName: string;
  createdAt: string | null;
  paymentStatus: "PAID" | "UNPAID";
  orderItems: ApiOrderItem[];
  totalPrice: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type OrderListApiResponse = BaseResponse<ApiOrderResponse[]>;

export type OrderPageResponse = BaseResponse<PaginatedResponse<ApiOrderResponse>>;

export interface DealerInfo {
  companyName: string;
  phone: string;
  email: string;
  accountId?: number;
}

export interface DealerApiResponse {
  success: boolean;
  message: string;
  data: DealerInfo;
}

export type UpdatePaymentStatusResponse = BaseResponse<ApiOrderResponse>;

class OrderService {
  async getAllOrders(page: number = 0, size: number = 100): Promise<OrderPageResponse> {
    // Gateway exposes paginated list; default size bumped to reduce extra round-trips in admin
    return apiRequest<OrderPageResponse>(`${ORDERS_BASE}?page=${page}&size=${size}`);
  }

  async getOrders(page: number = 0, size: number = 100): Promise<OrderPageResponse> {
    return this.getAllOrders(page, size);
  }

  async getDeletedOrders(): Promise<OrderListApiResponse> {
    return apiRequest<OrderListApiResponse>(`${ORDERS_BASE}/deleted`);
  }

  async searchOrders(query: string): Promise<OrderListApiResponse> {
    return apiRequest<OrderListApiResponse>(`${ORDERS_BASE}/search?q=${encodeURIComponent(query)}`);
  }

  async getOrderById(orderId: number): Promise<BaseResponse<ApiOrderResponse>> {
    return apiRequest<BaseResponse<ApiOrderResponse>>(`${ORDERS_BASE}/${orderId}`);
  }

  async updatePaymentStatus(orderId: number, paymentStatus: "PAID" | "UNPAID"): Promise<UpdatePaymentStatusResponse> {
    return apiRequest<UpdatePaymentStatusResponse>(`${ORDERS_BASE}/${orderId}/payment-status?paymentStatus=${paymentStatus}`, {
      method: "PATCH",
    });
  }

  async softDeleteOrder(orderId: number): Promise<BaseResponse<ApiOrderResponse>> {
    return apiRequest<BaseResponse<ApiOrderResponse>>(`${ORDERS_BASE}/${orderId}`, { method: "DELETE" });
  }

  async hardDeleteOrder(orderId: number): Promise<BaseResponse<ApiOrderResponse>> {
    return apiRequest<BaseResponse<ApiOrderResponse>>(`${ORDERS_BASE}/${orderId}/hard`, { method: "DELETE" });
  }

  async bulkSoftDeleteOrders(orderIds: number[]): Promise<BaseResponse<null>> {
    return apiRequest<BaseResponse<null>>(`${ORDERS_BASE}/bulk`, {
      method: "DELETE",
      body: JSON.stringify(orderIds),
    });
  }

  async bulkHardDeleteOrders(orderIds: number[]): Promise<BaseResponse<null>> {
    return apiRequest<BaseResponse<null>>(`${ORDERS_BASE}/bulk/hard`, {
      method: "DELETE",
      body: JSON.stringify(orderIds),
    });
  }

  async restoreOrder(orderId: number): Promise<BaseResponse<ApiOrderResponse>> {
    return apiRequest<BaseResponse<ApiOrderResponse>>(`${ORDERS_BASE}/${orderId}/restore`, { method: "PATCH" });
  }

  async updateOrderItemStatus(orderItemId: number, status: "PENDING" | "COMPLETED"): Promise<void> {
    const statusParam = status.toUpperCase();
    const response = await apiRequest<BaseResponse<null>>(
      `/api/order/order-items/${orderItemId}/status?status=${encodeURIComponent(statusParam)}`,
      { method: "PATCH" }
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update order item status");
    }
    logger.info("Order item status updated", { orderItemId, status: statusParam });
  }

  async getDealerInfo(dealerId: number): Promise<DealerApiResponse> {
    // Align with gateway: dealer info exposed via user-service
    return apiRequest<DealerApiResponse>(`/api/user/dealer/${dealerId}`);
  }

  async getOrdersByDealerId(
    dealerId: number,
    status?: "PAID" | "UNPAID",
    includeDeleted: boolean = false
  ): Promise<OrderListApiResponse> {
    let endpoint = `/api/order/orders/dealer/${dealerId}?includeDeleted=${includeDeleted}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    return apiRequest<OrderListApiResponse>(endpoint);
  }
}

export const orderService = new OrderService();
