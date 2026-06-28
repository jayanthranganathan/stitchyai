import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { signInWithEmail, signUpWithEmail } from '@/lib/firebaseEmail';
import { useAuthStore } from '@/store/authStore';
import { spacing, typography, useThemedStyles } from '@/theme';
import { validators } from '@/utils/validators';

import type { AuthScreenProps } from '@/navigation/types';

const USE_FIREBASE = Boolean(Constants.expoConfig?.extra?.useFirebaseAuth);

export function EmailLoginScreen({ navigation }: AuthScreenProps<'EmailLogin'>) {
  const firebaseLogin = useAuthStore((s) => s.firebaseLogin);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    switchLink: { ...typography.body, color: c.primary, textAlign: 'center' as const, marginTop: spacing.lg },
    muted: { color: c.textMuted, fontSize: 13 },
  }));

  async function onSubmit() {
    if (!validators.email(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!USE_FIREBASE) {
      setError('Email sign-in needs the production build. Use phone for now.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const idToken = mode === 'signup'
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
      await firebaseLogin(idToken);
      // RootNavigator switches to the customer stack automatically.
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(emailErrorMessage(code) ?? 'Could not continue. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</Text>
      <Text style={styles.subtitle}>
        {mode === 'signup' ? 'Sign up with your email and a password.' : 'Sign in with your email and password.'}
      </Text>
      <Input
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        error={error ?? undefined}
      />
      <Button
        title={mode === 'signup' ? 'Create account' : 'Sign in'}
        onPress={onSubmit}
        loading={loading}
      />
      <Text style={styles.switchLink} onPress={() => { setError(null); setMode(mode === 'signup' ? 'signin' : 'signup'); }}>
        {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </Text>
      <Pressable onPress={() => navigation.navigate('PhoneLogin')} style={{ marginTop: spacing.md, alignItems: 'center' }}>
        <Text style={styles.muted}>Use phone number instead</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function emailErrorMessage(code?: string): string | null {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Password is too weak — use at least 6 characters.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong email or password.';
    case 'auth/user-not-found':
      return 'No account with that email. Create one instead.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return code ? `Sign-in failed (${code})` : null;
  }
}
