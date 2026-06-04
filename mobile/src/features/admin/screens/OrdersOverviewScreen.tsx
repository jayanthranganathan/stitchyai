import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { BottomNavBar } from '@/components/BottomNavBar';
import { ProgressBar } from '@/components/ProgressBar';
import { spacing, useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { AdminScreenProps } from '@/navigation/types';

const TABS = [
  { icon: '🏠', label: 'Home', screen: 'Dashboard' },
  { icon: '📦', label: 'Orders', screen: 'OrdersOverview' },
  { icon: '✅', label: 'Approvals', screen: 'Approvals' },
];

const STATUS_OPTIONS = ['all', 'placed', 'assigned', 'in_progress', 'ready', 'delivered', 'cancelled'] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const STATUS_COLOR: Record<string, string> = {
  placed: '#F59E0B', assigned: '#7C3AED', in_progress: '#EC4899',
  ready: '#4ADE80', delivered: '#4ADE80', cancelled: '#EF4444',
};

type OrderRow = {
  id: string; status: string; progress_percent: number; total_amount: number;
  currency: string; placed_at: string | null; expected_delivery_date: string | null;
  customer_name?: string | null; tailor_name?: string | null;
};

export function OrdersOverviewScreen(_props: AdminScreenProps<'OrdersOverview'>) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { colors } = useTheme();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'orders', statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await apiClient.get<OrderRow[]>(endpoints.admin.orders, { params });
      return data;
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 }}>Orders overview</Text>
        </View>

        {/* Filter chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_OPTIONS as unknown as StatusFilter[]}
          keyExtractor={(s) => s}
          style={{ maxHeight: 40, marginBottom: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => setStatusFilter(item)}>
              {statusFilter === item ? (
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' as const, textTransform: 'capitalize' as const }}>
                    {item === 'all' ? 'All' : item.replace('_', ' ')}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={{ borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' as const }}>
                    {item === 'all' ? 'All' : item.replace('_', ' ')}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        />

        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: spacing.xl, gap: 10 }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: spacing.lg, alignItems: 'center' as const }}>
                <Text style={{ fontSize: 14, color: colors.textMuted }}>No orders found.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => setExpanded(expanded === item.id ? null : item.id)}>
              <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' as const, flexDirection: 'row' as const }}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ width: 3 }}
                />
                <View style={{ flex: 1, padding: 14 }}>
                  <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.text }}>#{item.id.slice(0, 8)}</Text>
                      {item.customer_name && (
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{item.customer_name}</Text>
                      )}
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: (STATUS_COLOR[item.status] ?? '#999') + '22' }}>
                      <Text style={{ fontSize: 10, color: STATUS_COLOR[item.status] ?? colors.textMuted, fontWeight: '700' as const, textTransform: 'capitalize' as const }}>
                        {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <ProgressBar percent={item.progress_percent} />
                  </View>
                  <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: 6 }}>
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' as const }}>{formatters.inr(item.total_amount)}</Text>
                    {item.placed_at && <Text style={{ fontSize: 10, color: colors.textMuted }}>{formatters.dateLong(item.placed_at)}</Text>}
                  </View>
                  {expanded === item.id && (
                    <View style={{ borderTopWidth: 1, borderColor: colors.border, marginTop: 10, paddingTop: 10 }}>
                      {item.tailor_name && <Text style={{ fontSize: 11, color: colors.textMuted }}>Tailor: {item.tailor_name}</Text>}
                      {item.expected_delivery_date && (
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                          ETA: {formatters.dateLong(item.expected_delivery_date)} ({formatters.relativeDays(item.expected_delivery_date)})
                        </Text>
                      )}
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Progress: {item.progress_percent}%</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      </SafeAreaView>
      <BottomNavBar tabs={TABS} />
    </View>
  );
}
