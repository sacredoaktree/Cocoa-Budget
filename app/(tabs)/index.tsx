import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getCategoriesByType } from '../../src/data/categories';
import { CategoryCard } from '../../src/components/CategoryCard';
import { PrivacyToggle } from '../../src/components/ui/PrivacyToggle';
import { currentMonth, prevMonth } from '../../src/utils/date';
import { Category } from '../../src/types';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, parseISO } from 'date-fns';

type Period = 'today' | 'week' | 'month' | 'last';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'last', label: 'Last Month' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function fmtAmount(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function useWeeklyDigest(sym: string) {
  const transactions = useTransactionStore((s) => s.transactions);
  const { settings, updateSettings } = useSettingsStore();

  const now = new Date();
  const isMonday = now.getDay() === 1;
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
  const twoWeeksAgoStart = subWeeks(lastWeekStart, 1);
  const twoWeeksAgoEnd = endOfWeek(twoWeeksAgoStart, { weekStartsOn: 1 });

  const thisWeekKey = thisWeekStart.toISOString().split('T')[0];
  const dismissed = (settings as any).lastDigestDismissedWeek === thisWeekKey;

  const digest = useMemo(() => {
    const lastWeekTxs = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        !t.isDeleted &&
        isWithinInterval(parseISO(t.date), { start: lastWeekStart, end: lastWeekEnd })
    );
    const prevWeekTxs = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        !t.isDeleted &&
        isWithinInterval(parseISO(t.date), { start: twoWeeksAgoStart, end: twoWeeksAgoEnd })
    );
    const spent = lastWeekTxs.reduce((s, t) => s + t.amount, 0);
    const prevSpent = prevWeekTxs.reduce((s, t) => s + t.amount, 0);
    const catMap: Record<string, number> = {};
    lastWeekTxs.forEach((t) => {
      catMap[t.categoryId] = (catMap[t.categoryId] ?? 0) + t.amount;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    const delta = prevSpent > 0 ? ((spent - prevSpent) / prevSpent) * 100 : 0;
    const txCount = lastWeekTxs.length;
    return { spent, prevSpent, topCat: topCat?.[0] ?? null, delta, txCount };
  }, [transactions]);

  const dismiss = () => updateSettings({ lastDigestDismissedWeek: thisWeekKey } as any);

  const shouldShow = isMonday && !dismissed && digest.txCount > 0;
  return { shouldShow, digest, dismiss, sym };
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const [period, setPeriod] = useState<Period>('month');
  const [incomeExpanded, setIncomeExpanded] = useState(true);

  const sym = settings.currencySymbol;
  const month = currentMonth();
  const lastMonth = prevMonth(month);

  const spendByCategory = useTransactionStore((s) => s.getSpendByCategory(month));
  const monthlyIncome = useTransactionStore((s) => s.getMonthlyIncome(month));
  const monthlyExpense = useTransactionStore((s) => s.getMonthlyExpense(month));
  const lastMonthExpense = useTransactionStore((s) => s.getMonthlyExpense(lastMonth));

  const { shouldShow: showDigest, digest, dismiss: dismissDigest } = useWeeklyDigest(sym);

  const expenseCategories = getCategoriesByType('expense');
  const incomeCategories = getCategoriesByType('income');

  const spendMap: Record<string, number> = {};
  spendByCategory.forEach((s) => {
    spendMap[s.categoryId] = s.amount;
  });

  function renderGrid(categories: Category[]) {
    const rows: Category[][] = [];
    for (let i = 0; i < categories.length; i += 3) {
      rows.push(categories.slice(i, i + 3));
    }
    return rows.map((row, rIdx) => (
      <View key={rIdx} style={styles.row}>
        {row.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            amount={spendMap[cat.id] ?? 0}
            symbol={sym}
          />
        ))}
        {row.length < 3 && (
          <View style={{ flex: 3 - row.length, margin: 4 }} />
        )}
      </View>
    ));
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>
            {greeting()},
          </Text>
          <Text style={[Typography.headline2, { color: colors.textPrimary }]}>
            {settings.displayName} 👋
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.iconBtn, { backgroundColor: colors.card }, Shadow.card]}>
            <PrivacyToggle size={22} />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Weekly Digest card (Mondays only) */}
        {showDigest && (
          <View style={[styles.digestCard, { backgroundColor: colors.card, ...Shadow.raised }]}>
            <View style={styles.digestTop}>
              <View style={[styles.digestIcon, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="bar-chart-outline" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[Typography.body2Semi, { color: colors.textPrimary }]}>Last Week Summary</Text>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                  You spent {sym}{fmtAmount(digest.spent)} across {digest.txCount} transactions
                </Text>
              </View>
              <TouchableOpacity onPress={dismissDigest}>
                <Ionicons name="close" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            {digest.prevSpent > 0 && (
              <View style={styles.digestFooter}>
                <Ionicons
                  name={digest.delta <= 0 ? 'trending-down-outline' : 'trending-up-outline'}
                  size={14}
                  color={digest.delta <= 0 ? colors.income : colors.expense}
                />
                <Text style={[Typography.captionSemi, {
                  color: digest.delta <= 0 ? colors.income : colors.expense,
                  marginLeft: 4,
                }]}>
                  {Math.abs(digest.delta).toFixed(0)}% {digest.delta <= 0 ? 'less' : 'more'} than the previous week
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Period selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodRow}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[
                styles.periodChip,
                {
                  backgroundColor:
                    period === p.key ? colors.accent : colors.card,
                  ...Shadow.card,
                },
              ]}
            >
              <Text
                style={[
                  Typography.body2Semi,
                  {
                    color:
                      period === p.key ? '#FFF' : colors.textSecondary,
                  },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary bar */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, ...Shadow.card },
          ]}
        >
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.expense }]} />
            <View>
              <Text
                style={[Typography.caption, { color: colors.textSecondary }]}
              >
                Expenses
              </Text>
              <Text
                style={[Typography.headline3, { color: colors.expense }]}
              >
                {sym}{fmtAmount(monthlyExpense)}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: colors.divider },
            ]}
          />
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.income }]} />
            <View>
              <Text
                style={[Typography.caption, { color: colors.textSecondary }]}
              >
                Income
              </Text>
              <Text
                style={[Typography.headline3, { color: colors.income }]}
              >
                {sym}{fmtAmount(monthlyIncome)}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: colors.divider },
            ]}
          />
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.info }]} />
            <View>
              <Text
                style={[Typography.caption, { color: colors.textSecondary }]}
              >
                Balance
              </Text>
              <Text
                style={[
                  Typography.headline3,
                  { color: colors.textPrimary },
                ]}
              >
                {sym}{fmtAmount(monthlyIncome - monthlyExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expense section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[Typography.overline, { color: colors.textSecondary }]}
          >
            Expenses
          </Text>
          <Text style={[Typography.body2Semi, { color: colors.expense }]}>
            {sym}{fmtAmount(monthlyExpense)}
          </Text>
        </View>
        <View style={styles.gridContainer}>
          {renderGrid(expenseCategories)}
        </View>

        {/* Income section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setIncomeExpanded((e) => !e)}
          activeOpacity={0.7}
        >
          <Text
            style={[Typography.overline, { color: colors.textSecondary }]}
          >
            Income
          </Text>
          <View style={styles.incomeMeta}>
            <Text style={[Typography.body2Semi, { color: colors.income }]}>
              {sym}{fmtAmount(monthlyIncome)}
            </Text>
            <Ionicons
              name={incomeExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
              style={{ marginLeft: 4 }}
            />
          </View>
        </TouchableOpacity>
        {incomeExpanded && (
          <View style={styles.gridContainer}>
            {renderGrid(incomeCategories)}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent, ...Shadow.fab }]}
        onPress={() => router.push('/modal/add-transaction')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digestCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  digestTop: { flexDirection: 'row', alignItems: 'center' },
  digestIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  digestFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 46 },
  scroll: { paddingBottom: 20 },
  periodRow: { marginBottom: 16 },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryDivider: { width: 1, marginVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  incomeMeta: { flexDirection: 'row', alignItems: 'center' },
  gridContainer: { paddingHorizontal: 12, marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 0 },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
