import { apiRequest } from './api';
import { logger } from '@/utils/logger';

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  message?: string;
}

export const notificationService = {
  // Lấy tất cả thông báo
  getAllNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiRequest<NotificationResponse>('/api/notification/notifies');
      return response.data || [];
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      // Graceful degradation: return empty list to avoid crash if backend 500
      return [];
    }
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: async (id: number): Promise<boolean> => {
    try {
      logger.debug('Making API call to mark as read:', `/api/notification/${id}/read`);
      const response = await apiRequest(`/api/notification/${id}/read`, {
        method: 'PATCH'
      });
      logger.debug('API response:', response);
      return true;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      return false;
    }
  },

  // Xóa thông báo (backend chưa expose endpoint) - chỉ thao tác local/state
  deleteNotification: async (id: number): Promise<boolean> => {
    try {
      const response = await apiRequest(`/api/notification/${id}`, {
        method: 'DELETE'
      });
      return !!response?.success;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      return false;
    }
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async (): Promise<boolean> => {
    try {
      const response = await apiRequest(`/api/notification/mark-all-read`, {
        method: 'PUT'
      });
      return !!response?.success;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      return false;
    }
  }
};
