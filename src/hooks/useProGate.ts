/**
 * useProGate
 *
 * A convenience hook for gating Pro features.
 * Usage:
 *   const { isPro, requirePro } = useProGate();
 *   // In a button handler:
 *   if (!requirePro()) return; // redirects to paywall if not pro
 *   // ... proceed with pro action
 */

import { useCallback } from 'react';
import { router } from 'expo-router';
import { useSubscription } from '../context/SubscriptionContext';

export function useProGate() {
  const { isPro } = useSubscription();

  const requirePro = useCallback((): boolean => {
    if (isPro) return true;
    router.push('/paywall');
    return false;
  }, [isPro]);

  return { isPro, requirePro };
}
