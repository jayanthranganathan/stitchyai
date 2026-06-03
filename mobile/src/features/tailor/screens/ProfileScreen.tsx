import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/BottomNavBar';
import { useAuthStore } from '@/store/authStore';
import { spacing, useTheme } from '@/theme';

import type { TailorScreenProps } from '@/navigation/types';

const TABS = [
  { icon: '🏠', label: 'Dashboard', screen: 'Dashboard' },
  { icon: '📦', label: 'My Orders', screen: 'MyOrders' },
  { icon: '👤', label: 'Profile', screen: 'Profile' },
];

export function ProfileScreen({ navigation }: TailorScreenProps<'Profile'>) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { colors } = useTheme();

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?';

  const settings = [
    { icon: '🎨', label: 'Appearance', onPress: () => navigation.navigate('ThemePicker'), danger: false },
    { icon: '🚪', label: 'Sign out', onPress: () => void logout(), danger: true },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>

          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 }}>Profile</Text>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 10 }}>

            {/* User card */}
            <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const }}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 14 }}
                >
                  <Text style={{ fontSize: 20, fontWeight: '700' as const, color: '#fff' }}>{initials}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700' as const, color: colors.text }}>{user?.full_name ?? 'Tailor'}</Text>
                  {user?.phone ? <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{user.phone}</Text> : null}
                  {user?.email ? <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{user.email}</Text> : null}
                </View>
              </View>
            </View>

            {/* Settings list */}
            <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' as const }}>
              {settings.map((item, i) => (
                <Pressable key={item.label} onPress={item.onPress}>
                  <View style={{
                    flexDirection: 'row' as const, alignItems: 'center' as const, padding: 14,
                    borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border,
                  }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 12 }}>
                      <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '500' as const, color: item.danger ? '#EF4444' : colors.text }}>{item.label}</Text>
                    {!item.danger && <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>}
                  </View>
                </Pressable>
              ))}
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNavBar tabs={TABS} />
    </View>
  );
}
