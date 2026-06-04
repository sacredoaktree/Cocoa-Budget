/**
 * Paywall screen
 *
 * Shown when a free user tries to access a Pro feature.
 * Displays available subscription packages from RevenueCat
 * and handles purchase + restore flows.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme';
import { useSubscription } from '../src/context/SubscriptionContext';

const PRO_FEATURES = [
  { icon: 'cloud-outline', label: 'Cloud sync across all your devices' },
  { icon: 'shield-checkmark-outline', label: 'Automatic encrypted backups' },
  { icon: 'trending-up-outline', label: 'Net Worth Timeline & Analytics' },
  { icon: 'calculator-outline', label: 'Debt Payoff Planner' },
  { icon: 'people-outline', label: 'Bill Splitting & shared expenses' },
  { icon: 'refresh-circle-outline', label: 'Subscription Audit tracker' },
  { icon: 'bar-chart-outline', label: 'Advanced Reports & Insights' },
  { icon: 'infinite-outline', label: 'Unlimited accounts & transactions' },
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const { packages, purchase, restore, isLoading } = useSubscription();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    if (!packages.length) {
      Alert.alert('Not available', 'Subscription packages are not available yet. Please try again later.');
      return;
    }
    setPurchasing(true);
    const { error } = await purchase(packages[selectedIndex]);
    setPurchasing(false);
    if (error) {
      Alert.alert('Purchase failed', error);
    } else {
      Alert.alert('Welcome to Pro! 🎉', 'Your subscription is now active.', [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const { error } = await restore();
    setRestoring(false);
    if (error) {
      Alert.alert('Restore failed', error);
    } else {
      Alert.alert('Restored!', 'Your Pro subscription has been restored.', [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    }
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Close button */}
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.emoji}>🍫</Text>
          <Text style={s.title}>Cocoa Budget Pro</Text>
          <Text style={s.subtitle}>Unlock the full experience</Text>
        </View>

        {/* Feature list */}
        <View style={s.features}>
          {PRO_FEATURES.map((f) => (
            <View key={f.label} style={s.featureRow}>
              <View style={s.featureIcon}>
                <Ionicons name={f.icon as any} size={18} color={colors.accent} />
              </View>
              <Text style={s.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Package selector */}
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
        ) : packages.length > 0 ? (
          <View style={s.packages}>
            {packages.map((pkg, i) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[s.packageCard, selectedIndex === i && s.packageCardSelected]}
                onPress={() => setSelectedIndex(i)}
                activeOpacity={0.8}
              >
                <View style={s.packageLeft}>
                  {selectedIndex === i ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={22} color={colors.textTertiary} />
                  )}
                  <Text style={s.packageTitle}>{pkg.product.title}</Text>
                </View>
                <Text style={s.packagePrice}>{pkg.product.priceString}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={s.noPackages}>
            <Text style={s.noPackagesText}>
              Subscription packages are being configured. Check back soon!
            </Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[s.ctaBtn, (purchasing || isLoading) && s.ctaBtnDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || isLoading}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.ctaBtnText}>
              {packages.length > 0 ? `Start Free Trial` : 'Coming Soon'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={s.trialNote}>7-day free trial, then billed as selected. Cancel anytime.</Text>

        {/* Restore */}
        <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={restoring}>
          {restoring ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : (
            <Text style={s.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={s.legal}>
          Payment will be charged to your App Store / Google Play account. Subscription automatically
          renews unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { padding: 24, paddingBottom: 40 },
    closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
    header: { alignItems: 'center', marginBottom: 28 },
    emoji: { fontSize: 56, marginBottom: 8 },
    title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
    features: { gap: 12, marginBottom: 28 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: colors.card,
      alignItems: 'center', justifyContent: 'center',
    },
    featureLabel: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    packages: { gap: 10, marginBottom: 20 },
    packageCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.card, borderRadius: 14, padding: 16,
      borderWidth: 2, borderColor: 'transparent',
    },
    packageCardSelected: { borderColor: colors.accent },
    packageLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    packageTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    packagePrice: { fontSize: 15, fontWeight: '700', color: colors.accent },
    noPackages: {
      backgroundColor: colors.card, borderRadius: 14, padding: 20,
      alignItems: 'center', marginBottom: 20,
    },
    noPackagesText: { color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
    ctaBtn: {
      backgroundColor: colors.primary, borderRadius: 16, padding: 18,
      alignItems: 'center', marginBottom: 10,
    },
    ctaBtnDisabled: { opacity: 0.6 },
    ctaBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    trialNote: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginBottom: 16 },
    restoreBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 16 },
    restoreText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
    legal: { textAlign: 'center', color: colors.textTertiary, fontSize: 10, lineHeight: 15 },
  });
