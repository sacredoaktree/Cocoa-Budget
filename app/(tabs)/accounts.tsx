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
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useAccountStore } from '../../src/store/useAccountStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { NetWorthCard } from '../../src/components/NetWorthCard';
import { AccountCard } from '../../src/components/AccountCard';
import { Account } from '../../src/types';

type AccountGroup = {
  label: string;
  types: string[];
  labelColor: string;
};

const ACCOUNT_GROUPS: AccountGroup[] = [
  {
    label: 'Debit',
    types: ['checking', 'savings', 'cash', 'digital'],
    labelColor: '#4A90D9',
  },
  {
    label: 'Credit',
    types: ['credit'],
    labelColor: '#D94F3D',
  },
  {
    label: 'Investment',
    types: ['investment', 'stock', 'crypto'],
    labelColor: '#C8956A',
  },
  {
    label: 'Loan',
    types: ['loan'],
    labelColor: '#8B5CF6',
  },
];

function fmtBalance(cents: number): string {
  return (Math.abs(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function groupTotal(accs: Account[]): number {
  return accs.reduce((sum, a) => sum + a.balance, 0);
}

export default function AccountsScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const accounts = useAccountStore((s) => s.accounts);
  const netWorth = useAccountStore((s) => s.getNetWorth());
  const totalAssets = useAccountStore((s) => s.getTotalAssets());
  const totalLiabilities = useAccountStore((s) => s.getTotalLiabilities());
  const [refreshing, setRefreshing] = useState(false);

  const sym = settings.currencySymbol;
  const active = accounts.filter((a) => !a.isArchived);

  function groupAccounts(types: string[]): Account[] {
    return active.filter((a) => types.includes(a.type));
  }

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={[Typography.headline3, { color: colors.accent }]}>
            All
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>
          Accounts
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/modal/add-account')}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Net Worth Card */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <NetWorthCard
            netWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            symbol={sym}
          />
        </View>

        {/* Account groups */}
        {ACCOUNT_GROUPS.map((group) => {
          const groupAccs = groupAccounts(group.types);
          if (!groupAccs.length) return null;
          const total = groupTotal(groupAccs);
          const isNeg = total < 0;

          return (
            <View
              key={group.label}
              style={[
                styles.groupCard,
                { backgroundColor: colors.card, ...Shadow.card },
              ]}
            >
              <View style={styles.groupHeader}>
                <Text
                  style={[
                    Typography.body1Semi,
                    { color: group.labelColor },
                  ]}
                >
                  {group.label}
                </Text>
                <View style={styles.groupHeaderRight}>
                  <Text
                    style={[
                      Typography.caption,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Bal.{' '}
                  </Text>
                  <Text
                    style={[
                      Typography.body2Semi,
                      {
                        color: isNeg
                          ? colors.expense
                          : colors.textPrimary,
                      },
                    ]}
                  >
                    {isNeg ? '-' : ''}
                    {sym}
                    {fmtBalance(total)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={colors.textSecondary}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>

              {groupAccs.map((acc, idx) => (
                <View key={acc.id}>
                  {idx > 0 && (
                    <View
                      style={[
                        styles.rowDivider,
                        { backgroundColor: colors.divider },
                      ]}
                    />
                  )}
                  <AccountCard
                    account={acc}
                    symbol={acc.currency === 'USD' ? '$' : sym}
                    compact
                    onPress={() => router.push(`/account/${acc.id}`)}
                  />
                </View>
              ))}
            </View>
          );
        })}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: 20 },
  groupCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
  },
});
