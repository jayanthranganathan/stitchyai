import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable,
  ScrollView, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { DatePickerInput } from '@/components/DatePickerInput';
import { Input } from '@/components/Input';
import { spacing, useTheme } from '@/theme';

import type { CustomerScreenProps } from '@/navigation/types';

// ─── measurement config ───────────────────────────────────────────────────────

const MEASUREMENT_FIELDS: Record<string, { label: string; unit: string }[]> = {
  blouse: [
    { label: 'Bust', unit: 'inches' },
    { label: 'Waist', unit: 'inches' },
    { label: 'Hip', unit: 'inches' },
    { label: 'Sleeve length', unit: 'inches' },
    { label: 'Blouse length', unit: 'inches' },
  ],
  'saree-blouse': [
    { label: 'Bust', unit: 'inches' },
    { label: 'Waist', unit: 'inches' },
    { label: 'Sleeve length', unit: 'inches' },
    { label: 'Blouse length', unit: 'inches' },
  ],
  kurti: [
    { label: 'Bust', unit: 'inches' },
    { label: 'Waist', unit: 'inches' },
    { label: 'Hip', unit: 'inches' },
    { label: 'Length', unit: 'inches' },
    { label: 'Shoulder', unit: 'inches' },
  ],
  shirt: [
    { label: 'Chest', unit: 'inches' },
    { label: 'Waist', unit: 'inches' },
    { label: 'Shoulder', unit: 'inches' },
    { label: 'Sleeve length', unit: 'inches' },
    { label: 'Shirt length', unit: 'inches' },
  ],
  pants: [
    { label: 'Waist', unit: 'inches' },
    { label: 'Hip', unit: 'inches' },
    { label: 'Inseam', unit: 'inches' },
    { label: 'Length', unit: 'inches' },
  ],
  'co-ord': [
    { label: 'Bust / Chest', unit: 'inches' },
    { label: 'Waist', unit: 'inches' },
    { label: 'Hip', unit: 'inches' },
    { label: 'Top length', unit: 'inches' },
    { label: 'Bottom length', unit: 'inches' },
  ],
  frock: [
    { label: 'Bust', unit: 'inches' },
    { label: 'Waist', unit: 'inches' },
    { label: 'Hip', unit: 'inches' },
    { label: 'Length', unit: 'inches' },
  ],
  'pattu-pavadai': [
    { label: 'Chest', unit: 'inches' },
    { label: 'Waist', unit: 'inches' },
    { label: 'Skirt length', unit: 'inches' },
  ],
  custom: [
    { label: 'Bust / Chest', unit: 'inches' },
    { label: 'Waist', unit: 'inches' },
    { label: 'Hip', unit: 'inches' },
    { label: 'Length', unit: 'inches' },
  ],
};

const toKey = (label: string) => label.toLowerCase().replace(/[\s/]+/g, '_');

const MAX_REF_IMAGES = 5;

// ─── component ────────────────────────────────────────────────────────────────

