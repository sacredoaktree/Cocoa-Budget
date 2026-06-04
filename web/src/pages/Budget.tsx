import React, { useState, useMemo, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, Target, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useBudgetStore, getBudgetCategoryIds } from '@shared/store/useBudgetStore';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { SYSTEM_CATEGORIES } from '@shared/data/categories';
import { todayStr, currentMonth } from '@shared/utils/date';
import { formatCurrency } from '@shared/utils/currency';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import type { Budget, BudgetPeriod } from '@shared/types';

const ICON_EMOJI: Record<string, string> = {
  'card-outline': '💳', 'restaurant-outline': '🍽️', 'bus-outline': '🚌',
  'flash-outline': '⚡', 'happy-outline': '💆', 'bag-outline': '🛍️',
  'medkit-outline': '🏥', 'refresh-circle-outline': '🔄', 'film-outline': '🎬',
  'school-outline': '📚', 'airplane-outline': '✈️', 'ellipsis-horizontal-outline': '⋯',
  'help-circle-outline': '❓',
};
function catEmoji(icon: string) { return ICON_EMOJI[icon] ?? '•'; }

const EXPENSE_CATS = SYSTEM_CATEGORIES.filter((c) => c.type === 'expense' && !c.isArchived);

// Compute date range label for a budget
function periodLabel(b: Budget): string {
  const p = b.period ?? 'monthly';
  if (p === 'monthly') {
    const [yr, mo] = b.month.split('-');
    return format(new Date(+yr, +mo - 1, 1), 'MMMM yyyy');
  }
  if (p === 'daily' && b.startDate) return format(new Date(b.startDate + 'T00:00:00'), 'MMM d, yyyy');
  if ((p === 'weekly' || p === 'custom') && b.startDate && b.endDate) {
    const s = format(new Date(b.startDate + 'T00:00:00'), 'MMM d');
    const e = format(new Date(b.endDate + 'T00:00:00'), 'MMM d');
    return `${s} – ${e}`;
  }
  return b.month;
}

