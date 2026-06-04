import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type Tab = { icon: string; label: string; screen: string };
type AnyNav = NavigationProp<Record<string, object | undefined>>;

export function BottomNavBar({ tabs }: { tabs: Tab[] }) {
  const navigation = useNavigation<AnyNav>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderTopWidth: 1.5,
      borderTopColor: colors.border,
      paddingTop: 10,
      paddingBottom: Math.max(insets.bottom, 10),
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
    }}>
      {tabs.map((tab) => {
        const isActive = route.name === tab.screen;
        return (
          <Pressable
            key={tab.screen}
            onPress={() => navigation.navigate(tab.screen)}
            style={{ alignItems: 'center' as const, flex: 1, paddingHorizontal: 4 }}
          >
            <Text style={{ fontSize: 20, opacity: isActive ? 1 : 0.4 }}>{tab.icon}</Text>
            <Text style={{
              fontSize: 10,
              color: isActive ? colors.primary : colors.textMuted,
              fontWeight: isActive ? ('700' as const) : ('400' as const),
              marginTop: 2,
            }}>
              {tab.label}
            </Text>
            {isActive ? (
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: 4, height: 4, borderRadius: 2, marginTop: 3 }}
              />
            ) : (
              <View style={{ width: 4, height: 4, marginTop: 3 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
