import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export const adminApi = {
  approvals: (kind?: 'tailor' | 'delivery' | 'customer' | 'order') =>
    apiClient.get(endpoints.admin.approvals, { params: kind ? { kind } : undefined }),
  approveOrder: (id: string) =>
    apiClient.post(endpoints.admin.approveOrder(id)),
  approveTailor: (id: string, approve: boolean, reason?: string) =>
    apiClient.post(endpoints.admin.approveTailor(id), { approve, reason }),
  approveDelivery: (id: string, approve: boolean, reason?: string) =>
    apiClient.post(endpoints.admin.approveDelivery(id), { approve, reason }),
  assignOrder: (orderId: string, tailorId: string) =>
    apiClient.post(endpoints.admin.assignOrder(orderId), { tailor_id: tailorId }),
  listAdmins: () => apiClient.get(endpoints.admin.admins),
  createAdmin: (body: {
    phone: string;
    email?: string;
    full_name: string;
    role?: 'super_admin' | 'ops' | 'support';
    permissions?: string[];
  }) => apiClient.post(endpoints.admin.admins, body),
};
