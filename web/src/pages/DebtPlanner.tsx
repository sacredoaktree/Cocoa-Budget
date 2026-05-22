import React from 'react';
import { CreditCard, TrendingDown } from 'lucide-react';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';

export default function DebtPlanner() {
  const accounts   = useAccountStore((s) => s.accounts);
  const { settings } = useSettingsStore();
  const symbol     = settings.currencySymbol;

  // Debt accounts = credit cards and loans with negative balance
  const debtAccounts = accounts.filter(
    (a) => !a.isArchived && (a.type === 'credit' || a.type === 'loan') && a.balance < 0
  );

  const totalDebt = debtAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);

  // Estimate payoff months given monthly payment
  function payoffMonths(balance: number, monthlyPayment?: number): number {
    const payment = monthlyPayment ?? Math.ceil(balance * 0.02);
    if (payment <= 0) return Infinity;
    const interestRate = 0.03; // assumed 3% monthly for credit cards
    if (payment <= balance * interestRate) return Infinity;
    return Math.ceil(
      Math.log(payment / (payment - balance * interestRate)) /
        Math.log(1 + interestRate)
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <TrendingDown size={22} className="text-cocoa-expense" />
        <h1 className="text-xl font-bold text-cocoa-primary">Debt Planner</h1>
      </div>

      {/* Total debt hero */}
      <Card className="bg-gradient-to-br from-cocoa-expense to-[#F07060] !text-white">
        <p className="text-white/70 text-sm mb-1">Total Debt</p>
        <AmountText cents={totalDebt} symbol={symbol} className="text-3xl font-bold text-white" />
        <p className="text-white/60 text-xs mt-2">{debtAccounts.length} debt account(s)</p>
      </Card>

      {/* Debt accounts */}
      {debtAccounts.length === 0 ? (
        <div className="text-center py-16 text-cocoa-text3">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No debts found</p>
          <p className="text-sm mt-1">Credit card and loan accounts with negative balance appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {debtAccounts.map((account) => {
            const balance   = Math.abs(account.balance);
            const monthly   = account.monthlyPayment;
            const months    = payoffMonths(balance / 100, (monthly ?? 0) / 100);
            const progress  = account.creditLimit
              ? Math.min(Math.abs(account.balance) / account.creditLimit, 1)
              : 0;

            return (
              <Card key={account.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: account.color + '22' }}
                  >
                    <CreditCard size={18} style={{ color: account.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cocoa-text1">{account.name}</p>
                    {account.note && (
                      <p className="text-xs text-cocoa-text3">•••• {account.note}</p>
                    )}
                  </div>
                  <AmountText cents={balance} symbol={symbol} className="text-sm font-bold text-cocoa-expense" />
                </div>

                {/* Utilization bar */}
                {account.creditLimit && (
                  <>
                    <div className="h-2 bg-cocoa-divider rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full bg-cocoa-expense transition-all"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-cocoa-text3 mb-3">
                      <span>{Math.round(progress * 100)}% utilized</span>
                      <span>Limit: <AmountText cents={account.creditLimit} symbol={symbol} className="text-cocoa-text3" /></span>
                    </div>
                  </>
                )}

                {/* Interest + payoff info */}
                <div className="grid grid-cols-2 gap-3">
                  {account.interestRate && (
                    <div className="bg-cocoa-bg rounded-xl px-3 py-2">
                      <p className="text-xs text-cocoa-text3">Interest Rate</p>
                      <p className="text-sm font-semibold text-cocoa-text1">{account.interestRate}%</p>
                    </div>
                  )}
                  {account.monthlyPayment && (
                    <div className="bg-cocoa-bg rounded-xl px-3 py-2">
                      <p className="text-xs text-cocoa-text3">Monthly Payment</p>
                      <AmountText cents={account.monthlyPayment} symbol={symbol} className="text-sm font-semibold text-cocoa-text1" />
                    </div>
                  )}
                  {isFinite(months) && (
                    <div className="bg-cocoa-bg rounded-xl px-3 py-2">
                      <p className="text-xs text-cocoa-text3">Est. Payoff</p>
                      <p className="text-sm font-semibold text-cocoa-text1">{months} months</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
