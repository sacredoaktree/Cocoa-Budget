import React from 'react';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { useBillSplitStore } from '@shared/store/useBillSplitStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';

export default function BillSplit() {
  const entries             = useBillSplitStore((s) => s.entries);
  const settleEntry         = useBillSplitStore((s) => s.settleEntry);
  const deleteEntry         = useBillSplitStore((s) => s.deleteEntry);
  const getPeopleWithBalances = useBillSplitStore((s) => s.getPeopleWithBalances);
  const { settings }        = useSettingsStore();
  const symbol              = settings.currencySymbol;

  const balances = getPeopleWithBalances();
  const unsettled = entries.filter((e) => !e.isSettled);
  const settled   = entries.filter((e) => e.isSettled);

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Users size={22} className="text-cocoa-accent" />
        <h1 className="text-xl font-bold text-cocoa-primary">Bill Splitting</h1>
      </div>

      {/* Balance summary per person */}
      {balances.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-3">
            Balances
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {balances.map(({ person, balance }) => (
              <Card key={person} className="!p-4">
                <p className="text-sm font-semibold text-cocoa-text1">{person}</p>
                <AmountText
                  cents={Math.abs(balance)}
                  symbol={symbol}
                  className={`text-base font-bold mt-1 ${balance > 0 ? 'text-cocoa-income' : 'text-cocoa-expense'}`}
                />
                <p className="text-xs text-cocoa-text3 mt-0.5">
                  {balance > 0 ? 'owes you' : 'you owe'}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Unsettled entries */}
      <section>
        <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-3">
          Pending ({unsettled.length})
        </h2>
        {unsettled.length === 0 && (
          <p className="text-sm text-cocoa-text3">All settled up!</p>
        )}
        <div className="space-y-2">
          {unsettled.map((e) => (
            <Card key={e.id} className="!p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cocoa-text1">{e.person}</p>
                <p className="text-xs text-cocoa-text3 truncate">{e.description}</p>
                <p className="text-xs text-cocoa-text3">{e.date}</p>
              </div>
              <AmountText
                cents={Math.abs(e.amount)}
                symbol={symbol}
                className={`text-sm font-bold ${e.amount > 0 ? 'text-cocoa-income' : 'text-cocoa-expense'}`}
              />
              <div className="flex gap-1">
                <button
                  onClick={() => settleEntry(e.id)}
                  className="p-1.5 rounded-full text-cocoa-income hover:bg-cocoa-income/10 transition-colors"
                  title="Mark as settled"
                >
                  <CheckCircle size={18} />
                </button>
                <button
                  onClick={() => deleteEntry(e.id)}
                  className="p-1.5 rounded-full text-cocoa-expense hover:bg-cocoa-expense/10 transition-colors"
                  title="Delete"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Settled entries */}
      {settled.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-3">
            Settled ({settled.length})
          </h2>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-cocoa-divider">
              {settled.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cocoa-text1 line-through truncate">{e.description}</p>
                    <p className="text-xs text-cocoa-text3">{e.person} · {e.date}</p>
                  </div>
                  <AmountText
                    cents={Math.abs(e.amount)}
                    symbol={symbol}
                    className="text-sm text-cocoa-text3 line-through"
                  />
                  <CheckCircle size={16} className="text-cocoa-income flex-shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
