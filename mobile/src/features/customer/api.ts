import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

export type Category = {
  id: string;
  slug: string;
  name: string;
  icon_url: string | null;
  sort_order: number;
};

export type Design = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  images: string[];
  base_price: number;
  tags: string[];
};

export type OrderSummary = {
  id: string;
  status: string;
  placed_at: string | null;
  expected_delivery_date: string | null;
  total_amount: number;
  currency: string;
  progress_percent: number;
  // Optional enrichment fields returned by some endpoints
  design_name?: string | null;
  category_name?: string | null;
};

export const customerApi = {
  async categories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>(endpoints.catalog.categories);
    return data;
  },
  async designs(slug: string): Promise<Design[]> {
    const { data } = await apiClient.get<Design[]>(endpoints.catalog.designs(slug));
    return data;
  },
  async orders(): Promise<OrderSummary[]> {
    const { data } = await apiClient.get<OrderSummary[]>(endpoints.orders.list);
    return data;
  },
  async progress(orderId: string) {
    const { data } = await apiClient.get(endpoints.orders.progress(orderId));
    return data;
  },
  async snapshot(orderId: string) {
    const { data } = await apiClient.get(endpoints.tracking.snapshot(orderId));
    return data;
  },
};
