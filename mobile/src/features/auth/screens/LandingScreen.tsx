import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import { spacing, useTheme } from '@/theme';

import type { AuthScreenProps } from '@/navigation/types';

export function LandingScreen({ navigation }: AuthScreenProps<'Landing'>) {
  const { colors } = useTheme();
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Radial glow at top */}
      <LinearGradient
        colors={['rgba(124,58,237,0.18)', 'rgba(236,72,153,0.12)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: -60, left: -60, right: -60, height: 300 }}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>

          {/* Top bar */}
          <View style={{
            flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
            paddingHorizontal: 18, paddingTop: 30,
          }}>
            <Text style={{ fontSize: 17, fontWeight: '800' as const, color: colors.primary, letterSpacing: -0.5 }}>
              Thugil<Text style={{ color: colors.accent }}>✦</Text>
            </Text>
            <View style={{
              backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1,
              borderColor: 'rgba(124,58,237,0.28)', borderRadius: 20,
              paddingHorizontal: 10, paddingVertical: 3,
            }}>
              <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '700' as const, letterSpacing: 1.5 }}>BETA</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={{ paddingHorizontal: 18, paddingTop: 20 }}>
            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' as const, letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 8 }}>
              ✦ Tailored for you
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '800' as const, color: colors.text, letterSpacing: -1, lineHeight: 33 }}>
              Your style,{'\n'}
              <Text style={{ color: colors.accent }}>stitched</Text>
              {'\n'}to perfection
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 18 }}>
              Custom garments delivered fast. No guessing, no fitting rooms.
            </Text>
          </View>

          {/* Floating category pills */}
          <View style={{
            flexDirection: 'row' as const, gap: 8,
            paddingHorizontal: 18, paddingTop: 16,
          }}>
            {['Blouse ✓', 'Kurti ✓', 'Shirt ✓'].map((pill) => (
              <View key={pill} style={{
                backgroundColor: colors.surface, borderWidth: 1.5,
                borderColor: colors.border, borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 6,
              }}>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' as const }}>{pill}</Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1, minHeight: 32 }} />

          {/* Action buttons */}
          <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: spacing.xl, gap: 10 }}>
            {/* Primary gradient button */}
            <Pressable onPress={() => navigation.navigate('PhoneLogin')}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 12, paddingVertical: 14,
                  alignItems: 'center' as const,
                  shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.5 }}>
                  Get started →
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Outline button */}
            <Pressable
              onPress={() => navigation.navigate('EmailLogin')}
              style={{
                borderRadius: 12, paddingVertical: 13,
                alignItems: 'center' as const,
                borderWidth: 1.5, borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' as const }}>
                I already have an account
              </Text>
            </Pressable>

            {/* Ghost link */}
            <Pressable onPress={continueAsGuest} style={{ paddingVertical: 8, alignItems: 'center' as const }}>
              <Text style={{ fontSize: 11, color: colors.textMuted, textDecorationLine: 'underline' as const }}>
                Browse without signing up
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
