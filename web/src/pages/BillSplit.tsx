import React, { useState } from 'react';
import {
  Users, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Plus, ChevronLeft, CheckCircle, XCircle,
} from 'lucide-react';
import { useBillSplitStore } from '@shared/store/useBillSplitStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { formatCurrency } from '@shared/utils/currency';
import { formatDate } from '@shared/utils/date';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';
import type { SplitEntry } from '@shared/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function stringColor(name: string): string {
  const colors = [
    '#C8956A', '#4A90D9', '#2E9E6B', '#8B5CF6',
    '#D94F3D', '#E88C2A', '#D4AF37', '#EC4899',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Add Entry Form ────────────────────────────────────────────────────────────
function AddEntryForm({ onClose, symbol }: { onClose: () => void; symbol: string }) {
  const { addEntry } = useBillSplitStore();
  const [direction, setDirection] = useState<'owed' | 'owing'>('owed');
  const [person, setPerson] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.round(parseFloat(amountRaw) * 100);
    if (!person.trim()) { setError('Enter a person name'); return; }
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    if (!description.trim()) { setError('Enter a description'); return; }
    const entry: SplitEntry = {
      id: `split-${Date.now()}`,
      person: person.trim(),
      amount: direction === 'owed' ? amt : -amt,
      description: description.trim(),
      date: new Date().toISOString().slice(0, 10),
      isSettled: false,
      createdAt: new Date().toISOString(),
    };
    addEntry(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-cocoa-text1">Add Entry</h2>
          <button onClick={onClose} className="text-cocoa-text3 hover:text-cocoa-text1 text-xl leading-none">✕</button>
        </div>
        {/* Direction toggle */}
        <div className="flex gap-2 p-1 bg-cocoa-input rounded-xl mb-4">
          {(['owed', 'owing'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                direction === d
                  ? d === 'owed' ? 'bg-cocoa-income text-white shadow-sm' : 'bg-cocoa-expense text-white shadow-sm'
                  : 'text-cocoa-text2'
              }`}
            >
              {d === 'owed' ? 'They owe me' : 'I owe them'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text" value={person} onChange={(e) => setPerson(e.target.value)}
            placeholder="Person's name"
            className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm">{symbol}</span>
            <input
              type="number" value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)}
              placeholder="0.00" min="0.01" step="0.01"
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-7 pr-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
            />
          </div>
          <input
            type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g. Dinner at Nobu)"
            className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
          />
          {error && <p className="text-xs text-cocoa-expense">{error}</p>}
          <button
            type="submit"
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm ${direction === 'owed' ? 'bg-cocoa-income' : 'bg-cocoa-expense'}`}
          >
            Add Entry
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Entry Row ─────────────────────────────────────────────────────────────────
function EntryRow({ entry, symbol, onSettle, onDelete }: {
  entry: SplitEntry; symbol: string;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isOwedToMe = entry.amount > 0;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-cocoa-divider last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOwedToMe ? 'bg-cocoa-income/10' : 'bg-cocoa-expense/10'}`}>
        {isOwedToMe
          ? <ArrowDownLeft size={16} className="text-cocoa-income" />
          : <ArrowUpRight size={16} className="text-cocoa-expense" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cocoa-text1 truncate">{entry.description}</p>
        <p className="text-xs text-cocoa-text3 mt-0.5">{entry.person} · {formatDate(entry.date, 'MMM dd')}</p>
      </div>
      <AmountText
        cents={Math.abs(entry.amount)}
        symbol={symbol}
        className={`text-sm font-bold flex-shrink-0 ${isOwedToMe ? 'text-cocoa-income' : 'text-cocoa-expense'}`}
      />
      {!entry.isSettled ? (
        <>
          <button
            onClick={() => onSettle(entry.id)}
            className="flex-shrink-0 text-xs font-semibold text-cocoa-accent bg-cocoa-accent/10 px-2.5 py-1 rounded-lg hover:bg-cocoa-accent/20 transition-colors"
          >
            Settle
          </button>
          <button onClick={() => onDelete(entry.id)} className="p-1 text-cocoa-text3 hover:text-cocoa-expense flex-shrink-0">
            <XCircle size={15} />
          </button>
        </>
      ) : (
        <CheckCircle2 size={16} className="text-cocoa-income flex-shrink-0" />
      )}
    </div>
  );
}

// ── Person View ───────────────────────────────────────────────────────────────
function PersonView({ person, balance, symbol, onBack }: {
  person: string; balance: number; symbol: string; onBack: () => void;
}) {
  const { entries, settleEntry, deleteEntry } = useBillSplitStore();
  const personEntries = entries.filter((e) => e.person === person);
  const color = stringColor(person);
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-cocoa-text2 hover:text-cocoa-text1 mb-4">
        <ChevronLeft size={16} /> Back to people
      </button>
      <div className="bg-white rounded-2xl p-5 border border-cocoa-divider shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ backgroundColor: color }}>
            {initials(person)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-cocoa-text1">{person}</h2>
            <p className={`text-base font-semibold mt-0.5 ${balance > 0 ? 'text-cocoa-income' : balance < 0 ? 'text-cocoa-expense' : 'text-cocoa-text3'}`}>
              {balance > 0 ? `Owes you ${formatCurrency(balance, symbol)}` : balance < 0 ? `You owe ${formatCurrency(Math.abs(balance), symbol)}` : 'Settled up'}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-cocoa-divider shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-cocoa-divider">
          <h3 className="font-semibold text-cocoa-text1">All Entries</h3>
        </div>
        {personEntries.length === 0 ? (
          <p className="text-center text-cocoa-text3 text-sm py-8">No entries</p>
        ) : (
          <div className="px-5">
            {personEntries.map((e) => (
              <EntryRow key={e.id} entry={e} symbol={symbol} onSettle={settleEntry} onDelete={deleteEntry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BillSplit() {
  const entries = useBillSplitStore((s) => s.entries);
  const settleEntry = useBillSplitStore((s) => s.settleEntry);
  const deleteEntry = useBillSplitStore((s) => s.deleteEntry);
  const getPeopleWithBalances = useBillSplitStore((s) => s.getPeopleWithBalances);
  const { settings } = useSettingsStore();
  const symbol = settings.currencySymbol;

  const [showForm, setShowForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const people = getPeopleWithBalances();

  const owedToMe = entries.filter((e) => !e.isSettled && e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const youOwe = entries.filter((e) => !e.isSettled && e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
  const unsettledEntries = entries.filter((e) => !e.isSettled);
  const settledEntries = entries.filter((e) => e.isSettled);

  if (selectedPerson) {
    const pb = people.find((p) => p.person === selectedPerson);
    return (
      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
        <PersonView person={selectedPerson} balance={pb?.balance ?? 0} symbol={symbol} onBack={() => setSelectedPerson(null)} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cocoa-text1 flex items-center gap-2">
            <Users size={24} className="text-cocoa-accent" />
            Bill Split
          </h1>
          <p className="text-sm text-cocoa-text2 mt-0.5">{people.length} people involved</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-cocoa-accent hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cocoa-income/10 rounded-2xl p-4 border border-cocoa-income/20">
          <p className="text-xs text-cocoa-income font-semibold uppercase tracking-wide mb-1">Owed to you</p>
          <AmountText cents={owedToMe} symbol={symbol} className="text-2xl font-bold text-cocoa-income" />
        </div>
        <div className="bg-cocoa-expense/10 rounded-2xl p-4 border border-cocoa-expense/20">
          <p className="text-xs text-cocoa-expense font-semibold uppercase tracking-wide mb-1">You owe</p>
          <AmountText cents={youOwe} symbol={symbol} className="text-2xl font-bold text-cocoa-expense" />
        </div>
      </div>

      {/* People list */}
      {people.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-cocoa-divider">
            <h2 className="font-semibold text-cocoa-text1">People</h2>
          </div>
          <div className="divide-y divide-cocoa-divider">
            {people.map(({ person, balance }) => {
              const color = stringColor(person);
              return (
                <button
                  key={person}
                  onClick={() => setSelectedPerson(person)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-cocoa-bg transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {initials(person)}
                  </div>
                  <span className="flex-1 text-sm font-medium text-cocoa-text1">{person}</span>
                  <AmountText
                    cents={Math.abs(balance)}
                    symbol={symbol}
                    className={`text-sm font-bold ${balance > 0 ? 'text-cocoa-income' : balance < 0 ? 'text-cocoa-expense' : 'text-cocoa-text3'}`}
                  />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Pending entries */}
      {unsettledEntries.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-cocoa-divider flex items-center justify-between">
            <h2 className="font-semibold text-cocoa-text1">Pending Entries</h2>
            <span className="text-xs text-cocoa-text3 bg-cocoa-input px-2 py-0.5 rounded-full">{unsettledEntries.length}</span>
          </div>
          <div className="px-5">
            {unsettledEntries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} symbol={symbol} onSettle={settleEntry} onDelete={deleteEntry} />
            ))}
          </div>
        </Card>
      )}

      {/* Settled entries */}
      {settledEntries.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-cocoa-divider flex items-center justify-between">
            <h2 className="font-semibold text-cocoa-text1">Settled</h2>
            <span className="text-xs text-cocoa-text3 bg-cocoa-input px-2 py-0.5 rounded-full">{settledEntries.length}</span>
          </div>
          <div className="divide-y divide-cocoa-divider">
            {settledEntries.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 opacity-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cocoa-text1 line-through truncate">{e.description}</p>
                  <p className="text-xs text-cocoa-text3">{e.person} · {formatDate(e.date, 'MMM dd')}</p>
                </div>
                <AmountText cents={Math.abs(e.amount)} symbol={symbol} className="text-sm text-cocoa-text3 line-through" />
                <CheckCircle size={16} className="text-cocoa-income flex-shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {people.length === 0 && unsettledEntries.length === 0 && (
        <div className="text-center py-16 text-cocoa-text3">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No split entries yet</p>
          <p className="text-sm mt-1">Add an entry to track who owes who</p>
        </div>
      )}

      {showForm && <AddEntryForm onClose={() => setShowForm(false)} symbol={symbol} />}
    </div>
  );
}
