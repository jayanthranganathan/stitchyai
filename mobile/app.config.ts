import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Thugil Designers',
  slug: 'thugil-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'thugil',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'in.thugildesigners.mobile',
    // From Firebase console → iOS app. Override path via GOOGLE_SERVICES_PLIST.
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './GoogleService-Info.plist',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
    },
  },
  android: {
    package: 'in.thugildesigners.mobile',
    // From Firebase console → Android app. Override path via GOOGLE_SERVICES_JSON.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
    },
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://thugil-api-production.up.railway.app/v1/',
    razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '',
    // Turn on real Firebase phone OTP (native). Leave false for the dev OTP
    // flow (code 123456) on simulators / Expo Go.
    useFirebaseAuth: process.env.EXPO_PUBLIC_USE_FIREBASE_AUTH === 'true',
    eas: {
      projectId: "9cd99483-419e-4cd4-bdd9-46e4557f2790"
    }
  },
  plugins: [
    'expo-secure-store',
    '@react-native-firebase/app',
    [
      'expo-build-properties',
      {
        // @react-native-firebase requires static frameworks on iOS
        ios: { useFrameworks: 'static' },
        // Google Play requires apps to target API level 35 (Android 15).
        // Expo SDK 51 defaults to 34, so override the Android SDK levels here.
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0',
        },
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow $(PRODUCT_NAME) to share your location to track deliveries.',
      },
    ],
  ],
};

export default config;
