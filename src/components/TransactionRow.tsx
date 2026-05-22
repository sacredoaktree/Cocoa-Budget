import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Category } from '../types';
import { Typography } from '../theme/typography';
import { useTheme } from '../theme';

interface TransactionRowProps {
  transaction: Transaction;
  category: Category | undefined;
  symbol?: string;
  onPress?: () => void;
  showAccount?: boolean;
  accountName?: string;
}

export function TransactionRow({
  transaction,
  category,
  symbol = '₱',
  onPress,
  showAccount,
  accountName,
}: TransactionRowProps) {
  const { colors } = useTheme();

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const amountColor = isIncome ? colors.income : isTransfer ? colors.info : colors.expense;
  const sign = isIncome ? '+' : isTransfer ? '⇄' : '-';
  const amount = transaction.amount / 100;
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const iconName = (category?.icon ?? 'help-circle-outline') as any;
  const iconColor = category?.color ?? '#8A8A8A';
  const iconBg = category?.bgColor ?? '#F0F0F0';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
        {transaction.subscriptionId ? (
          <View style={[styles.recurringDot, { backgroundColor: colors.info }]}>
            <Ionicons name="refresh-outline" size={8} color="#FFF" />
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <Text
          style={[Typography.body1Semi, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {transaction.payee || category?.name || 'Transaction'}
        </Text>
        <View style={styles.metaRow}>
          {showAccount && accountName ? (
            <View style={[styles.accountChip, { backgroundColor: colors.input }]}>
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                {accountName}
              </Text>
            </View>
          ) : null}
          <Text style={[Typography.caption, { color: colors.textTertiary }]}>
            {transaction.time}
          </Text>
        </View>
      </View>

      <Text style={[Typography.amountSmall, { color: amountColor }]}>
        {sign}{symbol}{formattedAmount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  recurringDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  accountChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
