// ─── Account ─────────────────────────────────────────────────────────────
export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'cash'
  | 'digital'
  | 'loan'
  | 'investment'
  | 'stock'
  | 'crypto';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  icon: string;
  currency: string;
  balance: number;          // in cents, can be negative
  note: string;             // last 4 digits or memo
  creditLimit?: number;
  interestRate?: number;
  monthlyPayment?: number;
  costBasis?: number;
  countInAsset: boolean;
  hideBalance: boolean;
  chartColor: string;
  isArchived: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Category ────────────────────────────────────────────────────────────
export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  bgColor: string;
  isSystem: boolean;
  isArchived: boolean;
  displayOrder: number;
}

// ─── Transaction ─────────────────────────────────────────────────────────
export type TransactionType = 'expense' | 'income' | 'transfer' | 'adjustment';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;           // always positive, in cents
  accountId: string;
  categoryId: string;
  transferToAccountId?: string;
  transferPairId?: string;
  subscriptionId?: string;
  payee: string;
  note: string;
  date: string;             // YYYY-MM-DD
  time: string;             // HH:mm
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Subscription ────────────────────────────────────────────────────────
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  accountId: string;
  categoryId: string;
  status: SubscriptionStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Budget ──────────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  categoryId: string;
  month: string;            // YYYY-MM
  limitAmount: number;
  rollover: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Settings ────────────────────────────────────────────────────────────
export interface AppSettings {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  lockEnabled: boolean;
  lockMethod: 'pin' | 'biometric';
  pinHash: string;
  lockTimeout: number;
  displayName: string;
  hasCompletedOnboarding: boolean;
  totalTransactionCount: number;
  totalDaysUsed: number;
  streakDays: number;
  privacyMode: boolean;
}

// ─── Exchange Rate ────────────────────────────────────────────────────────
export interface ExchangeRate {
  from: string;      // e.g. "USD"
  to: string;        // e.g. "PHP"
  rate: number;      // e.g. 56.5
  updatedAt: string; // ISO 8601
}

// ─── Computed helpers ────────────────────────────────────────────────────
export interface AccountWithStats extends Account {
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface BudgetWithSpent extends Budget {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'under' | 'warning' | 'over';
}

export interface SpendByCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percent: number;
  count: number;
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
}

// ─── Savings Goal ────────────────────────────────────────────────────────
export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;     // cents
  currentAmount: number;    // cents (manually set or from linked account)
  deadline: string;         // YYYY-MM-DD
  accountId?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Net Worth Snapshot ──────────────────────────────────────────────────
export interface NetWorthSnapshot {
  id: string;
  date: string;             // YYYY-MM
  amount: number;           // cents
  assets: number;
  liabilities: number;
}

// ─── Bill Split Entry ────────────────────────────────────────────────────
export interface SplitEntry {
  id: string;
  person: string;
  amount: number;           // cents — positive = they owe you, negative = you owe them
  description: string;
  date: string;
  isSettled: boolean;
  createdAt: string;
}
