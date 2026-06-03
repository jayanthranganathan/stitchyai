import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export const deliveryApi = {
  me: () => apiClient.get(endpoints.delivery.me),
  register: (body: { vehicle_type: string; license_url?: string; documents?: object; city?: string }) =>
    apiClient.post(endpoints.delivery.register, body),
  setOnline: (isOnline: boolean) =>
    apiClient.patch(endpoints.delivery.status, { is_online: isOnline }),
  assignments: () => apiClient.get(endpoints.delivery.assignments),
  transition: (id: string, state: 'accepted' | 'picked_up' | 'delivered' | 'cancelled', note?: string) =>
    apiClient.patch(endpoints.delivery.transition(id), { state, note }),
  sendPings: (
    pings: { assignment_id: string; lat: number; lng: number; accuracy_m?: number; recorded_at: string }[],
  ) => apiClient.post(endpoints.tracking.pings, { pings }),
};
