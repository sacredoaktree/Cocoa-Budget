import React, { useState, useMemo } from 'react';
import {
  Plus, X, Pencil, Play, Pause, Trash2, CheckCircle2,
  RefreshCw, AlertTriangle, Clock,
} from 'lucide-react';
import { useSubscriptionStore } from '@shared/store/useSubscriptionStore';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { formatCurrency } from '@shared/utils/currency';
import { formatDate } from '@shared/utils/date';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';
import type { BillingCycle, Subscription } from '@shared/types';

// ── Constants ─────────────────────────────────────────────────────────────────
const SUB_ICONS = [
  { key: 'tv', emoji: '📺' }, { key: 'music', emoji: '🎵' },
  { key: 'phone', emoji: '📱' }, { key: 'cloud', emoji: '☁️' },
  { key: 'gym', emoji: '💪' }, { key: 'home', emoji: '🏠' },
  { key: 'internet', emoji: '🌐' }, { key: 'gaming', emoji: '🎮' },
  { key: 'delivery', emoji: '📦' }, { key: 'security', emoji: '🔒' },
  { key: 'education', emoji: '📚' }, { key: 'transport', emoji: '🚗' },
  { key: 'electric', emoji: '⚡' }, { key: 'health', emoji: '❤️' },
  { key: 'finance', emoji: '🏦' }, { key: 'news', emoji: '📰' },
  { key: 'food', emoji: '🍔' }, { key: 'travel', emoji: '✈️' },
  { key: 'refresh', emoji: '🔄' }, { key: 'shopping', emoji: '🛒' },
];

const SUB_COLORS = [
  '#E50914', '#1DB954', '#0078D4', '#4A7FD4', '#C8956A',
  '#8B5CF6', '#EC4899', '#E88C2A', '#D94F3D', '#2E9E6B',
  '#D4AF37', '#06B6D4', '#3D2B1F', '#FF6B35', '#253B80',
];

const CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
};

const CYCLE_MULTIPLIERS: Record<BillingCycle, number> = {
  weekly: 52, monthly: 12, quarterly: 4, yearly: 1,
};

function toMonthly(amount: number, cycle: BillingCycle): number {
  return Math.round((amount * CYCLE_MULTIPLIERS[cycle]) / 12);
}

