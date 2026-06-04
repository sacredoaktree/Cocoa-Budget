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
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { SYSTEM_CATEGORIES } from '../../src/data/categories';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { currentMonth, prevMonth } from '../../src/utils/date';

type Period = 'thisMonth' | 'lastMonth' | 'thisWeek';
type Tab = 'expenses' | 'income';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'thisWeek', label: 'This Week' },
];

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'expenses', label: 'Expenses' },
  { key: 'income', label: 'Income' },
];

function formatAmount(cents: number, symbol: string): string {
  const abs = Math.abs(cents);
  if (abs >= 100000) return `${symbol}${(abs / 100000).toFixed(1)}k`;
  return `${symbol}${(abs / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const { transactions } = useTransactionStore();

  const [period, setPeriod] = useState<Period>('thisMonth');
  const [tab, setTab] = useState<Tab>('expenses');

  const symbol = settings.currencySymbol || '$';

  // Determine date range for the selected period
  const { monthKey, startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (period === 'thisMonth') {
      const m = currentMonth();
      return { monthKey: m, startDate: `${m}-01`, endDate: null };
    }
    if (period === 'lastMonth') {
      const m = prevMonth(currentMonth());
      return { monthKey: m, startDate: `${m}-01`, endDate: null };
    }
    // thisWeek
    const ws = startOfWeek(now, { weekStartsOn: 1 });
    const we = endOfWeek(now, { weekStartsOn: 1 });
    return {
      monthKey: null,
      startDate: format(ws, 'yyyy-MM-dd'),
      endDate: format(we, 'yyyy-MM-dd'),
    };
  }, [period]);

  // Filter transactions for the period
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.isDeleted) return false;
      if (monthKey) return t.date.startsWith(monthKey);
      if (startDate && endDate) return t.date >= startDate && t.date <= endDate;
      return false;
    });
  }, [transactions, monthKey, startDate, endDate]);

  // Aggregate by category for the selected tab
  const categoryRows = useMemo(() => {
    const type = tab === 'expenses' ? 'expense' : 'income';
    const filtered = periodTransactions.filter((t) => t.type === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);

    const map: Record<string, number> = {};
    filtered.forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    });

    const rows = Object.entries(map)
      .map(([categoryId, amount]) => {
        const cat = SYSTEM_CATEGORIES.find((c) => c.id === categoryId);
        return {
          categoryId,
          name: cat?.name ?? 'Other',
          icon: cat?.icon ?? 'help-circle-outline',
          color: cat?.color ?? '#8A8A8A',
          amount,
          percent: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { rows, total };
  }, [periodTransactions, tab]);

  const { rows, total } = categoryRows;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Period segmented control */}
        <View style={[styles.segmentWrap, { backgroundColor: colors.card, ...Shadow.card }]}>
          {PERIOD_LABELS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.segment,
                period === key && { backgroundColor: colors.accent },
              ]}
              onPress={() => setPeriod(key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  Typography.captionSemi,
                  { color: period === key ? '#FFF' : colors.textSecondary },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab toggle */}
        <View style={[styles.tabRow, { backgroundColor: colors.card, ...Shadow.card }]}>
          {TAB_LABELS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tabBtn,
                tab === key && {
                  borderBottomWidth: 2,
                  borderBottomColor: key === 'expenses' ? colors.expense : colors.income,
                },
              ]}
              onPress={() => setTab(key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  Typography.body2Semi,
                  {
                    color:
                      tab === key
                        ? key === 'expenses'
                          ? colors.expense
                          : colors.income
                        : colors.textSecondary,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total card */}
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor:
                tab === 'expenses' ? colors.expense : colors.income,
            },
          ]}
        >
          <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>
            {tab === 'expenses' ? 'Total Expenses' : 'Total Income'}
          </Text>
          <Text style={[Typography.amountLarge, { color: '#FFF', marginTop: 4 }]}>
            {formatAmount(total, symbol)}
          </Text>
          <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)', marginTop: 2 }]}>
            {rows.length} {rows.length === 1 ? 'category' : 'categories'}
          </Text>
        </View>

        {/* Category list */}
        {rows.length === 0 ? (
          <View style={[styles.emptyWrap, { backgroundColor: colors.card, ...Shadow.card }]}>
            <Ionicons
              name={tab === 'expenses' ? 'receipt-outline' : 'cash-outline'}
              size={40}
              color={colors.textTertiary}
            />
            <Text
              style={[Typography.body2, { color: colors.textSecondary, marginTop: 12 }]}
            >
              No {tab === 'expenses' ? 'expenses' : 'income'} for this period
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: colors.card, ...Shadow.card }]}>
            {rows.map((row, index) => (
              <React.Fragment key={row.categoryId}>
                <View style={styles.categoryRow}>
                  {/* Icon dot */}
                  <View
                    style={[styles.dot, { backgroundColor: row.color + '22' }]}
                  >
                    <Ionicons name={row.icon as any} size={16} color={row.color} />
                  </View>

                  <View style={styles.categoryInfo}>
                    {/* Name + amount on same row */}
                    <View style={styles.categoryTopRow}>
                      <Text
                        style={[Typography.body2Semi, { color: colors.textPrimary, flex: 1 }]}
                        numberOfLines={1}
                      >
                        {row.name}
                      </Text>
                      <Text
                        style={[Typography.body2Semi, { color: colors.textPrimary }]}
                      >
                        {formatAmount(row.amount, symbol)}
                      </Text>
                    </View>

                    {/* Progress bar + percent */}
                    <View style={styles.barRow}>
                      <View
                        style={[styles.barTrack, { backgroundColor: colors.divider }]}
                      >
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: row.color,
                              width: `${Math.min(row.percent, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          Typography.caption,
                          { color: colors.textTertiary, marginLeft: 8, minWidth: 36, textAlign: 'right' },
                        ]}
                      >
                        {row.percent.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
                {index < rows.length - 1 && (
                  <View
                    style={[styles.divider, { backgroundColor: colors.divider }]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16 },
  segmentWrap: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  totalCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyWrap: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: { flex: 1 },
  categoryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
});
