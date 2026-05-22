import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../../theme/typography';

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

  const color =
    type === 'income'
      ? colors.income
      : type === 'expense'
      ? colors.expense
      : colors.textPrimary;

  return (
    <Text style={[Typography[variant], { color }, style]}>
      {display}
    </Text>
  );
}
