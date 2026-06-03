import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { spacing, useTheme } from '@/theme';

import type { CustomerScreenProps } from '@/navigation/types';

// ─── types ───────────────────────────────────────────────────────────────────

type DesignSuggestion = { id: string; name: string; desc: string };
type SuggestionGroup = { category: string; slug: string; icon: string; designs: DesignSuggestion[] };

// ─── mock fallback (shown when backend AI endpoint isn't implemented yet) ─────

const MOCK_SUGGESTIONS: SuggestionGroup[] = [
  {
    category: 'Blouses', slug: 'blouse', icon: '✂️',
    designs: [
      { id: 'm1', name: 'Floral Embroidered Blouse', desc: 'Perfect for the rich texture in your fabric' },
      { id: 'm2', name: 'Cold-shoulder Blouse', desc: 'Flowing cut that suits this material weight' },
    ],
  },
  {
    category: 'Kurtis', slug: 'kurti', icon: '👗',
    designs: [
      { id: 'm3', name: 'Anarkali Kurti', desc: 'The deep tone works beautifully in this silhouette' },
      { id: 'm4', name: 'A-Line Kurti', desc: 'Classic shape that flatters the drape of this fabric' },
    ],
  },
  {
    category: 'Co-ord Sets', slug: 'co-ord', icon: '🩱',
    designs: [
      { id: 'm5', name: 'Crop Top + Wide Pants', desc: 'Trendy co-ord for casual and semi-formal wear' },
      { id: 'm6', name: 'Blazer + Trousers', desc: 'Power set — this fabric holds its shape well' },
    ],
  },
  {
    category: 'Frocks', slug: 'frock', icon: '👒',
    designs: [
      { id: 'm7', name: 'Fit & Flare Frock', desc: 'Flattering silhouette for most body types' },
      { id: 'm8', name: 'Maxi Dress', desc: 'Flowing length to showcase the print or weave' },
    ],
  },
  {
    category: 'Pattu Pavadai', slug: 'pattu-pavadai', icon: '🎀',
    designs: [
      { id: 'm9', name: 'Classic Pattu Pavadai', desc: 'Traditional design for kids\' occasions & festivals' },
      { id: 'm10', name: 'Half-saree Set', desc: 'Coming-of-age ceremony style with duppatta' },
    ],
  },
];

// ─── component ────────────────────────────────────────────────────────────────

export function FabricScanScreen({ navigation }: CustomerScreenProps<'FabricScan'>) {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionGroup[] | null>(null);

  async function pickImage(source: 'camera' | 'library') {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert(
        'Permission required',
        `Allow access to your ${source === 'camera' ? 'camera' : 'photo library'} in Settings.`,
      );
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setSuggestions(null);
    }
  }

  async function analyzeImage() {
    if (!imageUri) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('image', { uri: imageUri, name: 'fabric.jpg', type: 'image/jpeg' } as unknown as Blob);
      const { data } = await apiClient.post<{ suggestions: SuggestionGroup[] }>(
        endpoints.ai.fabricScan,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setSuggestions(data.suggestions);
    } catch {
      // Backend AI endpoint not yet implemented — show mock suggestions
      setSuggestions(MOCK_SUGGESTIONS);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 14 }}>
            <Text style={{
              fontSize: 11, color: colors.textMuted, fontWeight: '500' as const,
              letterSpacing: 1, textTransform: 'uppercase' as const,
            }}>
              AI powered
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5, marginTop: 2 }}>
              Fabric scanner ✦
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              Upload a photo of your fabric and we'll suggest designs that suit it.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 10 }}>

            {/* ── Source picker (shown when no image selected) ── */}
            {!imageUri && (
              <>
                <Pressable onPress={() => void pickImage('camera')}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, padding: 20, alignItems: 'center' as const, overflow: 'hidden' as const }}
                  >
                    <View style={{
                      position: 'absolute' as const, right: -20, top: -20,
                      width: 90, height: 90, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 45,
                    }} />
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>📸</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff' }}>Take a photo</Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                      Use your camera for the best results
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable onPress={() => void pickImage('library')}>
                  <View style={{
                    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                    borderRadius: 16, padding: 16,
                    flexDirection: 'row' as const, alignItems: 'center' as const,
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 10, backgroundColor: colors.border,
                      alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 20 }}>🖼️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text }}>Choose from gallery</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>Pick an existing fabric photo</Text>
                    </View>
                    <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
                  </View>
                </Pressable>
              </>
            )}

            {/* ── Image preview + action row ── */}
            {imageUri && (
              <>
                <View style={{ borderRadius: 16, overflow: 'hidden' as const, borderWidth: 1.5, borderColor: colors.border }}>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
                </View>

                <View style={{ flexDirection: 'row' as const, gap: 8 }}>
                  <Pressable
                    onPress={() => { setImageUri(null); setSuggestions(null); }}
                    style={{ flex: 1 }}
                  >
                    <View style={{
                      backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                      borderRadius: 12, padding: 12, alignItems: 'center' as const,
                    }}>
                      <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '600' as const }}>↩ Retake</Text>
                    </View>
                  </Pressable>

                  <Pressable onPress={() => void analyzeImage()} style={{ flex: 2 }} disabled={loading}>
                    <LinearGradient
                      colors={[colors.primary, colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 12, padding: 12,
                        alignItems: 'center' as const, justifyContent: 'center' as const,
                        flexDirection: 'row' as const, gap: 6,
                      }}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' as const }}>✦ Analyse fabric</Text>
                      }
                    </LinearGradient>
                  </Pressable>
                </View>
              </>
            )}

            {/* ── Analysing spinner card ── */}
            {loading && (
              <View style={{
                backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                borderRadius: 16, padding: 28, alignItems: 'center' as const,
              }}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 14, textAlign: 'center' as const }}>
                  Analysing your fabric…{'\n'}Finding the best design fits
                </Text>
              </View>
            )}

            {/* ── Suggestion groups ── */}
            {suggestions && !loading && (
              <>
                <View style={{
                  flexDirection: 'row' as const, alignItems: 'center' as const,
                  marginTop: 6, marginBottom: 2,
                }}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}
                  >
                    <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' as const, letterSpacing: 1 }}>
                      ✦ AI SUGGESTIONS
                    </Text>
                  </LinearGradient>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>based on your fabric</Text>
                </View>

                {suggestions.map((group) => (
                  <View key={group.category} style={{ marginBottom: 4 }}>
                    {/* Category header */}
                    <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 6 }}>
                      <Text style={{ fontSize: 18, marginRight: 6 }}>{group.icon}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text }}>
                        {group.category}
                      </Text>
                    </View>

                    {/* Design tiles */}
                    {group.designs.map((design) => (
                      <Pressable
                        key={design.id}
                        onPress={() => navigation.navigate('CreateOrder', { categorySlug: group.slug })}
                        style={{ marginBottom: 6 }}
                      >
                        <View style={{
                          backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
                          borderRadius: 14, overflow: 'hidden' as const, flexDirection: 'row' as const,
                        }}>
                          <LinearGradient
                            colors={[colors.primary, colors.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={{ width: 3 }}
                          />
                          <View style={{ flex: 1, padding: 12 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700' as const, color: colors.text }}>
                              {design.name}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                              {design.desc}
                            </Text>
                          </View>
                          <View style={{ justifyContent: 'center' as const, paddingRight: 12 }}>
                            <LinearGradient
                              colors={[colors.primary, colors.accent]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                            >
                              <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' as const }}>
                                Order →
                              </Text>
                            </LinearGradient>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </>
            )}

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
