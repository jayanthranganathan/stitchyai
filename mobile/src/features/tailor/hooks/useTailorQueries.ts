import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tailorApi } from '../api';

export const tailorKeys = {
  me: ['tailor', 'me'] as const,
  myOrders: ['tailor', 'myOrders'] as const,
  availableOrders: ['tailor', 'availableOrders'] as const,
};

export const useTailorProfile = () =>
  useQuery({
    queryKey: tailorKeys.me,
    queryFn: async () => {
      const { data } = await tailorApi.me();
      return data;
    },
  });

export const useAvailableOrders = () =>
  useQuery({
    queryKey: tailorKeys.availableOrders,
    queryFn: async () => {
      const { data } = await tailorApi.availableOrders();
      return data as TailorOrder[];
    },
  });

export const useMyTailorOrders = () =>
  useQuery({
    queryKey: tailorKeys.myOrders,
    queryFn: async () => {
      const { data } = await tailorApi.myOrders();
      return data as TailorOrder[];
    },
  });

export const useSendInterest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      note,
      expectedDeliveryDate,
    }: { orderId: string; note?: string; expectedDeliveryDate?: string }) =>
      tailorApi.sendInterest(orderId, note, expectedDeliveryDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: tailorKeys.availableOrders }),
  });
};

export const useUpdateProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, progress, note }: { orderId: string; progress: number; note?: string }) =>
      tailorApi.updateProgress(orderId, progress, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: tailorKeys.myOrders }),
  });
};

export type TailorOrder = {
  id: string;
  status: string;
  progress_percent: number;
  expected_delivery_date: string | null;
  placed_at: string | null;
  total_amount: number;
  currency: string;
  category_name?: string;
  design_name?: string;
  customer_name?: string;
  measurements?: Record<string, number | string>;
  delivery_address?: Record<string, string | number>;
  notes?: string | null;
};
