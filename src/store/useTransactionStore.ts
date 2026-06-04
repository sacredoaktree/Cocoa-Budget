import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cocoaStorage } from '../utils/storage';
import { Transaction, SpendByCategory, DailyTotal } from '../types';
import { SYSTEM_CATEGORIES } from '../data/categories';

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getByAccount: (accountId: string) => Transaction[];
  getByMonth: (month: string) => Transaction[];
  getByDate: (date: string) => Transaction[];
  getMonthlyIncome: (month: string) => number;
  getMonthlyExpense: (month: string) => number;
  getSpendByCategory: (month: string) => SpendByCategory[];
  getDailyTotals: (month: string) => DailyTotal[];
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (tx) =>
        set((s) => ({ transactions: [tx, ...s.transactions] })),

      updateTransaction: (id, updates) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, isDeleted: true } : t
          ),
        })),

      getByAccount: (accountId) =>
        get().transactions.filter((t) => !t.isDeleted && t.accountId === accountId),

      getByMonth: (month) =>
        get().transactions.filter((t) => !t.isDeleted && t.date.startsWith(month)),

      getByDate: (date) =>
        get().transactions.filter((t) => !t.isDeleted && t.date === date),

      getMonthlyIncome: (month) =>
        get()
          .getByMonth(month)
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),

      getMonthlyExpense: (month) =>
        get()
          .getByMonth(month)
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),

      getSpendByCategory: (month) => {
        const txs = get()
          .getByMonth(month)
          .filter((t) => t.type === 'expense');
        const totalExpense = txs.reduce((sum, t) => sum + t.amount, 0);

        const map: Record<string, number> = {};
        txs.forEach((t) => {
          map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
        });

        return Object.entries(map)
          .map(([categoryId, amount]) => {
            const cat = SYSTEM_CATEGORIES.find((c) => c.id === categoryId);
            return {
              categoryId,
              categoryName: cat?.name ?? 'Other',
              categoryIcon: cat?.icon ?? 'help-circle-outline',
              categoryColor: cat?.color ?? '#8A8A8A',
              amount,
              percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
              count: txs.filter((t) => t.categoryId === categoryId).length,
            };
          })
          .sort((a, b) => b.amount - a.amount);
      },

      getDailyTotals: (month) => {
        const txs = get().getByMonth(month);
        const map: Record<string, DailyTotal> = {};
        txs.forEach((t) => {
          if (!map[t.date]) map[t.date] = { date: t.date, income: 0, expense: 0 };
          if (t.type === 'income') map[t.date].income += t.amount;
          if (t.type === 'expense') map[t.date].expense += t.amount;
        });
        return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
      },
    }),
    { name: 'cocoa-transactions', storage: cocoaStorage }
  )
);
