import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { spacing, useTheme } from '@/theme';

import type { Address, User } from '@/types';
import type { CustomerScreenProps } from '@/navigation/types';

const EMPTY_ADDRESS: Address = {
  label: 'Home',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
};

export function EditProfileScreen({ navigation }: CustomerScreenProps<'EditProfile'>) {
  const { colors } = useTheme();
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addr, setAddr] = useState<Address>(EMPTY_ADDRESS);

  // Fetch fresh profile (includes saved addresses, which login alone doesn't return)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await apiClient.get<User>(endpoints.users.me);
        if (!active) return;
        setFullName(data.full_name ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        if (data.addresses && data.addresses.length > 0) setAddr({ ...EMPTY_ADDRESS, ...data.addresses[0] });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function setAddrField<K extends keyof Address>(key: K, value: Address[K]) {
    setAddr((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    // Only send the address if at least the essentials are filled
    const hasAddress = addr.line1.trim() && addr.city.trim() && addr.pincode.trim();
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        addresses: hasAddress ? [{ ...addr, label: addr.label.trim() || 'Home' }] : undefined,
      });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Could not save', 'Please check your details and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: spacing.xl }}>

          {/* ── Basic details ── */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 }}>👤 Basic details</Text>
          <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
            <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* ── Verification ── */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 10 }}>✅ Verification</Text>
          <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, gap: 12 }}>
            <VerifyRow
              label="Phone number"
              value={phone || '—'}
              verified
              colors={colors}
            />
            <View style={{ height: 0.5, backgroundColor: colors.border }} />
            <VerifyRow
              label="Email address"
              value={email.trim() ? email.trim() : 'Not added'}
              verified={false}
              pendingLabel={email.trim() ? 'Unverified' : 'Add email'}
              colors={colors}
            />
          </View>

          {/* ── Default address ── */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 10 }}>📍 Default address</Text>
          <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
            <Input label="Label" value={addr.label} onChangeText={(v) => setAddrField('label', v)} placeholder="Home / Office" />
            <Input label="Address line 1" value={addr.line1} onChangeText={(v) => setAddrField('line1', v)} placeholder="House no, street" />
            <Input label="Address line 2 (optional)" value={addr.line2 ?? ''} onChangeText={(v) => setAddrField('line2', v)} placeholder="Area, locality" />
            <Input label="City" value={addr.city} onChangeText={(v) => setAddrField('city', v)} placeholder="Chennai" />
            <Input label="State" value={addr.state} onChangeText={(v) => setAddrField('state', v)} placeholder="Tamil Nadu" />
            <Input label="Pincode" value={addr.pincode} onChangeText={(v) => setAddrField('pincode', v)} placeholder="600040" keyboardType="number-pad" />
            <Input label="Landmark (optional)" value={addr.landmark ?? ''} onChangeText={(v) => setAddrField('landmark', v)} placeholder="Near…" />
          </View>

          <View style={{ marginTop: 20 }}>
            <Button title="Save changes" onPress={() => void onSave()} loading={saving} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function VerifyRow({
  label,
  value,
  verified,
  pendingLabel = 'Pending',
  colors,
}: {
  label: string;
  value: string;
  verified: boolean;
  pendingLabel?: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 1 }} numberOfLines={1}>{value}</Text>
      </View>
      <View style={{ backgroundColor: verified ? '#E7F3EA' : colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: verified ? '#1F8A4C' : colors.textMuted }}>
          {verified ? '✓ Verified' : pendingLabel}
        </Text>
      </View>
    </View>
  );
}
