import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { spacing, typography, useThemedStyles } from '@/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, ...rest }: Props) {
  const styles = useThemedStyles((c) => ({
    wrap: { marginBottom: spacing.md },
    label: { ...typography.caption, color: c.textMuted, marginBottom: spacing.xs, fontWeight: '500' as const },
    input: {
      ...typography.body,
      color: c.text,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      backgroundColor: c.surface,
    },
    inputError: { borderColor: c.danger },
    errorText: { ...typography.caption, color: c.danger, marginTop: spacing.xs },
  }));

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={styles.label.color as string}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
