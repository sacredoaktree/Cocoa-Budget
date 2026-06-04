import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SubscriptionProvider } from '../src/context/SubscriptionContext';
import '../src/i18n';

// ─── Auth redirect logic (runs inside navigation context) ────────────────────
function useProtectedRoute() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait until auth state is determined

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // Not signed in — redirect to sign-in
      router.replace('/auth/sign-in');
    } else if (session && inAuthGroup) {
      // Signed in but on auth screen — redirect to main app
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);
}

// ─── Inner layout with navigation ────────────────────────────────────────────
function RootLayoutNav() {
  const { isDark } = useTheme();
  const { loading } = useAuth();

  // Run auth redirect logic
  useProtectedRoute();

  // Show loading screen while auth state is being determined
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8956A" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="account/[id]"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="modal/add-account"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="modal/add-transaction"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="features/goals"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="features/net-worth-timeline"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="features/bill-split"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="features/debt-planner"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="features/subscription-audit"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="features/analytics"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="paywall"
          options={{ presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F5F1',
  },
});

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const theme = useSettingsStore((s) => s.settings.theme);
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ThemeProvider override={theme}>
          <RootLayoutNav />
        </ThemeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
