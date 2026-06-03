/**
 * Step 2 — Category Selection Screen
 *
 * User selects which garment category to generate. Each of the 12 supported
 * categories is shown as a tappable card with icon, name, and example tags.
 * On selection, enqueues the generation job and navigates to AIProcessingScreen.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable,
  Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGenerateDesigns } from '../hooks/useAIGeneration';
import { useAIGenerationStore } from '../store/aiGenerationStore';
import { FASHION_CATEGORIES, type CategoryMeta, type FashionCategory } from '../types';
import { spacing, useTheme } from '@/theme';
import type { CustomerScreenProps } from '@/navigation/types';

export function AICategorySelectionScreen({ navigation }: CustomerScreenProps<'AICategorySelect'>) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FashionCategory | null>(null);
  const [styleNotes, setStyleNotes] = useState('');

  const { fabricUploadId, setCategory } = useAIGenerationStore();
  const generate = useGenerateDesigns();

  const filtered = FASHION_CATEGORIES.filter((c) =>
    c.value.toLowerCase().includes(search.toLowerCase()) ||
    c.exampleTags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleGenerate() {
    if (!selected || !fabricUploadId) return;
    setCategory(selected);
    try {
      await generate.mutateAsync({
        uploadId: fabricUploadId,
        category: selected,
        styleNotes: styleNotes.trim() || undefined,
      });
      navigation.navigate('AIProcessing');
    } catch {
      Alert.alert('Generation failed', 'Could not start design generation. Please try again.');
    }
  }

  function renderCategory({ item: cat }: { item: CategoryMeta }) {
    const isSelected = selected === cat.value;
    return (
      <Pressable onPress={() => setSelected(cat.value)} style={{ flex: 1, margin: 5 }}>
        {isSelected ? (
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 14, minHeight: 110, overflow: 'hidden' as const }}
          >
            <View style={{ position: 'absolute' as const, right: -10, top: -10, width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 25 }} />
            <Text style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: '#fff' }}>{cat.value}</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              {cat.exampleTags.slice(0, 2).join(' · ')}
            </Text>
          </LinearGradient>
        ) : (
          <View style={{
            backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
            borderRadius: 16, padding: 14, minHeight: 110,
          }}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.text }}>{cat.value}</Text>
            <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>
              {cat.exampleTags.slice(0, 2).join(' · ')}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.value}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 11, paddingBottom: 120 }}
          ListHeaderComponent={
            <View>
              {/* Header */}
              <View style={{ paddingHorizontal: 5, paddingTop: 24, paddingBottom: 12 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' as const, letterSpacing: 1, textTransform: 'uppercase' as const }}>
                  Step 2 of 3
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5, marginTop: 4 }}>
                  Choose a category
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 20 }}>
                  Select the type of garment you want to create.
                </Text>
              </View>

              {/* Search */}
              <View style={{ paddingHorizontal: 5, marginBottom: 12 }}>
                <View style={{
                  flexDirection: 'row' as const, alignItems: 'center' as const,
                  backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                  borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search categories…"
                    placeholderTextColor={colors.textMuted}
                    style={{ flex: 1, fontSize: 14, color: colors.text }}
                  />
                </View>
              </View>
            </View>
          }
          renderItem={renderCategory}
          ListFooterComponent={
            selected ? (
              <View style={{ paddingHorizontal: 5, paddingTop: 16, gap: 10 }}>
                {/* Style notes */}
                <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.text, marginBottom: 8 }}>
                    ✏️ Style notes (optional)
                  </Text>
                  <TextInput
                    value={styleNotes}
                    onChangeText={setStyleNotes}
                    placeholder="e.g. Traditional South Indian style, muted tones, minimal embellishment…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={{
                      fontSize: 13, color: colors.text, lineHeight: 20,
                      textAlignVertical: 'top' as const, minHeight: 70,
                    }}
                    maxLength={400}
                  />
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'right' as const }}>
                    {styleNotes.length}/400
                  </Text>
                </View>

                {/* Generate button */}
                <Pressable onPress={() => void handleGenerate()} disabled={generate.isPending}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 14, paddingVertical: 16,
                      alignItems: 'center' as const,
                      opacity: generate.isPending ? 0.8 : 1,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    {generate.isPending
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff', letterSpacing: 0.3 }}>
                          ✦ Generate {selected} designs
                        </Text>
                    }
                  </LinearGradient>
                </Pressable>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}
