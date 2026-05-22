import { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { SYSTEM_CATEGORIES } from '@shared/data/categories';
import {
  currentMonth,
  prevMonth,
  nextMonth,
  monthLabel,
  formatGroupDate,
  formatTime,
} from '@shared/utils/date';
import { formatCurrency } from '@shared/utils/currency';
import type { Transaction } from '@shared/types';

// Map Ionicons names used in categories to emoji equivalents
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
  'laptop-outline': '💻',
  'trending-up-outline': '📈',
  'swap-horizontal-outline': '↔️',
  'cash-outline': '💵',
  'heart-circle-outline': '💝',
  'add-circle-outline': '➕',
  'help-circle-outline': '❓',
};

function getCategoryEmoji(iconName: string): string {
  return CATEGORY_EMOJI[iconName] ?? '•';
}

export default function Transactions() {
  const [month, setMonth] = useState(currentMonth());
  const { getByMonth, getMonthlyIncome, getMonthlyExpense } = useTransactionStore();
  const { settings } = useSettingsStore();
  const symbol = settings.currencySymbol;

  const transactions = getByMonth(month);
  const income = getMonthlyIncome(month);
  const expense = getMonthlyExpense(month);
  const balance = income - expense;

  // Group transactions by date, sorted newest first
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Sort each day's transactions newest time first
  for (const date of sortedDates) {
    grouped[date].sort((a, b) => b.time.localeCompare(a.time));
  }

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

        {/* Summary Row */}
        <div className="max-w-2xl mx-auto px-4 pb-3 grid grid-cols-3 gap-2">
          <div className="bg-green-50 rounded-xl p-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp size={13} />
              <span className="text-xs font-medium">Income</span>
            </div>
            <span className="text-sm font-bold text-green-700">
              {formatCurrency(income, symbol)}
            </span>
          </div>

          <div className="bg-red-50 rounded-xl p-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-red-500">
              <TrendingDown size={13} />
              <span className="text-xs font-medium">Expenses</span>
            </div>
            <span className="text-sm font-bold text-red-600">
              {formatCurrency(expense, symbol)}
            </span>
          </div>

          <div
            className={`rounded-xl p-3 flex flex-col gap-0.5 ${
              balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
            }`}
          >
            <div
              className={`flex items-center gap-1 ${
                balance >= 0 ? 'text-blue-600' : 'text-orange-500'
              }`}
            >
              <Minus size={13} />
              <span className="text-xs font-medium">Balance</span>
            </div>
            <span
              className={`text-sm font-bold ${
                balance >= 0 ? 'text-blue-700' : 'text-orange-600'
              }`}
            >
              {formatCurrency(balance, symbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {sortedDates.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No transactions for {monthLabel(month)}</p>
          </div>
        )}

        {sortedDates.map((date) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {formatGroupDate(date)}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">
                {formatCurrency(
                  grouped[date].reduce((sum, tx) => {
                    if (tx.type === 'expense') return sum - tx.amount;
                    if (tx.type === 'income') return sum + tx.amount;
                    return sum;
                  }, 0),
                  symbol
                )}
              </span>
            </div>

            {/* Transaction Rows */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
              {grouped[date].map((tx) => {
                const cat = SYSTEM_CATEGORIES.find((c) => c.id === tx.categoryId);
                const emoji = cat ? getCategoryEmoji(cat.icon) : '•';
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Category Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: cat?.bgColor ?? '#F0F0F0' }}
                    >
                      {emoji}
                    </div>

                    {/* Payee + Note */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {tx.payee || cat?.name || 'Transaction'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {tx.note && (
                          <span className="text-xs text-gray-400 truncate max-w-[160px]">
                            {tx.note}
                          </span>
                        )}
                        {tx.note && (
                          <span className="text-gray-300 text-xs">·</span>
                        )}
                        <span className="text-xs text-gray-400">{formatTime(tx.time)}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <span
                      className={`text-sm font-semibold flex-shrink-0 ${
                        isIncome
                          ? 'text-green-600'
                          : isExpense
                          ? 'text-red-500'
                          : 'text-gray-600'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(tx.amount, symbol)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
