/**
 * Saved Designs Screen
 *
 * Shows the user's AI generation history: all past jobs with their
 * saved designs. Tapping a job row navigates back to its results gallery.
 * Empty state prompts the user to start a new generation.
 */

import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator, FlatList, Image,
  Pressable, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAIHistory } from '../hooks/useAIGeneration';
import type { GenerationJob } from '../types';
import { useTheme } from '@/theme';
import type { CustomerScreenProps } from '@/navigation/types';

// ─── job history card ─────────────────────────────────────────────────────────

function JobCard({
  job,
  onPress,
}: {
  job: GenerationJob;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const savedDesigns = job.designs.filter((d) => d.is_saved);
  const previewDesigns = job.designs.slice(0, 3);

  const createdDate = new Date(job.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Pressable onPress={onPress}>
      <View style={{
        backgroundColor: colors.surface,
        borderWidth: 1.5, borderColor: colors.border,
        borderRadius: 16, padding: 14,
        marginBottom: 10,
      }}>
        {/* top row */}
        <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '700' as const, color: colors.text }}>{job.category}</Text>
              {savedDesigns.length > 0 && (
                <View style={{
                  backgroundColor: colors.border, borderRadius: 10,
                  paddingHorizontal: 7, paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '700' as const }}>
                    ♥ {savedDesigns.length} saved
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{createdDate}</Text>
          </View>
          <View style={{
            width: 28, height: 28, backgroundColor: colors.border,
            borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const,
          }}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' as const }}>›</Text>
          </View>
        </View>

        {/* thumbnail strip */}
        {previewDesigns.length > 0 && (
          <View style={{ flexDirection: 'row' as const, gap: 6 }}>
            {previewDesigns.map((design) => (
              <View key={design.id} style={{
                flex: 1, borderRadius: 10, overflow: 'hidden' as const,
                backgroundColor: colors.border,
              }}>
                <Image
                  source={{ uri: design.thumbnail_url || design.image_url }}
                  style={{ width: '100%', height: 80 }}
                  resizeMode="cover"
                />
                {design.is_saved && (
                  <View style={{
                    position: 'absolute' as const, top: 4, right: 4,
                    width: 18, height: 18, borderRadius: 9,
                    backgroundColor: 'rgba(236,72,153,0.85)',
                    alignItems: 'center' as const, justifyContent: 'center' as const,
                  }}>
                    <Text style={{ fontSize: 9, color: '#fff' }}>♥</Text>
                  </View>
                )}
              </View>
            ))}
            {job.designs.length > 3 && (
              <View style={{
                flex: 1, borderRadius: 10,
                backgroundColor: colors.border,
                height: 80,
                alignItems: 'center' as const, justifyContent: 'center' as const,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.textMuted }}>
                  +{job.designs.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* fabric analysis tags */}
        {job.fabric_analysis && (
          <View style={{ flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 5, marginTop: 10 }}>
            {[job.fabric_analysis.fabric_type, job.fabric_analysis.texture].map((tag) => (
              <View key={tag} style={{
                borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
                backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
              }}>
                <Text style={{ fontSize: 9, color: colors.textMuted }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onStart }: { onStart: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={{
      flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const,
      paddingHorizontal: 32, paddingBottom: 60,
    }}>
      <Text style={{ fontSize: 60, marginBottom: 16 }}>🪡</Text>
      <Text style={{ fontSize: 20, fontWeight: '800' as const, color: colors.text, textAlign: 'center' as const }}>
        No saved designs yet
      </Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' as const, marginTop: 8, lineHeight: 20 }}>
        Upload a fabric photo and let our AI generate dress designs tailored to your fabric's texture and patterns.
      </Text>
      <Pressable onPress={onStart} style={{ marginTop: 24, width: '100%' }}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center' as const }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff' }}>
            ✦ Start AI Design Studio
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export function AISavedDesignsScreen({ navigation }: CustomerScreenProps<'AISavedDesigns'>) {
  const { colors } = useTheme();
  const { data: jobs, isLoading, isError, refetch } = useAIHistory();

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
  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
        <Text style={{ fontSize: 16, fontWeight: '700' as const, color: colors.text, textAlign: 'center' as const }}>
          Could not load designs
        </Text>
        <Pressable onPress={() => void refetch()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' as const }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const hasJobs = (jobs?.length ?? 0) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {hasJobs ? (
          <FlatList
            data={jobs}
            keyExtractor={(j) => j.job_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            ListHeaderComponent={
              <View style={{ paddingTop: 24, paddingBottom: 16 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' as const, letterSpacing: 1, textTransform: 'uppercase' as const }}>
                  AI Design Studio
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5, marginTop: 4 }}>
                  Saved designs
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                  {jobs!.length} generation{jobs!.length !== 1 ? 's' : ''}
                </Text>
              </View>
            }
            renderItem={({ item: job }) => (
              <JobCard
                job={job}
                onPress={() => navigation.navigate('AIResultsGallery', { jobId: job.job_id })}
              />
            )}
            ListFooterComponent={
              <Pressable onPress={() => navigation.navigate('AIFabricUpload')} style={{ marginTop: 6 }}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center' as const }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff' }}>
                    ✦ New generation
                  </Text>
                </LinearGradient>
              </Pressable>
            }
          />
        ) : (
          <EmptyState onStart={() => navigation.navigate('AIFabricUpload')} />
        )}

      </SafeAreaView>
    </View>
  );
}
