import { Alert, Linking, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAssignments, useTransition } from '@/features/delivery/hooks/useDeliveryQueries';
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

const STATE_LABEL: Record<string, string> = {
  proposed: 'Pending acceptance',
  accepted: 'Accepted — head to pickup',
  picked_up: 'Picked up — deliver now',
  delivered: 'Delivered ✓',
  cancelled: 'Cancelled',
};

const NEXT_STATE: Record<string, { state: 'accepted' | 'picked_up' | 'delivered' | 'cancelled'; label: string }[]> = {
  proposed: [{ state: 'accepted', label: 'Accept pickup' }, { state: 'cancelled', label: 'Decline' }],
  accepted: [{ state: 'picked_up', label: 'Mark as picked up' }],
  picked_up: [{ state: 'delivered', label: 'Mark as delivered' }],
};

export function ActivePickupScreen({ route, navigation }: DeliveryScreenProps<'ActivePickup'>) {
  const { assignmentId } = route.params;
  const { data: assignments = [], isLoading } = useAssignments();
  const { mutateAsync: transition, isPending } = useTransition();

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.sm },
    sectionLabel: { ...typography.caption, color: c.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
    muted: { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
    address: { ...typography.body, color: c.textMuted },
    spacer: { marginTop: spacing.sm },
    actions: { gap: spacing.sm, marginTop: spacing.lg },
    statusBadge: { alignSelf: 'flex-start' as const, backgroundColor: c.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginBottom: spacing.md },
    statusText: { ...typography.caption, color: '#fff', fontWeight: '600' as const },
  }));

  const assignment = assignments.find((a) => a.id === assignmentId);

  async function doTransition(state: 'accepted' | 'picked_up' | 'delivered' | 'cancelled') {
    try {
      await transition({ id: assignmentId, state });
      if (state === 'delivered') {
        Alert.alert('Delivered!', 'Great work. The order is marked as delivered.', [
          { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
        ]);
      }
    } catch {
      Alert.alert('Failed', 'Could not update status. Try again.');
    }
  }

  if (isLoading) return <ScreenContainer><Text style={styles.muted}>Loading…</Text></ScreenContainer>;
  if (!assignment) return <ScreenContainer><Text style={styles.muted}>Assignment not found.</Text></ScreenContainer>;

  const actions = NEXT_STATE[assignment.state] ?? [];
  const pickup = assignment.pickup_location;
  const drop = assignment.drop_location as LocationPayload;

  return (
    <ScreenContainer>
      <Text style={styles.title}>Active pickup</Text>
      <View style={styles.statusBadge}><Text style={styles.statusText}>{STATE_LABEL[assignment.state] ?? assignment.state}</Text></View>
      <Card>
        <Text style={styles.sectionLabel}>PICKUP — FROM TAILOR</Text>
        <Text style={styles.address}>{pickup.address ?? '—'}</Text>
        {pickup.contact_name && <Text style={styles.muted}>Contact: {pickup.contact_name}</Text>}
        {pickup.contact_phone && (
          <View style={styles.spacer}><Button title={`Call ${pickup.contact_phone}`} variant="secondary" onPress={() => Linking.openURL(`tel:${pickup.contact_phone}`)} /></View>
        )}
        {pickup.lat != null && (
          <View style={styles.spacer}><Button title="Navigate to pickup" variant="ghost" onPress={() => Linking.openURL(`https://maps.apple.com/?daddr=${pickup.lat},${pickup.lng}&dirflg=d`)} /></View>
        )}
      </Card>
      <Card>
        <Text style={styles.sectionLabel}>DROP-OFF — CUSTOMER</Text>
        <Text style={styles.address}>{[drop.street, drop.city, drop.pincode].filter(Boolean).join(', ') || '—'}</Text>
        {drop.lat != null && (
          <View style={styles.spacer}><Button title="Navigate to drop-off" variant="ghost" onPress={() => Linking.openURL(`https://maps.apple.com/?daddr=${drop.lat},${drop.lng}&dirflg=d`)} /></View>
        )}
      </Card>
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Button key={a.state} title={a.label} variant={a.state === 'cancelled' ? 'ghost' : 'primary'} onPress={() => doTransition(a.state)} loading={isPending} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
