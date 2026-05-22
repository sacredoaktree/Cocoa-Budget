import { create } from 'zustand';
import { NetWorthSnapshot } from '../types';

// Seed 12 months of net worth history (realistic growth)
const buildHistory = (): NetWorthSnapshot[] => {
  const base = 200000000; // ₱2,000,000 in cents
  const months = [
    '2025-06','2025-07','2025-08','2025-09','2025-10','2025-11',
    '2026-01','2026-02','2026-03','2026-04','2026-05',
  ];
  return months.map((date, i) => {
    const growth = Math.round(base * (1 + i * 0.04 + (Math.random() * 0.02 - 0.01)));
    const assets = Math.round(growth * 1.1);
    const liabilities = assets - growth;
    return { id: `nws-${i}`, date, amount: growth, assets, liabilities };
  });
};

interface NetWorthStore {
  snapshots: NetWorthSnapshot[];
  addSnapshot: (snapshot: NetWorthSnapshot) => void;
  recordCurrentNetWorth: (netWorth: number, assets: number, liabilities: number) => void;
}

export const useNetWorthStore = create<NetWorthStore>((set, get) => ({
  snapshots: buildHistory(),
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
