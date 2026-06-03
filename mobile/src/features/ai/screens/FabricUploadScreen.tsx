/**
 * Step 1 — Fabric Upload Screen
 *
 * The user captures or picks a fabric photo. On confirmation, the image is
 * uploaded to the backend (POST /ai/fabric-upload) and the upload_id is
 * stored in Zustand. Navigation then proceeds to CategorySelectionScreen.
 */

import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable,
  ScrollView, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFabricUpload } from '../hooks/useAIGeneration';
import { spacing, useTheme } from '@/theme';
import type { CustomerScreenProps } from '@/navigation/types';

export function AIFabricUploadScreen({ navigation }: CustomerScreenProps<'AIFabricUpload'>) {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const upload = useFabricUpload();

  async function pickImage(source: 'camera' | 'library') {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permission required',
        `Allow ${source === 'camera' ? 'camera' : 'photo library'} access in Settings.`);
      return;
    }

    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleContinue() {
    if (!imageUri) return;
    try {
      await upload.mutateAsync(imageUri);
      navigation.navigate('AICategorySelect');
    } catch {
      Alert.alert('Upload failed', 'Could not upload the fabric image. Please check your connection and try again.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>

          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' as const, letterSpacing: 1, textTransform: 'uppercase' as const }}>
              Step 1 of 3
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5, marginTop: 4 }}>
              Upload your fabric ✦
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              Take a clear photo of your fabric swatch. Our AI will analyse the texture, colours and motifs to generate designs.
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 8 }}>

            {/* Image preview */}
            {imageUri ? (
              <View style={{ borderRadius: 16, overflow: 'hidden' as const, borderWidth: 2, borderColor: colors.primary }}>
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: 280 }} resizeMode="cover" />
                <View style={{ position: 'absolute' as const, top: 12, right: 12 }}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                  >
                    <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' as const }}>✓ Selected</Text>
                  </LinearGradient>
                </View>
              </View>
            ) : (
              /* Empty state placeholder */
              <View style={{
                height: 200, borderRadius: 16, borderWidth: 2, borderColor: colors.border,
                borderStyle: 'dashed' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
                backgroundColor: colors.surface,
              }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🧵</Text>
                <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' as const, paddingHorizontal: 32 }}>
                  Your fabric photo will appear here
                </Text>
              </View>
            )}

            {/* Source buttons */}
            <Pressable onPress={() => void pickImage('camera')}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 18, overflow: 'hidden' as const }}
              >
                <View style={{ position: 'absolute' as const, right: -20, top: -20, width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 40 }} />
                <Text style={{ fontSize: 28, marginBottom: 6 }}>📸</Text>
                <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff' }}>Take a photo</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                  Best results — lay fabric flat in good lighting
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => void pickImage('library')}>
              <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 16, flexDirection: 'row' as const, alignItems: 'center' as const }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 12 }}>
                  <Text style={{ fontSize: 22 }}>🖼️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text }}>Choose from gallery</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>Pick an existing fabric photo</Text>
                </View>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
              </View>
            </Pressable>

            {/* Tips card */}
            <View style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700' as const, color: colors.text, marginBottom: 8 }}>📋 Tips for best results</Text>
              {[
                '✓  Lay fabric flat on a clean, contrasting surface',
                '✓  Ensure the texture and embroidery are clearly visible',
                '✓  Use natural or bright even lighting — avoid harsh shadows',
                '✓  Fill the frame with the fabric for maximum detail',
              ].map((tip) => (
                <Text key={tip} style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4, lineHeight: 17 }}>{tip}</Text>
              ))}
            </View>

            {/* Continue button */}
            {imageUri && (
              <Pressable onPress={() => void handleContinue()} disabled={upload.isPending}>
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 14, paddingVertical: 16,
                    alignItems: 'center' as const,
                    opacity: upload.isPending ? 0.8 : 1,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  {upload.isPending
                    ? (
                      <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 }}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff' }}>Uploading…</Text>
                      </View>
                    )
                    : <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff', letterSpacing: 0.3 }}>
                        Continue → Select category
                      </Text>
                  }
                </LinearGradient>
              </Pressable>
            )}

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
