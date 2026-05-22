import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme';
import '../src/i18n';

function RootLayoutInner() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
