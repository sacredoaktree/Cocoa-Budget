import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cocoaStorage } from '../utils/storage';
import { SavingsGoal } from '../types';

interface SavingsGoalStore {
  goals: SavingsGoal[];
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  contribute: (id: string, amount: number) => void;
}

export const useSavingsGoalStore = create<SavingsGoalStore>()(
  persist(
    (set) => ({
      goals: [],
      addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
      updateGoal: (id, updates) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
          ),
        })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      contribute: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== id) return g;
            const newAmount = g.currentAmount + amount;
            return {
              ...g,
              currentAmount: newAmount,
              isCompleted: newAmount >= g.targetAmount,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),
    }),
    { name: 'cocoa-savings-goals', storage: cocoaStorage }
  )
);
