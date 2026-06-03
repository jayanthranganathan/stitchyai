import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeButton } from '@/components/HomeButton';
import { ActivePickupScreen } from '@/features/delivery/screens/ActivePickupScreen';
import { DashboardScreen } from '@/features/delivery/screens/DashboardScreen';
import { DeliveryMapScreen } from '@/features/delivery/screens/DeliveryMapScreen';
import { ThemePickerScreen } from '@/features/customer/screens/ThemePickerScreen';
import { ProfileScreen } from '@/features/delivery/screens/ProfileScreen';
import { RegisterScreen } from '@/features/delivery/screens/RegisterScreen';
import { ReportsScreen } from '@/features/delivery/screens/ReportsScreen';

import type { DeliveryStackParamList } from './types';

const Stack = createNativeStackNavigator<DeliveryStackParamList>();

export function DeliveryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerRight: route.name !== 'Dashboard'
          ? () => <HomeButton onPress={() => navigation.navigate('Dashboard')} />
          : undefined,
      })}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Deliveries' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Become a partner' }} />
      <Stack.Screen name="ActivePickup" component={ActivePickupScreen} options={{ title: 'Active pickup' }} />
      <Stack.Screen name="DeliveryMap" component={DeliveryMapScreen} options={{ title: 'Map' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="ThemePicker" component={ThemePickerScreen} options={{ title: 'Appearance' }} />
    </Stack.Navigator>
  );
}
