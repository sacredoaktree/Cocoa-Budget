import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { Subscription } from '../../src/types';

const CYCLE_ANNUAL: Record<string, number> = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

function annualCost(sub: Subscription) {
  return sub.amount * (CYCLE_ANNUAL[sub.billingCycle] ?? 12);
}

function fmt(cents: number, sym: string) {
  if (cents >= 100000) {
    return sym + (cents / 100 / 1000).toFixed(1) + 'k';
  }
  return sym + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtFull(cents: number, sym: string) {
  return sym + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CYCLE_LABEL: Record<string, string> = {
  weekly: '/wk',
  monthly: '/mo',
  quarterly: '/qtr',
  yearly: '/yr',
};

export default function SubscriptionAuditScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const sym = settings.currencySymbol;
  const { subscriptions, cancelSubscription } = useSubscriptionStore();
  const transactions = useTransactionStore((s) => s.transactions);
  const [filter, setFilter] = useState<'all' | 'active' | 'unused'>('all');

  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  function isUnused(sub: Subscription) {
    if (sub.status !== 'active') return false;
    const lastTx = transactions
      .filter((t) => t.subscriptionId === sub.id && !t.isDeleted)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!lastTx) return true;
    return new Date(lastTx.date) < sixtyDaysAgo;
  }

  const active = subscriptions.filter((s) => s.status === 'active');
  const annualTotal = active.reduce((sum, s) => sum + annualCost(s), 0);
  const monthlyTotal = active.reduce((sum, s) => sum + s.amount * (CYCLE_ANNUAL[s.billingCycle] ?? 12) / 12, 0);
  const unusedSubs = active.filter(isUnused);

  const sorted = [...subscriptions].sort((a, b) => annualCost(b) - annualCost(a));
  const filtered = sorted.filter((s) => {
    if (filter === 'active') return s.status === 'active';
    if (filter === 'unused') return isUnused(s);
    return true;
  });

  const handleCancel = (sub: Subscription) => {
    Alert.alert(
      'Cancel Subscription',
      `Stop tracking "${sub.name}"? This only changes the status in the app — it won't cancel the actual subscription.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel It',
          style: 'destructive',
          onPress: () => cancelSubscription(sub.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>Subscription Audit</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Headline card */}
        <View style={[styles.headlineCard, { backgroundColor: colors.accent }]}>
          <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>
            You're spending
          </Text>
          <Text style={[Typography.displayMedium, { color: '#FFF', marginVertical: 4 }]}>
            {fmt(annualTotal, sym)}/year
          </Text>
          <Text style={[Typography.body2, { color: 'rgba(255,255,255,0.85)' }]}>
            on subscriptions · {fmtFull(monthlyTotal, sym)}/month avg
          </Text>

          {unusedSubs.length > 0 && (
            <View style={[styles.unusedAlert, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
              <Ionicons name="warning-outline" size={16} color="#FFE" />
              <Text style={[Typography.body2Semi, { color: '#FFE', marginLeft: 6 }]}>
                {unusedSubs.length} unused subscription{unusedSubs.length > 1 ? 's' : ''} detected
              </Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, ...Shadow.card }]}>
          {[
            { label: 'Active', value: String(active.length), color: colors.income },
            { label: 'Paused', value: String(subscriptions.filter(s => s.status === 'paused').length), color: colors.textSecondary },
            { label: 'Cancelled', value: String(subscriptions.filter(s => s.status === 'cancelled').length), color: colors.expense },
            { label: 'Unused', value: String(unusedSubs.length), color: '#F59E0B' },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />}
              <View style={styles.statItem}>
                <Text style={[Typography.headline2, { color: item.color }]}>{item.value}</Text>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(['all', 'active', 'unused'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                { backgroundColor: filter === f ? colors.accent : colors.card, ...Shadow.card },
              ]}
            >
              <Text style={[Typography.body2Semi, { color: filter === f ? '#FFF' : colors.textSecondary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscription list */}
        {filtered.map((sub) => {
          const unused = isUnused(sub);
          const annual = annualCost(sub);
          const isCancelled = sub.status === 'cancelled';
          const isPaused = sub.status === 'paused';
          return (
            <View
              key={sub.id}
              style={[
                styles.subRow,
                {
                  backgroundColor: colors.card,
                  ...Shadow.card,
                  opacity: isCancelled ? 0.5 : 1,
                },
              ]}
            >
              <View style={[styles.subIcon, { backgroundColor: sub.color + '22' }]}>
                <Ionicons name={sub.icon as any} size={22} color={sub.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.subNameRow}>
                  <Text style={[Typography.body1Semi, { color: colors.textPrimary }]}>{sub.name}</Text>
                  {unused && (
                    <View style={[styles.unusedTag, { backgroundColor: '#F59E0B22' }]}>
                      <Text style={[Typography.captionSemi, { color: '#F59E0B' }]}>Unused</Text>
                    </View>
                  )}
                  {isPaused && (
                    <View style={[styles.unusedTag, { backgroundColor: colors.textTertiary + '22' }]}>
                      <Text style={[Typography.captionSemi, { color: colors.textTertiary }]}>Paused</Text>
                    </View>
                  )}
                  {isCancelled && (
                    <View style={[styles.unusedTag, { backgroundColor: colors.expense + '22' }]}>
                      <Text style={[Typography.captionSemi, { color: colors.expense }]}>Cancelled</Text>
                    </View>
                  )}
                </View>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                  {fmtFull(sub.amount, sym)}{CYCLE_LABEL[sub.billingCycle]} · {fmtFull(annual, sym)}/yr
                </Text>
                <Text style={[Typography.caption, { color: colors.textTertiary }]}>
                  Next: {sub.nextBillingDate}
                </Text>
              </View>

              {!isCancelled && (
                <TouchableOpacity
                  onPress={() => handleCancel(sub)}
                  style={[styles.cancelBtn, { borderColor: colors.expense }]}
                >
                  <Text style={[Typography.captionSemi, { color: colors.expense }]}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={52} color={colors.income} />
            <Text style={[Typography.body1, { color: colors.textTertiary, marginTop: 12 }]}>
              No subscriptions in this category
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headlineCard: {
    marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 12,
  },
  unusedAlert: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, padding: 10, marginTop: 12,
  },
  statsRow: {
    marginHorizontal: 16, borderRadius: 16, padding: 8,
    flexDirection: 'row', marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statDivider: { width: 1, marginVertical: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  subRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, borderRadius: 16, padding: 14, marginBottom: 10,
  },
  subIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  subNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  unusedTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  cancelBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
