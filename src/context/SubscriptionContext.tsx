/**
 * SubscriptionContext.tsx
 *
 * Manages in-app subscription state.
 * Currently operates in "free mode" — all users get full access.
 * When you're ready to monetize, install RevenueCat and replace the stub below.
 *
 * FUTURE SETUP (when ready to add subscriptions):
 * 1. Run: pnpm add react-native-purchases
 * 2. Replace the placeholder API keys with your real RevenueCat keys
 * 3. Configure products in App Store Connect and Google Play Console
 * 4. Add them to RevenueCat with an Entitlement named "pro"
 */

import React, { createContext, useContext, useState } from 'react';

// ─── Context types ────────────────────────────────────────────────────────────
type PurchasesPackage = {
  identifier: string;
  product: {
    title: string;
    priceString: string;
    description: string;
  };
};

interface SubscriptionContextValue {
  isPro: boolean;
  isLoading: boolean;
  packages: PurchasesPackage[];
  purchase: (pkg: PurchasesPackage) => Promise<{ error: string | null }>;
  restore: () => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  // In free mode, everyone is "pro" (all features unlocked)
  const [isPro] = useState(true);
  const [isLoading] = useState(false);
  const [packages] = useState<PurchasesPackage[]>([]);

  const purchase = async (_pkg: PurchasesPackage): Promise<{ error: string | null }> => {
    return { error: 'Subscriptions are not yet configured.' };
  };

  const restore = async (): Promise<{ error: string | null }> => {
    return { error: 'Subscriptions are not yet configured.' };
  };

  const refresh = async (): Promise<void> => {};

  return (
    <SubscriptionContext.Provider value={{ isPro, isLoading, packages, purchase, restore, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
