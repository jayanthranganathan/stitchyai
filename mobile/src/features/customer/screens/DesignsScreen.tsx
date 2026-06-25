import { Dimensions, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddButton } from '@/components/AddButton';
import { type Design } from '@/features/customer/api';
import { useDesigns } from '@/features/customer/hooks/useCustomerQueries';
import { spacing, useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { CustomerScreenProps } from '@/navigation/types';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = (SCREEN_W - 16 * 2 - 11) / 2; // 16 page padding both sides, 11 gap

const CATEGORY_EMOJI: Record<string, string> = {
  blouse: '👚', kurti: '👗', shirt: '👔', pants: '👖',
  'saree-blouse': '🪭', custom: '🪡', default: '🧵',
};

export function DesignsScreen({ route, navigation }: CustomerScreenProps<'Designs'>) {
  const { categorySlug, categoryName } = route.params;
  const { data, isLoading } = useDesigns(categorySlug);
  const { colors } = useTheme();

  const emoji = CATEGORY_EMOJI[categorySlug] ?? CATEGORY_EMOJI.default;

  function openOrder(design: Design) {
    navigation.navigate('CreateOrder', {
      designId: design.id,
      categorySlug,
      designName: design.name,
      designImage: design.images?.[0],
      basePrice: design.base_price,
    });
  }

  function renderCard({ item, index }: { item: Design; index: number }) {
    const img = item.images?.[0];
    const tagLine = item.tags?.slice(0, 2).join(' · ');
    // Alternate two theme-derived tints for the image panel
    const tint = (index % 2 === 0 ? colors.primary : colors.accent) + '1A';
    return (
      <Pressable
        onPress={() => openOrder(item)}
        style={({ pressed }) => ({ width: CARD_W, opacity: pressed ? 0.9 : 1 })}
      >
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <View style={{ height: 110, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
            {img ? (
              <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 44 }}>{emoji}</Text>
            )}
          </View>
          <View style={{ padding: 11, paddingBottom: 13 }}>
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
              {item.name}
            </Text>
            {tagLine ? (
              <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' }}>
                {tagLine}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primary }}>
                {formatters.inr(item.base_price)}
              </Text>
              <AddButton onPress={() => openOrder(item)} accessibilityLabel={`Order ${item.name}`} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {categoryName ?? 'Designs'}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 2 }}>
            Pick a design
          </Text>
        </View>

        {isLoading ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, paddingHorizontal: 16 }}>Loading designs…</Text>
        ) : null}

        <FlatList
          data={data ?? []}
          keyExtractor={(d) => d.id}
          numColumns={2}
          renderItem={renderCard}
          columnWrapperStyle={{ gap: 11, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 11, paddingBottom: spacing.xl }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: spacing.lg, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.textMuted }}>No designs in this category yet.</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}
