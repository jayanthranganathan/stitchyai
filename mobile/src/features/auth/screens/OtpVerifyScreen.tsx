import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { confirmPhoneCode } from '@/lib/firebasePhone';
import { useAuthStore } from '@/store/authStore';
import { radii, spacing, typography, useThemedStyles } from '@/theme';
import { validators } from '@/utils/validators';

import type { AuthScreenProps } from '@/navigation/types';

const DEV_OTP = '123456';

export function OtpVerifyScreen({ route }: AuthScreenProps<'OtpVerify'>) {
  const { phone, firebase } = route.params;
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const firebaseLogin = useAuthStore((s) => s.firebaseLogin);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    devBanner: {
      marginTop: spacing.xl,
      backgroundColor: '#FFF8C5',
      borderWidth: 1,
      borderColor: '#E6C700',
      borderRadius: radii.md,
      padding: spacing.md,
      alignItems: 'center' as const,
    },
    devLabel: {
      fontSize: 13,
      color: '#7A5C00',
      fontWeight: '600' as const,
    },
  }));

  async function onVerify() {
    if (!validators.otp(code)) {
      setError('Enter the 6-digit code we sent you.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (firebase) {
        const idToken = await confirmPhoneCode(code);
        await firebaseLogin(idToken);
      } else {
        await verifyOtp(phone, code);
      }
      // RootNavigator switches to the role's stack automatically.
    } catch {
      setError('Invalid code. Try again or resend.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Enter the OTP</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {phone}.</Text>
      <Input
        label="OTP"
        value={code}
        onChangeText={setCode}
        placeholder="••••••"
        keyboardType="number-pad"
        maxLength={6}
        error={error ?? undefined}
      />
      <Button title="Verify and sign in" onPress={onVerify} loading={loading} />

      {/* DEV-only shortcut — not compiled in production builds */}
      {__DEV__ && (
        <TouchableOpacity style={styles.devBanner} onPress={() => setCode(DEV_OTP)}>
          <Text style={styles.devLabel}>🛠 Dev mode — tap to fill OTP: {DEV_OTP}</Text>
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}
