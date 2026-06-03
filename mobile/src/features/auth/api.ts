import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export const authApi = {
  requestOtp: (phone: string) => apiClient.post(endpoints.auth.requestOtp, { phone }),
  verifyOtp: (phone: string, code: string) =>
    apiClient.post(endpoints.auth.verifyOtp, { phone, code }),
};
