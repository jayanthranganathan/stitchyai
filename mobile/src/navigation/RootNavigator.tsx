import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme';

import { AdminNavigator } from './AdminNavigator';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { DeliveryNavigator } from './DeliveryNavigator';
import { TailorNavigator } from './TailorNavigator';

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.activeRole);
  const { colors } = useTheme();

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'guest') return <CustomerNavigator />;
  if (status !== 'authenticated' || !role) return <AuthNavigator />;

  switch (role) {
    case 'customer': return <CustomerNavigator />;
    case 'tailor': return <TailorNavigator />;
    case 'delivery': return <DeliveryNavigator />;
    case 'admin': return <AdminNavigator />;
    default: return <AuthNavigator />;
  }
}
