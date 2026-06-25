import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCategories } from '@/features/customer/hooks/useCustomerQueries';
import { spacing, useTheme } from '@/theme';

import type { CustomerScreenProps } from '@/navigation/types';

const CATEGORY_ICONS: Record<string, string> = {
  blouse: '👚', kurti: '👗', shirt: '👔', pants: '👖',
  'saree-blouse': '🪭', custom: '🪡', trouser: '👖',
  saree: '🪭', lehenga: '👘', default: '🧵',
};

export function CategoriesScreen({ navigation }: CustomerScreenProps<'Categories'>) {
  const { data, isLoading } = useCategories();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toLowerCase();
    return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
  }, [data, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            Browse
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
            What would you like stitched?
          </Text>

          {/* Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, height: 42, marginTop: 14 }}>
            <Text style={{ fontSize: 15, color: colors.textMuted }}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search categories…"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, fontSize: 14, color: colors.text }}
            />
          </View>
        </View>

        {isLoading ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, paddingHorizontal: 16 }}>Loading…</Text>
        ) : null}

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: spacing.lg, gap: 11 }}
          columnWrapperStyle={{ gap: 11 }}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, paddingHorizontal: 16 }}>No categories match “{query}”.</Text>
            ) : null
          }
          renderItem={({ item, index }) => {
            const icon = CATEGORY_ICONS[item.slug?.toLowerCase()] ?? CATEGORY_ICONS.default;
            const tint = (index % 2 === 0 ? colors.primary : colors.accent) + '1A';
            return (
              <Pressable
                style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.88 : 1 })}
                onPress={() => navigation.navigate('Designs', { categorySlug: item.slug, categoryName: item.name })}
              >
                <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                  <View style={{ height: 92, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 40 }}>{icon}</Text>
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Tap to see designs</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />

        {/* Custom design CTA */}
        <View style={{ paddingHorizontal: 16, paddingBottom: spacing.lg, paddingTop: 4 }}>
          <Pressable onPress={() => navigation.navigate('CreateOrder', {})}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 14, paddingVertical: 15,
                alignItems: 'center',
                shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 }}>
                🪡 Propose a custom design
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}
