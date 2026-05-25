import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * app.config.ts
 *
 * Dynamic Expo config that reads environment variables for production builds.
 * This allows secrets to be injected via EAS Secrets without hardcoding them.
 *
 * To set EAS Secrets:
 *   eas secret:create --scope project --name SUPABASE_URL --value "https://..."
 *   eas secret:create --scope project --name SUPABASE_ANON_KEY --value "eyJ..."
 *   eas secret:create --scope project --name REVENUECAT_IOS_KEY --value "appl_..."
 *   eas secret:create --scope project --name REVENUECAT_ANDROID_KEY --value "goog_..."
 */

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Cocoa Budget',
  slug: 'cocoa-budget',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'cocoabudget',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  jsEngine: 'jsc',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F8F5F1',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.cocoa.budget',
    buildNumber: '1',
    infoPlist: {
      NSFaceIDUsageDescription: 'Cocoa Budget uses Face ID to protect your financial data.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#3D2B1F',
    },
    package: 'com.cocoa.budget',
    versionCode: 1,
    permissions: ['USE_BIOMETRIC', 'USE_FINGERPRINT'],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-local-authentication',
      { faceIDPermission: 'Allow Cocoa Budget to use Face ID for privacy lock.' },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://czxrnmwntwokhcjbqvgs.supabase.co',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '79ccefa8-08d7-4583-a87e-d0a9ccca616e',
    },
  },
});
