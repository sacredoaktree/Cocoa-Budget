import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cocoaStorage } from '../utils/storage';
import { Budget, BudgetWithSpent } from '../types';
import { SYSTEM_CATEGORIES } from '../data/categories';

export function getBudgetCategoryIds(b: Budget): string[] {
  if (b.categoryIds && b.categoryIds.length > 0) return b.categoryIds;
  if (b.categoryId) return [b.categoryId];
  return [];
}

interface BudgetStore {
  budgets: Budget[];
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetsWithSpent: (
    month: string,
    spendByCategory: Record<string, number>
  ) => BudgetWithSpent[];
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      budgets: [],

      addBudget: (budget) =>
        set((s) => ({ budgets: [...s.budgets, budget] })),

      updateBudget: (id, updates) =>
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          ),
        })),

      deleteBudget: (id) =>
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      getBudgetsWithSpent: (month, spendByCategory) =>
        get()
          .budgets.filter((b) => b.month === month)
          .map((b) => {
            const catIds = getBudgetCategoryIds(b);
            const primaryId = catIds[0] ?? '';
            const cat = SYSTEM_CATEGORIES.find((c) => c.id === primaryId);
            const cats = catIds
              .map((id) => SYSTEM_CATEGORIES.find((c) => c.id === id))
              .filter(Boolean) as typeof SYSTEM_CATEGORIES;

            const spent = catIds.reduce((sum, id) => sum + (spendByCategory[id] ?? 0), 0);
            const remaining = b.limitAmount - spent;
            const percentUsed = b.limitAmount > 0 ? spent / b.limitAmount : 0;

            return {
              ...b,
              categoryName: cats.length > 1
                ? `${cats.length} categories`
                : (cat?.name ?? 'Unknown'),
              categoryNames: cats.map((c) => c.name),
              categoryIcon: cat?.icon ?? 'help-circle-outline',
              categoryColor: cat?.color ?? '#8A8A8A',
              spent,
              remaining,
              percentUsed,
              status: percentUsed >= 1 ? 'over' : percentUsed >= 0.8 ? 'warning' : 'under',
            } as BudgetWithSpent;
          }),
    }),
    { name: 'cocoa-budgets', storage: cocoaStorage }
  )
);
