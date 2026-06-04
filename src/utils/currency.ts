export const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
  HKD: 'HK$',
  MYR: 'RM',
  THB: '฿',
  IDR: 'Rp',
  KRW: '₩',
  CNY: '¥',
  INR: '₹',
  CHF: 'Fr',
  NZD: 'NZ$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  AED: 'د.إ',
  SAR: '﷼',
};

export function symbolForCurrency(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

export function formatCurrency(
  amountInCents: number,
  symbol = '₱',
  compact = false
): string {
  const amount = amountInCents / 100;
  const abs = Math.abs(amount);

  if (compact) {
    if (abs >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  }

  return `${symbol}${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAmount(
  amountInCents: number,
  type: 'income' | 'expense' | 'neutral',
  symbol = '₱'
): string {
  const formatted = formatCurrency(Math.abs(amountInCents), symbol);
  if (type === 'income') return `+${formatted}`;
  if (type === 'expense') return `-${formatted}`;
  return formatted;
}

export function centsToDisplay(cents: number, symbol = '₱'): string {
  return formatCurrency(cents, symbol);
}
