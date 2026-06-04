import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useMyTailorOrders, useUpdateProgress } from '@/features/tailor/hooks/useTailorQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { TailorScreenProps } from '@/navigation/types';

const STEPS = [
  { label: 'Cutting', percent: 25 },
  { label: 'Stitching', percent: 55 },
  { label: 'Finishing', percent: 80 },
  { label: 'Ready', percent: 100 },
];

export function OrderDetailScreen({ route }: TailorScreenProps<'OrderDetail'>) {
  const { orderId } = route.params;
  const { data: orders = [], isLoading } = useMyTailorOrders();
  const order = orders.find((o) => o.id === orderId);
  const { mutateAsync: updateProgress, isPending } = useUpdateProgress();
  const [progressInput, setProgressInput] = useState('');
  const [note, setNote] = useState('');

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    muted: { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
    body: { ...typography.body, color: c.textMuted },
    section: { ...typography.h2, color: c.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    sectionLabel: { ...typography.caption, color: c.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
    progressTrack: { height: 10, backgroundColor: c.border, borderRadius: radii.pill, overflow: 'hidden' as const, marginBottom: spacing.xs },
    progressFill: { height: 10, backgroundColor: c.primary },
    progressText: { ...typography.h2, color: c.primary },
    row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 2 },
    measureKey: { ...typography.body, color: c.textMuted, textTransform: 'capitalize' as const },
    measureVal: { ...typography.body, color: c.text, fontWeight: '600' as const },
    stepRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.md },
    spacer: { marginTop: spacing.md },
  }));

  async function submit(percent?: number) {
    const val = percent ?? parseInt(progressInput, 10);
    if (isNaN(val) || val < 0 || val > 100) {
      Alert.alert('Invalid value', 'Enter a number between 0 and 100.');
      return;
    }
    try {
      await updateProgress({ orderId, progress: val, note: note.trim() || undefined });
      setProgressInput('');
      setNote('');
      Alert.alert('Updated!', `Progress set to ${val}%.`);
    } catch {
      Alert.alert('Failed', 'Could not update progress. Try again.');
    }
  }

  if (isLoading) return <ScreenContainer><Text style={styles.muted}>Loading…</Text></ScreenContainer>;
  if (!order) return <ScreenContainer><Text style={styles.muted}>Order not found.</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <Text style={styles.title}>{order.design_name ?? order.category_name ?? 'Order'}</Text>
      <Text style={styles.muted}>Order #{order.id.slice(0, 8)}</Text>
      <Card>
        <Text style={styles.sectionLabel}>PROGRESS</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${order.progress_percent}%` as `${number}%` }]} /></View>
        <Text style={styles.progressText}>{order.progress_percent}%</Text>
      </Card>
      {order.measurements && Object.keys(order.measurements).length > 0 && (
        <Card>
          <Text style={styles.sectionLabel}>MEASUREMENTS</Text>
          {Object.entries(order.measurements).map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.measureKey}>{k.replace('_', ' ')}</Text>
              <Text style={styles.measureVal}>{v as number}"</Text>
            </View>
          ))}
        </Card>
      )}
      {order.expected_delivery_date && (
        <Card>
          <Text style={styles.sectionLabel}>DEADLINE</Text>
          <Text style={styles.body}>
            {formatters.dateLong(order.expected_delivery_date)}
            {' '}({formatters.relativeDays(order.expected_delivery_date)})
          </Text>
        </Card>
      )}
      <Text style={styles.section}>Update progress</Text>
      <View style={styles.stepRow}>
        {STEPS.map((s) => (
          <Button key={s.label} title={`${s.label}\n${s.percent}%`} variant={order.progress_percent >= s.percent ? 'primary' : 'secondary'} onPress={() => submit(s.percent)} />
        ))}
      </View>
      <Input label="Custom % (0–100)" value={progressInput} onChangeText={setProgressInput} keyboardType="number-pad" placeholder="e.g. 40" />
      <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Fabric cut, starting stitching tomorrow" />
      <View style={styles.spacer}><Button title="Save progress" onPress={() => submit()} loading={isPending} /></View>
    </ScreenContainer>
  );
}
