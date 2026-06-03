/**
 * AI Results Gallery Screen
 *
 * Displays the 4 generated dress designs in a scrollable grid.
 * Users can:
 *   - Tap a design to view it full-screen
 *   - Save / unsave designs (heart icon)
 *   - Share a design via the native share sheet
 *   - Regenerate with the same fabric + category
 *   - Navigate to Saved Designs history
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions,
  FlatList, Image, Modal, Pressable, Share,
  Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useGenerationResults,
  useRegenerateDesigns,
  useSaveDesign,
} from '../hooks/useAIGeneration';
import { useAIGenerationStore } from '../store/aiGenerationStore';
import type { GeneratedDesign } from '../types';
import { useTheme } from '@/theme';
import type { CustomerScreenProps } from '@/navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_W - 32 - 10) / 2; // 2 columns, 16 px side padding, 10 px gap

// ─── full-screen design viewer ────────────────────────────────────────────────

function DesignModal({
  design,
  onClose,
  onSave,
  isSaving,
}: {
  design: GeneratedDesign;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const { colors } = useTheme();

  async function handleShare() {
    try {
      await Share.share({ url: design.image_url, message: 'Check out this AI-generated dress design from Stitchy.ai ✦' });
    } catch {
      // user cancelled or platform error — ignore
    }
  }

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* image */}
        <Image
          source={{ uri: design.image_url }}
          style={{ flex: 1 }}
          resizeMode="contain"
        />

        {/* top close */}
        <SafeAreaView style={{ position: 'absolute' as const, top: 0, left: 0, right: 0 }} edges={['top']}>
          <View style={{ flexDirection: 'row' as const, justifyContent: 'flex-end' as const, padding: 16 }}>
            <Pressable onPress={onClose} style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.5)',
              alignItems: 'center' as const, justifyContent: 'center' as const,
            }}>
              <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        {/* bottom actions */}
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute' as const, bottom: 0, left: 0, right: 0 }}>
          <View style={{
            flexDirection: 'row' as const, gap: 10, padding: 16,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}>
            <Pressable onPress={onSave} disabled={isSaving} style={{ flex: 1 }}>
              <LinearGradient
                colors={design.is_saved ? ['#EC4899', '#7C3AED'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 12, paddingVertical: 13, alignItems: 'center' as const, borderWidth: design.is_saved ? 0 : 1, borderColor: 'rgba(255,255,255,0.3)' }}
              >
                {isSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' as const }}>
                      {design.is_saved ? '♥ Saved' : '♡ Save'}
                    </Text>
                }
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => void handleShare()} style={{ flex: 1 }}>
              <View style={{
                borderRadius: 12, paddingVertical: 13, alignItems: 'center' as const,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' as const }}>⬆ Share</Text>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── design card ──────────────────────────────────────────────────────────────

function DesignCard({
  design,
  onPress,
  onSave,
  isSaving,
}: {
  design: GeneratedDesign;
  onPress: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={{ width: CARD_SIZE }}>
      <View style={{
        backgroundColor: colors.surface,
        borderWidth: 1.5, borderColor: colors.border,
        borderRadius: 16, overflow: 'hidden' as const,
      }}>
        {/* design image */}
        <Image
          source={{ uri: design.thumbnail_url || design.image_url }}
          style={{ width: CARD_SIZE, height: CARD_SIZE * 1.3 }}
          resizeMode="cover"
        />

        {/* save button overlay */}
        <Pressable
          onPress={onSave}
          disabled={isSaving}
          style={{
            position: 'absolute' as const, top: 8, right: 8,
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center' as const, justifyContent: 'center' as const,
          }}
        >
          {isSaving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ fontSize: 16, color: design.is_saved ? '#EC4899' : '#fff' }}>
                {design.is_saved ? '♥' : '♡'}
              </Text>
          }
        </Pressable>

        {/* design index badge */}
        <View style={{ position: 'absolute' as const, top: 8, left: 8 }}>
          <LinearGradient
            colors={['rgba(124,58,237,0.9)', 'rgba(236,72,153,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}
          >
            <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' as const }}>
              #{design.index + 1}
            </Text>
          </LinearGradient>
        </View>

        {/* label strip */}
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 16 }} numberOfLines={2}>
            {design.prompt_used ? `"${design.prompt_used.slice(0, 60)}…"` : `Design variation ${design.index + 1}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export function AIResultsGalleryScreen({
  navigation,
  route,
}: CustomerScreenProps<'AIResultsGallery'>) {
  const { colors } = useTheme();
  const { jobId } = route.params;
  const { styleNotes } = useAIGenerationStore();

  const { data: job, isLoading, isError } = useGenerationResults(jobId);
  const saveDesign = useSaveDesign();
  const regenerate = useRegenerateDesigns();

  const [focusedDesign, setFocusedDesign] = useState<GeneratedDesign | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleSave(design: GeneratedDesign) {
    setSavingId(design.id);
    try {
      await saveDesign.mutateAsync({ designId: design.id, save: !design.is_saved });
    } finally {
      setSavingId(null);
    }
  }

  async function handleRegenerate() {
    try {
      await regenerate.mutateAsync({
        job_id: jobId,
        style_notes: styleNotes ?? undefined,
      });
      navigation.replace('AIProcessing');
    } catch {
      Alert.alert('Regeneration failed', 'Could not start a new generation. Please try again.');
    }
  }

  const designs = job?.designs ?? [];
  const savedCount = designs.filter((d) => d.is_saved).length;

  // ── loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, alignItems: 'center' as const }}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 12 }}>Loading designs…</Text>
      </View>
    );
  }

  // ── error ───────────────────────────────────────────────────────────────────
  if (isError || !job) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
        <Text style={{ fontSize: 16, fontWeight: '700' as const, color: colors.text, textAlign: 'center' as const }}>
          Could not load designs
        </Text>
        <Pressable onPress={() => navigation.navigate('Home')} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' as const }}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Full-screen design viewer */}
      {focusedDesign && (
        <DesignModal
          design={focusedDesign}
          onClose={() => setFocusedDesign(null)}
          onSave={() => void handleSave(focusedDesign)}
          isSaving={savingId === focusedDesign.id}
        />
      )}

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={designs}
          keyExtractor={(d) => d.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: 10, justifyContent: 'center' as const }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ListHeaderComponent={
            <View>
              {/* Header */}
              <View style={{ paddingTop: 24, paddingBottom: 16 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' as const, letterSpacing: 1, textTransform: 'uppercase' as const }}>
                  {job.category}
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5, marginTop: 4 }}>
                  Your designs ✦
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                  {designs.length} design{designs.length !== 1 ? 's' : ''} generated{savedCount > 0 ? ` · ${savedCount} saved` : ''}
                </Text>
              </View>

              {/* Fabric analysis pill strip */}
              {job.fabric_analysis && (
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 }}>
                    {[
                      job.fabric_analysis.fabric_type,
                      job.fabric_analysis.texture,
                      ...job.fabric_analysis.colors.slice(0, 2),
                      ...(job.fabric_analysis.embroidery ? [job.fabric_analysis.embroidery] : []),
                    ].map((tag) => (
                      <View key={tag} style={{
                        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
                        backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                      }}>
                        <Text style={{ fontSize: 10, color: colors.text, fontWeight: '500' as const }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          }
          renderItem={({ item: design }) => (
            <DesignCard
              design={design}
              onPress={() => setFocusedDesign(design)}
              onSave={() => void handleSave(design)}
              isSaving={savingId === design.id}
            />
          )}
          ListFooterComponent={
            <View style={{ gap: 10, marginTop: 20 }}>
              {/* Regenerate */}
              <Pressable onPress={() => void handleRegenerate()} disabled={regenerate.isPending}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 14, paddingVertical: 16,
                    alignItems: 'center' as const,
                    opacity: regenerate.isPending ? 0.8 : 1,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  {regenerate.isPending
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff', letterSpacing: 0.3 }}>
                        ↺ Regenerate designs
                      </Text>
                  }
                </LinearGradient>
              </Pressable>

              {/* View saved */}
              <Pressable onPress={() => navigation.navigate('AISavedDesigns')}>
                <View style={{
                  borderRadius: 14, paddingVertical: 14, alignItems: 'center' as const,
                  backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600' as const, color: colors.text }}>
                    ♥ View all saved designs
                  </Text>
                </View>
              </Pressable>

              {/* Back home */}
              <Pressable onPress={() => navigation.navigate('Home')}>
                <View style={{ paddingVertical: 12, alignItems: 'center' as const }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>Back to Home</Text>
                </View>
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}
