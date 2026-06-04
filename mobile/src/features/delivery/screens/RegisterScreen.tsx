import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { deliveryApi } from '@/features/delivery/api';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

import type { DeliveryScreenProps } from '@/navigation/types';

const VEHICLES = [
  { slug: 'bike', icon: '🏍️', label: 'Bike' },
  { slug: 'scooter', icon: '🛵', label: 'Scooter' },
  { slug: 'bicycle', icon: '🚲', label: 'Bicycle' },
  { slug: 'car', icon: '🚗', label: 'Car' },
] as const;

type Vehicle = (typeof VEHICLES)[number]['slug'];

export function RegisterScreen({ navigation }: DeliveryScreenProps<'Register'>) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    section: { ...typography.h2, color: c.text, marginBottom: spacing.sm },
    grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.lg },
    vehicleCard: {
      width: '47%' as `${number}%`,
      alignItems: 'center' as const,
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 2,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    vehicleCardActive: { borderColor: c.primary, backgroundColor: c.background },
    vehicleIcon: { fontSize: 36, marginBottom: spacing.xs },
    vehicleLabel: { ...typography.body, color: c.textMuted },
    vehicleLabelActive: { color: c.primary, fontWeight: '600' as const },
    docNote: { backgroundColor: '#FFF8C5', borderRadius: radii.md, padding: spacing.md, marginVertical: spacing.md },
    docText: { ...typography.caption, color: '#7A5C00' },
  }));

  async function submit() {
    if (!vehicle) {
      Alert.alert('Select vehicle', 'Please choose your vehicle type.');
      return;
    }
    setLoading(true);
    try {
      await deliveryApi.register({ vehicle_type: vehicle, city: city.trim() || undefined });
      Alert.alert('Application submitted!', 'An admin will approve within 24–48 hours.', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
      ]);
    } catch {
      Alert.alert('Failed', 'Could not submit. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Complete registration</Text>
      <Text style={styles.subtitle}>Tell us about your vehicle. An admin will verify and approve your profile.</Text>
      <Text style={styles.section}>Your vehicle</Text>
      <View style={styles.grid}>
        {VEHICLES.map((v) => (
          <Pressable
            key={v.slug}
            style={[styles.vehicleCard, vehicle === v.slug && styles.vehicleCardActive]}
            onPress={() => setVehicle(v.slug)}
          >
            <Text style={styles.vehicleIcon}>{v.icon}</Text>
            <Text style={[styles.vehicleLabel, vehicle === v.slug && styles.vehicleLabelActive]}>{v.label}</Text>
          </Pressable>
        ))}
      </View>
      <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Chennai" />
      <View style={styles.docNote}>
        <Text style={styles.docText}>📄 License and Aadhaar upload will be collected during onboarding call.</Text>
      </View>
      <Button title="Submit application" onPress={submit} loading={loading} />
    </ScreenContainer>
  );
}
