import React from 'react';
import { useNetWorthStore } from '@shared/store/useNetWorthStore';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { formatCurrency } from '@shared/utils/currency';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';

export default function NetWorth() {
  const snapshots = useNetWorthStore((s) => s.snapshots);
  const getNetWorth         = useAccountStore((s) => s.getNetWorth);
  const getTotalAssets      = useAccountStore((s) => s.getTotalAssets);
  const getTotalLiabilities = useAccountStore((s) => s.getTotalLiabilities);
  const { settings }        = useSettingsStore();
  const symbol              = settings.currencySymbol;

  const currentNetWorth = getNetWorth();
  const currentAssets   = getTotalAssets();
  const currentLiab     = getTotalLiabilities();

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));

  // Simple bar chart — get max for scaling
  const maxAmount = Math.max(...sorted.map((s) => s.amount), currentNetWorth, 1);

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-cocoa-primary">Net Worth Timeline</h1>

      {/* Hero */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #7C5CBF 0%, #9B7DD4 100%)' }}
      >
        <p className="text-white/70 text-sm mb-1">Current Net Worth</p>
        <AmountText cents={currentNetWorth} symbol={symbol} className="text-3xl font-bold text-white" />
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Assets</p>
            <AmountText cents={currentAssets} symbol={symbol} className="text-base font-semibold text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Liabilities</p>
            <AmountText cents={currentLiab} symbol={symbol} className="text-base font-semibold text-white/80" />
          </div>
        </div>
      </div>

      {/* Bar chart timeline */}
      <Card>
        <h2 className="text-sm font-semibold text-cocoa-text2 mb-4">Historical Trend</h2>
        <div className="flex items-end gap-1.5 h-40">
          {sorted.map((snap) => {
            const height = Math.max((snap.amount / maxAmount) * 100, 4);
            return (
              <div key={snap.id} className="flex flex-col items-center flex-1 min-w-0 gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${height}%`,
                    backgroundColor: '#7C5CBF',
                    opacity: 0.7 + (sorted.indexOf(snap) / sorted.length) * 0.3,
                  }}
                  title={formatCurrency(snap.amount, symbol)}
                />
                <span className="text-[9px] text-cocoa-text3 truncate w-full text-center">
                  {snap.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Snapshot table */}
      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-cocoa-divider">
          <h2 className="text-sm font-semibold text-cocoa-text2">Monthly Snapshots</h2>
        </div>
        <div className="divide-y divide-cocoa-divider">
          {[...sorted].reverse().map((snap) => {
            const prev = sorted[sorted.indexOf(snap) - 1];
            const change = prev ? snap.amount - prev.amount : 0;
            return (
              <div key={snap.id} className="flex items-center px-5 py-3 gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-cocoa-text1">{snap.date}</p>
                </div>
                <AmountText cents={snap.amount} symbol={symbol} className="text-sm font-semibold text-cocoa-text1" />
                {change !== 0 && (
                  <span className={`text-xs font-medium ${change > 0 ? 'text-cocoa-income' : 'text-cocoa-expense'}`}>
                    {change > 0 ? '+' : ''}{formatCurrency(change, symbol)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
