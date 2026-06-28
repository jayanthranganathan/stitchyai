import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import { spacing, useTheme } from '@/theme';

import type { AuthScreenProps } from '@/navigation/types';

// hero.jpg is the full composited artwork (model + purple circle + saree/thread/
// fabric cards + swatches + fabric wave, all baked into one transparent-style PNG
// on a light-lavender ground that matches colors.background). We render it edge to
// edge as the page backdrop — NO card — and overlay the text + buttons on top.
const HERO_RATIO = 1536 / 1024; // intrinsic height / width
const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const HERO_H = SCREEN_W * HERO_RATIO;
// Anchor the artwork from the top (not the bottom) so the model's face rises
// above the heading/chips. ~11% down lands her head just under the top bar and
// keeps her whole face clear of the category chips.
const HERO_TOP = Math.round(SCREEN_H * 0.11);

const CATEGORIES = [
  { icon: '👚', label: 'Blouse' },
  { icon: '👗', label: 'Kurti' },
  { icon: '👔', label: 'Shirt' },
];

export function LandingScreen({ navigation }: AuthScreenProps<'Landing'>) {
  const { colors } = useTheme();
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Full-bleed hero artwork — anchored to the bottom, full screen width, so
          the fabric collage sits along the bottom edge and the model rises into
          the upper area behind the heading. Blends into the background (no card). */}
      <Image
        source={require('../../../../assets/hero.jpg')}
        style={{ position: 'absolute', top: HERO_TOP, left: 0, width: SCREEN_W, height: HERO_H }}
        resizeMode="cover"
      />

      {/* Soft glow at the very top */}
      <LinearGradient
        colors={['rgba(124,58,237,0.16)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
        pointerEvents="none"
      />

      {/* Bottom scrim — fades the artwork into the page background so the buttons
          stay readable while the artwork shows through above them. */}
      <LinearGradient
        colors={['transparent', colors.background + '00', colors.background, colors.background]}
        locations={[0, 0.25, 0.62, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 340 }}
        pointerEvents="none"
      />

      {/* Floating "Premium Fabrics" badge over the fabric collage (lower-left). */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', left: 22, bottom: 330,
          width: 78, height: 78, borderRadius: 39,
          backgroundColor: 'rgba(255,255,255,0.92)',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.16, shadowRadius: 12, elevation: 6,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text, textAlign: 'center' }}>Premium</Text>
        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, textAlign: 'center' }}>Fabrics</Text>
        <Text style={{ fontSize: 12, color: colors.accent, marginTop: 1 }}>✦</Text>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 22, paddingTop: 12,
        }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary, letterSpacing: -0.5 }}>
            Thugil<Text style={{ color: colors.accent }}>✦</Text>
          </Text>
          <View style={{
            backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1,
            borderColor: 'rgba(124,58,237,0.28)', borderRadius: 20,
            paddingHorizontal: 11, paddingVertical: 4,
          }}>
            <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '800', letterSpacing: 1.5 }}>BETA</Text>
          </View>
        </View>

        {/* Heading */}
        <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>
            ✦ Tailored for you
          </Text>
          <Text style={{ fontSize: 40, fontWeight: '900', color: colors.text, letterSpacing: -1.5, lineHeight: 44 }}>
            Your style,{'\n'}
            <Text style={{ color: colors.accent }}>stitched</Text>
            {'\n'}to perfection
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 12, lineHeight: 19, maxWidth: 240 }}>
            Custom garments delivered fast. No guessing, no fitting rooms.
          </Text>
        </View>

        {/* White pill category chips */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingTop: 18, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <View
              key={c.label}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 7,
                backgroundColor: colors.surface, borderRadius: 999,
                paddingHorizontal: 14, paddingVertical: 9,
                borderWidth: 1, borderColor: colors.border,
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.10, shadowRadius: 6, elevation: 2,
              }}
            >
              <Text style={{ fontSize: 15 }}>{c.icon}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Spacer lets the hero artwork show through between chips and buttons */}
        <View style={{ flex: 1 }} />

        {/* Action buttons — overlap the lower hero artwork, sitting on the scrim */}
        <View style={{ paddingHorizontal: 22, paddingBottom: spacing.lg, gap: 12 }}>
          {/* Primary gradient button */}
          <Pressable onPress={() => navigation.navigate('PhoneLogin')}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.32, shadowRadius: 16, elevation: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>
                Get started →
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Secondary — sign in */}
          <Pressable
            onPress={() => navigation.navigate('EmailLogin')}
            style={{
              borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
              shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08, shadowRadius: 10, elevation: 2,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
              I already have an account
            </Text>
          </Pressable>

          {/* Ghost link */}
          <Pressable onPress={continueAsGuest} style={{ paddingVertical: 6, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline' }}>
              Browse without signing up
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
