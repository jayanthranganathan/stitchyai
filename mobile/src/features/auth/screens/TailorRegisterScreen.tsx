import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

const EXPERTISE_OPTIONS = ['Blouse', 'Kurti', 'Shirt', 'Pants', 'Saree Blouse', 'Custom / Bridal'];

export function TailorRegisterScreen() {
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const styles = useThemedStyles((c) => ({
    scroll: { paddingBottom: spacing.xl },
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    sectionLabel: { ...typography.caption, color: c.text, fontWeight: '700' as const, marginBottom: spacing.sm, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.lg },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipSelected: { borderColor: c.primary, backgroundColor: '#FAF0EE' },
    chipText: { ...typography.caption, color: c.text, fontWeight: '600' as const },
    chipTextSelected: { color: c.primary },
    multiline: { height: 80, textAlignVertical: 'top' as const, paddingTop: spacing.sm },
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

  function toggleExpertise(item: string) {
    setExpertise((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  }

  async function onSubmit() {
    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!city.trim()) { setError('City is required.'); return; }
    if (expertise.length === 0) { setError('Select at least one area of expertise.'); return; }
    setError(null);
    setLoading(true);
    try {
      // TODO: POST /tailors/register { full_name, city, bio, expertise }
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
            Our team will review your profile and documents. You'll receive a notification once approved — usually within 24 hours.
          </Text>
        </View>
        <Button
          title="Continue to app"
          onPress={() => { void setActiveRole('tailor'); }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Become a Tailor</Text>
        <Text style={styles.subtitle}>
          Tell us about your skills. An admin will review your application before you can accept orders.
        </Text>

        <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Ravi Kumar" autoComplete="name" />
        <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Chennai" />
        <Input
          label="Short bio (optional)"
          value={bio}
          onChangeText={setBio}
          placeholder="e.g. 10 years experience in silk blouses and bridal wear"
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <Text style={styles.sectionLabel}>Areas of expertise</Text>
        <View style={styles.chipRow}>
          {EXPERTISE_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, expertise.includes(item) && styles.chipSelected]}
              onPress={() => toggleExpertise(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, expertise.includes(item) && styles.chipTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.docNote}>
          <Text style={styles.docNoteTitle}>📄 Documents required</Text>
          <Text style={styles.docNoteBody}>
            Aadhaar / PAN upload will be available in the next step after account review.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Submit application" onPress={onSubmit} loading={loading} />
      </ScrollView>
    </ScreenContainer>
  );
}