export function CreateOrderScreen({ route, navigation }: CustomerScreenProps<'CreateOrder'>) {
  const { designId, categorySlug = 'custom' } = route.params ?? {};
  const { colors } = useTheme();

  const fields = MEASUREMENT_FIELDS[categorySlug] ?? MEASUREMENT_FIELDS.custom ?? [];
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [refImages, setRefImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function setField(label: string, value: string) {
    setMeasurements((prev) => ({ ...prev, [toKey(label)]: value }));
  }

  async function addRefImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow photo library access in Settings to attach reference images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_REF_IMAGES - refImages.length,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setRefImages((prev) => [...prev, ...newUris].slice(0, MAX_REF_IMAGES));
    }
  }

  function removeRefImage(idx: number) {
    setRefImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadReferenceImages(orderId: string, uris: string[]) {
    for (const uri of uris) {
      try {
        const form = new FormData();
        form.append('image', { uri, name: 'reference.jpg', type: 'image/jpeg' } as unknown as Blob);
        await apiClient.post(endpoints.orders.attachments(orderId), form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        // Silently skip — order was already created
      }
    }
  }

  async function placeOrder() {
    const numericMeasurements: Record<string, number> = {};
    for (const f of fields) {
      const val = parseFloat(measurements[toKey(f.label)] ?? '');
      if (isNaN(val) || val <= 0) {
        Alert.alert('Missing measurement', `Please enter a valid value for "${f.label}".`);
        return;
      }
      numericMeasurements[toKey(f.label)] = val;
    }
    if (!deliveryDate) {
      Alert.alert('Delivery date required', 'Please pick an expected delivery date.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post<{ id: string }>(endpoints.orders.create, {
        design_id: designId ?? null,
        category_slug: categorySlug,
        measurements: numericMeasurements,
        expected_delivery_date: deliveryDate,
        notes: notes.trim() || null,
        quantity: 1,
      });

      // Upload reference images in the background (non-blocking)
      if (refImages.length > 0) {
        void uploadReferenceImages(data.id, refImages);
      }

      navigation.replace('OrderTrack', { orderId: data.id });
    } catch {
      Alert.alert('Order failed', 'Could not place the order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 }}>
              Place your order
            </Text>
            {categorySlug !== 'custom' && (
              <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 6 }}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}
                >
                  <Text style={{
                    fontSize: 10, color: '#fff', fontWeight: '700' as const,
                    textTransform: 'capitalize' as const, letterSpacing: 0.5,
                  }}>
                    {categorySlug.replace(/-/g, ' ')}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: 16, gap: 16 }}>

            {/* ── Design confirmation (if from Designs screen) ── */}
            {designId && (
              <View style={{
                backgroundColor: colors.surface, borderWidth: 1.5,
                borderColor: colors.border, borderRadius: 14,
                overflow: 'hidden' as const, flexDirection: 'row' as const,
              }}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={{ width: 3 }}
                />
                <View style={{ padding: 12 }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' as const, letterSpacing: 0.5 }}>
                    DESIGN SELECTED
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '600' as const }}>
                    {categorySlug.replace(/-/g, ' ')} — tap Back to change
                  </Text>
                </View>
              </View>
            )}

            {/* ── Measurements ── */}
            <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.text, marginBottom: 12 }}>
                📐 Measurements
              </Text>
              <View style={{ gap: 4 }}>
                {fields.map((f) => (
                  <Input
                    key={f.label}
                    label={`${f.label} (${f.unit})`}
                    value={measurements[toKey(f.label)] ?? ''}
                    onChangeText={(v) => setField(f.label, v)}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                  />
                ))}
              </View>
            </View>

            {/* ── Delivery details ── */}
            <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.text, marginBottom: 12 }}>
                🗓 Delivery details
              </Text>
              <View style={{ gap: 4 }}>
                <DatePickerInput
                  label="Expected delivery date *"
                  value={deliveryDate}
                  onChangeDate={setDeliveryDate}
                  minimumDate={new Date()}
                  placeholder="Tap to pick a date"
                />
                <Input
                  label="Special instructions (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Neck style, lining, embroidery notes…"
                />
              </View>
            </View>

            {/* ── Reference images ── */}
            <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
              <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: 4 }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.text }}>
                    🖼 Reference images
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    Photos of designs / styles you like (optional, max {MAX_REF_IMAGES})
                  </Text>
                </View>
                {refImages.length > 0 && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.border, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' as const }}>
                      {refImages.length}/{MAX_REF_IMAGES}
                    </Text>
                  </View>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingTop: 10, paddingBottom: 2 }}
              >
                {/* Thumbnails */}
                {refImages.map((uri, idx) => (
                  <View key={uri} style={{ position: 'relative' as const }}>
                    <Image
                      source={{ uri }}
                      style={{ width: 80, height: 80, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => removeRefImage(idx)}
                      style={{
                        position: 'absolute' as const, top: -6, right: -6,
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: '#EF4444',
                        alignItems: 'center' as const, justifyContent: 'center' as const,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' as const }}>✕</Text>
                    </Pressable>
                  </View>
                ))}

                {/* Add button */}
                {refImages.length < MAX_REF_IMAGES && (
                  <Pressable onPress={() => void addRefImage()}>
                    <View style={{
                      width: 80, height: 80, borderRadius: 12,
                      borderWidth: 1.5, borderColor: colors.primary,
                      borderStyle: 'dashed' as const,
                      alignItems: 'center' as const, justifyContent: 'center' as const,
                      backgroundColor: colors.background,
                    }}>
                      <Text style={{ fontSize: 24, color: colors.primary }}>+</Text>
                      <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2, textAlign: 'center' as const }}>
                        Add photo
                      </Text>
                    </View>
                  </Pressable>
                )}
              </ScrollView>
            </View>

            {/* ── Confirm button ── */}
            <Pressable onPress={() => void placeOrder()} disabled={loading}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 14, paddingVertical: 16,
                  alignItems: 'center' as const,
                  opacity: loading ? 0.7 : 1,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff', letterSpacing: 0.3 }}>
                      Confirm order →
                    </Text>
                }
              </LinearGradient>
            </Pressable>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
