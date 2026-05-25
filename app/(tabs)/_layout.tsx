import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useCloudSync } from '../../src/hooks/useCloudSync';

export default function TabsLayout() {
  const { colors } = useTheme();
  useCloudSync(); // Pull remote data into local stores on sign-in

  // Memoized to prevent React 19 infinite re-render with react-navigation useDescriptors
  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarStyle: {
      backgroundColor: colors.tabBg,
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      height: 60,
      paddingBottom: 8,
      paddingTop: 6,
    },
    tabBarActiveTintColor: colors.tabActive,
    tabBarInactiveTintColor: colors.tabInactive,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
  }), [colors]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
