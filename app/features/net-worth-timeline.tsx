import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useNetWorthStore } from '../../src/store/useNetWorthStore';
import { useAccountStore } from '../../src/store/useAccountStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { LineChart } from '../../src/components/charts/LineChart';
import { format, parseISO } from 'date-fns';

const { width: W } = Dimensions.get('window');

export default function NetWorthTimelineScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const { snapshots } = useNetWorthStore();
  const netWorth = useAccountStore((s) => s.getNetWorth());
  const totalAssets = useAccountStore((s) => s.getTotalAssets());
  const totalLiabilities = useAccountStore((s) => s.getTotalLiabilities());

  const sym = settings.currencySymbol;
  const fmt = (c: number) => (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = sorted.map((s) => ({
    label: format(parseISO(s.date + '-01'), 'MMM'),
    value: s.amount / 100,
  }));

  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const change = latest && prev ? latest.amount - prev.amount : 0;
  const changePct = prev && prev.amount > 0 ? (change / prev.amount) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>Net Worth Timeline</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Current net worth hero */}
        <View style={[styles.heroCard, { backgroundColor: '#7C5CBF' }]}>
          <View style={styles.heroWave1} />
          <View style={styles.heroWave2} />
          <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>Current Net Worth</Text>
          <Text style={[Typography.amountLarge, { color: '#FFF', marginVertical: 8, fontSize: 38 }]}>
            {sym}{fmt(netWorth)}
          </Text>
          {change !== 0 && (
            <View style={[styles.changeChip, { backgroundColor: isPositive ? 'rgba(46,158,107,0.3)' : 'rgba(217,79,61,0.3)' }]}>
              <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={14} color={isPositive ? '#7FFFB8' : '#FFB0A8'} />
              <Text style={[Typography.captionSemi, { color: isPositive ? '#7FFFB8' : '#FFB0A8', marginLeft: 4 }]}>
                {isPositive ? '+' : ''}{sym}{fmt(Math.abs(change))} ({changePct.toFixed(1)}%) vs last month
              </Text>
            </View>
          )}
          <View style={styles.assetsRow}>
            <View>
              <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Assets</Text>
              <Text style={[Typography.body1Semi, { color: '#FFF' }]}>{sym}{fmt(totalAssets)}</Text>
            </View>
            <View style={[styles.assetDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            <View>
              <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Liabilities</Text>
              <Text style={[Typography.body1Semi, { color: '#FFB8B0' }]}>{sym}{fmt(totalLiabilities)}</Text>
            </View>
          </View>
        </View>

        {/* Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, ...Shadow.card }]}>
          <Text style={[Typography.headline3, { color: colors.textPrimary, marginBottom: 16 }]}>12-Month History</Text>
          {sorted.length < 2 ? (
            <Text style={[Typography.body2, { color: colors.textTertiary, textAlign: 'center', paddingVertical: 32 }]}>
              Not enough history yet. Check back next month.
            </Text>
          ) : (
            <LineChart data={chartData} width={W - 64} height={180} color={colors.gold} showDots />
          )}
        </View>

        {/* Monthly breakdown table */}
        <View style={[styles.tableCard, { backgroundColor: colors.card, ...Shadow.card }]}>
          <Text style={[Typography.headline3, { color: colors.textPrimary, marginBottom: 12 }]}>Monthly Breakdown</Text>
          {sorted.slice().reverse().map((snap, i) => {
            const prevSnap = sorted[sorted.length - 2 - i];
            const diff = prevSnap ? snap.amount - prevSnap.amount : 0;
            const pos = diff >= 0;
            return (
              <View key={snap.id} style={[styles.tableRow, { borderBottomColor: colors.divider }]}>
                <Text style={[Typography.body2, { color: colors.textSecondary, width: 70 }]}>
                  {format(parseISO(snap.date + '-01'), 'MMM yyyy')}
                </Text>
                <Text style={[Typography.body2Semi, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}>
                  {sym}{fmt(snap.amount)}
                </Text>
                {diff !== 0 && (
                  <Text style={[Typography.captionSemi, { color: pos ? colors.income : colors.expense, width: 80, textAlign: 'right' }]}>
                    {pos ? '+' : ''}{sym}{fmt(Math.abs(diff))}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  heroCard: { margin: 16, borderRadius: 20, padding: 24, overflow: 'hidden' },
  heroWave1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -80, left: -40 },
  heroWave2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)', top: -50, right: -30 },
  changeChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 12 },
  assetsRow: { flexDirection: 'row', gap: 24, marginTop: 4 },
  assetDivider: { width: 1 },
  chartCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
  tableCard: { marginHorizontal: 16, borderRadius: 16, padding: 16 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
