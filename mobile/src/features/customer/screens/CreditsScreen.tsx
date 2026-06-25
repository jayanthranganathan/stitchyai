import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type CreditTxn } from '@/features/customer/api';
import { useCreditHistory, useMySubscription } from '@/features/customer/hooks/useBilling';
import { spacing, useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { CustomerScreenProps } from '@/navigation/types';

const KIND_LABEL: Record<string, string> = {
  earn_order: 'Earned on order',
  redeem_order: 'Redeemed on order',
  redeem_upgrade: 'Plan upgrade',
  promo: 'Promotional credit',
  refund: 'Refund',
};

export function CreditsScreen(_props: CustomerScreenProps<'Credits'>) {
  const { colors } = useTheme();
  const { data: me } = useMySubscription();
  const { data: history = [], isLoading, refetch } = useCreditHistory();

  function renderItem({ item }: { item: CreditTxn }) {
    const positive = item.amount >= 0;
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            {KIND_LABEL[item.kind] ?? item.kind}
          </Text>
          {item.note ? (
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{item.note}</Text>
          ) : null}
          <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: '800', color: positive ? '#16A34A' : '#EF4444' }}>
          {positive ? '+' : ''}
          {formatters.inr(item.amount)}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
            Credits
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18, padding: 20 }}
          >
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>BALANCE</Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 }}>
              {formatters.inr(me?.credit_balance ?? 0)}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              1 credit = ₹1 · redeem at checkout or to upgrade your plan
            </Text>
          </LinearGradient>
        </View>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(t) => t.id}
            onRefresh={refetch}
            refreshing={isLoading}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: spacing.xl, gap: 10 }}
            ListEmptyComponent={
              <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: spacing.lg, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.textMuted }}>
                  No credit activity yet. Complete an order to earn credits.
                </Text>
              </View>
            }
            renderItem={renderItem}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
