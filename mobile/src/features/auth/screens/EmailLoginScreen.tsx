import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { spacing, typography, useThemedStyles } from '@/theme';
import { validators } from '@/utils/validators';

import type { AuthScreenProps } from '@/navigation/types';

export function EmailLoginScreen({ navigation }: AuthScreenProps<'EmailLogin'>) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    switchLink: {
      ...typography.body,
      color: c.primary,
      textAlign: 'center' as const,
      marginTop: spacing.lg,
    },
  }));

  function onContinue() {
    if (!validators.email(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    // TODO: wire up backend email OTP / magic-link flow
    setError('Email sign-in is coming soon. Please use your phone number for now.');
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Sign in with Email</Text>
      <Text style={styles.subtitle}>We'll send you a link to sign in.</Text>
      <Input
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error ?? undefined}
      />
      <Button title="Continue" onPress={onContinue} />
      <Text style={styles.switchLink} onPress={() => navigation.navigate('PhoneLogin')}>
        Use phone number instead
      </Text>
    </ScreenContainer>
  );
}
