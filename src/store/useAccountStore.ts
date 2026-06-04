import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cocoaStorage } from '../utils/storage';
import { Account } from '../types';

interface AccountStore {
  accounts: Account[];
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  archiveAccount: (id: string) => void;
  transfer: (fromId: string, toId: string, amountCents: number, feeCents: number) => void;
  getById: (id: string) => Account | undefined;
  getAssets: () => Account[];
  getLiabilities: () => Account[];
  getTotalAssets: () => number;
  getTotalLiabilities: () => number;
  getNetWorth: () => number;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],

      addAccount: (account) =>
        set((s) => ({ accounts: [...s.accounts, account] })),

      updateAccount: (id, updates) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        })),

      archiveAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, isArchived: true, updatedAt: new Date().toISOString() } : a
          ),
        })),

      transfer: (fromId, toId, amountCents, feeCents) =>
        set((s) => ({
          accounts: s.accounts.map((a) => {
            const now = new Date().toISOString();
            if (a.id === fromId) return { ...a, balance: a.balance - amountCents - feeCents, updatedAt: now };
            if (a.id === toId)   return { ...a, balance: a.balance + amountCents, updatedAt: now };
            return a;
          }),
        })),

      getById: (id) => get().accounts.find((a) => a.id === id),

      getAssets: () =>
        get().accounts.filter((a) => !a.isArchived && a.countInAsset && a.balance >= 0),

      getLiabilities: () =>
        get().accounts.filter((a) => !a.isArchived && a.balance < 0),

      getTotalAssets: () =>
        get()
          .getAssets()
          .reduce((sum, a) => sum + a.balance, 0),

      getTotalLiabilities: () =>
        get()
          .getLiabilities()
          .reduce((sum, a) => sum + Math.abs(a.balance), 0),

      getNetWorth: () => get().getTotalAssets() - get().getTotalLiabilities(),
    }),
    { name: 'cocoa-accounts', storage: cocoaStorage }
  )
);
