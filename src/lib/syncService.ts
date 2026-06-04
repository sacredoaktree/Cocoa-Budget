/**
 * syncService.ts
 *
 * Handles bidirectional sync between local Zustand stores and Supabase.
 * Strategy: optimistic local updates first, then background sync to Supabase.
 * On app launch, pull remote data and merge into local stores.
 */

import { supabase } from './supabase';
import {
  Account, Transaction, Subscription, Budget,
  SavingsGoal, NetWorthSnapshot, SplitEntry, Category,
} from '../types';

// ─── Helper: get current user id ─────────────────────────────────────────────
async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
export const accountSync = {
  async fetchAll(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) { console.error('[sync] accounts fetch:', error.message); return []; }
    return (data ?? []).map(remoteToAccount);
  },

  async upsert(account: Account): Promise<void> {
    const uid = await getUserId();
    if (!uid) return;
    const { error } = await supabase.from('accounts').upsert(accountToRemote(account, uid));
    if (error) console.error('[sync] account upsert:', error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('accounts').update({ is_archived: true }).eq('id', id);
    if (error) console.error('[sync] account delete:', error.message);
  },
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionSync = {
  async fetchAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_deleted', false)
      .order('date', { ascending: false });
    if (error) { console.error('[sync] transactions fetch:', error.message); return []; }
    return (data ?? []).map(remoteToTransaction);
  },

  async upsert(tx: Transaction): Promise<void> {
    const uid = await getUserId();
    if (!uid) return;
    const { error } = await supabase.from('transactions').upsert(transactionToRemote(tx, uid));
    if (error) console.error('[sync] transaction upsert:', error.message);
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').update({ is_deleted: true }).eq('id', id);
    if (error) console.error('[sync] transaction delete:', error.message);
  },
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionSync = {
  async fetchAll(): Promise<Subscription[]> {
    const { data, error } = await supabase.from('subscriptions').select('*');
    if (error) { console.error('[sync] subscriptions fetch:', error.message); return []; }
    return (data ?? []).map(remoteToSubscription);
  },

  async upsert(sub: Subscription): Promise<void> {
    const uid = await getUserId();
    if (!uid) return;
    const { error } = await supabase.from('subscriptions').upsert(subscriptionToRemote(sub, uid));
    if (error) console.error('[sync] subscription upsert:', error.message);
  },
};

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const budgetSync = {
  async fetchAll(): Promise<Budget[]> {
    const { data, error } = await supabase.from('budgets').select('*');
    if (error) { console.error('[sync] budgets fetch:', error.message); return []; }
    return (data ?? []).map(remoteToBudget);
  },

  async upsert(budget: Budget): Promise<void> {
    const uid = await getUserId();
    if (!uid) return;
    const { error } = await supabase.from('budgets').upsert(budgetToRemote(budget, uid));
    if (error) console.error('[sync] budget upsert:', error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) console.error('[sync] budget delete:', error.message);
  },
};

// ─── Savings Goals ────────────────────────────────────────────────────────────
export const goalSync = {
  async fetchAll(): Promise<SavingsGoal[]> {
    const { data, error } = await supabase.from('savings_goals').select('*');
    if (error) { console.error('[sync] goals fetch:', error.message); return []; }
    return (data ?? []).map(remoteToGoal);
  },

  async upsert(goal: SavingsGoal): Promise<void> {
    const uid = await getUserId();
    if (!uid) return;
    const { error } = await supabase.from('savings_goals').upsert(goalToRemote(goal, uid));
    if (error) console.error('[sync] goal upsert:', error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) console.error('[sync] goal delete:', error.message);
  },
};

// ─── Net Worth Snapshots ──────────────────────────────────────────────────────
export const netWorthSync = {
  async fetchAll(): Promise<NetWorthSnapshot[]> {
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .order('date', { ascending: true });
    if (error) { console.error('[sync] net worth fetch:', error.message); return []; }
    return (data ?? []).map(remoteToSnapshot);
  },

  async upsert(snapshot: NetWorthSnapshot): Promise<void> {
    const uid = await getUserId();
    if (!uid) return;
    const { error } = await supabase.from('net_worth_snapshots').upsert(snapshotToRemote(snapshot, uid));
    if (error) console.error('[sync] net worth upsert:', error.message);
  },
};

// ─── Split Entries ────────────────────────────────────────────────────────────
export const splitSync = {
  async fetchAll(): Promise<SplitEntry[]> {
    const { data, error } = await supabase.from('split_entries').select('*');
    if (error) { console.error('[sync] split entries fetch:', error.message); return []; }
    return (data ?? []).map(remoteToSplit);
  },

  async upsert(entry: SplitEntry): Promise<void> {
    const uid = await getUserId();
    if (!uid) return;
    const { error } = await supabase.from('split_entries').upsert(splitToRemote(entry, uid));
    if (error) console.error('[sync] split entry upsert:', error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('split_entries').delete().eq('id', id);
    if (error) console.error('[sync] split entry delete:', error.message);
  },
};

// ─── Full initial sync (called on login) ──────────────────────────────────────
export async function pullAllFromCloud() {
  try {
    const [accounts, transactions, subscriptions, budgets, goals, snapshots, splits] =
      await Promise.all([
        accountSync.fetchAll(),
        transactionSync.fetchAll(),
        subscriptionSync.fetchAll(),
        budgetSync.fetchAll(),
        goalSync.fetchAll(),
        netWorthSync.fetchAll(),
        splitSync.fetchAll(),
      ]);
    return { accounts, transactions, subscriptions, budgets, goals, snapshots, splits };
  } catch (err) {
    console.warn('[syncService] pullAllFromCloud failed:', err);
    return { accounts: [], transactions: [], subscriptions: [], budgets: [], goals: [], snapshots: [], splits: [] };
  }
}

// ─── Mapping helpers: remote DB row → local TypeScript type ──────────────────

function remoteToAccount(r: any): Account {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    color: r.color,
    icon: r.icon,
    currency: r.currency,
    balance: r.balance,
    note: r.note,
    creditLimit: r.credit_limit ?? undefined,
    interestRate: r.interest_rate ?? undefined,
    monthlyPayment: r.monthly_payment ?? undefined,
    costBasis: r.cost_basis ?? undefined,
    countInAsset: r.count_in_asset,
    hideBalance: r.hide_balance,
    chartColor: r.chart_color,
    isArchived: r.is_archived,
    displayOrder: r.display_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function accountToRemote(a: Account, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    type: a.type,
    color: a.color,
    icon: a.icon,
    currency: a.currency,
    balance: a.balance,
    note: a.note,
    credit_limit: a.creditLimit ?? null,
    interest_rate: a.interestRate ?? null,
    monthly_payment: a.monthlyPayment ?? null,
    cost_basis: a.costBasis ?? null,
    count_in_asset: a.countInAsset,
    hide_balance: a.hideBalance,
    chart_color: a.chartColor,
    is_archived: a.isArchived,
    display_order: a.displayOrder,
    updated_at: a.updatedAt,
  };
}

function remoteToTransaction(r: any): Transaction {
  return {
    id: r.id,
    type: r.type,
    amount: r.amount,
    accountId: r.account_id,
    categoryId: r.category_id ?? '',
    transferToAccountId: r.transfer_to_account_id ?? undefined,
    transferPairId: r.transfer_pair_id ?? undefined,
    subscriptionId: r.subscription_id ?? undefined,
    payee: r.payee,
    note: r.note,
    date: r.date,
    time: r.time,
    isDeleted: r.is_deleted,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function transactionToRemote(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    type: t.type,
    amount: t.amount,
    account_id: t.accountId,
    category_id: t.categoryId || null,
    transfer_to_account_id: t.transferToAccountId ?? null,
    transfer_pair_id: t.transferPairId ?? null,
    subscription_id: t.subscriptionId ?? null,
    payee: t.payee,
    note: t.note,
    date: t.date,
    time: t.time,
    is_deleted: t.isDeleted,
    updated_at: t.updatedAt,
  };
}

function remoteToSubscription(r: any): Subscription {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    amount: r.amount,
    billingCycle: r.billing_cycle,
    nextBillingDate: r.next_billing_date,
    accountId: r.account_id ?? '',
    categoryId: r.category_id ?? '',
    status: r.status,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function subscriptionToRemote(s: Subscription, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    name: s.name,
    icon: s.icon,
    color: s.color,
    amount: s.amount,
    billing_cycle: s.billingCycle,
    next_billing_date: s.nextBillingDate,
    account_id: s.accountId || null,
    category_id: s.categoryId || null,
    status: s.status,
    note: s.note,
    updated_at: s.updatedAt,
  };
}

function remoteToBudget(r: any): Budget {
  return {
    id: r.id,
    categoryIds: r.category_ids ?? [],
    month: r.month,
    limitAmount: r.limit_amount,
    rollover: r.rollover,
    period: r.period,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function budgetToRemote(b: Budget, userId: string) {
  return {
    id: b.id,
    user_id: userId,
    category_ids: b.categoryIds ?? (b.categoryId ? [b.categoryId] : []),
    month: b.month,
    limit_amount: b.limitAmount,
    rollover: b.rollover,
    period: b.period ?? 'monthly',
    start_date: b.startDate ?? null,
    end_date: b.endDate ?? null,
    updated_at: b.updatedAt,
  };
}

function remoteToGoal(r: any): SavingsGoal {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    targetAmount: r.target_amount,
    currentAmount: r.current_amount,
    deadline: r.deadline,
    accountId: r.account_id ?? undefined,
    isCompleted: r.is_completed,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function goalToRemote(g: SavingsGoal, userId: string) {
  return {
    id: g.id,
    user_id: userId,
    name: g.name,
    icon: g.icon,
    color: g.color,
    target_amount: g.targetAmount,
    current_amount: g.currentAmount,
    deadline: g.deadline,
    account_id: g.accountId ?? null,
    is_completed: g.isCompleted,
    updated_at: g.updatedAt,
  };
}

function remoteToSnapshot(r: any): NetWorthSnapshot {
  return {
    id: r.id,
    date: r.date,
    amount: r.amount,
    assets: r.assets,
    liabilities: r.liabilities,
  };
}

function snapshotToRemote(s: NetWorthSnapshot, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    date: s.date,
    amount: s.amount,
    assets: s.assets,
    liabilities: s.liabilities,
  };
}

function remoteToSplit(r: any): SplitEntry {
  return {
    id: r.id,
    person: r.person,
    amount: r.amount,
    description: r.description,
    date: r.date,
    isSettled: r.is_settled,
    createdAt: r.created_at,
  };
}

function splitToRemote(e: SplitEntry, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    person: e.person,
    amount: e.amount,
    description: e.description,
    date: e.date,
    is_settled: e.isSettled,
  };
}
