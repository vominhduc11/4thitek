import { apiRequest } from './api';
import { logger } from '@/utils/logger';

export interface AdminInfo {
  accountId: number;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  requireLoginEmailConfirmation?: boolean;
  role?: string;
  username?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminResponse {
  success: boolean;
  message: string;
  data: AdminInfo;
}

export interface AdminListResponse {
  success: boolean;
  message: string;
  data: AdminInfo[];
}

export interface CreateAdminRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
}

export interface UpdateAdminRequest {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    username: string;
    changedAt: string;
  };
}

export const adminService = {
  // Lấy thông tin admin
  getAdminInfo: async (adminId: number): Promise<AdminInfo> => {
    try {
      const response = await apiRequest<AdminResponse>(`/api/user/admin/${adminId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching admin info:', error);
      throw error;
    }
  },

  // Cập nhật thông tin admin
  updateAdminInfo: async (adminId: number, data: UpdateAdminRequest): Promise<AdminInfo> => {
    try {
      logger.debug('Updating admin info with data:', data);
      const response = await apiRequest<AdminResponse>(`/api/user/admin/${adminId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating admin info:', error);
      throw error;
    }
  },

  // Đổi mật khẩu admin
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    try {
      const response = await apiRequest<ChangePasswordResponse>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  },

  // ===== ADMIN MANAGEMENT APIs (SYSTEM + ADMIN role required) =====

  // Lấy danh sách tất cả admin (chỉ trả về admin có role ADMIN, không bao gồm super admin)
  getAllAdmins: async (): Promise<AdminListResponse> => {
    try {
      const response = await apiRequest<AdminListResponse>('/api/user/admin');
      return response;
    } catch (error) {
      logger.error('Error fetching all admins:', error);
      throw error;
    }
  },

  // Tạo admin mới
  createAdmin: async (data: CreateAdminRequest): Promise<AdminResponse> => {
    try {
      const response = await apiRequest<AdminResponse>('/api/user/admin', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      logger.error('Error creating admin:', error);
      throw error;
    }
  },

  // Xóa admin
  deleteAdmin: async (adminId: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(`/api/user/admin/${adminId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      logger.error('Error deleting admin:', error);
      throw error;
    }
  },

  // Xóa nhiều admin (Batch Delete)
  batchDeleteAdmins: async (adminIds: number[]): Promise<{
    success: boolean;
    message: string;
    data: {
      totalRequested: number;
      successCount: number;
      failCount: number;
      successfulDeletes: number[];
      failedDeletes: Array<{ adminId: number; error: string }>;
    };
  }> => {
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        data: {
          totalRequested: number;
          successCount: number;
          failCount: number;
          successfulDeletes: number[];
          failedDeletes: Array<{ adminId: number; error: string }>;
        };
      }>('/api/user/admin/batch', {
        method: 'DELETE',
        body: JSON.stringify(adminIds)
      });
      return response;
    } catch (error) {
      logger.error('Error batch deleting admins:', error);
      throw error;
    }
  },

  // Cập nhật cài đặt xác thực email khi đăng nhập
  updateLoginEmailConfirmation: async (accountId: number, requireLoginEmailConfirmation: boolean): Promise<AdminInfo> => {
    try {
      const response = await apiRequest<AdminResponse>(`/api/user/admin/${accountId}/login-email-confirmation`, {
        method: 'PATCH',
        body: JSON.stringify({ requireLoginEmailConfirmation })
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating login email confirmation setting:', error);
      throw error;
    }
  }
};
