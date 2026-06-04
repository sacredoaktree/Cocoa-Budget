import React from 'react';
import { useSettingsStore } from '@shared/store/useSettingsStore';

interface AmountTextProps {
  cents: number;
  symbol?: string;
  className?: string;
  colorize?: boolean;
}

export default function AmountText({
  cents,
  symbol = '₱',
  className = '',
  colorize = false,
}: AmountTextProps) {
  const { settings } = useSettingsStore();

  if (settings.privacyMode) {
    return <span className={className}>••••</span>;
  }

  const abs = Math.abs(cents) / 100;
  const formatted =
    symbol +
    abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  let colorClass = '';
  if (colorize) {
    colorClass = cents >= 0 ? 'text-cocoa-income' : 'text-cocoa-expense';
  }

  return (
    <span className={`${colorClass} ${className}`.trim()}>
      {formatted}
    </span>
  );
}
