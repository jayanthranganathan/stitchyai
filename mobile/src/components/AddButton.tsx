import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
};

/** Circular gradient "+" button used on product cards. */
export function AddButton({ onPress, size = 30, accessibilityLabel = 'Add' }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.9 : 1 }] })}
    >
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 4,
        }}
      >
        <Text style={{ color: '#fff', fontSize: size * 0.6, fontWeight: '600', marginTop: -2 }}>+</Text>
      </LinearGradient>
    </Pressable>
  );
}
