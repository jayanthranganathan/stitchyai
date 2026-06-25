import { useQuery } from '@tanstack/react-query';

import { customerApi } from '../api';

export const customerKeys = {
  categories: ['catalog', 'categories'] as const,
  designs: (slug: string) => ['catalog', 'designs', slug] as const,
  orders: ['orders', 'list'] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  progress: (id: string) => ['orders', 'progress', id] as const,
  snapshot: (id: string) => ['tracking', 'snapshot', id] as const,
};

export const useCategories = () =>
  useQuery({ queryKey: customerKeys.categories, queryFn: customerApi.categories });

export const useDesigns = (slug: string) =>
  useQuery({ queryKey: customerKeys.designs(slug), queryFn: () => customerApi.designs(slug) });

export const useMyOrders = () =>
  useQuery({ queryKey: customerKeys.orders, queryFn: customerApi.orders });

export const useOrderDetail = (orderId: string) =>
  useQuery({
    queryKey: customerKeys.detail(orderId),
    queryFn: () => customerApi.orderDetail(orderId),
  });

export const useOrderProgress = (orderId: string) =>
  useQuery({
    queryKey: customerKeys.progress(orderId),
    queryFn: () => customerApi.progress(orderId),
    refetchInterval: 30_000,
  });

export const useTrackingSnapshot = (orderId: string) =>
  useQuery({
    queryKey: customerKeys.snapshot(orderId),
    queryFn: () => customerApi.snapshot(orderId),
    refetchInterval: 10_000,
  });
