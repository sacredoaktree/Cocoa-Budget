import { create } from 'zustand';
import { Account } from '../types';

interface AccountStore {
  accounts: Account[];
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  archiveAccount: (id: string) => void;
  getById: (id: string) => Account | undefined;
  getAssets: () => Account[];
  getLiabilities: () => Account[];
  getTotalAssets: () => number;
  getTotalLiabilities: () => number;
  getNetWorth: () => number;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
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
}));
