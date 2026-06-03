import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { THEME_ORDER, THEMES, spacing, typography, useTheme, useThemedStyles, type ThemeId } from '@/theme';

export function ThemePickerScreen() {
  const { themeId: activeId, setTheme, colors } = useTheme();
  const styles = useThemedStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.background },
    header: { padding: spacing.md, paddingBottom: spacing.sm },
    title: { ...typography.h1, color: c.text },
    subtitle: { ...typography.caption, color: c.textMuted, marginTop: 4 },
    list: { padding: spacing.md, gap: spacing.md },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: c.border,
      overflow: 'hidden' as const,
    },
    cardActive: { borderColor: c.primary },
    preview: { height: 80, flexDirection: 'row' as const },
    previewSwatch: { flex: 1 },
    cardBody: { padding: spacing.md },
    cardRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    cardName: { ...typography.h2, color: c.text, fontSize: 17 },
    cardDesc: { ...typography.caption, color: c.textMuted, marginTop: 2 },
    badge: {
      backgroundColor: c.primary,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' as const },
    checkRing: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: c.primary,
      alignItems: 'center' as const, justifyContent: 'center' as const,
    },
    checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
    emptyRing: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: c.border,
    },
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Appearance</Text>
        <Text style={styles.subtitle}>Choose a theme — your pick is saved automatically</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {THEME_ORDER.map((id: ThemeId) => {
          const theme = THEMES[id];
          const isActive = id === activeId;
          return (
            <Pressable
              key={id}
              style={[styles.card, isActive && styles.cardActive]}
              onPress={() => setTheme(id)}
            >
              {/* Color swatch preview strip */}
              <View style={styles.preview}>
                {theme.swatches.map((hex, i) => (
                  <View key={i} style={[styles.previewSwatch, { backgroundColor: hex }]} />
                ))}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{theme.name}</Text>
                    <Text style={styles.cardDesc}>{theme.description}</Text>
                  </View>
                  {isActive ? (
                    <View style={styles.checkRing}>
                      <View style={styles.checkDot} />
                    </View>
                  ) : (
                    <View style={styles.emptyRing} />
                  )}
                </View>
                {isActive && (
                  <View style={[styles.badge, { marginTop: spacing.sm, alignSelf: 'flex-start' as const }]}>
                    <Text style={styles.badgeText}>Active</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
