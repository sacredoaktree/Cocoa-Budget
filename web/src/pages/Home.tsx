import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Wallet, TrendingUp } from 'lucide-react';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { getCategoriesByType } from '@shared/data/categories';
import { currentMonth } from '@shared/utils/date';
import { useNavigate } from 'react-router-dom';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';

// Map Ionicons-style icon names to emoji equivalents for the web
const ICON_EMOJI: Record<string, string> = {
  'card-outline':                  '💳',
  'restaurant-outline':            '🍽️',
  'bus-outline':                   '🚌',
  'flash-outline':                 '⚡',
  'happy-outline':                 '😊',
  'bag-outline':                   '🛍️',
  'medkit-outline':                '💊',
  'refresh-circle-outline':        '🔄',
  'film-outline':                  '🎬',
  'school-outline':                '🎓',
  'airplane-outline':              '✈️',
  'ellipsis-horizontal-outline':   '•••',
  'laptop-outline':                '💻',
  'trending-up-outline':           '📈',
  'swap-horizontal-outline':       '↔️',
  'cash-outline':                  '💵',
  'heart-circle-outline':          '💗',
  'add-circle-outline':            '➕',
};

function iconEmoji(iconName: string): string {
  return ICON_EMOJI[iconName] ?? '📌';
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const [incomeExpanded, setIncomeExpanded] = useState(false);
  const navigate = useNavigate();

  const { settings } = useSettingsStore();
  const { currencySymbol, displayName } = settings;

  const accounts = useAccountStore((s) => s.accounts.filter((a) => !a.isArchived));
  const hasAccounts = accounts.length > 0;

  const month = currentMonth();
  const getMonthlyExpense = useTransactionStore((s) => s.getMonthlyExpense);
  const getMonthlyIncome  = useTransactionStore((s) => s.getMonthlyIncome);
  const getSpendByCategory = useTransactionStore((s) => s.getSpendByCategory);

  const totalExpense = getMonthlyExpense(month);
  const totalIncome  = getMonthlyIncome(month);
  const balance      = totalIncome - totalExpense;

  const getByMonth = useTransactionStore((s) => s.getByMonth);

  const spendByCat = getSpendByCategory(month);
  const spendMap   = Object.fromEntries(spendByCat.map((s) => [s.categoryId, s.amount]));

  // Compute income per category for the current month
  const monthTxs  = getByMonth(month);
  const incomeMap: Record<string, number> = {};
  monthTxs
    .filter((t) => t.type === 'income')
    .forEach((t) => {
      incomeMap[t.categoryId] = (incomeMap[t.categoryId] ?? 0) + t.amount;
    });

  const expenseCats = getCategoriesByType('expense');
  const incomeCats  = getCategoriesByType('income');

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto space-y-6">

      {/* Greeting */}
      <div>
        <p className="text-cocoa-text2 text-sm">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-cocoa-primary">{displayName} 👋</h1>
      </div>

      {/* Empty state guide when no accounts exist */}
      {!hasAccounts && (
        <Card className="border-dashed border-2 border-cocoa-divider bg-cocoa-bg/50">
          <div className="text-center py-4 space-y-3">
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
            <button
              onClick={() => navigate('/accounts')}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition-colors"
              style={{ backgroundColor: '#C8956A' }}
            >
              Add your first account →
            </button>
          </div>
        </Card>
      )}

      {/* Monthly summary bar */}
      <Card className="!p-0 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-cocoa-divider">
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-cocoa-text3 uppercase tracking-wide mb-1">Expenses</p>
            <AmountText
              cents={totalExpense}
              symbol={currencySymbol}
              className="text-lg font-bold text-cocoa-expense"
            />
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-cocoa-text3 uppercase tracking-wide mb-1">Income</p>
            <AmountText
              cents={totalIncome}
              symbol={currencySymbol}
              className="text-lg font-bold text-cocoa-income"
            />
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-cocoa-text3 uppercase tracking-wide mb-1">Balance</p>
            <AmountText
              cents={balance}
              symbol={currencySymbol}
              colorize
              className="text-lg font-bold"
            />
          </div>
        </div>
      </Card>

      {/* Expense categories grid */}
      <section>
        <h2 className="text-sm font-semibold text-cocoa-text2 uppercase tracking-wide mb-3">
          Expenses by Category
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {expenseCats.map((cat) => {
            const amount = spendMap[cat.id] ?? 0;
            return (
              <Card key={cat.id} className="!p-3 text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-xl"
                  style={{ backgroundColor: cat.bgColor }}
                >
                  {iconEmoji(cat.icon)}
                </div>
                <p className="text-xs text-cocoa-text2 truncate">{cat.name}</p>
                <AmountText
                  cents={amount}
                  symbol={currencySymbol}
                  className="text-xs font-semibold text-cocoa-accent mt-0.5 block"
                />
              </Card>
            );
          })}
        </div>
      </section>

      {/* Income categories (collapsible) */}
      <section>
        <button
          onClick={() => setIncomeExpanded((v) => !v)}
          className="flex items-center justify-between w-full mb-3"
        >
          <h2 className="text-sm font-semibold text-cocoa-text2 uppercase tracking-wide">
            Income by Category
          </h2>
          {incomeExpanded
            ? <ChevronUp size={16} className="text-cocoa-text3" />
            : <ChevronDown size={16} className="text-cocoa-text3" />
          }
        </button>

        {incomeExpanded && (
          <div className="grid grid-cols-3 gap-3">
            {incomeCats.map((cat) => {
              const amount = incomeMap[cat.id] ?? 0;
              return (
                <Card key={cat.id} className="!p-3 text-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-xl"
                    style={{ backgroundColor: cat.bgColor }}
                  >
                    {iconEmoji(cat.icon)}
                  </div>
                  <p className="text-xs text-cocoa-text2 truncate">{cat.name}</p>
                  <AmountText
                    cents={amount}
                    symbol={currencySymbol}
                    className="text-xs font-semibold text-cocoa-income mt-0.5 block"
                  />
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
