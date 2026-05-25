/**
 * SubscriptionContext.tsx
 *
 * Manages in-app subscription state via RevenueCat.
 * Provides isPro flag, available packages, and purchase/restore methods.
 *
 * SETUP REQUIRED:
 * 1. Run: pnpm add react-native-purchases
 * 2. Replace the placeholder API keys below with your real RevenueCat keys
 *    from https://app.revenuecat.com → Project → API Keys
 * 3. Configure your products in App Store Connect and Google Play Console
 *    then add them to RevenueCat with an Entitlement named "pro"
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useAuth } from './AuthContext';

// ─── RevenueCat types (stub until SDK is installed) ──────────────────────────
// Once you run `pnpm add react-native-purchases`, replace this entire block
// with: import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';

type PurchasesPackage = {
  identifier: string;
  product: {
    title: string;
    priceString: string;
    description: string;
  };
};

type CustomerInfo = {
  entitlements: {
    active: Record<string, { isActive: boolean; expirationDate: string | null }>;
  };
};

// ─── Placeholder Purchases object (replace with real SDK import) ──────────────
const Purchases = {
  configure: (_config: { apiKey: string; appUserID?: string }) => {},
  getOfferings: async () => ({
    current: {
      availablePackages: [] as PurchasesPackage[],
    },
  }),
  purchasePackage: async (_pkg: PurchasesPackage): Promise<{ customerInfo: CustomerInfo }> => {
    throw new Error('RevenueCat SDK not installed. Run: pnpm add react-native-purchases');
  },
  restorePurchases: async (): Promise<CustomerInfo> => {
    throw new Error('RevenueCat SDK not installed. Run: pnpm add react-native-purchases');
  },
  getCustomerInfo: async (): Promise<CustomerInfo> => ({
    entitlements: { active: {} },
  }),
  logIn: async (_userId: string): Promise<{ customerInfo: CustomerInfo }> => ({
    customerInfo: { entitlements: { active: {} } },
  }),
};

// ─── Replace these with your real RevenueCat API keys ────────────────────────
const REVENUECAT_IOS_KEY = 'appl_REPLACE_WITH_YOUR_IOS_KEY';
const REVENUECAT_ANDROID_KEY = 'goog_REPLACE_WITH_YOUR_ANDROID_KEY';

// ─── Context types ────────────────────────────────────────────────────────────
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
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  // Initialize RevenueCat on mount
  useEffect(() => {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
    Purchases.configure({ apiKey, appUserID: user?.id });
    loadData();
  }, []);

  // When user logs in, identify them in RevenueCat for cross-device sync
  useEffect(() => {
    if (user?.id) {
      Purchases.logIn(user.id).then(({ customerInfo }) => {
        setIsPro(checkIsPro(customerInfo));
      }).catch(console.warn);
    }
  }, [user?.id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);
      setIsPro(checkIsPro(customerInfo));
      setPackages(offerings.current?.availablePackages ?? []);
    } catch (err) {
      console.warn('[SubscriptionContext] loadData error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchase = async (pkg: PurchasesPackage): Promise<{ error: string | null }> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setIsPro(checkIsPro(customerInfo));
      return { error: null };
    } catch (err: any) {
      if (err?.userCancelled) return { error: null }; // User cancelled — not an error
      return { error: err?.message ?? 'Purchase failed. Please try again.' };
    }
  };

  const restore = async (): Promise<{ error: string | null }> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      setIsPro(checkIsPro(customerInfo));
      if (!checkIsPro(customerInfo)) {
        return { error: 'No active subscription found to restore.' };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message ?? 'Restore failed. Please try again.' };
    }
  };

  return (
    <SubscriptionContext.Provider value={{ isPro, isLoading, packages, purchase, restore, refresh: loadData }}>
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

// ─── Helper ───────────────────────────────────────────────────────────────────
function checkIsPro(customerInfo: CustomerInfo): boolean {
  return !!customerInfo?.entitlements?.active?.['pro']?.isActive;
}
