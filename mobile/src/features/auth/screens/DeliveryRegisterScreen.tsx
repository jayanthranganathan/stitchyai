import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

const VEHICLE_TYPES = [
  { key: 'bike', label: '🏍 Bike' },
  { key: 'scooter', label: '🛵 Scooter' },
  { key: 'bicycle', label: '🚲 Bicycle' },
  { key: 'car', label: '🚗 Car' },
];

export function DeliveryRegisterScreen() {
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    sectionLabel: { ...typography.caption, color: c.text, fontWeight: '700' as const, marginBottom: spacing.sm, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    vehicleGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.lg },
    vehicleCard: {
      width: '47%',
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center' as const,
    },
    vehicleCardSelected: { borderColor: c.primary, backgroundColor: '#FAF0EE' },
    vehicleLabel: { ...typography.body, fontWeight: '600' as const, color: c.text },
    docNote: {
      backgroundColor: '#F0F4FF',
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: '#C8D4F0',
      marginBottom: spacing.lg,
    },
    docNoteTitle: { ...typography.caption, fontWeight: '700' as const, color: '#2A4A8C', marginBottom: spacing.xs },
    docNoteBody: { ...typography.caption, color: '#2A4A8C' },
    error: { ...typography.caption, color: c.danger, marginBottom: spacing.md },
    successBox: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: spacing.md },
    successIcon: { fontSize: 56, marginBottom: spacing.md },
    successTitle: { ...typography.h1, color: c.text, textAlign: 'center' as const, marginBottom: spacing.sm },
    successBody: { ...typography.body, color: c.textMuted, textAlign: 'center' as const, lineHeight: 24 },
  }));

  async function onSubmit() {
    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!city.trim()) { setError('City is required.'); return; }
    if (!vehicle) { setError('Please select your vehicle type.'); return; }
    setError(null);
    setLoading(true);
    try {
      // TODO: POST /delivery/register { full_name, city, vehicle_type }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <ScreenContainer>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Application submitted!</Text>
          <Text style={styles.successBody}>
            Our team will verify your documents and approve your account. You'll be notified within 24 hours.
          </Text>
        </View>
        <Button
          title="Continue to app"
          onPress={() => { void setActiveRole('delivery'); }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Become a Delivery Partner</Text>
      <Text style={styles.subtitle}>
        Tell us about yourself and your vehicle. An admin will approve your account before you can start accepting pickups.
      </Text>

      <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Suresh Kumar" autoComplete="name" />
      <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Chennai" />

      <Text style={styles.sectionLabel}>Vehicle type</Text>
      <View style={styles.vehicleGrid}>
        {VEHICLE_TYPES.map((v) => (
          <TouchableOpacity
            key={v.key}
            style={[styles.vehicleCard, vehicle === v.key && styles.vehicleCardSelected]}
            onPress={() => setVehicle(v.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.vehicleLabel}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.docNote}>
        <Text style={styles.docNoteTitle}>📄 Documents required</Text>
        <Text style={styles.docNoteBody}>
          Driving licence and Aadhaar upload will be available after your account is approved.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Submit application" onPress={onSubmit} loading={loading} />
    </ScreenContainer>
  );
}
