import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cocoaStorage } from '../utils/storage';
import { Subscription } from '../types';

interface SubscriptionStore {
  subscriptions: Subscription[];
  addSubscription: (sub: Subscription) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  cancelSubscription: (id: string) => void;
  getActive: () => Subscription[];
  getAnnualCost: () => number;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      subscriptions: [],

      addSubscription: (sub) =>
        set((s) => ({ subscriptions: [sub, ...s.subscriptions] })),

      updateSubscription: (id, updates) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...updates, updatedAt: new Date().toISOString() } : sub
          ),
        })),

      cancelSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: 'cancelled', updatedAt: new Date().toISOString() } : sub
          ),
        })),

      getActive: () => get().subscriptions.filter((s) => s.status === 'active'),

      getAnnualCost: () => {
        const multipliers: Record<string, number> = {
          weekly: 52,
          monthly: 12,
          quarterly: 4,
          yearly: 1,
        };
        return get()
          .subscriptions.filter((s) => s.status === 'active')
          .reduce((sum, s) => sum + s.amount * (multipliers[s.billingCycle] ?? 12), 0);
      },
    }),
    { name: 'cocoa-subscriptions', storage: cocoaStorage }
  )
);
