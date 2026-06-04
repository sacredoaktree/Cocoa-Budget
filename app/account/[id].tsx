import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useAccountStore } from '../../src/store/useAccountStore';
import { useTransactionStore } from '../../src/store/useTransactionStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getCategoryById } from '../../src/data/categories';
import { TransactionRow } from '../../src/components/TransactionRow';
import { formatGroupDate } from '../../src/utils/date';
import { Transaction } from '../../src/types';

type ViewMode = 'day' | 'month';

const ACCOUNT_ICONS: Record<string, string> = {
  checking: 'card-outline',
  savings: 'wallet-outline',
  credit: 'card-outline',
  cash: 'cash-outline',
  digital: 'send-outline',
  loan: 'trending-down-outline',
  investment: 'trending-up-outline',
  stock: 'bar-chart-outline',
  crypto: 'logo-bitcoin',
};

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const account = useAccountStore((s) => s.getById(id ?? ''));
  const txs = useTransactionStore((s) => s.getByAccount(id ?? ''));
  const [mode, setMode] = useState<ViewMode>('day');
  const [refreshing, setRefreshing] = useState(false);

  if (!account) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={[Typography.body1, { color: colors.textSecondary }]}>
            Account not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sym = account.currency === 'USD' ? '$' : settings.currencySymbol;
  const balance = account.balance / 100;
  const isNeg = balance < 0;
  const fmtBalance = Math.abs(balance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Group transactions by date
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));
  const groups: { date: string; txs: Transaction[] }[] = [];
  const seen = new Set<string>();
  sorted.forEach((tx) => {
    if (!seen.has(tx.date)) {
      seen.add(tx.date);
      groups.push({ date: tx.date, txs: sorted.filter((t) => t.date === tx.date) });
    }
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={[Typography.headline3, { color: colors.textPrimary, flex: 1 }]}
          numberOfLines={1}
        >
          {account.name}
        </Text>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.accent + '22' }]}
        >
          <Text style={[Typography.body2Semi, { color: colors.accent }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Account hero card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: account.color + '18',
              borderColor: account.color + '30',
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: account.color }]}>
              <Ionicons
                name={(ACCOUNT_ICONS[account.type] ?? 'wallet-outline') as any}
                size={24}
                color="#FFF"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[Typography.headline3, { color: colors.textPrimary }]}>
                {account.name}
              </Text>
              {account.note ? (
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                  {account.note}
                </Text>
              ) : null}
            </View>
          </View>

          <Text
            style={[
              Typography.displayMedium,
              {
                color: isNeg ? colors.expense : colors.textPrimary,
                marginVertical: 12,
              },
            ]}
          >
            {isNeg ? '-' : ''}
            {sym}
            {fmtBalance}
          </Text>

          {account.type === 'credit' && account.creditLimit ? (
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>
              Credit limit: {sym}
              {(account.creditLimit / 100).toLocaleString('en-US', {
                minimumFractionDigits: 0,
              })}{' '}
              · Available: {sym}
              {((account.creditLimit + account.balance) / 100).toLocaleString(
                'en-US',
                { minimumFractionDigits: 0 }
              )}
            </Text>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#E88C2A' }]}
              onPress={() => router.push('/modal/add-transaction')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.gold, marginLeft: 8 }]}
            >
              <Ionicons name="swap-horizontal" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions header + toggle */}
        <View style={styles.txHeader}>
          <Text style={[Typography.headline3, { color: colors.textPrimary }]}>
            Transactions
          </Text>
          <View style={[styles.modeToggle, { backgroundColor: colors.input }]}>
            {(['day', 'month'] as ViewMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.modeBtn,
                  mode === m && { backgroundColor: colors.card, ...Shadow.card },
                ]}
              >
                <Text
                  style={[
                    Typography.captionSemi,
                    {
                      color:
                        mode === m ? colors.textPrimary : colors.textSecondary,
                    },
                  ]}
                >
                  {m === 'day' ? 'Day' : 'Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transaction list */}
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={44} color={colors.textTertiary} />
            <Text
              style={[
                Typography.body2,
                { color: colors.textTertiary, marginTop: 10 },
              ]}
            >
              No transactions yet
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.date}>
              <View
                style={[
                  styles.dateHeader,
                  { borderBottomColor: colors.divider },
                ]}
              >
                <Text
                  style={[Typography.body2Semi, { color: colors.textSecondary }]}
                >
                  {formatGroupDate(group.date)}
                </Text>
              </View>
              {group.txs.map((tx) => (
                <View
                  key={tx.id}
                  style={[styles.txCard, { backgroundColor: colors.card }]}
                >
                  <TransactionRow
                    transaction={tx}
                    category={getCategoryById(tx.categoryId)}
                    symbol={sym}
                  />
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: { padding: 4 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', marginTop: 12 },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txCard: {
    marginHorizontal: 16,
    marginBottom: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 48 },
});
