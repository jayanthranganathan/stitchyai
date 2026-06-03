import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { tailorApi } from '@/features/tailor/api';
import { radii, spacing, typography, useThemedStyles } from '@/theme';

import type { TailorScreenProps } from '@/navigation/types';

const EXPERTISE_OPTIONS = ['blouse', 'kurti', 'shirt', 'pants', 'saree-blouse', 'custom'];

export function RegisterScreen({ navigation }: TailorScreenProps<'Register'>) {
  const [selected, setSelected] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    section: { ...typography.h2, color: c.text, marginBottom: spacing.sm },
    chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.lg },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { ...typography.body, color: c.textMuted, textTransform: 'capitalize' as const },
    chipTextActive: { color: '#fff', fontWeight: '600' as const },
    docNote: { backgroundColor: '#FFF8C5', borderRadius: radii.md, padding: spacing.md, marginVertical: spacing.md },
    docText: { ...typography.caption, color: '#7A5C00' },
  }));

  function toggle(slug: string) {
    setSelected((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  }

  async function submit() {
    if (selected.length === 0) {
      Alert.alert('Select expertise', 'Choose at least one category you can stitch.');
      return;
    }
    setLoading(true);
    try {
      await tailorApi.register({ expertise_slugs: selected, bio: bio.trim() || undefined, city: city.trim() || undefined });
      Alert.alert('Application submitted!', 'An admin will review within 24–48 hours.', [
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
      <Text style={styles.subtitle}>Tell us what you can stitch. An admin reviews and approves your profile.</Text>
      <Text style={styles.section}>What do you stitch?</Text>
      <View style={styles.chips}>
        {EXPERTISE_OPTIONS.map((slug) => {
          const active = selected.includes(slug);
          return (
            <Pressable key={slug} style={[styles.chip, active && styles.chipActive]} onPress={() => toggle(slug)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{slug.replace('-', ' ')}</Text>
            </Pressable>
          );
        })}
      </View>
      <Input label="Bio (optional)" value={bio} onChangeText={setBio} placeholder="e.g. 10 years in traditional silk blouses" />
      <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. Chennai" />
      <View style={styles.docNote}>
        <Text style={styles.docText}>📄 Document upload will be collected during onboarding call.</Text>
      </View>
      <Button title="Submit application" onPress={submit} loading={loading} />
    </ScreenContainer>
  );
}
