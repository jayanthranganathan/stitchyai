import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/BottomNavBar';
import { ProgressBar } from '@/components/ProgressBar';
import { useMyTailorOrders } from '@/features/tailor/hooks/useTailorQueries';
import { spacing, useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { TailorScreenProps } from '@/navigation/types';

const TABS = [
  { icon: '🏠', label: 'Dashboard', screen: 'Dashboard' },
  { icon: '📦', label: 'My Orders', screen: 'MyOrders' },
  { icon: '👤', label: 'Profile', screen: 'Profile' },
];

const FILTERS = ['all', 'in_progress', 'completed'] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_LABELS: Record<string, string> = { all: 'All', in_progress: 'In progress', completed: 'Completed' };

const STATUS_COLOR: Record<string, string> = {
  assigned: '#F59E0B', in_progress: '#EC4899', completed: '#4ADE80',
  delivered: '#4ADE80', cancelled: '#EF4444',
};

export function MyOrdersScreen({ navigation }: TailorScreenProps<'MyOrders'>) {
  const { data: orders = [], isLoading, refetch } = useMyTailorOrders();
  const [filter, setFilter] = useState<Filter>('all');
  const { colors } = useTheme();

  const filtered = orders.filter((o) => {
    if (filter === 'in_progress') return ['assigned', 'in_progress'].includes(o.status);
    if (filter === 'completed') return ['completed', 'delivered'].includes(o.status);
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 }}>My orders</Text>
        </View>

        {/* Filter chips */}
        <View style={{ flexDirection: 'row' as const, gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)}>
              {filter === f ? (
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' as const }}>{FILTER_LABELS[f]}</Text>
                </LinearGradient>
              ) : (
                <View style={{ borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{FILTER_LABELS[f]}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: spacing.xl, gap: 10 }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: spacing.lg, alignItems: 'center' as const, marginTop: spacing.md }}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>📦</Text>
                <Text style={{ fontSize: 14, fontWeight: '600' as const, color: colors.text }}>No orders here yet</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' as const }}>Assigned orders will appear once an admin picks you.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
              <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' as const, flexDirection: 'row' as const }}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ width: 3 }}
                />
                <View style={{ flex: 1, padding: 14 }}>
                  <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const }}>
                    Order #{item.id.slice(0, 8)}
                  </Text>
                  <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text, flex: 1, marginRight: 8 }}>
                      {item.design_name ?? item.category_name ?? 'Custom order'}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '700' as const, color: STATUS_COLOR[item.status] ?? colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                      {item.status.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <ProgressBar percent={item.progress_percent} />
                  </View>
                  <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: 6 }}>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>{item.progress_percent}% complete</Text>
                    {item.expected_delivery_date && (
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        Due {formatters.relativeDays(item.expected_delivery_date)}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' as const, marginTop: 6, textAlign: 'right' as const }}>
                    Update progress →
                  </Text>
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
