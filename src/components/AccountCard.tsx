import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account } from '../types';
import { Typography } from '../theme/typography';
import { Shadow } from '../theme/spacing';

interface AccountCardProps {
  account: Account;
  symbol?: string;
  onPress?: () => void;
  compact?: boolean;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit Card',
  cash: 'Cash',
  digital: 'Digital',
  loan: 'Loan',
  investment: 'Investment',
  stock: 'Stocks',
  crypto: 'Crypto',
};

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

export function AccountCard({
  account,
  symbol = '₱',
  onPress,
  compact = false,
}: AccountCardProps) {
  const balance = account.balance / 100;
  const isNegative = balance < 0;
  const absBalance = Math.abs(balance);
  const formattedBalance = absBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const bgColor = account.color;
  const iconName = (ACCOUNT_ICONS[account.type] ?? 'wallet-outline') as any;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.compactCard,
          { backgroundColor: bgColor + '22', borderLeftColor: bgColor, ...Shadow.card },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={18} color="#FFF" />
        </View>
        <View style={styles.compactInfo}>
          <Text style={[Typography.headline3, { color: '#1A1008' }]}>{account.name}</Text>
          {account.note ? (
            <Text style={[Typography.caption, { color: '#7A6858' }]}>{account.note}</Text>
          ) : null}
        </View>
        <Text
          style={[Typography.amountSmall, { color: isNegative ? '#D94F3D' : '#1A1008' }]}
        >
          {isNegative ? '-' : ''}
          {account.currency !== 'PHP' ? '$' : symbol}
          {formattedBalance}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: bgColor }, Shadow.raised]}
    >
      {/* Background decorative circles */}
      <View style={[styles.circle1, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
      <View style={[styles.circle2, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

      <View style={styles.header}>
        <View>
          <Text style={[Typography.body2Semi, { color: 'rgba(255,255,255,0.8)' }]}>
            {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
          </Text>
          <Text style={[Typography.headline3, { color: '#FFFFFF', marginTop: 2 }]}>
            {account.name}
          </Text>
          {account.note ? (
            <Text
              style={[Typography.caption, { color: 'rgba(255,255,255,0.7)', marginTop: 2 }]}
            >
              ···· {account.note}
            </Text>
          ) : null}
        </View>
        <View style={styles.iconCircleLarge}>
          <Ionicons name={iconName} size={22} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.balanceRow}>
        <Text style={[Typography.amountLarge, { color: '#FFFFFF' }]}>
          {isNegative ? '-' : ''}
          {account.currency !== 'PHP' ? '$' : symbol}
          {formattedBalance}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    height: 130,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircleLarge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  balanceRow: {
    marginTop: 8,
  },
  circle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -30,
    right: -20,
  },
  circle2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    bottom: -20,
    right: 40,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  compactInfo: {
    flex: 1,
  },
});
