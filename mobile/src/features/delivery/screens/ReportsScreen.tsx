import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAssignments } from '@/features/delivery/hooks/useDeliveryQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
] as const;

const KIND_LABEL: Record<string, string> = {
  customer_to_tailor: 'Customer → Tailor',
  tailor_to_customer: 'Tailor → Customer',
  office_to_customer: 'Office → Customer',
};

export function ReportsScreen() {
  const [period, setPeriod] = useState(30);
  const { data: assignments = [], isLoading } = useAssignments();

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.md },
    muted: { ...typography.caption, color: c.textMuted },
    sectionLabel: { ...typography.caption, color: c.textMuted, letterSpacing: 0.5, marginBottom: spacing.sm },
    chips: { flexDirection: 'row' as const, gap: spacing.sm, marginBottom: spacing.md },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, borderWidth: 1, borderColor: c.border },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { ...typography.caption, color: c.textMuted },
    chipTextActive: { color: '#fff', fontWeight: '600' as const },
    summaryRow: { flexDirection: 'row' as const, gap: spacing.sm, marginBottom: spacing.sm },
    summaryCard: { flex: 1, alignItems: 'center' as const },
    statValue: { ...typography.h2, color: c.primary, textAlign: 'center' as const },
    statLabel: { ...typography.caption, color: c.textMuted, textAlign: 'center' as const, marginTop: spacing.xs },
    barRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.xs, gap: spacing.sm },
    barLabel: { ...typography.caption, color: c.textMuted, width: 100 },
    barTrack: { flex: 1, height: 12, backgroundColor: c.border, borderRadius: radii.pill, overflow: 'hidden' as const },
    barFill: { height: 12, backgroundColor: c.primary },
    barCount: { ...typography.caption, color: c.text, width: 24, textAlign: 'right' as const },
    exportBtn: { marginTop: spacing.lg, alignSelf: 'center' as const, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: c.primary, borderRadius: radii.pill },
    exportText: { ...typography.body, color: c.primary, fontWeight: '600' as const },
  }));

  const cutoff = Date.now() - period * 86_400_000;
  const inPeriod = assignments.filter((a) => {
    const at = a.started_at ? new Date(a.started_at).getTime() : 0;
    return at >= cutoff;
  });
  const completed = inPeriod.filter((a) => a.state === 'delivered');
  const inProgress = inPeriod.filter((a) => a.state === 'picked_up').length;
  const cancelled = inPeriod.filter((a) => a.state === 'cancelled').length;
  const byKind: Record<string, number> = {};
  for (const a of completed) byKind[a.kind] = (byKind[a.kind] ?? 0) + 1;
  const maxCount = Math.max(...Object.values(byKind), 1);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Your reports</Text>
      <View style={styles.chips}>
        {PERIODS.map((p) => (
          <Pressable key={p.days} style={[styles.chip, period === p.days && styles.chipActive]} onPress={() => setPeriod(p.days)}>
            <Text style={[styles.chipText, period === p.days && styles.chipTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      {isLoading && <Text style={styles.muted}>Loading…</Text>}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}><Text style={styles.statValue}>{completed.length}</Text><Text style={styles.statLabel}>Delivered</Text></Card>
        <Card style={styles.summaryCard}><Text style={styles.statValue}>{inProgress}</Text><Text style={styles.statLabel}>In transit</Text></Card>
        <Card style={styles.summaryCard}><Text style={styles.statValue}>{cancelled}</Text><Text style={styles.statLabel}>Cancelled</Text></Card>
      </View>
      {Object.keys(byKind).length > 0 && (
        <Card>
          <Text style={styles.sectionLabel}>DELIVERIES BY TYPE</Text>
          {Object.entries(byKind).map(([kind, count]) => (
            <View key={kind} style={styles.barRow}>
              <Text style={styles.barLabel} numberOfLines={1}>{KIND_LABEL[kind] ?? kind}</Text>
              <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(count / maxCount) * 100}%` as any }]} /></View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </Card>
      )}
      <Pressable style={styles.exportBtn} onPress={() => Alert.alert('Export', 'CSV export available when backend reports endpoint is connected.')}>
        <Text style={styles.exportText}>Export CSV</Text>
      </Pressable>
    </ScreenContainer>
  );
}
