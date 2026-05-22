import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, getDay, getDaysInMonth } from 'date-fns';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getCategoryById } from '../../src/data/categories';
import { TransactionRow } from '../../src/components/TransactionRow';
import { DonutChart } from '../../src/components/charts/DonutChart';
import { LineChart } from '../../src/components/charts/LineChart';
import { BarChart } from '../../src/components/charts/BarChart';
import {
  currentMonth,
  monthLabel,
  prevMonth,
  nextMonth,
  formatGroupDate,
} from '../../src/utils/date';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 64;

type TabMode = 'record' | 'stats';

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const [month, setMonth] = useState(currentMonth());
  const [mode, setMode] = useState<TabMode>('record');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sym = settings.currencySymbol;

  const allTxs = useTransactionStore((s) => s.getByMonth(month));
  const income = useTransactionStore((s) => s.getMonthlyIncome(month));
  const expense = useTransactionStore((s) => s.getMonthlyExpense(month));
  const spendByCategory = useTransactionStore((s) => s.getSpendByCategory(month));
  const dailyTotals = useTransactionStore((s) => s.getDailyTotals(month));

  const balance = income - expense;

  const fmt = (c: number) =>
    (Math.abs(c) / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Build calendar grid
  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1);
  const daysCount = getDaysInMonth(firstDay);
  // getDay returns 0=Sun, 1=Mon … convert to Mon-start offset (Mon=0)
  const rawDow = getDay(firstDay);
  const startOffset = rawDow === 0 ? 6 : rawDow - 1;

  const dailyExpenseMap: Record<string, number> = {};
  const dailyIncomeMap: Record<string, number> = {};
  dailyTotals.forEach((d) => {
    dailyExpenseMap[d.date] = d.expense;
    dailyIncomeMap[d.date] = d.income;
  });

  const calendarCells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const cellDate = (day: number) => `${month}-${String(day).padStart(2, '0')}`;

  // Grouped transactions for Record tab
  const filteredTxs = selectedDate
    ? allTxs.filter((t) => t.date === selectedDate)
    : allTxs;

  const seenDates = new Set<string>();
  const groupedTxs: { date: string; txs: typeof allTxs }[] = [];
  filteredTxs.forEach((tx) => {
    if (!seenDates.has(tx.date)) {
      seenDates.add(tx.date);
      groupedTxs.push({
        date: tx.date,
        txs: filteredTxs.filter((t) => t.date === tx.date),
      });
    }
  });
  groupedTxs.sort((a, b) => b.date.localeCompare(a.date));

  // Stats: last 6 months labels for bar chart
  const barData = Array.from({ length: 6 }, (_, i) => {
    let m = month;
    for (let j = 0; j < 5 - i; j++) m = prevMonth(m);
    return {
      label: format(new Date(m + '-01'), 'MMM'),
      income: 0,
      expense: 0,
    };
  });

  const handlePrevMonth = () => {
    setMonth(prevMonth(month));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setMonth(nextMonth(month));
    setSelectedDate(null);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>
          {monthLabel(month)}
        </Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {mode === 'record' ? (
          <>
            {/* Calendar card */}
            <View style={[styles.calendarCard, { backgroundColor: colors.card, ...Shadow.card }]}>
              {/* Day-of-week headers */}
              <View style={styles.dowRow}>
                {DOW_LABELS.map((d) => (
                  <Text key={d} style={[styles.dowLabel, { color: colors.textTertiary }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Calendar rows */}
              {Array.from({ length: calendarCells.length / 7 }, (_, row) => (
                <View key={row} style={styles.calRow}>
                  {calendarCells.slice(row * 7, row * 7 + 7).map((day, col) => {
                    if (!day) return <View key={col} style={styles.calCell} />;
                    const dateStr = cellDate(day);
                    const dayExpense = dailyExpenseMap[dateStr] ?? 0;
                    const dayIncome = dailyIncomeMap[dateStr] ?? 0;
                    const isToday = dateStr === todayStr;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <TouchableOpacity
                        key={col}
                        style={[
                          styles.calCell,
                          isToday && { backgroundColor: colors.accent, borderRadius: 8 },
                          isSelected && !isToday && {
                            backgroundColor: colors.accent + '30',
                            borderRadius: 8,
                          },
                        ]}
                        onPress={() => setSelectedDate(isSelected ? null : dateStr)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            Typography.body2,
                            { color: isToday ? '#FFF' : colors.textPrimary },
                          ]}
                        >
                          {day}
                        </Text>
                        {dayExpense > 0 && (
                          <Text
                            style={[
                              styles.calAmount,
                              {
                                color: isToday
                                  ? 'rgba(255,255,255,0.85)'
                                  : colors.expense,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {sym}
                            {(dayExpense / 100).toLocaleString('en-US', {
                              maximumFractionDigits: 0,
                            })}
                          </Text>
                        )}
                        {dayIncome > 0 && dayExpense === 0 && (
                          <Text
                            style={[
                              styles.calAmount,
                              {
                                color: isToday
                                  ? 'rgba(255,255,255,0.85)'
                                  : colors.income,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {sym}
                            {(dayIncome / 100).toLocaleString('en-US', {
                              maximumFractionDigits: 0,
                            })}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {/* Income / Expense / Balance summary */}
              <View style={[styles.summaryRow, { borderTopColor: colors.divider }]}>
                <View style={styles.summaryItem}>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    Income
                  </Text>
                  <Text style={[Typography.body2Semi, { color: colors.income }]}>
                    {sym}{fmt(income)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    Expense
                  </Text>
                  <Text style={[Typography.body2Semi, { color: colors.expense }]}>
                    {sym}{fmt(expense)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    Balance
                  </Text>
                  <Text
                    style={[
                      Typography.body2Semi,
                      { color: balance >= 0 ? colors.textPrimary : colors.expense },
                    ]}
                  >
                    {sym}{fmt(balance)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Grouped transaction list */}
            {groupedTxs.map((group) => {
              const groupExpense = group.txs
                .filter((t) => t.type === 'expense')
                .reduce((s, t) => s + t.amount, 0);
              const groupIncome = group.txs
                .filter((t) => t.type === 'income')
                .reduce((s, t) => s + t.amount, 0);
              const net = groupIncome - groupExpense;

              return (
                <View key={group.date}>
                  <View style={[styles.dateHeader, { borderBottomColor: colors.divider }]}>
                    <Text style={[Typography.body2Semi, { color: colors.textPrimary }]}>
                      {formatGroupDate(group.date)}
                    </Text>
                    {net !== 0 && (
                      <Text
                        style={[
                          Typography.captionSemi,
                          { color: net > 0 ? colors.income : colors.expense },
                        ]}
                      >
                        {net > 0 ? 'IN' : 'OUT'} {sym}{fmt(Math.abs(net))}
                      </Text>
                    )}
                  </View>
                  {group.txs.map((tx) => (
                    <View
                      key={tx.id}
                      style={[styles.txRow, { backgroundColor: colors.card }]}
                    >
                      <TransactionRow
                        transaction={tx}
                        category={getCategoryById(tx.categoryId)}
                        symbol={sym}
                      />
                    </View>
                  ))}
                </View>
              );
            })}

            {groupedTxs.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
                <Text
                  style={[Typography.body1, { color: colors.textTertiary, marginTop: 12 }]}
                >
                  No transactions yet
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Trends line chart */}
            <View style={[styles.statsCard, { backgroundColor: colors.card, ...Shadow.card }]}>
              <View style={styles.statsCardHeader}>
                <Text style={[Typography.headline3, { color: colors.textPrimary }]}>
                  Trends
                </Text>
                <View style={[styles.allChip, { backgroundColor: colors.accent + '22' }]}>
                  <Text style={[Typography.captionSemi, { color: colors.accent }]}>All</Text>
                </View>
              </View>
              <LineChart
                data={dailyTotals.map((d) => ({
                  label: d.date.split('-')[2],
                  value: d.expense,
                }))}
                width={CHART_W}
                height={160}
                color={colors.gold}
              />
              <View style={styles.chartLegend}>
                <View style={[styles.legendChip, { backgroundColor: colors.expense }]}>
                  <Text style={[Typography.captionSemi, { color: '#FFF' }]}>Expense</Text>
                </View>
                <Text
                  style={[Typography.body2Semi, { color: colors.expense, marginLeft: 8 }]}
                >
                  {sym}{fmt(expense)}
                </Text>
                <Text
                  style={[
                    Typography.body2Semi,
                    { color: colors.textSecondary, marginHorizontal: 16 },
                  ]}
                >
                  Income
                </Text>
                <Text style={[Typography.body2Semi, { color: colors.income }]}>
                  {sym}{fmt(income)}
                </Text>
              </View>
            </View>

            {/* Categories donut */}
            {spendByCategory.length > 0 && (
              <View style={[styles.statsCard, { backgroundColor: colors.card, ...Shadow.card }]}>
                <View style={styles.statsCardHeader}>
                  <Text style={[Typography.headline3, { color: colors.textPrimary }]}>
                    Categories
                  </Text>
                  <View style={styles.pctToggle}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, { backgroundColor: colors.input }]}
                    >
                      <Text style={[Typography.captionSemi, { color: colors.textSecondary }]}>
                        %
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, { backgroundColor: colors.input }]}
                    >
                      <Text style={[Typography.captionSemi, { color: colors.textSecondary }]}>
                        {sym}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.donutWrap}>
                  <DonutChart
                    segments={spendByCategory.map((s) => ({
                      color: s.categoryColor,
                      value: s.amount,
                    }))}
                    size={180}
                    centerLabel={`${sym}${fmt(expense)}`}
                    centerSub="total"
                  />
                </View>

                {spendByCategory.map((s) => (
                  <View key={s.categoryId} style={styles.catRow}>
                    <Ionicons
                      name={s.categoryIcon as any}
                      size={18}
                      color={s.categoryColor}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[Typography.body2, { color: colors.textPrimary, flex: 1 }]}
                    >
                      {s.categoryName}
                    </Text>
                    <View style={[styles.pctBadge, { backgroundColor: colors.input }]}>
                      <Text
                        style={[Typography.captionSemi, { color: colors.textSecondary }]}
                      >
                        {s.percent.toFixed(1)}%
                      </Text>
                    </View>
                    <Text
                      style={[
                        Typography.body2Semi,
                        {
                          color: colors.textPrimary,
                          marginLeft: 8,
                          width: 80,
                          textAlign: 'right',
                        },
                      ]}
                    >
                      {sym}{fmt(s.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Overview bar chart — last 6 months */}
            <View style={[styles.statsCard, { backgroundColor: colors.card, ...Shadow.card }]}>
              <View style={styles.statsCardHeader}>
                <Text style={[Typography.headline3, { color: colors.textPrimary }]}>
                  Overview
                </Text>
              </View>
              <BarChart data={barData} width={CHART_W} height={160} />
              <View style={styles.chartLegend}>
                <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
                <Text
                  style={[
                    Typography.captionSemi,
                    { color: colors.textSecondary, marginRight: 12 },
                  ]}
                >
                  Income
                </Text>
                <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
                <Text style={[Typography.captionSemi, { color: colors.textSecondary }]}>
                  Expense
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Record / Stats segmented toggle */}
      <View
        style={[
          styles.toggleBar,
          { backgroundColor: colors.card, borderTopColor: colors.divider },
        ]}
      >
        {(['record', 'stats'] as TabMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.toggleTab,
              mode === m && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
            ]}
            onPress={() => setMode(m)}
          >
            <Text
              style={[
                Typography.body1Semi,
                { color: mode === m ? colors.accent : colors.textSecondary },
              ]}
            >
              {m === 'record' ? 'Record' : 'Stats'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  calendarCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  dowRow: { flexDirection: 'row', marginBottom: 4 },
  dowLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  calRow: { flexDirection: 'row' },
  calCell: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  calAmount: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 10,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txRow: { marginHorizontal: 16, marginBottom: 2, borderRadius: 10, overflow: 'hidden' },
  empty: { alignItems: 'center', paddingTop: 60 },
  statsCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  allChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chartLegend: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  legendChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  donutWrap: { alignItems: 'center', marginVertical: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  pctBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pctToggle: { flexDirection: 'row', gap: 4 },
  toggleBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  toggleBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 4,
  },
  toggleTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
});
