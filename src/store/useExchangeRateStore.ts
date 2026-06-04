import { create } from 'zustand';
import { ExchangeRate } from '../types';

// Seed rates relative to PHP (base currency)
const SEED_RATES: ExchangeRate[] = [
  { from: 'USD', to: 'PHP', rate: 56.5,    updatedAt: new Date().toISOString() },
  { from: 'EUR', to: 'PHP', rate: 61.2,    updatedAt: new Date().toISOString() },
  { from: 'GBP', to: 'PHP', rate: 72.8,    updatedAt: new Date().toISOString() },
  { from: 'JPY', to: 'PHP', rate: 0.375,   updatedAt: new Date().toISOString() },
  { from: 'SGD', to: 'PHP', rate: 41.9,    updatedAt: new Date().toISOString() },
  { from: 'AUD', to: 'PHP', rate: 36.4,    updatedAt: new Date().toISOString() },
  { from: 'CAD', to: 'PHP', rate: 41.5,    updatedAt: new Date().toISOString() },
  { from: 'HKD', to: 'PHP', rate: 7.24,    updatedAt: new Date().toISOString() },
  { from: 'CNY', to: 'PHP', rate: 7.79,    updatedAt: new Date().toISOString() },
  { from: 'KRW', to: 'PHP', rate: 0.041,   updatedAt: new Date().toISOString() },
  { from: 'THB', to: 'PHP', rate: 1.58,    updatedAt: new Date().toISOString() },
  { from: 'MYR', to: 'PHP', rate: 12.1,    updatedAt: new Date().toISOString() },
  { from: 'IDR', to: 'PHP', rate: 0.00348, updatedAt: new Date().toISOString() },
  { from: 'INR', to: 'PHP', rate: 0.679,   updatedAt: new Date().toISOString() },
  { from: 'AED', to: 'PHP', rate: 15.4,    updatedAt: new Date().toISOString() },
  { from: 'CHF', to: 'PHP', rate: 63.8,    updatedAt: new Date().toISOString() },
  { from: 'NZD', to: 'PHP', rate: 33.7,    updatedAt: new Date().toISOString() },
  { from: 'PHP', to: 'PHP', rate: 1,       updatedAt: new Date().toISOString() },
];

interface ExchangeRateStore {
  rates: ExchangeRate[];
  isLoading: boolean;
  lastFetched: string | null;
  error: string | null;

  // Convert amount (in cents) from one currency to another
  convert: (amountCents: number, from: string, to: string) => number;

  // Get rate between two currencies
  getRate: (from: string, to: string) => number;

  // Update a rate manually
  updateRate: (from: string, to: string, rate: number) => void;

  // Fetch latest rates from frankfurter.app
  fetchRates: (baseCurrency?: string) => Promise<void>;
}

export const useExchangeRateStore = create<ExchangeRateStore>((set, get) => ({
  rates: SEED_RATES,
  isLoading: false,
  lastFetched: null,
  error: null,

  getRate: (from, to) => {
    if (from === to) return 1;
    const direct = get().rates.find((r) => r.from === from && r.to === to);
    if (direct) return direct.rate;
    // Try reverse
    const reverse = get().rates.find((r) => r.from === to && r.to === from);
    if (reverse && reverse.rate !== 0) return 1 / reverse.rate;
    return 1; // fallback: 1:1
  },

  convert: (amountCents, from, to) => {
    if (from === to) return amountCents;
    const rate = get().getRate(from, to);
    return Math.round(amountCents * rate);
  },

  updateRate: (from, to, rate) => {
    set((s) => {
      const existing = s.rates.find((r) => r.from === from && r.to === to);
      if (existing) {
        return {
          rates: s.rates.map((r) =>
            r.from === from && r.to === to
              ? { ...r, rate, updatedAt: new Date().toISOString() }
              : r
          ),
        };
      }
      return {
        rates: [
          ...s.rates,
          { from, to, rate, updatedAt: new Date().toISOString() },
        ],
      };
    });
  },

  fetchRates: async (baseCurrency = 'PHP') => {
    set({ isLoading: true, error: null });
    try {
      // Frankfurter returns rates relative to the base currency
      const res = await fetch(
        `https://api.frankfurter.app/latest?base=${baseCurrency}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const updatedAt = new Date().toISOString();
      const newRates: ExchangeRate[] = Object.entries(json.rates as Record<string, number>).map(
        ([to, rate]) => ({ from: baseCurrency, to, rate, updatedAt })
      );
      // Always include self
      newRates.push({ from: baseCurrency, to: baseCurrency, rate: 1, updatedAt });
      set({ rates: newRates, isLoading: false, lastFetched: updatedAt });
    } catch (err: any) {
      set({ isLoading: false, error: err.message ?? 'Failed to fetch rates' });
    }
  },
}));
