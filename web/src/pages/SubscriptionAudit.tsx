import React from 'react';
import { RefreshCw, XCircle } from 'lucide-react';
import { useSubscriptionStore } from '@shared/store/useSubscriptionStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';
import type { BillingCycle } from '@shared/types';

const CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly:    'Weekly',
  monthly:   'Monthly',
  quarterly: 'Quarterly',
  yearly:    'Yearly',
};

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  weekly:    52 / 12,
  monthly:   1,
  quarterly: 3,
  yearly:    12,
};

function monthlyEquivalent(amount: number, cycle: BillingCycle): number {
  return Math.round(amount / CYCLE_MONTHS[cycle]);
}

// Simple icon emoji map for subscriptions
const SUB_EMOJI: Record<string, string> = {
  'cloud-outline':          '☁️',
  'wifi-outline':           '📶',
  'tv-outline':             '📺',
  'musical-notes-outline':  '🎵',
  'logo-bitcoin':           '₿',
};

function subEmoji(icon: string): string {
  return SUB_EMOJI[icon] ?? '🔄';
}

export default function SubscriptionAudit() {
  const subscriptions   = useSubscriptionStore((s) => s.subscriptions);
  const cancelSubscription = useSubscriptionStore((s) => s.cancelSubscription);
  const getAnnualCost   = useSubscriptionStore((s) => s.getAnnualCost);
  const { settings }    = useSettingsStore();
  const symbol          = settings.currencySymbol;

  const active    = subscriptions.filter((s) => s.status === 'active');
  const cancelled = subscriptions.filter((s) => s.status === 'cancelled');
  const annual    = getAnnualCost();
  const monthly   = Math.round(annual / 12);

  // Sort active by monthly cost desc
  const sortedActive = [...active].sort(
    (a, b) => monthlyEquivalent(b.amount, b.billingCycle) - monthlyEquivalent(a.amount, a.billingCycle)
  );

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <RefreshCw size={22} className="text-cocoa-info" />
        <h1 className="text-xl font-bold text-cocoa-primary">Subscription Audit</h1>
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-xs text-cocoa-text3 uppercase tracking-wide mb-1">Monthly Cost</p>
          <AmountText cents={monthly} symbol={symbol} className="text-2xl font-bold text-cocoa-expense" />
        </Card>
        <Card className="text-center">
          <p className="text-xs text-cocoa-text3 uppercase tracking-wide mb-1">Annual Cost</p>
          <AmountText cents={annual} symbol={symbol} className="text-2xl font-bold text-cocoa-warning" />
        </Card>
      </div>

      {/* Active subscriptions */}
      <section>
        <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-3">
          Active ({active.length})
        </h2>
        {sortedActive.length === 0 && (
          <p className="text-sm text-cocoa-text3">No active subscriptions.</p>
        )}
        <div className="space-y-3">
          {sortedActive.map((sub) => {
            const mEquiv = monthlyEquivalent(sub.amount, sub.billingCycle);
            return (
              <Card key={sub.id} className="!p-4">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: sub.color + '22' }}
                  >
                    {subEmoji(sub.icon)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-cocoa-text1 truncate">{sub.name}</p>
                      <button
                        onClick={() => cancelSubscription(sub.id)}
                        className="p-1 text-cocoa-text3 hover:text-cocoa-expense transition-colors flex-shrink-0"
                        title="Cancel subscription"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-cocoa-text3 mt-0.5">
                      {CYCLE_LABELS[sub.billingCycle]} · Next: {sub.nextBillingDate}
                    </p>
                    {sub.note && (
                      <p className="text-xs text-cocoa-text3 truncate">{sub.note}</p>
                    )}
                  </div>
                </div>

                {/* Amount row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-cocoa-divider">
                  <span className="text-xs text-cocoa-text3">Per billing</span>
                  <AmountText cents={sub.amount} symbol={symbol} className="text-sm font-semibold text-cocoa-text1" />
                  <span className="text-xs text-cocoa-text3">~monthly</span>
                  <AmountText cents={mEquiv} symbol={symbol} className="text-sm font-semibold text-cocoa-expense" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Cancelled */}
      {cancelled.length > 0 && (
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
