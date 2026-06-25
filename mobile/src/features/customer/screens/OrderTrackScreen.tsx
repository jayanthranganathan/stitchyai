import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOrderDetail, useOrderProgress } from '@/features/customer/hooks/useCustomerQueries';
import { useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { OrderTimelineEntry } from '@/features/customer/api';
import type { CustomerScreenProps } from '@/navigation/types';

function humanize(status: string): string {
  const s = status.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Status → pill colors (bg tint + text). */
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
    default: // placed, confirmed, assigned, in_progress
      return { bg: '#F6E4E8', fg: '#8B2342' };
  }
}

export function OrderTrackScreen({ route, navigation }: CustomerScreenProps<'OrderTrack'>) {
  const { orderId } = route.params;
  const { colors } = useTheme();
  const { data: order, isLoading: orderLoading } = useOrderDetail(orderId);
  const { data: progress, isLoading: progressLoading } = useOrderProgress(orderId);

  if ((orderLoading && !order) || (progressLoading && !progress)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const status = order?.status ?? progress?.status ?? 'placed';
  const pill = statusColors(status);
  const gross = order?.items.reduce((s, i) => s + i.subtotal, 0) ?? order?.total_amount ?? 0;
  const credits = order?.credits_redeemed ?? 0;
  const history: OrderTimelineEntry[] = progress?.history ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

          {/* ── Order id + status ── */}
          <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                Order #{orderId.slice(0, 8)}
              </Text>
              <View style={{ backgroundColor: pill.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: pill.fg }}>{humanize(status)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 }}>
              {order?.placed_at ? (
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {formatters.dateLong(order.placed_at)} · {formatters.time(order.placed_at)}
                </Text>
              ) : null}
              {order?.items[0]?.category_name ? (
                <Text style={{ marginLeft: 'auto', fontSize: 12, color: colors.textMuted }}>
                  {order.items[0].category_name}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={{ height: 0.5, backgroundColor: colors.border, marginVertical: 16, marginHorizontal: 18 }} />

          {/* ── Line items ── */}
          <View style={{ paddingHorizontal: 18, gap: 14 }}>
            {(order?.items ?? []).map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: pill.bg }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: pill.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>🧵</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    {item.design_name ?? item.category_name ?? 'Custom garment'}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 3 }}>
                    {formatters.inr(item.unit_price)}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Qty : {item.quantity}</Text>
              </View>
            ))}
          </View>

          {/* ── Summary ── */}
          <View style={{ marginHorizontal: 18, marginTop: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 }}>
            <SummaryRow label="Amount" value={formatters.inr(gross)} muted={colors.textMuted} text={colors.text} />
            {credits > 0 ? (
              <SummaryRow label="Credits applied" value={`− ${formatters.inr(credits)}`} muted={colors.textMuted} valueColor="#1F8A4C" text={colors.text} />
            ) : null}
            <SummaryRow label="Total paid" value={formatters.inr(order?.total_amount ?? 0)} muted={colors.textMuted} text={colors.text} bold />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>Payment</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>
                  {order?.payment_provider ?? 'Pending'}
                </Text>
                {order?.payment_status ? (
                  <View style={{ backgroundColor: order.payment_status === 'captured' ? '#E7F3EA' : pill.bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: order.payment_status === 'captured' ? '#1F8A4C' : pill.fg }}>
                      {order.payment_status === 'captured' ? 'Paid' : humanize(order.payment_status)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* ── Notes ── */}
          {order?.notes ? (
            <View style={{ marginHorizontal: 18, marginTop: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 5 }}>Notes</Text>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 19 }}>{order.notes}</Text>
            </View>
          ) : null}

          {/* ── Map link ── */}
          <Pressable onPress={() => navigation.navigate('DeliveryMap', { orderId })}>
            <View style={{ marginHorizontal: 18, marginTop: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Text style={{ fontSize: 14 }}>📍</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>View delivery on map</Text>
            </View>
          </Pressable>

          {/* ── Timeline ── */}
          <View style={{ paddingHorizontal: 18, marginTop: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Order timeline</Text>
            {history.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textMuted }}>No updates yet.</Text>
            ) : (
              <View style={{ paddingLeft: 30 }}>
                {history.map((h, idx) => {
                  const last = idx === history.length - 1;
                  return (
                    <View key={`${h.status}-${h.at}`} style={{ position: 'relative', paddingBottom: last ? 0 : 18 }}>
                      {!last ? (
                        <View style={{ position: 'absolute', left: -20, top: 20, bottom: 0, width: 2, backgroundColor: '#D8EADD' }} />
                      ) : null}
                      <View style={{ position: 'absolute', left: -30, top: -1, width: 22, height: 22, borderRadius: 11, backgroundColor: '#2BA559', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{humanize(h.status)}</Text>
                          {h.note ? <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{h.note}</Text> : null}
                        </View>
                        <Text style={{ fontSize: 13, color: colors.textMuted }}>{formatters.time(h.at)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  text,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  muted: string;
  text: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}>
      <Text style={{ fontSize: 13, color: muted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: bold ? '700' : '600', color: valueColor ?? text }}>{value}</Text>
    </View>
  );
}
