import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DatePickerInput } from '@/components/DatePickerInput';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAvailableOrders, useSendInterest, type TailorOrder } from '@/features/tailor/hooks/useTailorQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { TailorScreenProps } from '@/navigation/types';

export function AvailableOrdersScreen({}: TailorScreenProps<'AvailableOrders'>) {
  const { data: orders = [], isLoading, refetch } = useAvailableOrders();
  const { mutateAsync: sendInterest, isPending } = useSendInterest();
  const [selected, setSelected] = useState<TailorOrder | null>(null);
  const [note, setNote] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.md },
    orderTitle: { ...typography.h2, color: c.text },
    muted: { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
    empty: { ...typography.body, color: c.text, marginBottom: spacing.xs },
    price: { ...typography.body, color: c.primary, fontWeight: '600' as const },
    row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const },
    flex: { flex: 1, marginRight: spacing.sm },
    link: { ...typography.caption, color: c.primary, fontWeight: '600' as const, marginTop: spacing.sm },
    expressInterest: { alignItems: 'flex-end' as const },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' as const },
    sheet: { backgroundColor: c.surface, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, padding: spacing.lg, paddingBottom: spacing.xl },
    sheetTitle: { ...typography.h2, color: c.text, marginBottom: spacing.xs },
    spacer: { height: spacing.md },
  }));

  async function submitInterest() {
    if (!selected) return;
    if (!expectedDate) {
      Alert.alert('Required', 'Please pick your expected delivery date.');
      return;
    }
    try {
      await sendInterest({
        orderId: selected.id,
        note: note.trim() || undefined,
        expectedDeliveryDate: expectedDate.trim(),
      });
      setSelected(null);
      setNote('');
      setExpectedDate('');
      Alert.alert('Interest sent!', 'The admin will review and assign if you are a good match.');
    } catch {
      Alert.alert('Failed', 'Could not send your interest. Try again.');
    }
  }

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>Available orders</Text>
      {isLoading && <Text style={styles.muted}>Loading…</Text>}
      {!isLoading && orders.length === 0 && (
        <Card>
          <Text style={styles.empty}>No available orders right now.</Text>
          <Text style={styles.muted}>Check back soon — new orders appear here once placed.</Text>
        </Card>
      )}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <Pressable onPress={() => { setSelected(item); setNote(''); setExpectedDate(''); }}>
            <Card>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.orderTitle}>{item.design_name ?? item.category_name ?? 'Custom order'}</Text>
                  <Text style={styles.price}>{formatters.inr(item.total_amount)}</Text>
                </View>
              </View>
              {item.expected_delivery_date && (
                <Text style={styles.muted}>
                  Deliver by {formatters.dateLong(item.expected_delivery_date)} ({formatters.relativeDays(item.expected_delivery_date)})
                </Text>
              )}
              <View style={styles.expressInterest}><Text style={styles.link}>Express interest →</Text></View>
            </Card>
          </Pressable>
        )}
      />
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Express interest</Text>
            <Text style={styles.muted}>{selected?.design_name ?? selected?.category_name} — {formatters.inr(selected?.total_amount ?? 0)}</Text>
            <View style={styles.spacer} />
            <DatePickerInput
              label="Your expected delivery date *"
              value={expectedDate}
              onChangeDate={setExpectedDate}
              minimumDate={new Date()}
              placeholder="Tap to pick a date"
            />
            <View style={styles.spacer} />
            <Input label="Note for admin (optional)" value={note} onChangeText={setNote} placeholder="e.g. Available from Monday, have silk fabric experience" />
            <View style={styles.spacer} />
            <Button title="Send interest" onPress={submitInterest} loading={isPending} />
            <Button title="Cancel" variant="ghost" onPress={() => setSelected(null)} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
