import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAdminList, useCreateAdmin } from '@/features/admin/hooks/useAdminQueries';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

import type { AdminScreenProps } from '@/navigation/types';

const ROLES = ['ops', 'support', 'super_admin'] as const;
type Role = (typeof ROLES)[number];

const ROLE_COLOR: Record<string, string> = {
  super_admin: '#7B2D26',
  ops: '#1F7A4D',
  support: '#C99A4B',
};

export function ManageAdminsScreen({}: AdminScreenProps<'ManageAdmins'>) {
  const { data: admins = [], isLoading, refetch } = useAdminList();
  const { mutateAsync: createAdmin, isPending } = useCreateAdmin();
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('ops');

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text },
    name: { ...typography.h2, color: c.text },
    muted: { ...typography.caption, color: c.textMuted, marginTop: spacing.xs },
    empty: { ...typography.body, color: c.textMuted },
    formTitle: { ...typography.h2, color: c.text, marginBottom: spacing.sm },
    roleLabel: { ...typography.body, color: c.text, marginTop: spacing.sm, marginBottom: spacing.xs },
    header: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: spacing.md },
    addBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: c.primary },
    addBtnText: { ...typography.body, color: '#fff', fontWeight: '600' as const },
    row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const },
    flex: { flex: 1, marginRight: spacing.sm },
    chips: { flexDirection: 'row' as const, gap: spacing.sm, marginBottom: spacing.md },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, borderWidth: 1, borderColor: c.border },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { ...typography.caption, color: c.textMuted, textTransform: 'capitalize' as const },
    chipTextActive: { color: '#fff', fontWeight: '600' as const },
    roleBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill },
    roleBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' as const, textTransform: 'capitalize' as const },
    borderFallback: c.border,
  }));

  async function submit() {
    if (!phone.trim() || !fullName.trim()) { Alert.alert('Required fields', 'Phone and full name are required.'); return; }
    try {
      await createAdmin({ phone: phone.trim(), full_name: fullName.trim(), email: email.trim() || undefined, role });
      setPhone(''); setFullName(''); setEmail(''); setRole('ops');
      setShowForm(false);
      Alert.alert('Admin created', `${fullName} has been added as ${role}.`);
    } catch {
      Alert.alert('Failed', 'Could not create admin. Check the details and try again.');
    }
  }

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin users</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </Pressable>
      </View>
      {showForm && (
        <Card>
          <Text style={styles.formTitle}>New administrator</Text>
          <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
          <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
          <Input label="Email (optional)" value={email} onChangeText={setEmail} placeholder="jane@example.com" keyboardType="email-address" />
          <Text style={styles.roleLabel}>Role</Text>
          <View style={styles.chips}>
            {ROLES.map((r) => (
              <Pressable key={r} style={[styles.chip, role === r && styles.chipActive]} onPress={() => setRole(r)}>
                <Text style={[styles.chipText, role === r && styles.chipTextActive]}>{r.replace('_', ' ')}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Create admin" onPress={submit} loading={isPending} />
        </Card>
      )}
      {isLoading && <Text style={styles.muted}>Loading…</Text>}
      <FlatList
        data={admins}
        keyExtractor={(a) => a.id}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.name}>{item.full_name ?? 'Unknown'}</Text>
                <Text style={styles.muted}>{item.phone}</Text>
                {item.email && <Text style={styles.muted}>{item.email}</Text>}
              </View>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_COLOR[item.role] ?? styles.borderFallback }]}>
                <Text style={styles.roleBadgeText}>{item.role.replace('_', ' ')}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={!isLoading && !showForm ? <Card><Text style={styles.empty}>No admin accounts yet.</Text></Card> : null}
      />
    </ScreenContainer>
  );
}
