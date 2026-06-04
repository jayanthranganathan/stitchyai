import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import { useMyOrders } from '@/features/customer/hooks/useCustomerQueries';
import { BottomNavBar } from '@/components/BottomNavBar';
import { spacing, useTheme } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { CustomerScreenProps } from '@/navigation/types';

const TABS = [
  { icon: '🏠', label: 'Home', screen: 'Home' },
  { icon: '📦', label: 'Orders', screen: 'Orders' },
  { icon: '👤', label: 'Profile', screen: 'Profile' },
];

export function HomeScreen({ navigation }: CustomerScreenProps<'Home'>) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data: orders } = useMyOrders();

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const activeOrders = orders?.filter((o) => !['delivered', 'cancelled'].includes(o.status)) ?? [];
  const totalSpent = orders?.reduce((sum, o) => sum + (o.status === 'delivered' ? o.total_amount : 0), 0) ?? 0;
  const activeOrder = activeOrders[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>

          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 14 }}>
            <Text style={{
              fontSize: 11, color: colors.textMuted, fontWeight: '500' as const,
              letterSpacing: 1, textTransform: 'uppercase' as const,
            }}>
              Good morning
            </Text>
            <Text style={{
              fontSize: 22, fontWeight: '700' as const, color: colors.text,
              letterSpacing: -0.5, marginTop: 2,
            }}>
              {firstName} 👋
            </Text>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row' as const, gap: 8, paddingHorizontal: 16, marginBottom: 10 }}>
            {[
              { num: String(orders?.length ?? 0), label: 'Orders' },
              { num: String(activeOrders.length), label: 'Active' },
              { num: formatters.inr(totalSpent), label: 'Saved' },
            ].map((stat) => (
              <View key={stat.label} style={{
                flex: 1, backgroundColor: colors.surface, borderWidth: 1.5,
                borderColor: colors.border, borderRadius: 12, padding: 10,
                alignItems: 'center' as const,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '700' as const, color: colors.text }}>{stat.num}</Text>
                <Text style={{
                  fontSize: 9, color: colors.textMuted, marginTop: 2,
                  textTransform: 'uppercase' as const, letterSpacing: 0.5,
                }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Cards body */}
          <View style={{ paddingHorizontal: 16, gap: 10 }}>

            {/* Gradient "New order" card */}
            <Pressable onPress={() => navigation.navigate('Categories')}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16, overflow: 'hidden' as const }}
              >
                {/* Decorative circle */}
                <View style={{
                  position: 'absolute' as const, right: -20, top: -20,
                  width: 90, height: 90,
                  backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 45,
                }} />
                <Text style={{ fontSize: 15, fontWeight: '700' as const, color: '#fff' }}>
                  New order ✦
                </Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  Pick a design and get started
                </Text>
                <View style={{
                  flexDirection: 'row' as const, justifyContent: 'space-between' as const,
                  alignItems: 'center' as const, marginTop: 12,
                }}>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
                    Blouse · Kurti · Shirt
                  </Text>
                  <View style={{
                    width: 28, height: 28, backgroundColor: 'rgba(255,255,255,0.25)',
                    borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' as const }}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* ✦ AI Design Studio card */}
            <Pressable onPress={() => navigation.navigate('AIFabricUpload')}>
              <LinearGradient
                colors={['#4C1D95', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16, overflow: 'hidden' as const }}
              >
                {/* Decorative circles */}
                <View style={{ position: 'absolute' as const, right: -25, top: -25, width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 50 }} />
                <View style={{ position: 'absolute' as const, right: 30, bottom: -30, width: 70, height: 70, backgroundColor: 'rgba(236,72,153,0.2)', borderRadius: 35 }} />

                <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 6 }}>
                  <Text style={{ fontSize: 22 }}>🪡</Text>
                  <View style={{
                    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                    backgroundColor: 'rgba(236,72,153,0.35)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.6)',
                  }}>
                    <Text style={{ fontSize: 9, color: '#F9A8D4', fontWeight: '700' as const, letterSpacing: 0.5 }}>NEW · AI</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 16, fontWeight: '800' as const, color: '#fff', letterSpacing: -0.3 }}>
                  ✦ AI Design Studio
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3, lineHeight: 17 }}>
                  Upload your fabric → AI generates 4 unique dress designs
                </Text>

                <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: 12 }}>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                    Saree · Blouse · Kurti · Lehenga · +8 more
                  </Text>
                  <View style={{
                    width: 28, height: 28, backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' as const }}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Fabric scan card */}
            <Pressable onPress={() => navigation.navigate('FabricScan')}>
              <View style={{
                backgroundColor: colors.surface, borderWidth: 1.5,
                borderColor: colors.border, borderRadius: 16, padding: 14,
                flexDirection: 'row' as const, alignItems: 'center' as const,
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 12, backgroundColor: colors.border,
                  alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 12,
                }}>
                  <Text style={{ fontSize: 22 }}>🔬</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text }}>Fabric scanner</Text>
                    <LinearGradient
                      colors={[colors.primary, colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}
                    >
                      <Text style={{ fontSize: 8, color: '#fff', fontWeight: '700' as const, letterSpacing: 0.5 }}>AI</Text>
                    </LinearGradient>
                  </View>
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                    Upload your fabric photo to get design suggestions
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
              </View>
            </Pressable>

            {/* Saved AI designs shortcut */}
            <Pressable onPress={() => navigation.navigate('AISavedDesigns')}>
              <View style={{
                backgroundColor: colors.surface, borderWidth: 1.5,
                borderColor: colors.border, borderRadius: 16, padding: 14,
                flexDirection: 'row' as const, alignItems: 'center' as const,
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 12, backgroundColor: colors.border,
                  alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 12,
                }}>
                  <Text style={{ fontSize: 22 }}>♥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text }}>Saved designs</Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                    View your AI-generated design history
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
              </View>
            </Pressable>

            {/* In-progress order card (or placeholder) */}
            {activeOrder ? (
              <Pressable onPress={() => navigation.navigate('OrderTrack', { orderId: activeOrder.id })}>
                <View style={{
                  backgroundColor: colors.surface, borderWidth: 1.5,
                  borderColor: colors.border, borderRadius: 16, padding: 14,
                }}>
                  <View style={{
                    flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text }}>
                        {activeOrder.design_name ?? activeOrder.category_name ?? 'Custom order'}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                        Stitching · ETA {activeOrder.expected_delivery_date ? formatters.dateLong(activeOrder.expected_delivery_date) : 'TBD'}
                      </Text>
                    </View>
                    <View style={{
                      width: 28, height: 28, backgroundColor: colors.border,
                      borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const,
                    }}>
                      <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' as const }}>→</Text>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View style={{ height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: 10, overflow: 'hidden' as const }}>
                    <LinearGradient
                      colors={[colors.primary, colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: 3, width: `${activeOrder.progress_percent ?? 0}%` as `${number}%` }}
                    />
                  </View>
                  <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>
                    {activeOrder.progress_percent ?? 0}% complete
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Pressable onPress={() => navigation.navigate('Orders')}>
                <View style={{
                  backgroundColor: colors.surface, borderWidth: 1.5,
                  borderColor: colors.border, borderRadius: 16, padding: 14,
                  flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
                }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700' as const, color: colors.text }}>My Orders</Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>View all order history</Text>
                  </View>
                  <View style={{
                    width: 28, height: 28, backgroundColor: colors.border,
                    borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const,
                  }}>
                    <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' as const }}>→</Text>
                  </View>
                </View>
              </Pressable>
            )}

          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNavBar tabs={TABS} />
    </View>
  );
}
