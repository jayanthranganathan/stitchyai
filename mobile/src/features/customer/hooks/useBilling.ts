import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { billingApi } from '../api';

export const billingKeys = {
  plans: ['billing', 'plans'] as const,
  me: ['billing', 'subscription'] as const,
  creditBalance: ['billing', 'creditBalance'] as const,
  creditHistory: ['billing', 'creditHistory'] as const,
};

export const usePlans = () =>
  useQuery({ queryKey: billingKeys.plans, queryFn: billingApi.plans });

export const useMySubscription = () =>
  useQuery({ queryKey: billingKeys.me, queryFn: billingApi.mySubscription });

export const useCreditBalance = () =>
  useQuery({ queryKey: billingKeys.creditBalance, queryFn: billingApi.creditBalance });

export const useCreditHistory = () =>
  useQuery({ queryKey: billingKeys.creditHistory, queryFn: billingApi.creditHistory });

export const useChangePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetTier, payWith }: { targetTier: string; payWith: 'free' | 'credits' }) =>
      billingApi.changePlan(targetTier, payWith),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.me });
      qc.invalidateQueries({ queryKey: billingKeys.creditBalance });
      qc.invalidateQueries({ queryKey: billingKeys.creditHistory });
    },
  });
};
