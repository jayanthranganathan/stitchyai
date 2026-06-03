import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { spacing, typography, useThemedStyles } from '@/theme';

export function CustomerRegisterScreen() {
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
  }));

  async function onContinue() {
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // TODO: PATCH /users/me with { full_name, city }
      await setActiveRole('customer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>Just a few details to personalise your experience.</Text>

      <Input
        label="Full name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Priya Sharma"
        autoComplete="name"
        error={error ?? undefined}
      />
      <Input
        label="City (optional)"
        value={city}
        onChangeText={setCity}
        placeholder="e.g. Chennai"
      />

      <Button title="Start exploring" onPress={onContinue} loading={loading} />
    </ScreenContainer>
  );
}
