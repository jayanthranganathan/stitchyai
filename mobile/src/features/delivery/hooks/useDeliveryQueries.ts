import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deliveryApi } from '../api';

export const deliveryKeys = {
  me: ['delivery', 'me'] as const,
  assignments: ['delivery', 'assignments'] as const,
};

export const useDeliveryProfile = () =>
  useQuery({
    queryKey: deliveryKeys.me,
    queryFn: async () => {
      const { data } = await deliveryApi.me();
      return data as DeliveryProfile;
    },
  });

export const useAssignments = () =>
  useQuery({
    queryKey: deliveryKeys.assignments,
    queryFn: async () => {
      const { data } = await deliveryApi.assignments();
      return data as DeliveryAssignment[];
    },
    refetchInterval: 15_000,
  });

export const useTransition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      state,
      note,
    }: {
      id: string;
      state: 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
      note?: string;
    }) => deliveryApi.transition(id, state, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.assignments }),
  });
};

export const useSetOnline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isOnline: boolean) => deliveryApi.setOnline(isOnline),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.me }),
  });
};

export type DeliveryProfile = {
  id: string;
  vehicle_type: string;
  approval_state: string;
  is_online: boolean;
  city: string | null;
};

export type DeliveryAssignment = {
  id: string;
  kind: string;
  state: string;
  pickup_location: { address: string; lat?: number; lng?: number; contact_name?: string; contact_phone?: string };
  drop_location: { address?: string; street?: string; city?: string; lat?: number; lng?: number };
  started_at: string | null;
  completed_at: string | null;
};
