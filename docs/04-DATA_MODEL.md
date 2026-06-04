# Cocoa Budget — Data Model

## Overview

All v1 data lives in local storage (AsyncStorage) and is seeded from mock data on first launch. The model is designed for a clean 1:1 migration to Supabase in v2 — UUIDs everywhere, timestamps in ISO 8601, relational references by ID.

---

## Entities

### 1. Account

Represents any financial account the user holds.

```typescript
type AccountType =
  | 'checking'
  | 'savings'
  | 'credit'
  | 'cash'
  | 'digital'    // PayPal, Venmo, CashApp
  | 'loan'
  | 'investment';

interface Account {
  id: string;                  // UUID
  name: string;                // "Chase Checking", "Amex Gold"
  type: AccountType;
  color: string;               // hex — from design system account palette
  icon: string;                // Ionicons name (optional override)
  currency: string;            // ISO 4217, default "USD"
  balance: number;             // Current balance in cents (integer)
  
  // Credit card fields (type === 'credit')
  creditLimit?: number;        // In cents
  
  // Loan fields (type === 'loan')
  principalAmount?: number;    // Original loan amount in cents
  interestRate?: number;       // Annual rate, e.g. 0.0425 for 4.25%
  monthlyPayment?: number;     // In cents
  
  // Investment fields (type === 'investment')
  costBasis?: number;          // Amount invested in cents
  
  isArchived: boolean;         // Soft delete
  displayOrder: number;        // For drag-to-reorder
  createdAt: string;           // ISO 8601
  updatedAt: string;
}
```

**Computed (in-memory, not stored):**
- `availableCredit = creditLimit - Math.abs(balance)` (credit accounts)
- `equity = balance - principalAmount` (loan accounts, negative = owed)

---

### 2. Category

Spending or income classification for transactions.

```typescript
type CategoryType = 'expense' | 'income';

interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;                // Ionicons name
  color: string;               // hex
  isSystem: boolean;           // true = shipped with app, cannot delete
  isArchived: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

---

### 3. Transaction

A single financial event — income, expense, or one leg of a transfer.

```typescript
type TransactionType = 'expense' | 'income' | 'transfer';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;              // Always positive, in cents
  
  accountId: string;           // FK → Account.id
  categoryId: string;          // FK → Category.id
  
  // Transfer-specific
  transferToAccountId?: string;   // FK → Account.id (destination for transfers)
  transferPairId?: string;        // Links the two legs of a transfer together
  
  payee: string;               // Merchant name / description
  note: string;                // Optional personal note
  
  date: string;                // ISO 8601 date (YYYY-MM-DD)
  
  // Recurring link
  subscriptionId?: string;     // FK → Subscription.id (if auto-logged)
  
  isDeleted: boolean;          // Soft delete
  createdAt: string;
  updatedAt: string;
}
```

**Notes on amount sign convention:**
- Amounts are always stored as positive integers (cents)
- The `type` field carries the sign semantics
- For transfers: two Transaction records are created — one expense on the source account, one income on the destination account, both linked by `transferPairId`
- Account `balance` is recomputed by summing all non-deleted transactions for that account

---

### 4. Subscription

A recurring bill or service.

```typescript
type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

interface Subscription {
  id: string;
  name: string;                // "Netflix", "Spotify"
  icon: string;                // Ionicons name or logo URL (v2)
  color: string;               // Brand color for the service
  
  amount: number;              // In cents, per billing cycle
  billingCycle: BillingCycle;
  nextBillingDate: string;     // ISO 8601 date (YYYY-MM-DD)
  
  accountId: string;           // FK → Account.id (charged to)
  categoryId: string;          // FK → Category.id (default: "Subscriptions")
  
  status: SubscriptionStatus;
  note: string;
  
  autoLogTransaction: boolean; // Whether to auto-create a transaction on billing date
  
