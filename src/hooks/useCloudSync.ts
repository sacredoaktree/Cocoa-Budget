/**
 * useCloudSync
 *
 * Called once after a user signs in. Pulls all data from Supabase
 * and hydrates the local Zustand stores. After the initial pull,
 * each store's write methods call the corresponding sync service
 * in the background.
 *
 * Wrapped in try/catch to prevent crashes if network is unavailable.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { pullAllFromCloud } from '../lib/syncService';
import { useAccountStore } from '../store/useAccountStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useBudgetStore } from '../store/useBudgetStore';
import { useSavingsGoalStore } from '../store/useSavingsGoalStore';
import { useNetWorthStore } from '../store/useNetWorthStore';
import { useBillSplitStore } from '../store/useBillSplitStore';

export function useCloudSync() {
  const { session } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!session || hasSynced.current) return;
    hasSynced.current = true;

    pullAllFromCloud()
      .then(({ accounts, transactions, subscriptions, budgets, goals, snapshots, splits }) => {
        // Only hydrate if remote has data (don't overwrite local data on first install)
        if (accounts?.length > 0) {
          useAccountStore.setState({ accounts });
        }
        if (transactions?.length > 0) {
          useTransactionStore.setState({ transactions });
        }
        if (subscriptions?.length > 0) {
          useSubscriptionStore.setState({ subscriptions });
        }
        if (budgets?.length > 0) {
          useBudgetStore.setState({ budgets });
        }
        if (goals?.length > 0) {
          useSavingsGoalStore.setState({ goals });
        }
        if (snapshots?.length > 0) {
          useNetWorthStore.setState({ snapshots });
        }
        if (splits?.length > 0) {
          useBillSplitStore.setState({ entries: splits });
        }
      })
      .catch((err) => {
        // Network errors are expected when offline — don't crash the app
        console.warn('[useCloudSync] initial pull failed:', err);
      });
  }, [session]);
}
