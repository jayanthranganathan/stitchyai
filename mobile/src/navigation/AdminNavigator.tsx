import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeButton } from '@/components/HomeButton';
import { ApprovalsScreen } from '@/features/admin/screens/ApprovalsScreen';
import { DashboardScreen } from '@/features/admin/screens/DashboardScreen';
import { ManageAdminsScreen } from '@/features/admin/screens/ManageAdminsScreen';
import { OrdersOverviewScreen } from '@/features/admin/screens/OrdersOverviewScreen';
import { ReportsScreen } from '@/features/admin/screens/ReportsScreen';

import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerRight: route.name !== 'Dashboard'
          ? () => <HomeButton onPress={() => navigation.navigate('Dashboard')} />
          : undefined,
      })}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Admin' }} />
      <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ title: 'Approvals' }} />
      <Stack.Screen name="OrdersOverview" component={OrdersOverviewScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="ManageAdmins" component={ManageAdminsScreen} options={{ title: 'Admins' }} />
    </Stack.Navigator>
  );
}
