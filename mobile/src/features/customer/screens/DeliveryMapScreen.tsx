import { Linking, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTrackingSnapshot } from '@/features/customer/hooks/useCustomerQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

import type { CustomerScreenProps } from '@/navigation/types';

export function DeliveryMapScreen({ route }: CustomerScreenProps<'DeliveryMap'>) {
  const { orderId } = route.params;
  const { data, isLoading } = useTrackingSnapshot(orderId);
  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    label: { ...typography.body, color: c.text, fontWeight: '600' as const },
    sectionLabel: { ...typography.caption, color: c.textMuted, marginBottom: spacing.xs, letterSpacing: 0.5 },
    muted: { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
    loading: { ...typography.body, color: c.textMuted, marginTop: spacing.md },
    address: { ...typography.body, color: c.textMuted, marginTop: spacing.xs },
    spacer: { marginTop: spacing.sm },
    badge: {
      marginTop: spacing.xl,
      alignSelf: 'center' as const,
      backgroundColor: c.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    badgeText: { ...typography.caption, color: c.textMuted },
  }));

  function openMaps(lat: number, lng: number, label: string) {
    Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(label)}&ll=${lat},${lng}`);
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Live delivery tracking</Text>
      <Text style={styles.muted}>Refreshes every 10 seconds.</Text>

      {isLoading && <Text style={styles.loading}>Fetching location…</Text>}

      {data?.partner_location ? (
        <Card>
          <Text style={styles.label}>Delivery partner location</Text>
          <Text style={styles.muted}>
            Last seen:{' '}
            {data.partner_location.recorded_at
              ? new Date(data.partner_location.recorded_at).toLocaleTimeString()
              : '—'}
          </Text>
          {data.partner_location.lat != null && (
            <View style={styles.spacer}>
              <Button
                title="Open partner in Maps"
                variant="secondary"
                onPress={() =>
                  openMaps(data.partner_location.lat, data.partner_location.lng, 'Delivery partner')
                }
              />
            </View>
          )}
        </Card>
      ) : (
        <Card>
          <Text style={styles.label}>Location not yet available</Text>
          <Text style={styles.muted}>
            Partner location appears here once they accept the pickup.
          </Text>
        </Card>
      )}

      {data?.pickup_address && (
        <Card>
          <Text style={styles.sectionLabel}>PICKUP — TAILOR</Text>
          <Text style={styles.address}>{data.pickup_address.address ?? '—'}</Text>
          {data.pickup_address.contact_name && (
            <Text style={styles.muted}>Contact: {data.pickup_address.contact_name}</Text>
          )}
          {data.pickup_address.lat != null && (
            <View style={styles.spacer}>
              <Button
                title="Open in Maps"
                variant="ghost"
                onPress={() => openMaps(data.pickup_address.lat, data.pickup_address.lng, 'Tailor pickup')}
              />
            </View>
          )}
        </Card>
      )}

      {data?.drop_address && (
        <Card>
          <Text style={styles.sectionLabel}>DROP-OFF — YOUR ADDRESS</Text>
          <Text style={styles.address}>
            {[data.drop_address.street, data.drop_address.city, data.drop_address.pincode]
              .filter(Boolean)
              .join(', ')}
          </Text>
        </Card>
      )}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>Auto-refreshes every 10 s</Text>
      </View>
    </ScreenContainer>
  );
}
