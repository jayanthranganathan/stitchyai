import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useMyTailorOrders } from '@/features/tailor/hooks/useTailorQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';
import { formatters } from '@/utils/formatters';

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
] as const;

export function ReportsScreen() {
  const [period, setPeriod] = useState(30);
  const { data: orders = [], isLoading } = useMyTailorOrders();

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
    barLabel: { ...typography.caption, color: c.textMuted, width: 80, textTransform: 'capitalize' as const },
    barTrack: { flex: 1, height: 12, backgroundColor: c.border, borderRadius: radii.pill, overflow: 'hidden' as const },
    barFill: { height: 12, backgroundColor: c.primary },
    barCount: { ...typography.caption, color: c.text, width: 24, textAlign: 'right' as const },
    exportBtn: { marginTop: spacing.lg, alignSelf: 'center' as const, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: c.primary, borderRadius: radii.pill },
    exportText: { ...typography.body, color: c.primary, fontWeight: '600' as const },
  }));

  const cutoff = Date.now() - period * 86_400_000;
  const inPeriod = orders.filter((o) => {
    const at = o.placed_at ? new Date(o.placed_at).getTime() : 0;
    return at >= cutoff;
  });
  const completed = inPeriod.filter((o) => ['completed', 'delivered'].includes(o.status));
  const totalEarned = completed.reduce((s, o) => s + o.total_amount, 0);
  const inProgress = inPeriod.filter((o) => o.status === 'in_progress').length;
  const byStatus: Record<string, number> = {};
  for (const o of inPeriod) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  const maxCount = Math.max(...Object.values(byStatus), 1);

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
        <Card style={styles.summaryCard}><Text style={styles.statValue}>{formatters.inr(totalEarned)}</Text><Text style={styles.statLabel}>Earned</Text></Card>
        <Card style={styles.summaryCard}><Text style={styles.statValue}>{completed.length}</Text><Text style={styles.statLabel}>Completed</Text></Card>
        <Card style={styles.summaryCard}><Text style={styles.statValue}>{inProgress}</Text><Text style={styles.statLabel}>In progress</Text></Card>
      </View>
      {Object.keys(byStatus).length > 0 && (
        <Card>
          <Text style={styles.sectionLabel}>ORDERS BY STATUS</Text>
          {Object.entries(byStatus).map(([status, count]) => (
            <View key={status} style={styles.barRow}>
              <Text style={styles.barLabel}>{status.replace('_', ' ')}</Text>
              <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(count / maxCount) * 100}%` as `${number}%` }]} /></View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </Card>
      )}
      <Pressable style={styles.exportBtn} onPress={() => Alert.alert('Export', 'CSV export available when backend endpoint is connected.')}>
        <Text style={styles.exportText}>Export CSV</Text>
      </Pressable>
    </ScreenContainer>
  );
}
