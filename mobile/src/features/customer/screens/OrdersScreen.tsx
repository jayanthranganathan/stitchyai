import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/BottomNavBar';
import { useMyOrders } from '@/features/customer/hooks/useCustomerQueries';
import { spacing, useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { OrderSummary } from '@/features/customer/api';
import type { CustomerScreenProps } from '@/navigation/types';

const TABS = [
  { icon: '🏠', label: 'Home', screen: 'Home' },
  { icon: '📦', label: 'Orders', screen: 'Orders' },
  { icon: '👤', label: 'Profile', screen: 'Profile' },
];

// Per-card accent colors, cycled for visual variety (theme-independent, all read
// well on light surfaces — matches the reference design).
const ACCENTS = ['#7C3AED', '#F59E0B', '#3B82F6', '#EC4899', '#10B981'];

const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', assigned: 'Assigned',
  in_progress: 'In progress', ready: 'Ready', out_for_delivery: 'Out for delivery',
  delivered: 'Delivered', cancelled: 'Cancelled',
};

function statusColors(status: string): { bg: string; fg: string } {
  switch (status) {
    case 'delivered':
      return { bg: '#E7F3EA', fg: '#1F8A4C' };
    case 'cancelled':
    case 'undeliverable':
      return { bg: '#FCEBEB', fg: '#C0392B' };
    case 'ready':
    case 'out_for_delivery':
      return { bg: '#FEF3E2', fg: '#B9770E' };
    default:
      return { bg: '#E7F3EA', fg: '#1F8A4C' }; // placed/confirmed/active → green "live"
  }
}

export function OrdersScreen({ navigation }: CustomerScreenProps<'Orders'>) {
  const { data, isLoading, refetch } = useMyOrders();
  const { colors } = useTheme();
  const orders = data ?? [];

  function MetricTile({ accent, icon, label, value, sub }: { accent: string; icon: string; label: string; value: string; sub?: string }) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accent + '1A', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 17 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: colors.textMuted }}>{label}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1}>{value}</Text>
          {sub ? <Text style={{ fontSize: 10, color: colors.textMuted }}>{sub}</Text> : null}
        </View>
      </View>
    );
  }

  function renderCard({ item, index }: { item: OrderSummary; index: number }) {
    const accent = ACCENTS[index % ACCENTS.length] ?? colors.primary;
    const pill = statusColors(item.status);
    const amount = item.total_amount > 0 ? formatters.inr(item.total_amount) : 'Awaiting quote';
    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, flexDirection: 'row' }}>
        <View style={{ width: 5, backgroundColor: accent }} />
        <View style={{ flex: 1, padding: 16 }}>
          {/* Top row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: accent + '1A', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>📋</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: accent, letterSpacing: 0.5 }}>
                ORDER #{item.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 1 }}>
                {item.design_name ?? item.category_name ?? 'Custom order'}
              </Text>
            </View>
            <View style={{ backgroundColor: pill.bg, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, color: pill.fg }}>●</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: pill.fg }}>{STATUS_LABEL[item.status] ?? item.status}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 14 }} />

          {/* Metrics */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <MetricTile
              accent={accent}
              icon="🗓"
              label="ETA"
              value={item.expected_delivery_date ? formatters.dateLong(item.expected_delivery_date) : 'TBD'}
              sub={item.expected_delivery_date ? formatters.relativeDays(item.expected_delivery_date) : undefined}
            />
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <MetricTile accent={accent} icon="🪙" label="Total amount" value={amount} />
          </View>

          {/* View details */}
          <Pressable onPress={() => navigation.navigate('OrderTrack', { orderId: item.id })} style={{ marginTop: 14 }}>
            <View style={{ backgroundColor: accent + '14', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: accent }}>View details</Text>
              <Text style={{ fontSize: 14, color: accent }}>›</Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Gradient banner */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 18, overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', right: -20, top: -24, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.12)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>My orders</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
                  Track and manage all your orders in one place
                </Text>
              </View>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 40 }}>🛍️</Text>
                <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>{orders.length} total</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          renderItem={renderCard}
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: spacing.lg, alignItems: 'center', marginTop: spacing.lg }}>
                <Text style={{ fontSize: 30, marginBottom: spacing.sm }}>📦</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>No orders yet</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>
                  Place your first order to see it here
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
      <BottomNavBar tabs={TABS} />
    </View>
  );
}
