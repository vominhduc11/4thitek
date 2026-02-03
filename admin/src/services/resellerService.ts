import { apiRequest } from './api';
import type { BaseResponse } from '@/types/api';

export interface DealerRegistrationRequest {
  companyName: string;
  fullName?: string;
  taxCode?: string;
  address: string;
  phone: string;
  email: string;
  district: string;
  city: string;
}

export interface DealerRegistrationResponse {
  success: boolean;
  message: string;
  data: DealerProfile | null;
}

export interface DealerProfile {
  accountId?: number;
  companyName: string;
  fullName?: string;
  taxCode?: string;
  avatarUrl?: string;
  address: string;
  phone: string;
  email: string;
  district: string;
  city: string;
}

export const registerReseller = async (
  data: DealerRegistrationRequest
): Promise<DealerRegistrationResponse> => {
  const response = await apiRequest<BaseResponse<DealerProfile>>('/api/user/dealer', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return {
    success: response.success,
    message: response.message,
    data: response.data,
  };
};
