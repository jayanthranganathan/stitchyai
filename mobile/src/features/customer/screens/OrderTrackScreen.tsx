import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useOrderProgress } from '@/features/customer/hooks/useCustomerQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

import type { CustomerScreenProps } from '@/navigation/types';

export function OrderTrackScreen({ route, navigation }: CustomerScreenProps<'OrderTrack'>) {
  const { orderId } = route.params;
  const { data, isLoading } = useOrderProgress(orderId);
  const styles = useThemedStyles((c) => ({
    title: { ...typography.h2, color: c.text, marginBottom: spacing.sm, textTransform: 'capitalize' as const },
    muted: { ...typography.body, color: c.textMuted, marginTop: spacing.xs },
    section: { ...typography.h2, color: c.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    progressTrack: {
      height: 8,
      backgroundColor: c.border,
      borderRadius: radii.pill,
      overflow: 'hidden' as const,
      marginBottom: spacing.sm,
    },
    progressFill: { height: 8, backgroundColor: c.primary },
  }));

  if (isLoading || !data) {
    return (
      <ScreenContainer>
        <Text style={styles.muted}>Loading…</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Card>
        <Text style={styles.title}>{data.status}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${data.progress_percent}%` }]} />
        </View>
        <Text style={styles.muted}>{data.progress_percent}% complete</Text>
        {data.eta ? <Text style={styles.muted}>ETA: {data.eta}</Text> : null}
      </Card>

      <Button
        title="View delivery on map"
        onPress={() => navigation.navigate('DeliveryMap', { orderId })}
        variant="secondary"
      />

      <Text style={styles.section}>Timeline</Text>
      {(data.history ?? []).map((h: { at: string; status: string; note: string | null; progress_percent: number }) => (
        <Card key={h.at}>
          <Text style={styles.title}>{h.status}</Text>
          <Text style={styles.muted}>{h.at}</Text>
          {h.note ? <Text style={styles.muted}>{h.note}</Text> : null}
          <Text style={styles.muted}>{h.progress_percent}%</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}
