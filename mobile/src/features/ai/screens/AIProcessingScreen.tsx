/**
 * Step 3 — AI Processing Screen
 *
 * Polls generation status every 3 s (processing) / 10 s (queued).
 * Shows an animated progress bar, current pipeline stage, and queue position.
 * Automatically navigates to AIResultsGallery when status === 'completed'.
 * Shows an error state with a retry option when status === 'failed'.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  Animated, Pressable, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGenerationStatus } from '../hooks/useAIGeneration';
import { useAIGenerationStore } from '../store/aiGenerationStore';
import { STAGE_LABELS, STAGE_PROGRESS, type GenerationStage } from '../types';
import { useTheme } from '@/theme';
import type { CustomerScreenProps } from '@/navigation/types';

// ─── animated progress bar ────────────────────────────────────────────────────

function ProgressBar({ percent, color1, color2 }: {
  percent: number;
  color1: string;
  color2: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: percent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percent, anim]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' as const }}>
      <Animated.View style={{ height: 8, width, borderRadius: 4, overflow: 'hidden' as const }}>
        <LinearGradient
          colors={[color1, color2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// ─── pulsing spinner dots ─────────────────────────────────────────────────────

function PulsingDots({ color }: { color: string }) {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []); // animations array is stable — created once on mount

  return (
    <View style={{ flexDirection: 'row' as const, gap: 6, justifyContent: 'center' as const, marginTop: 8 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: color,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}

// ─── stage step list ──────────────────────────────────────────────────────────

const STAGES: GenerationStage[] = ['segmenting', 'analyzing', 'prompting', 'generating', 'finalizing'];

function StageList({ currentStage }: { currentStage: GenerationStage }) {
  const { colors } = useTheme();
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <View style={{ gap: 10, marginTop: 20 }}>
      {STAGES.map((stage, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <View key={stage} style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 }}>
            {/* dot */}
            <View style={{
              width: 24, height: 24, borderRadius: 12,
              backgroundColor: isDone ? colors.primary : isActive ? colors.primary : colors.border,
              borderWidth: isActive ? 2 : 0,
              borderColor: colors.accent,
              alignItems: 'center' as const,
              justifyContent: 'center' as const,
              opacity: isDone || isActive ? 1 : 0.4,
            }}>
              <Text style={{ fontSize: 11, color: '#fff', fontWeight: '700' as const }}>
                {isDone ? '✓' : isActive ? '●' : String(i + 1)}
              </Text>
            </View>
            {/* label */}
            <Text style={{
              fontSize: 12,
              fontWeight: isActive ? ('700' as const) : ('400' as const),
              color: isDone ? colors.textMuted : isActive ? colors.text : colors.textMuted,
              opacity: isDone || isActive ? 1 : 0.5,
            }}>
              {STAGE_LABELS[stage]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export function AIProcessingScreen({ navigation }: CustomerScreenProps<'AIProcessing'>) {
  const { colors } = useTheme();
  const { activeJobId, clearActiveJob } = useAIGenerationStore();
  const { data: job, isError } = useGenerationStatus(activeJobId);

  // Navigate away as soon as job is done
  useEffect(() => {
    if (job?.status === 'completed' && job.job_id) {
      navigation.replace('AIResultsGallery', { jobId: job.job_id });
    }
  }, [job?.status, job?.job_id, navigation]);

  const stage: GenerationStage = job?.stage ?? 'segmenting';
  const progress = job?.progress_percent ?? STAGE_PROGRESS[stage];
  const stageLabel = STAGE_LABELS[stage];
  const queuePosition = job?.queue_position;

  // ── failed state ────────────────────────────────────────────────────────────
  if (job?.status === 'failed' || isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>😞</Text>
          <Text style={{ fontSize: 20, fontWeight: '800' as const, color: colors.text, textAlign: 'center' as const }}>
            Generation failed
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' as const, marginTop: 8, lineHeight: 20 }}>
            {job?.error_message ?? 'Something went wrong. Please try again.'}
          </Text>

          <View style={{ gap: 10, marginTop: 28, width: '100%' }}>
            <Pressable onPress={() => navigation.navigate('AICategorySelect')}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center' as const }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff' }}>
                  Try again
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => {
              clearActiveJob();
              navigation.navigate('Home');
            }}>
              <View style={{
                borderRadius: 14, paddingVertical: 14, alignItems: 'center' as const,
                backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600' as const, color: colors.textMuted }}>
                  Back to Home
                </Text>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── main processing state ───────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Hero gradient card */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, overflow: 'hidden' as const }}
          >
            {/* decorative circles */}
            <View style={{ position: 'absolute' as const, right: -30, top: -30, width: 110, height: 110, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 55 }} />
            <View style={{ position: 'absolute' as const, left: -20, bottom: -20, width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 40 }} />

            {/* Step label */}
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' as const, letterSpacing: 1, textTransform: 'uppercase' as const }}>
              Step 3 of 3
            </Text>

            {/* Main title */}
            <Text style={{ fontSize: 22, fontWeight: '800' as const, color: '#fff', marginTop: 6, letterSpacing: -0.5 }}>
              ✦ AI is creating your designs
            </Text>

            {/* Stage label */}
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 20 }}>
              {stageLabel}
            </Text>

            {/* Animated dots */}
            <PulsingDots color="rgba(255,255,255,0.8)" />

            {/* Progress bar */}
            <View style={{ marginTop: 16 }}>
              <ProgressBar percent={progress} color1="rgba(255,255,255,0.9)" color2="rgba(255,255,255,0.5)" />
              <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 6 }}>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
                  {progress}% complete
                </Text>
                {queuePosition != null && queuePosition > 0 && (
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
                    Queue position: #{queuePosition}
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Info cards */}
        <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 10 }}>

          {/* Stage breakdown */}
          <View style={{
            backgroundColor: colors.surface, borderWidth: 1.5,
            borderColor: colors.border, borderRadius: 16, padding: 16,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.text, marginBottom: 4 }}>
              Generation pipeline
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>
              Each step refines your design further
            </Text>
            <StageList currentStage={stage === 'uploading' || stage === 'done' ? 'segmenting' : stage} />
          </View>

          {/* Did you know */}
          <View style={{
            backgroundColor: colors.surface, borderWidth: 1.5,
            borderColor: colors.border, borderRadius: 16, padding: 14,
            flexDirection: 'row' as const, gap: 12, alignItems: 'flex-start' as const,
          }}>
            <Text style={{ fontSize: 24 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700' as const, color: colors.text, marginBottom: 4 }}>
                Did you know?
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 17 }}>
                Our AI analyses over 40 fabric properties — texture, sheen, embroidery density, and colour harmony — before generating each design variation.
              </Text>
            </View>
          </View>

        </View>

        {/* Cancel link */}
        <View style={{ flex: 1, justifyContent: 'flex-end' as const, paddingBottom: 32, alignItems: 'center' as const }}>
          <Pressable onPress={() => {
            clearActiveJob();
            navigation.navigate('Home');
          }}>
            <Text style={{ fontSize: 13, color: colors.textMuted, textDecorationLine: 'underline' as const }}>
              Cancel and go home
            </Text>
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}