// Compute how much was spent for a budget based on its period and categoryIds
function computeSpent(b: Budget, transactions: ReturnType<typeof useTransactionStore.getState>['transactions']): number {
  const p = b.period ?? 'monthly';
  const catIds = getBudgetCategoryIds(b);
  return transactions
    .filter((t) => !t.isDeleted && t.type === 'expense' && catIds.includes(t.categoryId))
    .filter((t) => {
      if (p === 'monthly') return t.date.startsWith(b.month);
      const start = b.startDate ?? (b.month + '-01');
      const end   = b.endDate   ?? (b.month + '-31');
      return t.date >= start && t.date <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, status }: { pct: number; status: 'under' | 'warning' | 'over' }) {
  const color = status === 'over' ? '#EF4444' : status === 'warning' ? '#F59E0B' : '#10B981';
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 1) * 100}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Add / Edit Budget Modal ──────────────────────────────────────────────────
function BudgetModal({
  existing,
  onClose,
}: {
  existing?: Budget;
  onClose: () => void;
}) {
  const today = todayStr();
  const thisMonth = currentMonth();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd   = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const [period, setPeriod]         = useState<BudgetPeriod>(existing?.period ?? 'monthly');
  const [categoryIds, setCategoryIds] = useState<string[]>(
    existing ? getBudgetCategoryIds(existing) : (EXPENSE_CATS[0]?.id ? [EXPENSE_CATS[0].id] : [])
  );
  const [amount, setAmount]         = useState(existing ? (existing.limitAmount / 100).toFixed(2) : '');
  const [month, setMonth]           = useState(existing?.month ?? thisMonth);
  const [startDate, setStart]       = useState(existing?.startDate ?? today);
  const [endDate, setEnd]           = useState(existing?.endDate ?? today);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { addBudget, updateBudget, deleteBudget } = useBudgetStore();

  // Toggle a category in/out of the selection array
  const toggleCategory = (catId: string) => {
    setCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Auto-set end date when start changes for weekly
  const handleStartChange = (val: string) => {
    setStart(val);
    if (period === 'weekly') {
      const d = new Date(val + 'T00:00:00');
      setEnd(format(addDays(d, 6), 'yyyy-MM-dd'));
    }
  };

  // When period changes, reset dates to sensible defaults
  const handlePeriodChange = (p: BudgetPeriod) => {
    setPeriod(p);
    if (p === 'weekly') {
      setStart(weekStart);
      setEnd(weekEnd);
    } else if (p === 'daily') {
      setStart(today);
      setEnd(today);
    } else if (p === 'monthly') {
      setMonth(thisMonth);
    }
  };

  const handleSave = useCallback(() => {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    if (!parsed || parsed <= 0 || categoryIds.length === 0) return;
    const cents = Math.round(parsed * 100);
    const now = new Date().toISOString();

    const derivedMonth =
      period === 'monthly' ? month :
      period === 'daily'   ? startDate.slice(0, 7) :
      startDate.slice(0, 7);

    if (existing) {
      updateBudget(existing.id, {
        categoryIds,
        limitAmount: cents,
        period,
        month: derivedMonth,
        startDate: period !== 'monthly' ? startDate : undefined,
        endDate:   (period === 'weekly' || period === 'custom') ? endDate : undefined,
      });
    } else {
      addBudget({
        id: `bgt-${Date.now()}`,
        categoryIds,
        limitAmount: cents,
        month: derivedMonth,
        rollover: false,
        period,
        startDate: period !== 'monthly' ? startDate : undefined,
        endDate:   (period === 'weekly' || period === 'custom') ? endDate : undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
    onClose();
  }, [amount, categoryIds, period, month, startDate, endDate, existing, addBudget, updateBudget, onClose]);

  const primaryCat = EXPENSE_CATS.find((c) => c.id === categoryIds[0]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{existing ? 'Edit Budget' : 'New Budget'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Period selector */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Period</p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-semibold">
              {(['daily', 'weekly', 'monthly', 'custom'] as BudgetPeriod[]).map((p) => (
                <button key={p} onClick={() => handlePeriodChange(p)}
                  className={`flex-1 py-2.5 capitalize transition-colors ${period === p ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  style={period === p ? { backgroundColor: '#C8956A' } : {}}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Date inputs based on period */}
          {period === 'monthly' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Month</p>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
            </div>
          )}
          {period === 'daily' && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date</p>
              <input type="date" value={startDate} onChange={(e) => handleStartChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
            </div>
          )}
          {(period === 'weekly' || period === 'custom') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">From</p>
                <input type="date" value={startDate} onChange={(e) => handleStartChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">To</p>
                <input type="date" value={endDate} min={startDate} onChange={(e) => setEnd(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
              </div>
            </div>
          )}

          {/* Category picker (multi-select) */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Categories
              {categoryIds.length > 0 && (
                <span className="ml-2 text-cocoa-accent normal-case font-medium">
                  {categoryIds.length} selected
                </span>
              )}
            </p>
            <button onClick={() => setShowCatPicker((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-3">
                {primaryCat ? (
                  <>
                    <span className="text-xl">{catEmoji(primaryCat.icon)}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {categoryIds.length > 1
                        ? `${primaryCat.name} +${categoryIds.length - 1} more`
                        : primaryCat.name}
                    </span>
                  </>
                ) : <span className="text-sm text-gray-400">Pick categories</span>}
              </div>
              {showCatPicker ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {showCatPicker && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {EXPENSE_CATS.map((cat) => {
                  const isSelected = categoryIds.includes(cat.id);
                  return (
                    <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${
                        isSelected ? 'border-cocoa-accent bg-cocoa-bg' : 'border-transparent hover:bg-gray-50'
                      }`}>
                      <span className="text-xl leading-none">{catEmoji(cat.icon)}</span>
                      <span className="text-[10px] font-medium text-gray-600 leading-tight line-clamp-2">{cat.name}</span>
                      {isSelected && <Check size={10} className="text-cocoa-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Limit amount */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Budget Limit</p>
            <input type="number" inputMode="decimal" placeholder="0.00" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              className="w-full px-4 py-3 text-xl font-bold text-gray-900 bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
          </div>
        </div>

        <div className="px-5 pb-6 pt-2 space-y-2">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!amount || categoryIds.length === 0}
              className="py-3 px-8 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
              style={{ flex: 2, backgroundColor: '#C8956A' }}>
              {existing ? 'Save Changes' : 'Add Budget'}
            </button>
          </div>
          {existing && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 flex items-center justify-center gap-2">
              <Trash2 size={15} /> Delete Budget
            </button>
          )}
          {existing && confirmDelete && (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100">Keep it</button>
              <button onClick={() => { deleteBudget(existing.id); onClose(); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600">Yes, Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Budget card ──────────────────────────────────────────────────────────────
function BudgetCard({
  budget,
  spent,
  symbol,
  onEdit,
}: {
  budget: Budget;
  spent: number;
  symbol: string;
  onEdit: () => void;
}) {
  const pct     = budget.limitAmount > 0 ? spent / budget.limitAmount : 0;
  const status  = pct >= 1 ? 'over' : pct >= 0.8 ? 'warning' : 'under';
  const remaining = budget.limitAmount - spent;

  const catIds   = getBudgetCategoryIds(budget);
  const cats     = catIds.map((id) => EXPENSE_CATS.find((c) => c.id === id)).filter(Boolean) as typeof EXPENSE_CATS;
  const primaryCat = cats[0];
  const emoji    = primaryCat ? catEmoji(primaryCat.icon) : '•';

  const labelColor = status === 'over' ? 'text-red-500' : status === 'warning' ? 'text-yellow-500' : 'text-green-600';
  const badgeColor = (budget.period ?? 'monthly') === 'monthly' ? 'bg-blue-50 text-blue-600'
    : (budget.period ?? 'monthly') === 'weekly' ? 'bg-purple-50 text-purple-600'
    : (budget.period ?? 'monthly') === 'daily'  ? 'bg-orange-50 text-orange-600'
    : 'bg-gray-100 text-gray-500';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${primaryCat?.color ?? '#C8956A'}20` }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-800">
              {cats.length > 1 ? `${cats.length} Categories` : (primaryCat?.name ?? 'Unknown')}
            </p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${badgeColor}`}>
              {budget.period ?? 'monthly'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{periodLabel(budget)}</p>
          {/* Category tags */}
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {cats.map((cat) => (
                <span key={cat.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {catEmoji(cat.icon)} {cat.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm font-bold ${labelColor}`}>{Math.round(pct * 100)}%</span>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-cocoa-accent">
            <Pencil size={14} />
          </button>
        </div>
      </div>

      <ProgressBar pct={pct} status={status} />

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">
          {formatCurrency(spent, symbol)} <span className="text-gray-300">of</span> {formatCurrency(budget.limitAmount, symbol)}
        </span>
        <span className={`text-xs font-semibold ${status === 'over' ? 'text-red-500' : 'text-gray-500'}`}>
          {status === 'over'
            ? `${formatCurrency(Math.abs(remaining), symbol)} over`
            : `${formatCurrency(remaining, symbol)} left`}
        </span>
      </div>
    </div>
  );
}

// ── Budget page ──────────────────────────────────────────────────────────────
export default function Budget() {
  const [showModal, setShowModal]   = useState(false);
  const [editingBudget, setEditing] = useState<Budget | undefined>(undefined);

  const budgets         = useBudgetStore((s) => s.budgets);
  const allTransactions = useTransactionStore((s) => s.transactions);
  const { settings }    = useSettingsStore();
  const symbol          = settings.currencySymbol;

  // Compute spent for every budget
  const budgetsWithSpent = useMemo(() =>
    budgets.map((b) => ({ budget: b, spent: computeSpent(b, allTransactions) })),
    [budgets, allTransactions]
  );

  const totalBudgeted = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent    = budgetsWithSpent.reduce((s, { spent }) => s + spent, 0);
  const overallPct    = totalBudgeted > 0 ? totalSpent / totalBudgeted : 0;
  const overallStatus = overallPct >= 1 ? 'over' : overallPct >= 0.8 ? 'warning' : 'under';

  // Group: over → warning → under
  const sorted = [...budgetsWithSpent].sort((a, b) => {
    const order = { over: 0, warning: 1, under: 2 };
    const sa = a.budget.limitAmount > 0 ? a.spent / a.budget.limitAmount : 0;
    const sb = b.budget.limitAmount > 0 ? b.spent / b.budget.limitAmount : 0;
    const statusA = sa >= 1 ? 'over' : sa >= 0.8 ? 'warning' : 'under';
    const statusB = sb >= 1 ? 'over' : sb >= 0.8 ? 'warning' : 'under';
    return order[statusA] - order[statusB] || sb - sa;
  });

  const openEdit = (b: Budget) => { setEditing(b); setShowModal(true); };
  const openAdd  = () => { setEditing(undefined); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(undefined); };

  return (
    <div className="min-h-screen bg-gray-50">
      {showModal && <BudgetModal existing={editingBudget} onClose={closeModal} />}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={18} style={{ color: '#C8956A' }} />
            <span className="text-base font-semibold text-gray-800">Budgets</span>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#C8956A' }}>
            <Plus size={15} /> Add Budget
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Overall summary */}
        {budgets.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total spent across all budgets</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent, symbol)}</p>
                <p className="text-xs text-gray-400 mt-0.5">of {formatCurrency(totalBudgeted, symbol)} budgeted</p>
              </div>
              <span className={`text-xl font-bold ${overallStatus === 'over' ? 'text-red-500' : overallStatus === 'warning' ? 'text-yellow-500' : 'text-green-600'}`}>
                {Math.round(overallPct * 100)}%
              </span>
            </div>
            <ProgressBar pct={overallPct} status={overallStatus} />
            <p className="text-xs text-gray-400 mt-2">
              {sorted.filter(({ spent, budget }) => (budget.limitAmount > 0 ? spent / budget.limitAmount : 0) >= 1).length} over ·{' '}
              {sorted.filter(({ spent, budget }) => { const p = budget.limitAmount > 0 ? spent / budget.limitAmount : 0; return p >= 0.8 && p < 1; }).length} near limit ·{' '}
              {sorted.filter(({ spent, budget }) => (budget.limitAmount > 0 ? spent / budget.limitAmount : 0) < 0.8).length} on track
            </p>
          </div>
        )}

        {/* Budget cards */}
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">📊</p>
            <p className="text-sm font-medium text-gray-600">No budgets yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Set a spending limit per category to stay on track.</p>
            <button onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#C8956A' }}>
              Create your first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sorted.map(({ budget, spent }) => (
              <BudgetCard key={budget.id} budget={budget} spent={spent} symbol={symbol} onEdit={() => openEdit(budget)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
