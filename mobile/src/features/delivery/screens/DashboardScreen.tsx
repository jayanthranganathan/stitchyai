import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import { BottomNavBar } from '@/components/BottomNavBar';
import { spacing, useTheme } from '@/theme';

import type { DeliveryScreenProps } from '@/navigation/types';

const TABS = [
  { icon: '🛵', label: 'Home', screen: 'Dashboard' },
  { icon: '👤', label: 'Profile', screen: 'Profile' },
];

const CARDS = [
  { icon: '🛵', title: "Today's pickups", desc: 'Pickups and drops queued for you', screen: 'Reports' as const, gradient: true },
  { icon: '📊', title: 'Reports', desc: 'Jobs completed, on-time delivery %', screen: 'Reports' as const, gradient: false },
  { icon: '👤', title: 'Profile', desc: 'Vehicle details and contact info', screen: 'Profile' as const, gradient: false },
];

export function DashboardScreen({ navigation }: DeliveryScreenProps<'Dashboard'>) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>

          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 14 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' as const, letterSpacing: 1, textTransform: 'uppercase' as const }}>
              Delivery partner
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5, marginTop: 2 }}>
              {firstName} 👋
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {CARDS.map((card) => (
              <Pressable key={card.title} onPress={() => navigation.navigate(card.screen)}>
                {card.gradient ? (
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, padding: 16, overflow: 'hidden' as const }}
                  >
                    <View style={{ position: 'absolute' as const, right: -20, top: -20, width: 90, height: 90, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 45 }} />
                    <Text style={{ fontSize: 16, fontWeight: '700' as const, color: '#fff', marginBottom: 2 }}>{card.icon} {card.title}</Text>
                    <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: 10 }}>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{card.desc}</Text>
                      <View style={{ width: 28, height: 28, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const }}>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' as const }}>→</Text>
                      </View>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 14, flexDirection: 'row' as const, alignItems: 'center' as const }}>
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 12 }}>
                      <Text style={{ fontSize: 20 }}>{card.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text }}>{card.title}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{card.desc}</Text>
                    </View>
                    <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
      <BottomNavBar tabs={TABS} />
    </View>
  );
}
