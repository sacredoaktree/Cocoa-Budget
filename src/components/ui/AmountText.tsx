import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../../theme/typography';
import { useSettingsStore } from '../../store/useSettingsStore';

interface AmountTextProps {
  amount: number;          // in cents
  type?: 'income' | 'expense' | 'neutral';
  symbol?: string;
  variant?: keyof typeof Typography;
  style?: TextStyle;
  showSign?: boolean;
}

export function AmountText({
  amount,
  type = 'neutral',
  symbol = '₱',
  variant = 'amountSmall',
  style,
  showSign = true,
}: AmountTextProps) {
  const { colors } = useTheme();
  const privacyMode = useSettingsStore((s) => s.settings.privacyMode);

  const color =
    type === 'income'
      ? colors.income
      : type === 'expense'
      ? colors.expense
      : colors.textPrimary;

  if (privacyMode) {
    return (
      <Text style={[Typography[variant], { color }, style]}>••••</Text>
    );
  }

  const abs = Math.abs(amount / 100);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const display = showSign
    ? type === 'income'
      ? `+${symbol}${formatted}`
      : type === 'expense'
      ? `-${symbol}${formatted}`
      : `${symbol}${formatted}`
    : `${symbol}${formatted}`;

  return (
    <Text style={[Typography[variant], { color }, style]}>
      {display}
    </Text>
  );
}
