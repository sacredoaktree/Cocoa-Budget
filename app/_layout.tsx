import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from '../src/theme';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SubscriptionProvider } from '../src/context/SubscriptionContext';
import '../src/i18n';

// ─── Auth guard: redirects unauthenticated users to sign-in ──────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!session && !inAuthGroup) {
      // Not signed in — redirect to sign-in
      router.replace('/auth/sign-in');
    } else if (session && inAuthGroup) {
      // Already signed in — redirect to main app
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return <>{children}</>;
}

// ─── Inner layout with theme ──────────────────────────────────────────────────
function RootLayoutInner() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth screens */}
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="auth/sign-up" />
        <Stack.Screen name="auth/forgot-password" />

        {/* Main app */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="account/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="modal/add-account"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="modal/add-transaction"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="features/goals"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="features/net-worth-timeline"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="features/bill-split"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="features/debt-planner"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="features/subscription-audit"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="features/analytics"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="paywall"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const theme = useSettingsStore((s) => s.settings.theme);
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ThemeProvider override={theme}>
          <AuthGuard>
            <RootLayoutInner />
          </AuthGuard>
        </ThemeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
