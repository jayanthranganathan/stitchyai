import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { spacing, typography, useThemedStyles } from '@/theme';
import { validators } from '@/utils/validators';

import type { AuthScreenProps } from '@/navigation/types';

export function PhoneLoginScreen({ navigation }: AuthScreenProps<'PhoneLogin'>) {
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function onContinue() {
    if (!validators.phone(phone)) {
      setError('Enter a valid phone number with country code, e.g. +919876543210');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
    } catch {
      // In dev the backend InMemory provider accepts 123456 for any number,
      // so navigate anyway. A real send failure in production blocks here.
      if (!__DEV__) {
        setError('Could not send OTP. Try again.');
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    navigation.navigate('OtpVerify', { phone });
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Sign in with Phone</Text>
      <Text style={styles.subtitle}>We'll send a one-time password to verify your number.</Text>
      <Input
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        placeholder="+91 98765 43210"
        keyboardType="phone-pad"
        autoComplete="tel"
        error={error ?? undefined}
      />
      <Button title="Send OTP" onPress={onContinue} loading={loading} />
      <Text style={styles.switchLink} onPress={() => navigation.navigate('EmailLogin')}>
        Use email instead
      </Text>
    </ScreenContainer>
  );
}
