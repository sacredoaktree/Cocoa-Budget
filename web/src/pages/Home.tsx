import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { SYSTEM_CATEGORIES } from '@shared/data/categories';
import { currentMonth, monthLabel, prevMonth, nextMonth, daysInMonth, todayStr } from '@shared/utils/date';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { formatCurrency } from '@shared/utils/currency';
import Card from '../components/ui/Card';

type Period = 'day' | 'week' | 'month';

const ICON_EMOJI: Record<string, string> = {
  'card-outline': '💳', 'restaurant-outline': '🍽️', 'bus-outline': '🚌',
  'flash-outline': '⚡', 'happy-outline': '💆', 'bag-outline': '🛍️',
  'medkit-outline': '🏥', 'refresh-circle-outline': '🔄', 'film-outline': '🎬',
  'school-outline': '📚', 'airplane-outline': '✈️', 'ellipsis-horizontal-outline': '⋯',
  'laptop-outline': '💻', 'trending-up-outline': '📈', 'swap-horizontal-outline': '↔️',
  'cash-outline': '💵', 'heart-circle-outline': '💝', 'help-circle-outline': '❓',
};

function catEmoji(icon: string) { return ICON_EMOJI[icon] ?? '•'; }
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// Custom tooltip for bar chart
function ChartTooltip({ active, payload, label, symbol }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill || p.color }}>
          {p.name}: {formatCurrency(p.value, symbol)}
        </p>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('month');
  const [month, setMonth] = useState(currentMonth());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week

  const { settings } = useSettingsStore();
  const { currencySymbol, displayName } = settings;

  const allAccounts = useAccountStore((s) => s.accounts);
  const accounts = allAccounts.filter((a) => !a.isArchived);
  const hasAccounts = accounts.length > 0;

  const allTransactions = useTransactionStore((s) => s.transactions);

  // ── Date range helpers ────────────────────────────────────────────────────
  const today = todayStr();

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

  // ── Filter transactions by period ─────────────────────────────────────────
  const periodTxs = useMemo(() => {
    return allTransactions.filter((t) => {
      if (t.isDeleted) return false;
      if (period === 'day')   return t.date === today;
      if (period === 'week')  return t.date >= weekStart && t.date <= weekEnd;
      return t.date.startsWith(month);
    });
  }, [allTransactions, period, today, weekStart, weekEnd, month]);

  const totalIncome  = useMemo(() => periodTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [periodTxs]);
  const totalExpense = useMemo(() => periodTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [periodTxs]);
  const balance      = totalIncome - totalExpense;

  // ── Chart data ────────────────────────────────────────────────────────────
  const barChartData = useMemo(() => {
    if (period === 'month') {
      return daysInMonth(month).map((d) => {
        const ds = format(d, 'yyyy-MM-dd');
        const dayTxs = periodTxs.filter(t => t.date === ds);
        return {
          label: format(d, 'd'),
          expense: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
          income:  dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        };
      });
    }
    if (period === 'week') {
      const start = new Date(weekStart + 'T00:00:00');
      const end   = new Date(weekEnd   + 'T00:00:00');
      return eachDayOfInterval({ start, end }).map((d) => {
        const ds = format(d, 'yyyy-MM-dd');
        const dayTxs = periodTxs.filter(t => t.date === ds);
        return {
          label: format(d, 'EEE'),
          expense: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
          income:  dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        };
      });
    }
    // day: category breakdown
    const catMap: Record<string, number> = {};
    periodTxs.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.categoryId] = (catMap[t.categoryId] ?? 0) + t.amount;
    });
    return Object.entries(catMap)
      .map(([catId, amount]) => {
        const cat = SYSTEM_CATEGORIES.find(c => c.id === catId);
        return { label: cat?.name ?? 'Other', expense: amount, income: 0 };
      })
      .sort((a, b) => b.expense - a.expense)
      .slice(0, 8);
  }, [period, month, weekStart, weekEnd, periodTxs]);

  // ── Category breakdown ────────────────────────────────────────────────────
  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    periodTxs.filter(t => t.type === 'expense').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return SYSTEM_CATEGORIES
      .filter(c => c.type === 'expense' && map[c.id])
      .map(c => ({ cat: c, amount: map[c.id], pct: total > 0 ? map[c.id] / total : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodTxs]);

  const hasData = periodTxs.length > 0;

  // ── Period nav label ──────────────────────────────────────────────────────
  const periodLabel =
    period === 'day'   ? (today === todayStr() ? 'Today' : format(new Date(today + 'T00:00:00'), 'MMM d')) :
    period === 'week'  ? weekLabel :
    monthLabel(month);

  return (
    <div className="px-4 py-5 md:px-8 max-w-4xl mx-auto space-y-5">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-cocoa-text2 text-sm">{getGreeting()},</p>
          <h1 className="text-xl font-bold text-cocoa-primary">{displayName} 👋</h1>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {!hasAccounts && (
        <Card className="border-dashed border-2 border-cocoa-divider bg-cocoa-bg/50">
          <div className="text-center py-3 space-y-3">
            <div className="flex justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FFF0DC' }}>
                <Wallet size={22} style={{ color: '#C8956A' }} />
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#DCFFF4' }}>
                <TrendingUp size={22} style={{ color: '#2E9E6B' }} />
              </div>
            </div>
            <div>
              <p className="font-semibold text-cocoa-primary text-sm">Welcome to Cocoa Budget!</p>
              <p className="text-xs text-cocoa-text2 mt-1">Start by adding your accounts, then tap <strong>+</strong> to log transactions.</p>
            </div>
            <button onClick={() => navigate('/accounts')}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-white"
              style={{ backgroundColor: '#C8956A' }}>
              Add your first account →
            </button>
          </div>
        </Card>
      )}

      {/* ── Period toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl overflow-hidden border border-cocoa-divider bg-white text-sm font-semibold flex-1">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 capitalize transition-colors ${
                period === p ? 'text-white' : 'text-cocoa-text2 hover:bg-cocoa-bg'
              }`}
              style={period === p ? { backgroundColor: '#C8956A' } : {}}>
              {p}
            </button>
          ))}
        </div>
        {/* Navigator */}
        <div className="flex items-center gap-1 bg-white border border-cocoa-divider rounded-xl px-2 py-1.5">
          <button onClick={() => {
            if (period === 'month') setMonth(prevMonth(month));
            else if (period === 'week') setWeekOffset(w => w - 1);
          }} className="p-0.5 rounded hover:bg-cocoa-bg text-cocoa-text2 transition-colors"
            style={{ visibility: period === 'day' ? 'hidden' : 'visible' }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium text-cocoa-text1 min-w-[80px] text-center">{periodLabel}</span>
          <button onClick={() => {
            if (period === 'month') setMonth(nextMonth(month));
            else if (period === 'week') setWeekOffset(w => w + 1);
          }} className="p-0.5 rounded hover:bg-cocoa-bg text-cocoa-text2 transition-colors"
            style={{ visibility: period === 'day' ? 'hidden' : 'visible' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="!p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-cocoa-expense">
            <TrendingDown size={14} />
            <span className="text-xs font-medium">Expenses</span>
          </div>
          <p className="text-base font-bold text-cocoa-expense">{formatCurrency(totalExpense, currencySymbol)}</p>
        </Card>
        <Card className="!p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-cocoa-income">
            <TrendingUp size={14} />
            <span className="text-xs font-medium">Income</span>
          </div>
          <p className="text-base font-bold text-cocoa-income">{formatCurrency(totalIncome, currencySymbol)}</p>
        </Card>
        <Card className={`!p-3 text-center space-y-1`}>
          <p className="text-xs font-medium text-cocoa-text2">Balance</p>
          <p className={`text-base font-bold ${balance >= 0 ? 'text-cocoa-income' : 'text-cocoa-expense'}`}>
            {formatCurrency(balance, currencySymbol)}
          </p>
        </Card>
      </div>

      {/* ── Bar chart ────────────────────────────────────────────────── */}
      <Card className="!p-4">
        <p className="text-xs font-semibold text-cocoa-text2 uppercase tracking-wide mb-3">
          {period === 'day' ? 'Spending by Category' : period === 'week' ? 'Daily Breakdown' : 'Daily Spending'}
        </p>
        {!hasData ? (
          <div className="h-40 flex items-center justify-center text-cocoa-text3 text-sm">
            No transactions yet — tap <strong className="mx-1 text-cocoa-accent">+</strong> to add one
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              barCategoryGap="25%">
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#B0A090' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip symbol={currencySymbol} />} cursor={{ fill: '#F8F5F1' }} />
              <Bar dataKey="expense" name="Expense" fill="#D94F3D" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {barChartData.map((_, i) => (
                  <Cell key={i} fill="#D94F3D" fillOpacity={0.85} />
                ))}
              </Bar>
              {period !== 'day' && (
                <Bar dataKey="income" name="Income" fill="#2E9E6B" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {barChartData.map((_, i) => (
                    <Cell key={i} fill="#2E9E6B" fillOpacity={0.85} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Category breakdown ───────────────────────────────────────── */}
      {catBreakdown.length > 0 && (
        <Card className="!p-4">
          <p className="text-xs font-semibold text-cocoa-text2 uppercase tracking-wide mb-3">Expenses by Category</p>
          <div className="space-y-3">
            {catBreakdown.map(({ cat, amount, pct }) => (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{catEmoji(cat.icon)}</span>
                  <span className="flex-1 text-xs font-medium text-cocoa-text1">{cat.name}</span>
                  <span className="text-xs font-semibold text-cocoa-expense">{formatCurrency(amount, currencySymbol)}</span>
                  <span className="text-xs text-cocoa-text3 w-10 text-right">{(pct * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct * 100}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Account balances summary ─────────────────────────────────── */}
      {hasAccounts && (
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-cocoa-text2 uppercase tracking-wide">Accounts</p>
            <button onClick={() => navigate('/accounts')} className="text-xs text-cocoa-accent font-medium">View all</button>
          </div>
          <div className="space-y-2">
            {accounts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                <span className="flex-1 text-sm text-cocoa-text1">{a.name}</span>
                <span className={`text-sm font-semibold ${a.balance < 0 ? 'text-cocoa-expense' : 'text-cocoa-text1'}`}>
                  {a.balance < 0 ? '−' : ''}{formatCurrency(Math.abs(a.balance), currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
