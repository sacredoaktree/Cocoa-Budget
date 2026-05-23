import { create } from 'zustand';
import { NetWorthSnapshot } from '../types';


interface NetWorthStore {
  snapshots: NetWorthSnapshot[];
  addSnapshot: (snapshot: NetWorthSnapshot) => void;
  recordCurrentNetWorth: (netWorth: number, assets: number, liabilities: number) => void;
}

export const useNetWorthStore = create<NetWorthStore>((set, get) => ({
  snapshots: [],
  addSnapshot: (snapshot) => set((s) => ({ snapshots: [...s.snapshots, snapshot] })),
  recordCurrentNetWorth: (netWorth, assets, liabilities) => {
    const month = new Date().toISOString().slice(0, 7);
    const existing = get().snapshots.find((s) => s.date === month);
    if (existing) {
      set((s) => ({
        snapshots: s.snapshots.map((snap) =>
          snap.date === month ? { ...snap, amount: netWorth, assets, liabilities } : snap
        ),
      }));
    } else {
      set((s) => ({
        snapshots: [
          ...s.snapshots,
          { id: `nws-${Date.now()}`, date: month, amount: netWorth, assets, liabilities },
        ],
      }));
    }
  },
}));
