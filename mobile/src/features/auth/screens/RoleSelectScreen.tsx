import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, useTheme } from '@/theme';

import type { AuthScreenProps } from '@/navigation/types';

const ROLES = [
  { key: 'customer' as const, icon: '👤', title: 'Customer', description: 'Browse designs, place orders and track deliveries.', screen: 'CustomerRegister' as const },
  { key: 'tailor' as const, icon: '🧵', title: 'Tailor', description: 'Accept orders, stitch garments and grow your business.', screen: 'TailorRegister' as const },
  { key: 'delivery' as const, icon: '🛵', title: 'Delivery Partner', description: 'Pick up and deliver orders in your city.', screen: 'DeliveryRegister' as const },
];

export function RoleSelectScreen({ navigation }: AuthScreenProps<'RoleSelect'>) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1, padding: spacing.lg }}>

        <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' as const, letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 8 }}>
          Getting started
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5, marginBottom: 6 }}>
          How will you use Thugil?
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 }}>
          Choose your role to get started. You can add more roles later from your profile.
        </Text>

        {ROLES.map((role, i) => (
          <Pressable
            key={role.key}
            onPress={() => navigation.navigate(role.screen)}
            style={({ pressed }) => ({
              flexDirection: 'row' as const,
              alignItems: 'center' as const,
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: 16,
              padding: spacing.md,
              marginBottom: 10,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: colors.border,
              alignItems: 'center' as const, justifyContent: 'center' as const,
              marginRight: spacing.md,
            }}>
              <Text style={{ fontSize: 22 }}>{role.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700' as const, color: colors.text, marginBottom: 2 }}>
                {role.title}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17 }}>
                {role.description}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: colors.textMuted, marginLeft: spacing.sm }}>›</Text>
          </Pressable>
        ))}

        {/* Admin note */}
        <View style={{
          marginTop: spacing.sm, backgroundColor: '#FFF8ED',
          borderRadius: 12, padding: spacing.md,
          borderWidth: 1.5, borderColor: '#F0DDB0',
        }}>
          <Text style={{ fontSize: 12, color: '#7A5C00', textAlign: 'center' as const }}>
            🔒 Administrator accounts are created by the platform team only.
          </Text>
        </View>

      </SafeAreaView>
    </View>
  );
}
