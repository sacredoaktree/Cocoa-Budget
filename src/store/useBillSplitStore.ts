import { create } from 'zustand';
import { SplitEntry } from '../types';

const MOCK_ENTRIES: SplitEntry[] = [
  { id: 'split-1', person: 'Maria', amount: 150000, description: 'Dinner at Nobu', date: '2026-05-10', isSettled: false, createdAt: '2026-05-10T00:00:00Z' },
  { id: 'split-2', person: 'Jose', amount: -80000, description: 'Grab ride share', date: '2026-05-08', isSettled: false, createdAt: '2026-05-08T00:00:00Z' },
  { id: 'split-3', person: 'Maria', amount: 250000, description: 'Concert tickets', date: '2026-04-22', isSettled: true, createdAt: '2026-04-22T00:00:00Z' },
];

interface BillSplitStore {
  entries: SplitEntry[];
  addEntry: (entry: SplitEntry) => void;
  settleEntry: (id: string) => void;
  deleteEntry: (id: string) => void;
  getByPerson: (person: string) => SplitEntry[];
  getPeopleWithBalances: () => { person: string; balance: number }[];
}

export const useBillSplitStore = create<BillSplitStore>((set, get) => ({
  entries: MOCK_ENTRIES,
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
