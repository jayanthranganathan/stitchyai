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

// ── Subscriptions & credits ────────────────────────────────────────────────

export type Plan = {
  tier: string;
  label: string;
  ai_enabled: boolean;
  ai_monthly_quota: number | null;
  save_designs: boolean;
  custom_proposals: boolean;
  priority_matching: boolean;
  credit_earn_multiplier: number;
  price_inr: number;
  price_credits: number;
  support: string;
};

export type SubscriptionMe = {
  tier: string;
  label: string;
  plan_expires_at: string | null;
  ai_enabled: boolean;
  ai_monthly_quota: number | null;
  ai_used_this_month: number;
  credit_balance: number;
};

export type CreditTxn = {
  id: string;
  amount: number;
  kind: string;
  balance_after: number;
  reference_id: string | null;
  note: string | null;
  created_at: string;
};

export const billingApi = {
  async plans(): Promise<Plan[]> {
    const { data } = await apiClient.get<Plan[]>(endpoints.subscriptions.plans);
    return data;
  },
  async mySubscription(): Promise<SubscriptionMe> {
    const { data } = await apiClient.get<SubscriptionMe>(endpoints.subscriptions.me);
    return data;
  },
  async changePlan(targetTier: string, payWith: 'free' | 'credits'): Promise<SubscriptionMe> {
    const { data } = await apiClient.post(endpoints.subscriptions.change, {
      target_tier: targetTier,
      pay_with: payWith,
    });
    return data;
  },
  async creditBalance(): Promise<{ balance: number }> {
    const { data } = await apiClient.get<{ balance: number }>(endpoints.credits.balance);
    return data;
  },
  async creditHistory(): Promise<CreditTxn[]> {
    const { data } = await apiClient.get<CreditTxn[]>(endpoints.credits.history);
    return data;
  },
};

export type OrderItemDetail = {
  id: string;
  category_id: string;
  category_name: string | null;
  design_id: string | null;
  design_name: string | null;
  proposal_id: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type OrderDetail = {
  id: string;
  status: string;
  placed_at: string | null;
  expected_delivery_date: string | null;
  total_amount: number;
  credits_redeemed: number;
  currency: string;
  progress_percent: number;
  notes: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  items: OrderItemDetail[];
};

export type OrderTimelineEntry = {
  status: string;
  progress_percent: number;
  note: string | null;
  actor_role: string | null;
  at: string;
};

export type OrderProgress = {
  status: string;
  progress_percent: number;
  eta: string | null;
  current_actor: string | null;
  history: OrderTimelineEntry[];
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
  async orderDetail(orderId: string): Promise<OrderDetail> {
    const { data } = await apiClient.get<OrderDetail>(endpoints.orders.detail(orderId));
    return data;
  },
  async progress(orderId: string): Promise<OrderProgress> {
    const { data } = await apiClient.get<OrderProgress>(endpoints.orders.progress(orderId));
    return data;
  },
  async snapshot(orderId: string) {
    const { data } = await apiClient.get(endpoints.tracking.snapshot(orderId));
    return data;
  },
};