  createdAt: string;
  updatedAt: string;
}
```

**Computed:**
- `monthlyEquivalent`: convert any cycle to monthly cost
  - weekly × 4.33, quarterly ÷ 3, yearly ÷ 12
- `yearlyEquivalent`: monthly × 12 equivalent

---

### 5. Budget

Monthly spending limit for a category.

```typescript
interface Budget {
  id: string;
  categoryId: string;          // FK → Category.id (unique per month+category)
  month: string;               // "YYYY-MM" format, e.g. "2026-05"
  limitAmount: number;         // In cents
  rollover: boolean;           // Carry unused budget to next month
  createdAt: string;
  updatedAt: string;
}
```

**Computed:**
- `spent`: sum of transactions for this category in this month
- `remaining = limitAmount - spent`
- `percentUsed = spent / limitAmount`
- `status`: `'under'` | `'warning'` (>80%) | `'over'` (>100%)

---

### 6. AppSettings

User preferences stored as a single document.

```typescript
interface AppSettings {
  // Display
  currency: string;            // ISO 4217, default "USD"
  currencySymbol: string;      // "$"
  dateFormat: string;          // "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
  theme: 'light' | 'dark' | 'system';
  
  // Security
  lockEnabled: boolean;
  lockMethod: 'pin' | 'biometric' | 'both';
  pinHash: string;             // Hashed PIN (bcrypt or SHA-256)
  lockTimeout: 0 | 60 | 300 | -1;  // seconds; -1 = never
  
  // Notifications (v1.5)
  subscriptionReminders: boolean;
  budgetAlerts: boolean;
  reminderDaysBefore: number;  // default 3
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  
  updatedAt: string;
}
```

---

## Relationships Diagram

```
AppSettings (singleton)

Account ──────────────────────────── Transaction (many)
    │                                      │
    │                                  Category (one)
    │                                      │
    └──── Subscription (many) ─────────────┘
                │
            Category (one)
                │
            Budget ──── Category (one)
```

---

## Storage Strategy (v1)

```typescript
// AsyncStorage keys
const STORAGE_KEYS = {
  ACCOUNTS:      '@cocoa/accounts',
  CATEGORIES:    '@cocoa/categories',
  TRANSACTIONS:  '@cocoa/transactions',
  SUBSCRIPTIONS: '@cocoa/subscriptions',
  BUDGETS:       '@cocoa/budgets',
  SETTINGS:      '@cocoa/settings',
  SEED_VERSION:  '@cocoa/seed_version',
};
```

- Each collection stored as JSON array
- On app launch: check `SEED_VERSION`. If absent or outdated, seed mock data.
- All mutations go through a repository layer (never direct AsyncStorage calls from components)
- Mutations always update `updatedAt` timestamp

---

## Mock Data Seed Plan

### Accounts (7)
1. Chase Checking — checking — $3,842.50
2. Chase Savings — savings — $12,500.00
3. Amex Gold — credit — -$1,240.00 (limit $10,000)
4. Cash Wallet — cash — $180.00
5. PayPal — digital — $340.00
6. Student Loan — loan — -$18,500.00 (rate 4.5%, payment $210/mo)
7. Robinhood — investment — $8,750.00 (basis $6,500)

**Net Worth = $3,842.50 + $12,500 + (−$1,240) + $180 + $340 + (−$18,500) + $8,750 = $5,872.50**

### Transactions
- 30 transactions across last 60 days
- Mix of all categories, all accounts
- 3 transfers (checking → savings, checking → PayPal)
- Realistic merchant names and amounts

### Subscriptions (8)
Netflix $15.99/mo, Spotify $9.99/mo, iCloud $2.99/mo, Disney+ $10.99/mo, Hulu $17.99/mo, Adobe CC $54.99/mo, Gym $29.99/mo, Amazon Prime $14.99/mo

### Budgets
12 category budgets for current month, each ~70% spent on seed day

---

## v2 Migration Notes (Supabase)

- Replace AsyncStorage repositories with Supabase client calls
- Add `userId: string` FK to all entities
- Enable Row Level Security on all tables (user sees only their rows)
- Keep the same TypeScript interfaces — only the persistence layer changes
- Sync strategy: optimistic local updates, background sync
