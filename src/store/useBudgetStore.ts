import { create } from 'zustand';
import { Budget, BudgetWithSpent } from '../types';
import { SYSTEM_CATEGORIES } from '../data/categories';

interface BudgetStore {
  budgets: Budget[];
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  getBudgetsWithSpent: (
    month: string,
    spendByCategory: Record<string, number>
  ) => BudgetWithSpent[];
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],

  addBudget: (budget) =>
    set((s) => ({ budgets: [...s.budgets, budget] })),

  updateBudget: (id, updates) =>
    set((s) => ({
      budgets: s.budgets.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      ),
    })),

  getBudgetsWithSpent: (month, spendByCategory) =>
    get()
      .budgets.filter((b) => b.month === month)
      .map((b) => {
        const cat = SYSTEM_CATEGORIES.find((c) => c.id === b.categoryId);
        const spent = spendByCategory[b.categoryId] ?? 0;
        const remaining = b.limitAmount - spent;
        const percentUsed = b.limitAmount > 0 ? spent / b.limitAmount : 0;
        return {
          ...b,
          categoryName: cat?.name ?? 'Unknown',
          categoryIcon: cat?.icon ?? 'help-circle-outline',
          categoryColor: cat?.color ?? '#8A8A8A',
          spent,
          remaining,
          percentUsed,
          status:
            percentUsed >= 1 ? 'over' : percentUsed >= 0.8 ? 'warning' : 'under',
        } as BudgetWithSpent;
      }),
}));
