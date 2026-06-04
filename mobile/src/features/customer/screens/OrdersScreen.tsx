import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMyOrders } from '@/features/customer/hooks/useCustomerQueries';
import { BottomNavBar } from '@/components/BottomNavBar';
import { spacing, useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { CustomerScreenProps } from '@/navigation/types';

const TABS = [
  { icon: '🏠', label: 'Home', screen: 'Home' },
  { icon: '📦', label: 'Orders', screen: 'Orders' },
  { icon: '👤', label: 'Profile', screen: 'Profile' },
];

const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function OrdersScreen({ navigation }: CustomerScreenProps<'Orders'>) {
  const { data, isLoading, refetch } = useMyOrders();
  const { colors } = useTheme();
  const orders = data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={{
          flexDirection: 'row' as const, alignItems: 'center' as const,
          justifyContent: 'space-between' as const,
          paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
        }}>
          <Text style={{ fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 }}>
            My Orders
          </Text>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 5 }}
          >
            <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' as const, letterSpacing: 0.5 }}>
              {orders.length} total
            </Text>
          </LinearGradient>
        </View>

        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={{
                backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                borderRadius: 14, padding: spacing.lg, alignItems: 'center' as const, marginTop: spacing.lg,
              }}>
                <Text style={{ fontSize: 28, marginBottom: spacing.sm }}>📦</Text>
                <Text style={{ fontSize: 14, fontWeight: '600' as const, color: colors.text }}>No orders yet</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' as const }}>
                  Place your first order to see it here
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('OrderTrack', { orderId: item.id })}>
              <View style={{
                backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                borderRadius: 14, overflow: 'hidden' as const, flexDirection: 'row' as const,
              }}>
                {/* Left accent bar */}
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ width: 3 }}
                />

                {/* Card body */}
                <View style={{ flex: 1, padding: spacing.md }}>
                  <Text style={{
                    fontSize: 9, color: colors.textMuted, fontWeight: '600' as const,
                    letterSpacing: 1, textTransform: 'uppercase' as const,
                  }}>
                    Order #{item.id.slice(0, 8)}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text, marginTop: 2 }}>
                    {item.design_name ?? item.category_name ?? 'Custom order'}
                  </Text>

                  {/* Progress bar */}
                  <View style={{
                    height: 3, backgroundColor: colors.border, borderRadius: 2,
                    marginTop: spacing.sm, overflow: 'hidden' as const,
                  }}>
                    <LinearGradient
                      colors={[colors.primary, colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: 3, width: `${item.progress_percent ?? 0}%` as `${number}%` }}
                    />
                  </View>

                  {/* Status + amount row */}
                  <View style={{
                    flexDirection: 'row' as const, justifyContent: 'space-between' as const,
                    alignItems: 'center' as const, marginTop: 6,
                  }}>
                    <Text style={{ fontSize: 9, color: colors.accent, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' as const }}>
                      {formatters.inr(item.total_amount)}
                    </Text>
                  </View>

                  {/* ETA row */}
                  {item.expected_delivery_date ? (
                    <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>
                      ETA {formatters.dateLong(item.expected_delivery_date)} · {formatters.relativeDays(item.expected_delivery_date)}
                    </Text>
                  ) : null}
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
