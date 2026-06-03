import type { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';

import { spacing, useThemedStyles } from '@/theme';

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const styles = useThemedStyles((c) => ({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.border,
      padding: 14,
      marginBottom: spacing.sm,
    },
  }));
  return <View style={[styles.card, style]}>{children}</View>;
}
