import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApi } from '../api';

export const adminKeys = {
  approvals: (kind?: string) => ['admin', 'approvals', kind ?? 'all'] as const,
  admins: ['admin', 'admins'] as const,
};

export const useApprovals = (kind?: 'tailor' | 'delivery' | 'customer' | 'order') =>
  useQuery({
    queryKey: adminKeys.approvals(kind),
    queryFn: async () => {
      const { data } = await adminApi.approvals(kind);
      return data as ApprovalItem[];
    },
  });

export const useAdminList = () =>
  useQuery({
    queryKey: adminKeys.admins,
    queryFn: async () => {
      const { data } = await adminApi.listAdmins();
      return data as AdminUser[];
    },
  });

export const useApproveTailor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) =>
      adminApi.approveTailor(id, approve, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'approvals'] }),
  });
};

export const useApproveDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) =>
      adminApi.approveDelivery(id, approve, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'approvals'] }),
  });
};

export const useApproveOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => adminApi.approveOrder(orderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'approvals'] }),
  });
};

export const useAssignOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, tailorId }: { orderId: string; tailorId: string }) =>
      adminApi.assignOrder(orderId, tailorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'approvals'] }),
  });
};

export const useCreateAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof adminApi.createAdmin>[0]) => adminApi.createAdmin(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.admins }),
  });
};

export type ApprovalItem = {
  kind: 'tailor' | 'delivery' | 'customer' | 'order';
  id: string;
  name: string | null;
  submitted_at: string;
  details: Record<string, unknown>;
};

export type AdminUser = {
  id: string;
  phone: string;
  full_name: string | null;
  email: string | null;
  role: string;
  permissions: string[];
};
