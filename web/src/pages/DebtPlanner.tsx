import React, { useState, useMemo } from 'react';
import { Calculator, CreditCard, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { formatCurrency } from '@shared/utils/currency';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';
import type { Account } from '@shared/types';

// ── Amortization math ─────────────────────────────────────────────────────────
interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

function computeAmortization(
  balanceCents: number,
  annualRatePct: number,
  paymentCents: number
): AmortRow[] {
  const rows: AmortRow[] = [];
  const monthlyRate = annualRatePct / 100 / 12;
  let remaining = balanceCents / 100; // work in whole currency units

  for (let month = 1; month <= 600; month++) {
    if (remaining <= 0) break;
    const interest = remaining * monthlyRate;
    const payment = Math.min(paymentCents / 100, remaining + interest);
    const principal = payment - interest;
    remaining -= principal;
    rows.push({
      month,
      payment: Math.round(payment * 100),
      principal: Math.round(principal * 100),
      interest: Math.round(interest * 100),
      balance: Math.max(Math.round(remaining * 100), 0),
    });
    if (remaining <= 0) break;
  }
  return rows;
}

function payoffDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Account picker row ────────────────────────────────────────────────────────
function AccountOption({ account, selected, onSelect }: {
  account: Account; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${
        selected ? 'border-cocoa-accent bg-cocoa-accent/5' : 'border-cocoa-divider bg-white hover:border-cocoa-accent/40'
      }`}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: account.color + '22' }}>
        <CreditCard size={16} style={{ color: account.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-cocoa-text1">{account.name}</p>
        {account.note && <p className="text-xs text-cocoa-text3">•••• {account.note}</p>}
      </div>
      <AmountText cents={Math.abs(account.balance)} symbol="₱" className="text-sm font-bold text-cocoa-expense" />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DebtPlanner() {
  const accounts = useAccountStore((s) => s.accounts);
  const { settings } = useSettingsStore();
  const symbol = settings.currencySymbol;

  // Filter loan/credit accounts
  const debtAccounts = accounts.filter(
    (a) => !a.isArchived && (a.type === 'loan' || a.type === 'credit') && a.balance < 0
  );

  const [selectedId, setSelectedId] = useState<string>(debtAccounts[0]?.id ?? '');
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [showTable, setShowTable] = useState(false);

  const selectedAccount = debtAccounts.find((a) => a.id === selectedId);

  // Form state — pre-fill from account
  const [balanceRaw, setBalanceRaw] = useState(
    selectedAccount ? String(Math.abs(selectedAccount.balance) / 100) : ''
  );
  const [rateRaw, setRateRaw] = useState(
    selectedAccount?.interestRate ? String(selectedAccount.interestRate) : '24'
  );
  const [paymentRaw, setPaymentRaw] = useState(
    selectedAccount?.monthlyPayment ? String(selectedAccount.monthlyPayment / 100) : ''
  );

  // When account changes, pre-fill fields
  function selectAccount(id: string) {
    setSelectedId(id);
    const acc = debtAccounts.find((a) => a.id === id);
    if (acc) {
      setBalanceRaw(String(Math.abs(acc.balance) / 100));
      setRateRaw(acc.interestRate ? String(acc.interestRate) : '24');
      setPaymentRaw(acc.monthlyPayment ? String(acc.monthlyPayment / 100) : '');
    }
  }

  const balance = Math.round(parseFloat(balanceRaw) * 100) || 0;
  const annualRate = parseFloat(rateRaw) || 0;
  const payment = Math.round(parseFloat(paymentRaw) * 100) || 0;
  const canCompute = balance > 0 && annualRate >= 0 && payment > 0;

  const amortRows = useMemo(() => {
    if (!canCompute) return [];
    return computeAmortization(balance, annualRate, payment);
  }, [balance, annualRate, payment, canCompute]);

  const totalMonths = amortRows.length;
  const totalPaid = amortRows.reduce((s, r) => s + r.payment, 0);
  const totalInterest = amortRows.reduce((s, r) => s + r.interest, 0);
  const tableRows = amortRows.slice(0, 24);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator size={24} className="text-cocoa-accent" />
        <h1 className="text-2xl font-bold text-cocoa-text1">Debt Payoff Planner</h1>
      </div>

      {/* Account picker */}
      {debtAccounts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-3">Select Account</h2>
          <div className="space-y-2">
            {debtAccounts.map((acc) => (
              <AccountOption
                key={acc.id}
                account={acc}
                selected={selectedId === acc.id}
                onSelect={() => selectAccount(acc.id)}
              />
            ))}
          </div>
        </section>
      )}

      {debtAccounts.length === 0 && (
        <div className="text-center py-12 text-cocoa-text3">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No debt accounts found</p>
          <p className="text-sm mt-1">Add a loan or credit account with a negative balance to use this planner.</p>
        </div>
      )}

      {/* Strategy toggle */}
      <section>
        <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-3">Payoff Strategy</h2>
        <div className="flex gap-2 p-1 bg-cocoa-input rounded-xl">
          {(['avalanche', 'snowball'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                strategy === s ? 'bg-white text-cocoa-text1 shadow-sm' : 'text-cocoa-text2'
              }`}
            >
              {s === 'avalanche' ? 'Avalanche' : 'Snowball'}
            </button>
          ))}
        </div>
        <p className="text-xs text-cocoa-text3 mt-2 px-1">
          {strategy === 'avalanche'
            ? 'Avalanche: Pay highest interest rate first — minimizes total interest paid.'
            : 'Snowball: Pay smallest balance first — builds momentum with quick wins.'}
        </p>
      </section>

      {/* Input form */}
      <Card>
        <h2 className="text-sm font-semibold text-cocoa-text2 mb-4 uppercase tracking-wide">Loan Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Balance */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text3 mb-1.5 uppercase tracking-wide">Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm">{symbol}</span>
              <input
                type="number" value={balanceRaw} onChange={(e) => setBalanceRaw(e.target.value)}
                placeholder="0.00" min="0" step="0.01"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-7 pr-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
              />
            </div>
          </div>
          {/* Annual rate */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text3 mb-1.5 uppercase tracking-wide">Annual Rate (%)</label>
            <div className="relative">
              <input
                type="number" value={rateRaw} onChange={(e) => setRateRaw(e.target.value)}
                placeholder="24" min="0" max="100" step="0.1"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 pr-8 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cocoa-text3 text-sm">%</span>
            </div>
          </div>
          {/* Monthly payment */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text3 mb-1.5 uppercase tracking-wide">Monthly Payment</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm">{symbol}</span>
              <input
                type="number" value={paymentRaw} onChange={(e) => setPaymentRaw(e.target.value)}
                placeholder="0.00" min="0" step="0.01"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-7 pr-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Results */}
      {canCompute && amortRows.length > 0 && (
        <>
          {/* Summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Months to Payoff', value: `${totalMonths} mo`, color: 'text-cocoa-text1' },
              { label: 'Payoff Date', value: payoffDate(totalMonths), color: 'text-cocoa-income' },
              { label: 'Total Interest', value: formatCurrency(totalInterest, symbol, true), color: 'text-cocoa-expense' },
              { label: 'Total Paid', value: formatCurrency(totalPaid, symbol, true), color: 'text-cocoa-warning' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm border border-cocoa-divider p-4 text-center">
                <p className="text-xs text-cocoa-text3 mb-1">{label}</p>
                <p className={`text-sm font-bold leading-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Amortization table */}
          <div className="bg-white rounded-2xl shadow-sm border border-cocoa-divider overflow-hidden">
            <button
              onClick={() => setShowTable((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-cocoa-bg transition-colors"
            >
              <div className="flex items-center gap-2">
                <TrendingDown size={16} className="text-cocoa-expense" />
                <span className="font-semibold text-cocoa-text1">Amortization Schedule</span>
                <span className="text-xs text-cocoa-text3 bg-cocoa-input px-2 py-0.5 rounded-full">
                  First {Math.min(24, tableRows.length)} months
                </span>
              </div>
              {showTable ? <ChevronUp size={16} className="text-cocoa-text3" /> : <ChevronDown size={16} className="text-cocoa-text3" />}
            </button>

            {showTable && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cocoa-bg border-t border-cocoa-divider">
                      {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-cocoa-text3 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cocoa-divider">
                    {tableRows.map((row) => (
                      <tr key={row.month} className="hover:bg-cocoa-bg transition-colors">
                        <td className="px-4 py-2.5 text-cocoa-text2 font-medium">{row.month}</td>
                        <td className="px-4 py-2.5 text-cocoa-text1 font-semibold">{formatCurrency(row.payment, symbol)}</td>
                        <td className="px-4 py-2.5 text-cocoa-income">{formatCurrency(row.principal, symbol)}</td>
                        <td className="px-4 py-2.5 text-cocoa-expense">{formatCurrency(row.interest, symbol)}</td>
                        <td className="px-4 py-2.5 text-cocoa-text1">{formatCurrency(row.balance, symbol)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalMonths > 24 && (
                  <p className="text-xs text-cocoa-text3 text-center py-3 border-t border-cocoa-divider">
                    Showing 24 of {totalMonths} months
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {canCompute && amortRows.length === 0 && (
        <div className="bg-cocoa-expense/10 border border-cocoa-expense/20 rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold text-cocoa-expense">Payment too low</p>
          <p className="text-xs text-cocoa-text2 mt-1">Increase your monthly payment to cover at least the monthly interest.</p>
        </div>
      )}
    </div>
  );
}
