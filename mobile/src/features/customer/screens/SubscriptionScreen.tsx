import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Plan } from '@/features/customer/api';
import { useChangePlan, useMySubscription, usePlans } from '@/features/customer/hooks/useBilling';
import { spacing, useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { CustomerScreenProps } from '@/navigation/types';

const FEATURE_ROWS: { key: keyof Plan; label: string }[] = [
  { key: 'ai_enabled', label: 'AI fabric generation' },
  { key: 'save_designs', label: 'Save AI designs' },
  { key: 'custom_proposals', label: 'Custom design proposals' },
  { key: 'priority_matching', label: 'Priority order matching' },
];

export function SubscriptionScreen({ route, navigation }: CustomerScreenProps<'Subscription'>) {
  const upsell = route.params?.upsell;
  const { colors } = useTheme();
  const { data: plans = [], isLoading } = usePlans();
  const { data: me } = useMySubscription();
  const { mutateAsync: changePlan, isPending } = useChangePlan();

  async function onUpgrade(plan: Plan) {
    if (plan.tier === me?.tier) return;
    const canPayCredits = (me?.credit_balance ?? 0) >= plan.price_credits && plan.price_credits > 0;

    function doChange(payWith: 'free' | 'credits') {
      changePlan({ targetTier: plan.tier, payWith })
        .then(() => Alert.alert('Plan updated', `You are now on ${plan.label}.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]))
        .catch(() => Alert.alert('Could not change plan', 'Please try again.'));
    }

    if (plan.tier === 'standard') {
      doChange('free');
      return;
    }

    const options: { text: string; onPress?: () => void; style?: 'cancel' }[] = [];
    if (canPayCredits) {
      options.push({
        text: `Use ${plan.price_credits} credits`,
        onPress: () => doChange('credits'),
      });
    }
    options.push({ text: 'Activate (free preview)', onPress: () => doChange('free') });
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(
      `Upgrade to ${plan.label}`,
      `₹${plan.price_inr}/month or ${plan.price_credits} credits.`,
      options,
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 6 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
              Choose your plan
            </Text>
            {me ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                Current: {me.label} · {formatters.inr(me.credit_balance)} in credits
              </Text>
            ) : null}
          </View>

          {upsell ? (
            <View style={{ marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#EDE9FE' }}>
              <Text style={{ fontSize: 13, color: '#5B21B6', fontWeight: '600' }}>{upsell}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <View style={{ paddingHorizontal: 16, gap: 14, marginTop: 14 }}>
              {plans.map((plan) => {
                const isCurrent = plan.tier === me?.tier;
                const isPremium = plan.tier !== 'standard';
                return (
                  <View
                    key={plan.tier}
                    style={{
                      borderRadius: 18,
                      borderWidth: isCurrent ? 2 : 1.5,
                      borderColor: isCurrent ? colors.primary : colors.border,
                      backgroundColor: colors.surface,
                      overflow: 'hidden',
                    }}
                  >
                    {isPremium ? (
                      <LinearGradient
                        colors={[colors.primary, colors.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                      >
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>{plan.label}</Text>
                        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                          ₹{plan.price_inr}/mo · or {plan.price_credits} credits
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{plan.label}</Text>
                        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Free</Text>
                      </View>
                    )}

                    <View style={{ padding: 16, gap: 8 }}>
                      {FEATURE_ROWS.map((row) => {
                        const on = Boolean(plan[row.key]);
                        return (
                          <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 14 }}>{on ? '✅' : '—'}</Text>
                            <Text style={{ fontSize: 13, color: on ? colors.text : colors.textMuted }}>
                              {row.label}
                              {row.key === 'ai_enabled' && on && plan.ai_monthly_quota != null
                                ? ` (${plan.ai_monthly_quota}/mo)`
                                : row.key === 'ai_enabled' && on
                                  ? ' (unlimited)'
                                  : ''}
                            </Text>
                          </View>
                        );
                      })}
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        Earn {Math.round(plan.credit_earn_multiplier * 100)}% back as credits · {plan.support} support
                      </Text>

                      {isCurrent ? (
                        <View style={{ marginTop: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted }}>Current plan</Text>
                        </View>
                      ) : (
                        <Pressable onPress={() => onUpgrade(plan)} disabled={isPending} style={{ marginTop: 8 }}>
                          <LinearGradient
                            colors={[colors.primary, colors.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingVertical: 13, borderRadius: 12, alignItems: 'center', opacity: isPending ? 0.7 : 1 }}
                          >
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                              {plan.tier === 'standard' ? 'Switch to Standard' : `Choose ${plan.label}`}
                            </Text>
                          </LinearGradient>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
