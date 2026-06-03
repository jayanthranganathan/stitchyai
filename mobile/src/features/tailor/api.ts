import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export const tailorApi = {
  me: () => apiClient.get(endpoints.tailors.me),
  register: (body: { expertise_slugs: string[]; bio?: string; city?: string; documents?: object }) =>
    apiClient.post(endpoints.tailors.register, body),
  myOrders: () => apiClient.get(endpoints.tailors.myOrders),
  availableOrders: () => apiClient.get(endpoints.tailors.availableOrders),
  sendInterest: (orderId: string, note?: string, expectedDeliveryDate?: string) =>
    apiClient.post(endpoints.tailors.interest, {
      order_id: orderId,
      note,
      expected_delivery_date: expectedDeliveryDate ?? null,
    }),
  updateProgress: (orderId: string, progress: number, note?: string) =>
    apiClient.patch(endpoints.tailors.progress(orderId), { progress_percent: progress, note }),
};
