import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeButton } from '@/components/HomeButton';
import { CategoriesScreen } from '@/features/customer/screens/CategoriesScreen';
import { CreateOrderScreen } from '@/features/customer/screens/CreateOrderScreen';
import { DeliveryMapScreen } from '@/features/customer/screens/DeliveryMapScreen';
import { DesignsScreen } from '@/features/customer/screens/DesignsScreen';
import { FabricScanScreen } from '@/features/customer/screens/FabricScanScreen';
import { HomeScreen } from '@/features/customer/screens/HomeScreen';
import { OrderTrackScreen } from '@/features/customer/screens/OrderTrackScreen';
import { OrdersScreen } from '@/features/customer/screens/OrdersScreen';
import { ProfileScreen } from '@/features/customer/screens/ProfileScreen';
import { EditProfileScreen } from '@/features/customer/screens/EditProfileScreen';
import { SubscriptionScreen } from '@/features/customer/screens/SubscriptionScreen';
import { CreditsScreen } from '@/features/customer/screens/CreditsScreen';
import { ThemePickerScreen } from '@/features/customer/screens/ThemePickerScreen';

// ── AI Design Studio screens ─────────────────────────────────────────────────
import { AIFabricUploadScreen } from '@/features/ai/screens/FabricUploadScreen';
import { AICategorySelectionScreen } from '@/features/ai/screens/CategorySelectionScreen';
import { AIProcessingScreen } from '@/features/ai/screens/AIProcessingScreen';
import { AIResultsGalleryScreen } from '@/features/ai/screens/AIResultsGalleryScreen';
import { AISavedDesignsScreen } from '@/features/ai/screens/SavedDesignsScreen';

import type { CustomerStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerRight: route.name !== 'Home'
          ? () => <HomeButton onPress={() => navigation.navigate('Home')} />
          : undefined,
      })}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Thugil Designers' }} />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
      <Stack.Screen name="FabricScan" component={FabricScanScreen} options={{ title: 'Fabric Scanner' }} />
      <Stack.Screen
        name="Designs"
        component={DesignsScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <Stack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ title: 'Place order' }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My orders' }} />
      <Stack.Screen name="OrderTrack" component={OrderTrackScreen} options={{ title: 'Track order' }} />
      <Stack.Screen name="DeliveryMap" component={DeliveryMapScreen} options={{ title: 'Delivery' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Plans' }} />
      <Stack.Screen name="Credits" component={CreditsScreen} options={{ title: 'Credits' }} />
      <Stack.Screen name="ThemePicker" component={ThemePickerScreen} options={{ title: 'Appearance' }} />

      {/* ── AI Design Studio ──────────────────────────────────────────────── */}
      <Stack.Screen
        name="AIFabricUpload"
        component={AIFabricUploadScreen}
        options={{ title: 'Upload Fabric', headerShown: false }}
      />
      <Stack.Screen
        name="AICategorySelect"
        component={AICategorySelectionScreen}
        options={{ title: 'Choose Category', headerShown: false }}
      />
      <Stack.Screen
        name="AIProcessing"
        component={AIProcessingScreen}
        options={{ title: 'Generating…', headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="AIResultsGallery"
        component={AIResultsGalleryScreen}
        options={{ title: 'Your Designs', headerShown: false }}
      />
      <Stack.Screen
        name="AISavedDesigns"
        component={AISavedDesignsScreen}
        options={{ title: 'Saved Designs', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
