import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { radii, spacing, typography, useThemedStyles } from '@/theme';
import { formatters } from '@/utils/formatters';

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
] as const;

const GROUP_BY = ['city', 'tailor', 'delivery_partner', 'customer'] as const;
type GroupBy = (typeof GROUP_BY)[number];

type ReportRow = { group: string; total_orders: number; completed_orders: number; total_revenue: number };
type ReportSummary = { total_orders: number; completed_orders: number; total_revenue: number; rows: ReportRow[] };

export function ReportsScreen() {
  const [period, setPeriod] = useState(30);
  const [groupBy, setGroupBy] = useState<GroupBy>('city');

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.md },
    muted: { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
    empty: { ...typography.body, color: c.textMuted },
    sectionLabel: { ...typography.caption, color: c.textMuted, letterSpacing: 0.5, marginBottom: spacing.xs },
    chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.md },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, borderWidth: 1, borderColor: c.border },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { ...typography.caption, color: c.textMuted, textTransform: 'capitalize' as const },
    chipTextActive: { color: '#fff', fontWeight: '600' as const },
    summaryRow: { flexDirection: 'row' as const, gap: spacing.sm, marginBottom: spacing.sm },
    summaryCard: { flex: 1, alignItems: 'center' as const },
    statValue: { ...typography.h2, color: c.primary, textAlign: 'center' as const, fontSize: 16 },
    statLabel: { ...typography.caption, color: c.textMuted, textAlign: 'center' as const, marginTop: spacing.xs },
    row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: spacing.xs },
    groupLabel: { ...typography.body, color: c.text, flex: 1, marginRight: spacing.sm },
    revenue: { ...typography.body, color: c.primary, fontWeight: '600' as const },
    barTrack: { height: 8, backgroundColor: c.border, borderRadius: radii.pill, overflow: 'hidden' as const, marginBottom: spacing.xs },
    barFill: { height: 8, backgroundColor: c.primary },
    exportBtn: { marginTop: spacing.lg, alignSelf: 'center' as const, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: c.primary, borderRadius: radii.pill },
    exportText: { ...typography.body, color: c.primary, fontWeight: '600' as const },
  }));

  const fromDate = new Date(Date.now() - period * 86_400_000).toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', period, groupBy],
    queryFn: async () => {
      const { data } = await apiClient.get<ReportSummary>(endpoints.reports.orders, {
        params: { from: fromDate, to: toDate, group_by: groupBy },
      });
      return data;
    },
  });

  const rows = data?.rows ?? [];
  const maxRevenue = Math.max(...rows.map((r) => r.total_revenue), 1);

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>Reports</Text>
      <View style={styles.chips}>
        {PERIODS.map((p) => (
          <Pressable key={p.days} style={[styles.chip, period === p.days && styles.chipActive]} onPress={() => setPeriod(p.days)}>
            <Text style={[styles.chipText, period === p.days && styles.chipTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionLabel}>GROUP BY</Text>
      <View style={styles.chips}>
        {GROUP_BY.map((g) => (
          <Pressable key={g} style={[styles.chip, groupBy === g && styles.chipActive]} onPress={() => setGroupBy(g)}>
            <Text style={[styles.chipText, groupBy === g && styles.chipTextActive]}>{g.replace('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>
      {isLoading && <Text style={styles.muted}>Loading…</Text>}
      {data && (
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}><Text style={styles.statValue}>{data.total_orders}</Text><Text style={styles.statLabel}>Total orders</Text></Card>
          <Card style={styles.summaryCard}><Text style={styles.statValue}>{data.completed_orders}</Text><Text style={styles.statLabel}>Completed</Text></Card>
          <Card style={styles.summaryCard}><Text style={styles.statValue}>{formatters.inr(data.total_revenue)}</Text><Text style={styles.statLabel}>Revenue</Text></Card>
        </View>
      )}
      <FlatList
        data={rows}
        keyExtractor={(r) => r.group}
        ListEmptyComponent={!isLoading ? <Card><Text style={styles.empty}>No report data for this period.</Text></Card> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.groupLabel}>{item.group}</Text>
              <Text style={styles.revenue}>{formatters.inr(item.total_revenue)}</Text>
            </View>
            <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(item.total_revenue / maxRevenue) * 100}%` as any }]} /></View>
            <Text style={styles.muted}>{item.completed_orders}/{item.total_orders} orders completed</Text>
          </Card>
        )}
      />
      <Pressable style={styles.exportBtn} onPress={() => Alert.alert('Export', 'CSV export available when backend /reports/orders endpoint is connected.')}>
        <Text style={styles.exportText}>Export CSV</Text>
      </Pressable>
    </ScreenContainer>
  );
}
