import React, { useState } from 'react';
import { RefreshCw, XCircle, AlertTriangle, CheckCircle2, PauseCircle } from 'lucide-react';
import { useSubscriptionStore } from '@shared/store/useSubscriptionStore';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { formatCurrency } from '@shared/utils/currency';
import { formatDate } from '@shared/utils/date';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';
import type { BillingCycle, Subscription } from '@shared/types';

// ── Constants & Helpers ───────────────────────────────────────────────────────
const CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
};

const CYCLE_MULTIPLIERS: Record<BillingCycle, number> = {
  weekly: 52, monthly: 12, quarterly: 4, yearly: 1,
};

function annualCost(sub: Subscription): number {
  return sub.amount * CYCLE_MULTIPLIERS[sub.billingCycle];
}

function monthlyEquivalent(sub: Subscription): number {
  return Math.round(annualCost(sub) / 12);
}

const SUB_EMOJI: Record<string, string> = {
  'cloud-outline': '☁️',
  'wifi-outline': '📶',
  'tv-outline': '📺',
  'musical-notes-outline': '🎵',
  'logo-bitcoin': '₿',
  'refresh-circle-outline': '🔄',
};
function subEmoji(icon: string): string {
  return SUB_EMOJI[icon] ?? '🔄';
}

// ── Check if unused (no transaction with subscriptionId in last 60 days) ──────
function isUnused(sub: Subscription, transactions: ReturnType<typeof useTransactionStore.getState>['transactions']): boolean {
  if (sub.status !== 'active') return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return !transactions.some(
    (t) => t.subscriptionId === sub.id && !t.isDeleted && t.date >= cutoffStr
  );
}

type FilterType = 'all' | 'active' | 'unused';