function calcNextDate(current: string, cycle: BillingCycle): string {
  const d = new Date(current + 'T00:00:00');
  switch (cycle) {
    case 'weekly':    d.setDate(d.getDate() + 7);        break;
    case 'monthly':   d.setMonth(d.getMonth() + 1);       break;
    case 'quarterly': d.setMonth(d.getMonth() + 3);       break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getIconEmoji(key: string): string {
  return SUB_ICONS.find((i) => i.key === key)?.emoji ?? '🔄';
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

type FilterTab = 'all' | 'active' | 'paused' | 'overdue';

// ── Sub Modal (Add / Edit) ────────────────────────────────────────────────────
function SubModal({ sub, onClose, symbol }: { sub?: Subscription; onClose: () => void; symbol: string }) {
  const { addSubscription, updateSubscription } = useSubscriptionStore();
  const accounts = useAccountStore((s) => s.accounts.filter((a) => !a.isArchived));
  const isEdit = !!sub;

  const defaultNextDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [name, setName]           = useState(sub?.name ?? '');
  const [icon, setIcon]           = useState(sub?.icon ?? 'tv');
  const [color, setColor]         = useState(sub?.color ?? SUB_COLORS[0]);
  const [amountRaw, setAmountRaw] = useState(sub ? (sub.amount / 100).toFixed(2) : '');
  const [cycle, setCycle]         = useState<BillingCycle>(sub?.billingCycle ?? 'monthly');
  const [nextDate, setNextDate]   = useState(sub?.nextBillingDate ?? defaultNextDate);
  const [accountId, setAccountId] = useState(sub?.accountId ?? (accounts[0]?.id ?? ''));
  const [note, setNote]           = useState(sub?.note ?? '');
  const [error, setError]         = useState('');

  const amountCents = Math.round(parseFloat(amountRaw || '0') * 100);
  const emoji = getIconEmoji(icon);
  const dayOfMonth = nextDate ? new Date(nextDate + 'T00:00:00').getDate() : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!amountRaw || amountCents <= 0) { setError('Enter a valid amount'); return; }
    if (!accountId) { setError('Select an account'); return; }
    const now = new Date().toISOString();
    if (isEdit) {
      updateSubscription(sub!.id, {
        name: name.trim(), icon, color, amount: amountCents,
        billingCycle: cycle, nextBillingDate: nextDate, accountId, note: note.trim(),
      });
    } else {
      addSubscription({
        id: `sub-${Date.now()}`, name: name.trim(), icon, color, amount: amountCents,
        billingCycle: cycle, nextBillingDate: nextDate, accountId,
        categoryId: 'cat-bills', status: 'active', note: note.trim(),
        createdAt: now, updatedAt: now,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Live preview header */}
        <div
          className="px-6 pt-6 pb-5 rounded-t-2xl"
          style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Charge' : 'Add Recurring Charge'}</h2>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white">
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center text-3xl">
              {emoji}
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-tight">{name || 'New Charge'}</p>
              <p className="text-white/70 text-sm mt-0.5">
                {amountCents > 0 ? formatCurrency(amountCents, symbol) : `${symbol}0.00`} / {CYCLE_LABELS[cycle].toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, Gym membership, Electric bill"
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
          </div>

          {/* Amount + Cycle */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm">{symbol}</span>
                <input type="number" value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)}
                  placeholder="0.00" min="0" step="0.01"
                  className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">Cycle</label>
              <select value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent">
                {(Object.keys(CYCLE_LABELS) as BillingCycle[]).map((c) => (
                  <option key={c} value={c}>{CYCLE_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Next Billing Date */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">
              Next Billing Date
            </label>
            <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
            {cycle === 'monthly' && dayOfMonth && (
              <p className="text-xs text-cocoa-text3 mt-1">
                Repeats on the {dayOfMonth}{ordinalSuffix(dayOfMonth)} of each month
              </p>
            )}
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">Charged to Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent">
              {accounts.length === 0 && <option value="">No accounts yet — add one first</option>}
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-2 uppercase tracking-wide">Icon</label>
            <div className="grid grid-cols-10 gap-1.5">
              {SUB_ICONS.map(({ key, emoji: e }) => (
                <button key={key} type="button" onClick={() => setIcon(key)}
                  className={`text-xl p-1.5 rounded-xl transition-all ${icon === key ? 'ring-2 ring-cocoa-accent scale-110 bg-cocoa-accent/10' : 'hover:bg-cocoa-bg'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-2 uppercase tracking-wide">Color</label>
            <div className="flex flex-wrap gap-2">
              {SUB_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-cocoa-accent' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Family plan, shared with partner"
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
          </div>

          {error && <p className="text-xs text-cocoa-expense font-medium">{error}</p>}

          <button type="submit"
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}>
            {isEdit ? 'Save Changes' : 'Add Recurring Charge'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Sub Card ──────────────────────────────────────────────────────────────────
interface SubCardProps {
  sub: Subscription;
  symbol: string;
  onEdit: (s: Subscription) => void;
  onMarkPaid: (s: Subscription) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
}

function SubCard({ sub, symbol, onEdit, onMarkPaid, onPause, onDelete }: SubCardProps) {
  const getAccount = useAccountStore((s) => s.getById);
  const account = getAccount(sub.accountId);
  const [showConfirm, setShowConfirm] = useState(false);

  const days = daysUntil(sub.nextBillingDate);
  const emoji = getIconEmoji(sub.icon);
  const monthly = toMonthly(sub.amount, sub.billingCycle);
  const isActive = sub.status === 'active';
  const isPaused = sub.status === 'paused';

  let urgencyColor = '#2E9E6B';
  let urgencyLabel = formatDate(sub.nextBillingDate, 'MMM dd');
  if (isActive) {
    if (days < 0)       { urgencyColor = '#D94F3D'; urgencyLabel = `${Math.abs(days)}d overdue`; }
    else if (days === 0){ urgencyColor = '#E85A2A'; urgencyLabel = 'Due today'; }
    else if (days <= 3) { urgencyColor = '#E88C2A'; urgencyLabel = `${days}d left`; }
    else if (days <= 7) { urgencyColor = '#D4AF37'; urgencyLabel = `${days} days`; }
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: sub.color + '22', border: `1.5px solid ${sub.color}44` }}
          >
            {emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-cocoa-text1">{sub.name}</p>
                  {isPaused && (
                    <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-semibold">Paused</span>
                  )}
                </div>
                <p className="text-xs text-cocoa-text3 mt-0.5">
                  {CYCLE_LABELS[sub.billingCycle]}
                  {account && ` · ${account.name}`}
                  {sub.note && ` · ${sub.note}`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <AmountText cents={sub.amount} symbol={symbol} className="text-sm font-bold text-cocoa-text1" />
                {sub.billingCycle !== 'monthly' && (
                  <p className="text-xs text-cocoa-text3 mt-0.5">~{formatCurrency(monthly, symbol)}/mo</p>
                )}
              </div>
            </div>

            {isActive && (
              <div className="flex items-center gap-2 mt-2">
                <Clock size={11} className="text-cocoa-text3 flex-shrink-0" />
                <span className="text-xs text-cocoa-text3">
                  Next: {formatDate(sub.nextBillingDate, 'MMM dd, yyyy')}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: urgencyColor, backgroundColor: urgencyColor + '18' }}
                >
                  {urgencyLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-cocoa-divider bg-cocoa-bg/60">
        {isActive && (
          <button
            onClick={() => onMarkPaid(sub)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: sub.color }}
          >
            <CheckCircle2 size={12} />
            Mark Paid
          </button>
        )}
        <div className="flex-1" />
        <button onClick={() => onEdit(sub)}
          className="p-2 text-cocoa-text3 hover:text-cocoa-accent hover:bg-cocoa-accent/10 rounded-lg transition-colors"
          title="Edit">
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onPause(sub.id)}
          className={`p-2 rounded-lg transition-colors ${isPaused ? 'text-blue-400 hover:bg-blue-50' : 'text-cocoa-text3 hover:text-blue-400 hover:bg-blue-50'}`}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>
        {!showConfirm ? (
          <button onClick={() => setShowConfirm(true)}
            className="p-2 text-cocoa-text3 hover:text-cocoa-expense hover:bg-cocoa-expense/10 rounded-lg transition-colors"
            title="Delete">
            <Trash2 size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1 ml-1">
            <button onClick={() => onDelete(sub.id)}
              className="text-xs px-2.5 py-1.5 bg-cocoa-expense text-white rounded-lg font-bold">
              Delete
            </button>
            <button onClick={() => setShowConfirm(false)}
              className="text-xs px-2.5 py-1.5 bg-cocoa-bg text-cocoa-text2 rounded-lg font-medium border border-cocoa-divider">
              Cancel
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubscriptionAudit() {
  const subscriptions        = useSubscriptionStore((s) => s.subscriptions);
  const updateSubscription   = useSubscriptionStore((s) => s.updateSubscription);
  const deleteSubscription   = useSubscriptionStore((s) => s.deleteSubscription);
  const addTransaction       = useTransactionStore((s) => s.addTransaction);
  const updateAccount        = useAccountStore((s) => s.updateAccount);
  const getAccountById       = useAccountStore((s) => s.getById);
  const { settings }         = useSettingsStore();
  const symbol               = settings.currencySymbol;

  const [filter, setFilter]     = useState<FilterTab>('all');
  const [showModal, setShowModal] = useState(false);
  const [editSub, setEditSub]   = useState<Subscription | null>(null);

  const active  = subscriptions.filter((s) => s.status === 'active');
  const paused  = subscriptions.filter((s) => s.status === 'paused');
  const overdue = active.filter((s) => daysUntil(s.nextBillingDate) < 0);
  const dueSoon = active.filter((s) => { const d = daysUntil(s.nextBillingDate); return d >= 0 && d <= 7; });

  const totalMonthly = active.reduce((sum, s) => sum + toMonthly(s.amount, s.billingCycle), 0);
  const totalAnnual  = active.reduce((sum, s) => sum + s.amount * CYCLE_MULTIPLIERS[s.billingCycle], 0);
  const nextCharge   = active.length > 0
    ? [...active].sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))[0]
    : null;

  const displayed = useMemo(() => {
    let list = subscriptions.filter((s) => s.status !== 'cancelled');
    if (filter === 'active')  list = active;
    if (filter === 'paused')  list = paused;
    if (filter === 'overdue') list = overdue;
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return toMonthly(b.amount, b.billingCycle) - toMonthly(a.amount, a.billingCycle);
    });
  }, [subscriptions, filter, active, paused, overdue]);

  const handleMarkPaid = (sub: Subscription) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addTransaction({
      id: `tx-${Date.now()}`,
      type: 'expense',
      amount: sub.amount,
      accountId: sub.accountId,
      categoryId: sub.categoryId,
      payee: sub.name,
      note: `${CYCLE_LABELS[sub.billingCycle]} charge`,
      date: today,
      time,
      subscriptionId: sub.id,
      isDeleted: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    const acct = getAccountById(sub.accountId);
    if (acct) updateAccount(sub.accountId, { balance: acct.balance - sub.amount });
    updateSubscription(sub.id, { nextBillingDate: calcNextDate(sub.nextBillingDate, sub.billingCycle) });
  };

  const handlePause = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;
    updateSubscription(id, { status: sub.status === 'paused' ? 'active' : 'paused' });
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cocoa-text1">Recurring Charges</h1>
          <p className="text-sm text-cocoa-text3 mt-0.5">
            {active.length} active · {paused.length} paused
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold bg-cocoa-accent hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Hero summary */}
      {active.length > 0 && (
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #C8956A 0%, #E8B98A 100%)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/70 mb-1">Monthly Spend</p>
              <AmountText cents={totalMonthly} symbol={symbol} className="text-4xl font-bold text-white tracking-tight" />
              <p className="text-sm text-white/70 mt-1">{formatCurrency(totalAnnual, symbol, true)}/year</p>
            </div>
            {nextCharge && (
              <div className="text-right bg-white/15 rounded-2xl px-4 py-3 min-w-0">
                <p className="text-xs text-white/60 mb-1">Next charge</p>
                <p className="text-sm font-bold truncate">{nextCharge.name}</p>
                <p className="text-xs text-white/70">{formatDate(nextCharge.nextBillingDate, 'MMM dd, yyyy')}</p>
                <AmountText cents={nextCharge.amount} symbol={symbol} className="text-sm font-bold mt-0.5" />
              </div>
            )}
          </div>
          <div className="flex gap-6 mt-5 pt-4 border-t border-white/20">
            {[
              { label: 'Active', value: active.length },
              { label: 'Paused', value: paused.length },
              { label: 'Due this week', value: dueSoon.length, highlight: dueSoon.length > 0 },
              { label: 'Overdue', value: overdue.length, highlight: overdue.length > 0 },
            ].map(({ label, value, highlight }) => (
              <div key={label}>
                <p className={`text-lg font-bold ${highlight ? 'text-yellow-200' : 'text-white'}`}>{value}</p>
                <p className="text-xs text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
          <AlertTriangle size={18} className="text-cocoa-expense flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-cocoa-expense">
              {overdue.length} overdue charge{overdue.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-cocoa-text2 mt-0.5">
              {overdue.map((s) => s.name).join(', ')} — mark as paid or update the billing date
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {subscriptions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: 'all' as FilterTab, label: 'All' },
            { key: 'active' as FilterTab, label: `Active (${active.length})` },
            { key: 'paused' as FilterTab, label: `Paused (${paused.length})` },
            { key: 'overdue' as FilterTab, label: `Overdue (${overdue.length})` },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-cocoa-accent text-white shadow-sm'
                  : 'bg-white border border-cocoa-divider text-cocoa-text2 hover:border-cocoa-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔄</div>
          <p className="text-base font-bold text-cocoa-text2">No recurring charges yet</p>
          <p className="text-sm text-cocoa-text3 mt-1 mb-6">
            Track subscriptions, bills, and any regular payment you make
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-cocoa-accent hover:opacity-90"
          >
            <Plus size={16} />
            Add First Charge
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((sub) => (
            <SubCard
              key={sub.id}
              sub={sub}
              symbol={symbol}
              onEdit={setEditSub}
              onMarkPaid={handleMarkPaid}
              onPause={handlePause}
              onDelete={deleteSubscription}
            />
          ))}
        </div>
      )}

      {showModal && <SubModal onClose={() => setShowModal(false)} symbol={symbol} />}
      {editSub && <SubModal sub={editSub} onClose={() => setEditSub(null)} symbol={symbol} />}
    </div>
  );
}
