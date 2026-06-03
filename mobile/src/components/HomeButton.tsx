import { Pressable, Text } from 'react-native';

import { spacing, useThemedStyles } from '@/theme';

type Props = { onPress: () => void };

export function HomeButton({ onPress }: Props) {
  const styles = useThemedStyles((c) => ({
    btn: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: spacing.sm },
    icon: { fontSize: 16 },
    label: { fontSize: 14, color: c.primary, fontWeight: '600' as const },
  }));
  return (
    <Pressable style={styles.btn} onPress={onPress} hitSlop={8}>
      <Text style={styles.icon}>🏠</Text>
      <Text style={styles.label}>Home</Text>
    </Pressable>
  );
}
