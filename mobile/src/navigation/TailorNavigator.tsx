import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeButton } from '@/components/HomeButton';
import { AvailableOrdersScreen } from '@/features/tailor/screens/AvailableOrdersScreen';
import { DashboardScreen } from '@/features/tailor/screens/DashboardScreen';
import { MyOrdersScreen } from '@/features/tailor/screens/MyOrdersScreen';
import { OrderDetailScreen } from '@/features/tailor/screens/OrderDetailScreen';
import { ThemePickerScreen } from '@/features/customer/screens/ThemePickerScreen';
import { ProfileScreen } from '@/features/tailor/screens/ProfileScreen';
import { RegisterScreen } from '@/features/tailor/screens/RegisterScreen';
import { ReportsScreen } from '@/features/tailor/screens/ReportsScreen';

import type { TailorStackParamList } from './types';

const Stack = createNativeStackNavigator<TailorStackParamList>();

export function TailorNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerRight: route.name !== 'Dashboard'
          ? () => <HomeButton onPress={() => navigation.navigate('Dashboard')} />
          : undefined,
      })}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Tailor dashboard' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Become a tailor' }} />
      <Stack.Screen name="AvailableOrders" component={AvailableOrdersScreen} options={{ title: 'Available orders' }} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My orders' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="ThemePicker" component={ThemePickerScreen} options={{ title: 'Appearance' }} />
    </Stack.Navigator>
  );
}
