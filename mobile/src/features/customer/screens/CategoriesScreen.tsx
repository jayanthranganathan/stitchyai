import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCategories } from '@/features/customer/hooks/useCustomerQueries';
import { spacing, useTheme } from '@/theme';

import type { CustomerScreenProps } from '@/navigation/types';

const CATEGORY_ICONS: Record<string, string> = {
  blouse: '✂', kurti: '👗', shirt: '👔', trouser: '👖',
  saree: '🪭', lehenga: '👘', default: '🧵',
};

export function CategoriesScreen({ navigation }: CustomerScreenProps<'Categories'>) {
  const { data, isLoading } = useCategories();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' as const, letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 4 }}>
            Browse
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 }}>
            What would you like stitched?
          </Text>
        </View>

        {isLoading && (
          <Text style={{ fontSize: 13, color: colors.textMuted, paddingHorizontal: 16 }}>Loading…</Text>
        )}

        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: spacing.xl, gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }) => {
            const icon = CATEGORY_ICONS[item.slug?.toLowerCase()] ?? CATEGORY_ICONS.default;
            return (
              <Pressable
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  padding: 20,
                  alignItems: 'center' as const,
                  justifyContent: 'center' as const,
                  minHeight: 100,
                  opacity: pressed ? 0.85 : 1,
                })}
                onPress={() => navigation.navigate('Designs', { categorySlug: item.slug, categoryName: item.name })}
              >
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{icon}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text, textAlign: 'center' as const }}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Custom design CTA */}
        <View style={{ paddingHorizontal: 16, paddingBottom: spacing.lg }}>
          <Pressable onPress={() => navigation.navigate('CreateOrder', {})}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 12, paddingVertical: 14,
                alignItems: 'center' as const,
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' as const, letterSpacing: 0.3 }}>
                🪡 Propose a custom design
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}
