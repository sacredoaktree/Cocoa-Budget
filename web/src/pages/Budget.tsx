import { useState } from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { useBudgetStore } from '@shared/store/useBudgetStore';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { currentMonth, prevMonth, nextMonth, monthLabel } from '@shared/utils/date';
import { formatCurrency } from '@shared/utils/currency';
import type { BudgetWithSpent } from '@shared/types';

// Map Ionicons icon names to emoji
const CATEGORY_EMOJI: Record<string, string> = {
  'card-outline': '💳',
  'restaurant-outline': '🍽️',
  'bus-outline': '🚌',
  'flash-outline': '⚡',
  'happy-outline': '😊',
  'bag-outline': '🛍️',
  'medkit-outline': '💊',
  'refresh-circle-outline': '🔄',
  'film-outline': '🎬',
  'school-outline': '🎓',
  'airplane-outline': '✈️',
  'ellipsis-horizontal-outline': '•••',
  'help-circle-outline': '❓',
};

function getCategoryEmoji(iconName: string): string {
  return CATEGORY_EMOJI[iconName] ?? '•';
}

function ProgressBar({
  percent,
  status,
}: {
  percent: number;
  status: BudgetWithSpent['status'];
}) {
  const colorClass =
    status === 'over'
      ? 'bg-red-500'
      : status === 'warning'
      ? 'bg-yellow-400'
      : 'bg-green-500';

  const clampedPercent = Math.min(percent, 1);

  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${clampedPercent * 100}%` }}
      />
    </div>
  );
}

function BudgetCard({
  budget,
  symbol,
}: {
  budget: BudgetWithSpent;
  symbol: string;
}) {
  const emoji = getCategoryEmoji(budget.categoryIcon);
  const pctLabel = `${Math.round(budget.percentUsed * 100)}%`;
  const labelColor =
    budget.status === 'over'
      ? 'text-red-500'
      : budget.status === 'warning'
      ? 'text-yellow-500'
      : 'text-green-600';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        {/* Category Icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{
            backgroundColor: `${budget.categoryColor}20`,
          }}
        >
          {emoji}
        </div>

        {/* Name + percentage */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {budget.categoryName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatCurrency(budget.spent, symbol)} of{' '}
            {formatCurrency(budget.limitAmount, symbol)}
          </p>
        </div>

        <span className={`text-sm font-bold flex-shrink-0 ${labelColor}`}>
          {pctLabel}
        </span>
      </div>

      <ProgressBar percent={budget.percentUsed} status={budget.status} />

      {budget.status === 'over' && (
        <p className="text-xs text-red-500 mt-1.5">
          Over by {formatCurrency(Math.abs(budget.remaining), symbol)}
        </p>
      )}
      {budget.status !== 'over' && (
        <p className="text-xs text-gray-400 mt-1.5">
          {formatCurrency(budget.remaining, symbol)} remaining
        </p>
      )}
    </div>
  );
}

export default function Budget() {
  const [month, setMonth] = useState(currentMonth());
  const { getBudgetsWithSpent } = useBudgetStore();
  const { getSpendByCategory } = useTransactionStore();
  const { settings } = useSettingsStore();
  const symbol = settings.currencySymbol;

  // Build spendByCategory map for this month
  const spendItems = getSpendByCategory(month);
  const spendMap: Record<string, number> = {};
  for (const item of spendItems) {
    spendMap[item.categoryId] = item.amount;
  }

  const budgets = getBudgetsWithSpent(month, spendMap);

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercent = totalBudgeted > 0 ? totalSpent / totalBudgeted : 0;
  const overallStatus: BudgetWithSpent['status'] =
    overallPercent >= 1 ? 'over' : overallPercent >= 0.8 ? 'warning' : 'under';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Month Navigator */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMonth(prevMonth(month))}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-base font-semibold text-gray-800">{monthLabel(month)}</span>
          <button
            onClick={() => setMonth(nextMonth(month))}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Overall Progress Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-[#C8956A]" />
            <h2 className="text-sm font-semibold text-gray-700">Overall Budget</h2>
          </div>

          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalSpent, symbol)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                of {formatCurrency(totalBudgeted, symbol)} budgeted
              </p>
            </div>
            <span
              className={`text-xl font-bold ${
                overallStatus === 'over'
                  ? 'text-red-500'
                  : overallStatus === 'warning'
                  ? 'text-yellow-500'
                  : 'text-green-600'
              }`}
            >
              {Math.round(overallPercent * 100)}%
            </span>
          </div>

          <ProgressBar percent={overallPercent} status={overallStatus} />

          <p className="text-xs text-gray-400 mt-2">
            {budgets.filter((b) => b.status === 'over').length} over budget ·{' '}
            {budgets.filter((b) => b.status === 'warning').length} near limit ·{' '}
            {budgets.filter((b) => b.status === 'under').length} on track
          </p>
        </div>

        {/* Per-Category Budget Cards */}
        {budgets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm">No budgets set for {monthLabel(month)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {budgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} symbol={symbol} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
