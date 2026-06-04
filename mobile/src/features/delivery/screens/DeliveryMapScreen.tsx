import { Linking, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAssignments } from '@/features/delivery/hooks/useDeliveryQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

import type { DeliveryScreenProps } from '@/navigation/types';

type LocationPayload = {
  street?: string;
  city?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
};

export function DeliveryMapScreen({ route }: DeliveryScreenProps<'DeliveryMap'>) {
  const { assignmentId } = route.params;
  const { data: assignments = [], isLoading } = useAssignments();

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    sectionLabel: { ...typography.caption, color: c.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
    muted: { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
    address: { ...typography.body, color: c.textMuted },
    empty: { ...typography.body, color: c.text, marginBottom: spacing.xs },
    spacer: { marginTop: spacing.sm },
    pingNote: { marginTop: spacing.xl, backgroundColor: c.border, borderRadius: radii.md, padding: spacing.md },
    pingText: { ...typography.caption, color: c.textMuted },
  }));

  const assignment = assignments.find((a) => a.id === assignmentId);
  const pickup = assignment?.pickup_location as LocationPayload | undefined;
  const drop = assignment?.drop_location as LocationPayload | undefined;

  function navigate(lat: number, lng: number) {
    Linking.openURL(`https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`);
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Navigation</Text>
      <Text style={styles.muted}>Use the buttons below to open turn-by-turn navigation for each leg.</Text>
      {isLoading && <Text style={styles.muted}>Loading assignment…</Text>}
      {pickup && (
        <Card>
          <Text style={styles.sectionLabel}>LEG 1 — PICKUP FROM TAILOR</Text>
          <Text style={styles.address}>{pickup.address ?? '—'}</Text>
          {pickup.contact_name && <Text style={styles.muted}>Contact: {pickup.contact_name}</Text>}
          {pickup.contact_phone && <Text style={styles.muted}>Phone: {pickup.contact_phone}</Text>}
          {pickup.lat != null && (
            <View style={styles.spacer}><Button title="Open in Maps — Pickup" onPress={() => navigate(pickup.lat!, pickup.lng!)} /></View>
          )}
        </Card>
      )}
      {drop && (
        <Card>
          <Text style={styles.sectionLabel}>LEG 2 — DROP-OFF TO CUSTOMER</Text>
          <Text style={styles.address}>{[drop.street, drop.city, drop.pincode].filter(Boolean).join(', ') || '—'}</Text>
          {drop.lat != null && (
            <View style={styles.spacer}><Button title="Open in Maps — Drop-off" variant="secondary" onPress={() => navigate(drop.lat!, drop.lng!)} /></View>
          )}
        </Card>
      )}
      {!assignment && !isLoading && (
        <Card>
          <Text style={styles.empty}>No active assignment.</Text>
          <Text style={styles.muted}>Accept a pickup from the Dashboard first.</Text>
        </Card>
      )}
      <View style={styles.pingNote}>
        <Text style={styles.pingText}>📡 Location pings are sent automatically every 10 s while you have an active assignment.</Text>
      </View>
    </ScreenContainer>
  );
}
