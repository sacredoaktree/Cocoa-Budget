import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useBudgetStore } from '../../src/store/useBudgetStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { currentMonth, monthLabel, prevMonth, nextMonth } from '../../src/utils/date';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const [month, setMonth] = useState(currentMonth());

  const sym = settings.currencySymbol;

  const spendByCategory = useTransactionStore((s) => s.getSpendByCategory(month));
  const spendMap: Record<string, number> = {};
  spendByCategory.forEach((s) => {
    spendMap[s.categoryId] = s.amount;
  });

  const budgets = useBudgetStore((s) => s.getBudgetsWithSpent(month, spendMap));

  const totalLimit = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalPercent = totalLimit > 0 ? totalSpent / totalLimit : 0;

  const fmt = (c: number) =>
    (c / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const statusColor = (status: string) => {
    if (status === 'over') return colors.expense;
    if (status === 'warning') return colors.warning;
    return colors.income;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMonth(prevMonth(month))}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>Budget</Text>
        <TouchableOpacity onPress={() => setMonth(nextMonth(month))}>
          <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Month label */}
        <Text
          style={[
            Typography.body2,
            { color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
          ]}
        >
          {monthLabel(month)}
        </Text>

        {/* Overall budget summary card */}
        <View style={[styles.overallCard, { backgroundColor: colors.card, ...Shadow.card }]}>
          <View style={styles.overallRow}>
            <View>
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                Total Spent
              </Text>
              <Text style={[Typography.headline2, { color: colors.expense }]}>
                {sym}{fmt(totalSpent)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                Total Budget
              </Text>
              <Text style={[Typography.headline2, { color: colors.textPrimary }]}>
                {sym}{fmt(totalLimit)}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <ProgressBar percent={totalPercent} height={10} />
          </View>
          <Text
            style={[
              Typography.caption,
              { color: colors.textSecondary, marginTop: 6, textAlign: 'right' },
            ]}
          >
            {sym}{fmt(totalLimit - totalSpent)} remaining
          </Text>
        </View>

        {/* Per-category budget cards */}
        {budgets.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pie-chart-outline" size={48} color={colors.textTertiary} />
            <Text
              style={[Typography.body1, { color: colors.textTertiary, marginTop: 12 }]}
            >
              No budgets set for this month
            </Text>
          </View>
        ) : (
          budgets.map((b) => (
            <View
              key={b.id}
              style={[styles.budgetCard, { backgroundColor: colors.card, ...Shadow.card }]}
            >
              <View style={styles.budgetHeader}>
                <View
                  style={[
                    styles.catIconWrap,
                    { backgroundColor: b.categoryColor + '22' },
                  ]}
                >
                  <Ionicons
                    name={b.categoryIcon as any}
                    size={20}
                    color={b.categoryColor}
                  />
                </View>
                <View style={styles.budgetInfo}>
                  <Text style={[Typography.body1Semi, { color: colors.textPrimary }]}>
                    {b.categoryName}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    {sym}{fmt(b.spent)} of {sym}{fmt(b.limitAmount)}
                  </Text>
                </View>
                <View style={styles.budgetRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor(b.status) + '22' },
                    ]}
                  >
                    <Text
                      style={[Typography.captionSemi, { color: statusColor(b.status) }]}
                    >
                      {b.status === 'over'
                        ? 'Over'
                        : b.status === 'warning'
                        ? '⚠ Near'
                        : 'OK'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      Typography.body2Semi,
                      { color: statusColor(b.status), marginTop: 4 },
                    ]}
                  >
                    {(b.percentUsed * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
              <View style={{ marginTop: 10 }}>
                <ProgressBar
                  percent={b.percentUsed}
                  height={6}
                  color={statusColor(b.status)}
                />
              </View>
              {b.status === 'over' && (
                <Text
                  style={[Typography.caption, { color: colors.expense, marginTop: 6 }]}
                >
                  Over by {sym}{fmt(Math.abs(b.remaining))}
                </Text>
              )}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  overallCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetCard: { borderRadius: 14, padding: 14, marginBottom: 10 },
  budgetHeader: { flexDirection: 'row', alignItems: 'center' },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  budgetInfo: { flex: 1 },
  budgetRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
