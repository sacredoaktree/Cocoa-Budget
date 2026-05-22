import { create } from 'zustand';
import { SavingsGoal } from '../types';

const MOCK_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    icon: 'shield-checkmark-outline',
    color: '#2E9E6B',
    targetAmount: 30000000,   // ₱300,000
    currentAmount: 9644108,   // ₱96,441 (matches Coins.ph balance)
    deadline: '2026-12-31',
    isCompleted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'goal-2',
    name: 'Vacation Fund',
    icon: 'airplane-outline',
    color: '#4A90D9',
    targetAmount: 10000000,   // ₱100,000
    currentAmount: 4200000,   // ₱42,000
    deadline: '2026-09-01',
    isCompleted: false,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'goal-3',
    name: 'New Laptop',
    icon: 'laptop-outline',
    color: '#8B5CF6',
    targetAmount: 8000000,    // ₱80,000
    currentAmount: 8000000,
    deadline: '2026-04-01',
    isCompleted: true,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
];

interface SavingsGoalStore {
  goals: SavingsGoal[];
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  contribute: (id: string, amount: number) => void;
}

export const useSavingsGoalStore = create<SavingsGoalStore>((set) => ({
  goals: MOCK_GOALS,
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
}));
