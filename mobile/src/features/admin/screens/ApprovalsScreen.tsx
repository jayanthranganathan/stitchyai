import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  useApproveDelivery,
  useApproveOrder,
  useApproveTailor,
  useApprovals,
  useAssignOrder,
  type ApprovalItem,
} from '@/features/admin/hooks/useAdminQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { AdminScreenProps } from '@/navigation/types';

const TABS = [
  { key: 'tailor',    label: 'Tailors'   },
  { key: 'delivery',  label: 'Delivery'  },
  { key: 'order',     label: 'Orders'    },
] as const;
type TabKey = (typeof TABS)[number]['key'];

// ─── Interest row type embedded in details ─────────────────────────────────
type TailorInterestRow = {
  tailor_id: string;
  tailor_name: string | null;
  note: string | null;
  expected_delivery_date: string | null;
};

export function ApprovalsScreen(_props: AdminScreenProps<'Approvals'>) {
  const [tab, setTab] = useState<TabKey>('tailor');
  const [tailorIdForOrder, setTailorIdForOrder] = useState<Record<string, string>>({});

  const { data: items = [], isLoading, refetch } = useApprovals(tab);
  const { mutateAsync: approveTailor,  isPending: tailorPending   } = useApproveTailor();
  const { mutateAsync: approveDelivery, isPending: deliveryPending } = useApproveDelivery();
  const { mutateAsync: approveOrder,   isPending: orderApprovePending } = useApproveOrder();
  const { mutateAsync: assignOrder,    isPending: assignPending    } = useAssignOrder();

  const styles = useThemedStyles((c) => ({
    title:       { ...typography.h1,      color: c.text,     marginBottom: spacing.md },
    muted:       { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
    empty:       { ...typography.body,    color: c.textMuted },
    name:        { ...typography.h2,      color: c.text },
    tabs:        { flexDirection: 'row' as const, marginBottom: spacing.md, borderBottomWidth: 1, borderColor: c.border },
    tab:         { flex: 1, alignItems: 'center' as const, paddingVertical: spacing.sm },
    tabActive:   { borderBottomWidth: 2, borderColor: c.primary },
    tabText:     { ...typography.body, color: c.textMuted },
    tabTextActive: { color: c.primary, fontWeight: '600' as const },
    actionRow:   { flexDirection: 'row' as const, gap: spacing.sm, marginTop: spacing.md },
    assignRow:   { flexDirection: 'row' as const, gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' as const },
    tailorInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      ...typography.body,
      color: c.text,
    },
    interestCard: {
      backgroundColor: c.background,
      borderRadius: radii.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    interestName: { ...typography.body, color: c.text, fontWeight: '600' as const },
    badge: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      marginTop: spacing.sm,
    },
    badgePlaced:    { backgroundColor: '#FEF9C3' },
    badgeConfirmed: { backgroundColor: '#EDE9FE' },
    badgePlacedText:    { color: '#92400E', fontSize: 10, fontWeight: '700' as const },
    badgeConfirmedText: { color: '#5B21B6', fontSize: 10, fontWeight: '700' as const },
  }));

  // ── Tailor/Delivery approval ──────────────────────────────────────────────
  async function handleApprove(item: ApprovalItem, approve: boolean) {
    const reason = approve ? undefined : await promptReason();
    try {
      if (item.kind === 'tailor')    await approveTailor({ id: item.id, approve, reason });
      else if (item.kind === 'delivery') await approveDelivery({ id: item.id, approve, reason });
      Alert.alert(
        approve ? 'Approved' : 'Rejected',
        `${item.name ?? item.id} has been ${approve ? 'approved' : 'rejected'}.`,
      );
    } catch {
      Alert.alert('Failed', 'Could not process approval. Try again.');
    }
  }

  // ── Order: Approve (placed → confirmed) ──────────────────────────────────
  async function handleApproveOrder(orderId: string) {
    try {
      await approveOrder(orderId);
      Alert.alert('Approved', 'Order is now visible to tailors.');
    } catch {
      Alert.alert('Failed', 'Could not approve order. Try again.');
    }
  }

  // ── Order: Assign tailor (confirmed → assigned) ───────────────────────────
  async function handleAssign(orderId: string) {
    const tailorId = tailorIdForOrder[orderId]?.trim();
    if (!tailorId) { Alert.alert('Enter tailor ID', 'Tap a tailor row to fill the ID, or paste it manually.'); return; }
    try {
      await assignOrder({ orderId, tailorId });
      Alert.alert('Assigned', 'Tailor assigned to order.');
      setTailorIdForOrder((prev) => ({ ...prev, [orderId]: '' }));
    } catch {
      Alert.alert('Failed', 'Could not assign tailor. Check the ID and try again.');
    }
  }

  function promptReason(): Promise<string | undefined> {
    return new Promise((resolve) => {
      if (Alert.prompt) Alert.prompt('Rejection reason', 'Optional — leave blank to skip', resolve);
      else resolve(undefined);
    });
  }

  // ── Render one order approval card ────────────────────────────────────────
  function renderOrderCard(item: ApprovalItem) {
    const d = item.details as Record<string, unknown>;
    const action = d.action as string | undefined;             // "approve" | "assign"
    const interests = (d.interests ?? []) as TailorInterestRow[];
    const amount = d.total_amount as number | undefined;
    const customerName = d.customer_name as string | null | undefined;
    const eta = d.expected_delivery_date as string | null | undefined;

    return (
      <Card>
        {/* Status badge */}
        <View style={[styles.badge, action === 'approve' ? styles.badgePlaced : styles.badgeConfirmed]}>
          <Text style={action === 'approve' ? styles.badgePlacedText : styles.badgeConfirmedText}>
            {action === 'approve' ? '⏳ Pending approval' : '✅ Confirmed — awaiting assignment'}
          </Text>
        </View>

        <Text style={[styles.name, { marginTop: spacing.sm }]}>{item.name ?? 'Order'}</Text>
        {customerName && <Text style={styles.muted}>Customer: {customerName}</Text>}
        {amount != null && <Text style={styles.muted}>Amount: {formatters.inr(amount)}</Text>}
        {eta && <Text style={styles.muted}>Expected by: {formatters.dateLong(eta)}</Text>}
        <Text style={styles.muted}>Placed: {new Date(item.submitted_at).toLocaleDateString()}</Text>

        {action === 'approve' && (
          /* ── Approve button ── */
          <View style={styles.actionRow}>
            <Button
              title="✓ Approve order"
              onPress={() => handleApproveOrder(item.id)}
              loading={orderApprovePending}
            />
          </View>
        )}

        {action === 'assign' && (
          /* ── Interested tailors list + assign ── */
          <View style={{ marginTop: spacing.sm }}>
            {interests.length === 0 ? (
              <Text style={styles.muted}>No tailors have expressed interest yet.</Text>
            ) : (
              <>
                <Text style={[styles.muted, { marginBottom: spacing.xs }]}>
                  {interests.length} tailor{interests.length > 1 ? 's' : ''} interested:
                </Text>
                {interests.map((i) => (
                  <Pressable
                    key={i.tailor_id}
                    style={styles.interestCard}
                    onPress={() => setTailorIdForOrder((p) => ({ ...p, [item.id]: i.tailor_id }))}
                  >
                    <Text style={styles.interestName}>{i.tailor_name ?? 'Unknown tailor'}</Text>
                    {i.expected_delivery_date && (
                      <Text style={styles.muted}>
                        Can deliver by {formatters.dateLong(i.expected_delivery_date)}
                      </Text>
                    )}
                    {i.note && <Text style={styles.muted}>Note: {i.note}</Text>}
                    <Text style={[styles.muted, { color: '#7C3AED' }]}>Tap to select →</Text>
                  </Pressable>
                ))}
              </>
            )}

            <View style={styles.assignRow}>
              <TextInput
                style={styles.tailorInput}
                placeholder="Tailor profile ID (tap row above or paste)"
                value={tailorIdForOrder[item.id] ?? ''}
                onChangeText={(v) => setTailorIdForOrder((p) => ({ ...p, [item.id]: v }))}
              />
              <Button
                title="Assign"
                onPress={() => handleAssign(item.id)}
                loading={assignPending}
              />
            </View>
          </View>
        )}
      </Card>
    );
  }

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>Approvals</Text>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading && <Text style={styles.muted}>Loading…</Text>}
      {!isLoading && items.length === 0 && (
        <Card><Text style={styles.empty}>No pending {tab} approvals.</Text></Card>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={({ item }) => {
          if (item.kind === 'order') return renderOrderCard(item);

          /* ── Tailor / Delivery card ── */
          return (
            <Card>
              <Text style={styles.name}>{item.name ?? 'Unknown'}</Text>
              <Text style={styles.muted}>ID: {item.id.slice(0, 12)}…</Text>
              <Text style={styles.muted}>Submitted: {new Date(item.submitted_at).toLocaleDateString()}</Text>
              <View style={styles.actionRow}>
                <Button
                  title="Approve"
                  onPress={() => handleApprove(item, true)}
                  loading={tailorPending || deliveryPending}
                />
                <Button
                  title="Reject"
                  variant="ghost"
                  onPress={() => handleApprove(item, false)}
                  loading={tailorPending || deliveryPending}
                />
              </View>
            </Card>
          );
        }}
      />
    </ScreenContainer>
  );
}
