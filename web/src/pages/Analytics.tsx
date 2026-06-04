import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { SYSTEM_CATEGORIES } from '@shared/data/categories';
import { currentMonth, prevMonth, nextMonth, monthLabel, todayStr } from '@shared/utils/date';
import { formatCurrency } from '@shared/utils/currency';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';

type Period = 'day' | 'week' | 'month';
type Tab = 'expense' | 'income';

const ICON_EMOJI: Record<string, string> = {
  'card-outline': '💳', 'restaurant-outline': '🍽️', 'bus-outline': '🚌',
  'flash-outline': '⚡', 'happy-outline': '💆', 'bag-outline': '🛍️',
  'medkit-outline': '🏥', 'refresh-circle-outline': '🔄', 'film-outline': '🎬',
  'school-outline': '📚', 'airplane-outline': '✈️', 'ellipsis-horizontal-outline': '⋯',
  'laptop-outline': '💻', 'trending-up-outline': '📈', 'swap-horizontal-outline': '↔️',
  'cash-outline': '💵', 'heart-circle-outline': '💝', 'help-circle-outline': '❓',
};
function catEmoji(icon: string) { return ICON_EMOJI[icon] ?? '•'; }

// Custom tooltip for pie chart
function PieTooltip({ active, payload, symbol }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800">{d.icon} {d.name}</p>
      <p className="text-gray-600 mt-0.5">{formatCurrency(d.value, symbol)}</p>
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('month');
  const [month, setMonth]   = useState(currentMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [tab, setTab]       = useState<Tab>('expense');

  const { settings }    = useSettingsStore();
  const { currencySymbol: symbol } = settings;
  const allTransactions = useTransactionStore((s) => s.transactions);

  const today = todayStr();

  // ── Week range ─────────────────────────────────────────────────────────────
  const weekStart = useMemo(() => {
    const base = new Date();
    const w = addWeeks(base, weekOffset);
    return format(startOfWeek(w, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    const base = new Date();
    const w = addWeeks(base, weekOffset);
    return format(endOfWeek(w, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    const s = format(new Date(weekStart + 'T00:00:00'), 'MMM d');
    const e = format(new Date(weekEnd + 'T00:00:00'), 'MMM d');
    return `${s} – ${e}`;
  }, [weekOffset, weekStart, weekEnd]);

  // ── Period label ───────────────────────────────────────────────────────────
  const periodTitle = period === 'day' ? format(new Date(today + 'T00:00:00'), 'EEE, MMM d')
    : period === 'week' ? weekLabel
    : monthLabel(month);

  // ── Filter transactions for current period ─────────────────────────────────
  const periodTxs = useMemo(() => {
    return allTransactions.filter((t) => {
      if (t.isDeleted) return false;
      if (period === 'day')   return t.date === today;
      if (period === 'week')  return t.date >= weekStart && t.date <= weekEnd;
      return t.date.startsWith(month);
    });
  }, [allTransactions, period, today, weekStart, weekEnd, month]);

  // ── Pie data ───────────────────────────────────────────────────────────────
  const expensePieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    periodTxs.filter((t) => t.type === 'expense').forEach((t) => {
      catMap[t.categoryId] = (catMap[t.categoryId] ?? 0) + t.amount;
    });
    return SYSTEM_CATEGORIES
      .filter((c) => c.type === 'expense' && catMap[c.id])
      .map((c) => ({ name: c.name, value: catMap[c.id], color: c.color, icon: catEmoji(c.icon) }))
      .sort((a, b) => b.value - a.value);
  }, [periodTxs]);

  const incomePieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    periodTxs.filter((t) => t.type === 'income').forEach((t) => {
      catMap[t.categoryId] = (catMap[t.categoryId] ?? 0) + t.amount;
    });
    return SYSTEM_CATEGORIES
      .filter((c) => c.type === 'income' && catMap[c.id])
      .map((c) => ({ name: c.name, value: catMap[c.id], color: c.color, icon: catEmoji(c.icon) }))
      .sort((a, b) => b.value - a.value);
  }, [periodTxs]);

  const pieData = tab === 'expense' ? expensePieData : incomePieData;
  const total   = pieData.reduce((s, d) => s + d.value, 0);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goBack = () => {
    if (period === 'month')  setMonth((m) => prevMonth(m));
    if (period === 'week')   setWeekOffset((o) => o - 1);
    // day navigation is not exposed (today only)
  };
  const goNext = () => {
    if (period === 'month')  setMonth((m) => nextMonth(m));
    if (period === 'week')   setWeekOffset((o) => o + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <TrendingDown size={18} style={{ color: '#C8956A' }} />
          <span className="text-base font-semibold text-gray-800">Analytics</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Period toggle */}
        <Card className="p-3">
          <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-semibold mb-3">
            {(['day', 'week', 'month'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`flex-1 py-2 capitalize transition-colors ${period === p ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                style={period === p ? { backgroundColor: '#C8956A' } : {}}>
                {p === 'day' ? 'Day' : p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={period === 'day'}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-700">{periodTitle}</span>
            <button
              onClick={goNext}
              disabled={period === 'day'}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </Card>

        {/* Expenses / Income tab */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-semibold bg-white">
          <button onClick={() => setTab('expense')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${tab === 'expense' ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            style={tab === 'expense' ? { backgroundColor: '#EF4444' } : {}}>
            <TrendingDown size={13} /> Expenses
          </button>
          <button onClick={() => setTab('income')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${tab === 'income' ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            style={tab === 'income' ? { backgroundColor: '#10B981' } : {}}>
            <TrendingUp size={13} /> Income
          </button>
        </div>

        {/* Pie chart */}
        {pieData.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">{tab === 'expense' ? '💸' : '💰'}</p>
              <p className="text-sm font-medium text-gray-600">
                No {tab === 'expense' ? 'expenses' : 'income'} for this period
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Add some transactions to see the breakdown.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {tab === 'expense' ? 'Spending' : 'Income'} breakdown
            </h3>

            {/* Pie chart with center total */}
            <div className="relative flex justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip symbol={symbol} />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                    iconSize={8}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ paddingBottom: '40px' }}>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Total</p>
                  <p className="text-base font-bold text-gray-800">{formatCurrency(total, symbol)}</p>
                </div>
              </div>
            </div>

            {/* Category breakdown list */}
            <div className="mt-4 space-y-3">
              {pieData.map((cat) => {
                const pct = total > 0 ? (cat.value / total) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="text-xs font-medium text-gray-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">{formatCurrency(cat.value, symbol)}</span>
                        <span className="text-[10px] text-gray-400 w-9 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