// ── Subscription Card ─────────────────────────────────────────────────────────
function SubCard({
  sub, symbol, unused, onCancel,
}: {
  sub: Subscription; symbol: string; unused: boolean; onCancel: (id: string) => void;
}) {
  const annual = annualCost(sub);
  const monthly = monthlyEquivalent(sub);

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: sub.color + '22' }}
          >
            {subEmoji(sub.icon)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-cocoa-text1">{sub.name}</p>
                  {unused && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-cocoa-warning/10 text-cocoa-warning px-2 py-0.5 rounded-full">
                      <AlertTriangle size={10} />
                      Unused
                    </span>
                  )}
                  {sub.status === 'paused' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-cocoa-info/10 text-cocoa-info px-2 py-0.5 rounded-full">
                      <PauseCircle size={10} />
                      Paused
                    </span>
                  )}
                </div>
                <p className="text-xs text-cocoa-text3 mt-0.5">
                  {formatCurrency(sub.amount, symbol)}/{CYCLE_LABELS[sub.billingCycle].toLowerCase()}
                  {' · '}Next: {formatDate(sub.nextBillingDate, 'MMM dd, yyyy')}
                </p>
              </div>
              {sub.status !== 'cancelled' && (
                <button
                  onClick={() => onCancel(sub.id)}
                  className="p-1 text-cocoa-text3 hover:text-cocoa-expense transition-colors flex-shrink-0"
                  title="Cancel"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-cocoa-divider bg-cocoa-bg">
        <span className="text-xs text-cocoa-text3">
          ~{formatCurrency(monthly, symbol)}/mo
        </span>
        <span className="text-xs font-semibold text-cocoa-text2">
          {formatCurrency(annual, symbol, true)}/yr
        </span>
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubscriptionAudit() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const cancelSubscription = useSubscriptionStore((s) => s.cancelSubscription);
  const getAnnualCost = useSubscriptionStore((s) => s.getAnnualCost);
  const transactions = useTransactionStore((s) => s.transactions);
  const { settings } = useSettingsStore();
  const symbol = settings.currencySymbol;
  const [filter, setFilter] = useState<FilterType>('all');

  const annual = getAnnualCost();
  const monthly = Math.round(annual / 12);

  const active = subscriptions.filter((s) => s.status === 'active');
  const paused = subscriptions.filter((s) => s.status === 'paused');
  const cancelled = subscriptions.filter((s) => s.status === 'cancelled');
  const unusedSubs = active.filter((s) => isUnused(s, transactions));

  // Filter and sort by annual cost desc
  const displaySubs = subscriptions
    .filter((s) => {
      if (filter === 'active') return s.status === 'active';
      if (filter === 'unused') return isUnused(s, transactions);
      return s.status !== 'cancelled';
    })
    .sort((a, b) => annualCost(b) - annualCost(a));

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <RefreshCw size={24} className="text-cocoa-info" />
        <h1 className="text-2xl font-bold text-cocoa-text1">Subscription Audit</h1>
      </div>

      {/* Hero card */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #C8956A 0%, #E8B98A 100%)' }}
      >
        <p className="text-sm text-white/80 mb-1">
          You're spending{' '}
          <span className="font-bold">{formatCurrency(annual, symbol)}/year</span>{' '}
          on subscriptions
        </p>
        <AmountText cents={annual} symbol={symbol} className="text-4xl font-bold text-white tracking-tight" />
        <p className="text-sm text-white/70 mt-1">
          {formatCurrency(monthly, symbol)}/month avg
        </p>
      </div>

      {/* Warning banner */}
      {unusedSubs.length > 0 && (
        <div className="flex items-start gap-3 bg-cocoa-warning/10 border border-cocoa-warning/30 rounded-xl p-4">
          <AlertTriangle size={18} className="text-cocoa-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-cocoa-warning">
              {unusedSubs.length} unused subscription{unusedSubs.length > 1 ? 's' : ''} detected
            </p>
            <p className="text-xs text-cocoa-text2 mt-0.5">
              These haven't had a matching transaction in the last 60 days. Consider cancelling them.
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Active', count: active.length, color: 'text-cocoa-income', icon: <CheckCircle2 size={14} /> },
          { label: 'Paused', count: paused.length, color: 'text-cocoa-info', icon: <PauseCircle size={14} /> },
          { label: 'Cancelled', count: cancelled.length, color: 'text-cocoa-text3', icon: <XCircle size={14} /> },
          { label: 'Unused', count: unusedSubs.length, color: 'text-cocoa-warning', icon: <AlertTriangle size={14} /> },
        ].map(({ label, count, color, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-cocoa-divider p-3 text-center">
            <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}>
              {icon}
              <span className="text-lg font-bold">{count}</span>
            </div>
            <p className="text-xs text-cocoa-text3">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {(['all', 'active', 'unused'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
              filter === f
                ? 'bg-cocoa-accent text-white'
                : 'bg-white border border-cocoa-divider text-cocoa-text2 hover:border-cocoa-accent'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : `Unused (${unusedSubs.length})`}
          </button>
        ))}
      </div>

      {/* Subscription list */}
      {displaySubs.length === 0 ? (
        <div className="text-center py-12 text-cocoa-text3">
          <RefreshCw size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No subscriptions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySubs.map((sub) => (
            <SubCard
              key={sub.id}
              sub={sub}
              symbol={symbol}
              unused={isUnused(sub, transactions)}
              onCancel={cancelSubscription}
            />
          ))}
        </div>
      )}

      {/* Cancelled section */}
      {filter === 'all' && cancelled.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-3">
            Cancelled ({cancelled.length})
          </h2>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-cocoa-divider">
              {cancelled.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3 px-4 py-3 opacity-50">
                  <span className="text-lg">{subEmoji(sub.icon)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cocoa-text1 line-through truncate">{sub.name}</p>
                    <p className="text-xs text-cocoa-text3">{CYCLE_LABELS[sub.billingCycle]}</p>
                  </div>
                  <AmountText cents={sub.amount} symbol={symbol} className="text-sm text-cocoa-text3 line-through" />
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
