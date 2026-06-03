import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomerRegisterScreen } from '@/features/auth/screens/CustomerRegisterScreen';
import { DeliveryRegisterScreen } from '@/features/auth/screens/DeliveryRegisterScreen';
import { EmailLoginScreen } from '@/features/auth/screens/EmailLoginScreen';
import { LandingScreen } from '@/features/auth/screens/LandingScreen';
import { OtpVerifyScreen } from '@/features/auth/screens/OtpVerifyScreen';
import { PhoneLoginScreen } from '@/features/auth/screens/PhoneLoginScreen';
import { RoleSelectScreen } from '@/features/auth/screens/RoleSelectScreen';
import { TailorRegisterScreen } from '@/features/auth/screens/TailorRegisterScreen';

import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="CustomerRegister" component={CustomerRegisterScreen} options={{ title: 'Your profile' }} />
      <Stack.Screen name="TailorRegister" component={TailorRegisterScreen} options={{ title: 'Become a tailor' }} />
      <Stack.Screen name="DeliveryRegister" component={DeliveryRegisterScreen} options={{ title: 'Become a delivery partner' }} />
    </Stack.Navigator>
  );
}
