import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { useTheme } from '@/theme';

type Props = { percent: number; height?: number };

export function ProgressBar({ percent, height = 3 }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ height, backgroundColor: colors.border, borderRadius: height, overflow: 'hidden' as const }}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height, width: `${Math.min(Math.max(percent, 0), 100)}%` as `${number}%` }}
      />
    </View>
  );
}
