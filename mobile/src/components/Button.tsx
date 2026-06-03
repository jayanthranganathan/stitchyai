import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { spacing, useTheme } from '@/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled }: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => ({ opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1, marginBottom: spacing.sm })}
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 12,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.3 }}>{title}</Text>}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => ({
          borderRadius: 12,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          borderWidth: 1.5,
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          marginBottom: spacing.sm,
        })}
      >
        {loading
          ? <ActivityIndicator color={colors.primary} />
          : <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' as const }}>{title}</Text>}
      </Pressable>
    );
  }

  // ghost
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        opacity: isDisabled ? 0.5 : pressed ? 0.7 : 1,
        marginBottom: spacing.xs,
      })}
    >
      {loading
        ? <ActivityIndicator color={colors.textMuted} />
        : <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '500' as const, textDecorationLine: 'underline' as const }}>{title}</Text>}
    </Pressable>
  );
}
