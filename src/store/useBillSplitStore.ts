import { create } from 'zustand';
import { SplitEntry } from '../types';


interface BillSplitStore {
  entries: SplitEntry[];
  addEntry: (entry: SplitEntry) => void;
  settleEntry: (id: string) => void;
  deleteEntry: (id: string) => void;
  getByPerson: (person: string) => SplitEntry[];
  getPeopleWithBalances: () => { person: string; balance: number }[];
}

export const useBillSplitStore = create<BillSplitStore>((set, get) => ({
  entries: [],
  addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
  settleEntry: (id) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, isSettled: true } : e)),
    })),
  deleteEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
  getByPerson: (person) => get().entries.filter((e) => e.person === person),
  getPeopleWithBalances: () => {
    const map: Record<string, number> = {};
    get().entries.filter((e) => !e.isSettled).forEach((e) => {
      map[e.person] = (map[e.person] ?? 0) + e.amount;
    });
    return Object.entries(map).map(([person, balance]) => ({ person, balance }));
  },
}));
