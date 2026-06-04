import React from 'react';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useNetWorthStore } from '@shared/store/useNetWorthStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { formatCurrency } from '@shared/utils/currency';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';
import NetWorthLine from '../components/charts/NetWorthLine';
import { TrendingUp, TrendingDown, Minus, Landmark, CreditCard } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortMonthFull(yyyymm: string): string {
  const [year, mon] = yyyymm.split('-');
  const d = new Date(parseInt(year), parseInt(mon) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function shortMonthLabel(yyyymm: string): string {
  const [year, mon] = yyyymm.split('-');
  const d = new Date(parseInt(year), parseInt(mon) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NetWorth() {
  const getNetWorth = useAccountStore((s) => s.getNetWorth);
  const getTotalAssets = useAccountStore((s) => s.getTotalAssets);
  const getTotalLiabilities = useAccountStore((s) => s.getTotalLiabilities);
  const { snapshots } = useNetWorthStore();
  const { settings } = useSettingsStore();
  const symbol = settings.currencySymbol;

  const netWorth = getNetWorth();
  const assets = getTotalAssets();
  const liabilities = getTotalLiabilities();

  // Sort snapshots ascending
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));

  // Chart data with short month labels
  const chartData = sorted.map((s) => ({
    date: shortMonthLabel(s.date),
    amount: s.amount,
  }));

  // Table rows newest first, with change vs prev
  const tableRows = sorted.map((snap, i) => {
    const prev = i > 0 ? sorted[i - 1] : null;
    const change = prev ? snap.amount - prev.amount : null;
    return { ...snap, change };
  }).reverse();

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-cocoa-text1">Net Worth Timeline</h1>

      {/* ── Hero Card ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #5B3FA8 0%, #7C5CBF 50%, #9B7DD4 100%)' }}
      >
        <p className="text-sm text-white/70 mb-1">Current Net Worth</p>
        <AmountText
          cents={Math.abs(netWorth)}
          symbol={symbol}
          className="text-4xl font-bold tracking-tight text-white"
        />

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Landmark size={14} className="text-white/70" />
              <span className="text-xs text-white/70">Total Assets</span>
            </div>
            <AmountText
              cents={assets}
              symbol={symbol}
              className="text-lg font-bold text-white"
            />
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard size={14} className="text-white/70" />
              <span className="text-xs text-white/70">Liabilities</span>
            </div>
            <AmountText
              cents={liabilities}
              symbol={symbol}
              className="text-lg font-bold text-white/90"
            />
          </div>
        </div>
      </div>

      {/* ── Line Chart ─────────────────────────────────────────────────────── */}
      <Card>
        <h2 className="text-sm font-semibold text-cocoa-text2 mb-4 uppercase tracking-wide">
          12-Month Trend
        </h2>
        <NetWorthLine data={chartData} symbol={symbol} />
      </Card>

      {/* ── Month-by-month table ────────────────────────────────────────────── */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-cocoa-divider">
          <h2 className="font-semibold text-cocoa-text1">Monthly Breakdown</h2>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-5 gap-2 px-5 py-2.5 border-b border-cocoa-divider bg-cocoa-bg">
          <span className="col-span-1 text-xs font-semibold text-cocoa-text3 uppercase tracking-wide">Month</span>
          <span className="col-span-1 text-xs font-semibold text-cocoa-text3 uppercase tracking-wide text-right">Net Worth</span>
          <span className="col-span-1 text-xs font-semibold text-cocoa-text3 uppercase tracking-wide text-right">Assets</span>
          <span className="col-span-1 text-xs font-semibold text-cocoa-text3 uppercase tracking-wide text-right">Liabilities</span>
          <span className="col-span-1 text-xs font-semibold text-cocoa-text3 uppercase tracking-wide text-right">Change</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-cocoa-divider">
          {tableRows.map((row) => {
            const changeIsPos = row.change !== null && row.change >= 0;
            const ChangeIcon =
              row.change === null
                ? Minus
                : row.change > 0
                ? TrendingUp
                : TrendingDown;

            return (
              <div
                key={row.id}
                className="grid grid-cols-2 md:grid-cols-5 gap-2 px-5 py-3.5 hover:bg-cocoa-bg transition-colors"
              >
                {/* Month */}
                <span className="col-span-1 text-sm font-medium text-cocoa-text1">
                  {shortMonthFull(row.date)}
                </span>

                {/* Desktop columns */}
                <span className="hidden md:block col-span-1 text-sm font-semibold text-cocoa-networth text-right">
                  {formatCurrency(row.amount, symbol, true)}
                </span>
                <span className="hidden md:block col-span-1 text-sm text-cocoa-income text-right">
                  {formatCurrency(row.assets, symbol, true)}
                </span>
                <span className="hidden md:block col-span-1 text-sm text-cocoa-expense text-right">
                  {formatCurrency(row.liabilities, symbol, true)}
                </span>

                {/* Mobile: net worth + change in one column */}
                <div className="md:hidden col-span-1 text-right">
                  <p className="text-sm font-semibold text-cocoa-networth">
                    {formatCurrency(row.amount, symbol, true)}
                  </p>
                  {row.change !== null && (
                    <p
                      className={`text-xs font-medium flex items-center justify-end gap-0.5 ${
                        changeIsPos ? 'text-cocoa-income' : 'text-cocoa-expense'
                      }`}
                    >
                      <ChangeIcon size={11} />
                      {formatCurrency(Math.abs(row.change), symbol, true)}
                    </p>
                  )}
                </div>

                {/* Desktop change */}
                <span
                  className={`hidden md:flex col-span-1 text-sm font-semibold text-right items-center justify-end gap-1 ${
                    row.change === null
                      ? 'text-cocoa-text3'
                      : changeIsPos
                      ? 'text-cocoa-income'
                      : 'text-cocoa-expense'
                  }`}
                >
                  <ChangeIcon size={13} />
                  {row.change === null
                    ? '—'
                    : formatCurrency(Math.abs(row.change), symbol, true)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
