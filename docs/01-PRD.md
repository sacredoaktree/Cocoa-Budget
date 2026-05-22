# Cocoa Budget — Product Requirements Document

## 1. Vision

Cocoa Budget is a premium personal finance tracker for iOS-first mobile users who want clarity and control over their money without the complexity of enterprise tools. The experience should feel like a well-crafted lifestyle app — calm, beautiful, and fast.

---

## 2. Goals

| Goal | Metric |
|------|--------|
| Help users see their full financial picture at a glance | All accounts + net worth visible on Home in < 2 seconds |
| Reduce friction to log a transaction | New transaction in ≤ 3 taps |
| Surface spending patterns automatically | Monthly insights without manual input |
| Build trust through privacy | Biometric lock before any sensitive data is shown |

---

## 3. Target Users

- **Primary:** Individuals aged 22–40 managing personal finances across 2–6 accounts
- **Secondary:** Couples sharing household budgets
- **Not targeted (v1):** Business accounting, tax preparation, multi-currency portfolios

---

## 4. Feature Scope

### 4.1 Account Management
- Create and manage multiple accounts: Checking, Savings, Credit Card, Cash, PayPal/Venmo, Loan, Investment
- Each account has: name, type, icon, color label, currency, balance
- Credit accounts track limit + current balance → available credit computed automatically
- Loan accounts track principal, interest rate, monthly payment
- Investment accounts show current value (manually updated in v1)
- Manual balance correction at any time

### 4.2 Transactions
- Log income and expense transactions
- Fields: amount, account, category, date, note, merchant/payee, receipt photo (v2)
- Quick-add from Home screen floating action button
- Transfer between accounts (debit one, credit another atomically)
- Edit and delete transactions
- Search and filter by date range, category, account, amount range

### 4.3 Categories
- Predefined expense categories: Housing, Food & Dining, Transport, Shopping, Entertainment, Health, Education, Travel, Subscriptions, Personal Care, Gifts, Fees & Charges, Other
- Predefined income categories: Salary, Freelance, Investment Returns, Gift, Refund, Other
- Custom categories with icon + color (v1.5)
- Each category can have a monthly budget limit

### 4.4 Recurring Subscriptions
- Dedicated subscription tracker separate from general expenses
- Fields: name, logo/icon, amount, billing cycle (weekly/monthly/yearly), next billing date, linked account, category, status (active/paused/cancelled)
- Monthly and yearly cost totals computed automatically
- Upcoming renewals shown in a timeline view
- Push notification 3 days before renewal (v1.5)

### 4.5 Budgets
- Monthly budget limits per category
- Visual progress bars (spent / limit)
- Over-budget alerts
- Budget rollover option (unused budget carries to next month)
- Total monthly budget vs. actual spend summary

### 4.6 Analytics & Charts
- Monthly spending by category (donut chart)
- Income vs. expense bar chart (last 6 months)
- Spending trend line chart (daily spend over current month)
- Top spending categories ranked list
- Net worth trend over time (manual data points initially)
- Per-account spend breakdown

### 4.7 Home / Dashboard
- Net worth headline (total assets minus liabilities)
- Account cards carousel (swipeable, balance visible)
- Period selector (This Week / This Month / Last Month / Custom)
- Income vs. Expense summary for selected period
- Recent transactions list (last 5)
- Upcoming subscription renewals (next 7 days)
- Quick action buttons: Add Transaction, Transfer, Add Subscription

### 4.8 Settings & Privacy
- App lock: PIN (4/6 digit) or biometric (Face ID / Touch ID)
- Lock timeout: Immediately / After 1 min / After 5 min / Never
- Currency display preference
- Date format preference
- Theme: Light / Dark / System
- Notification preferences
- Data export: CSV (v1.5)
- About, Privacy Policy, Terms

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| App startup (cold) | < 1.5s to Home |
| Transaction save | < 300ms |
| Offline support | Full read/write; sync when online (v2 with Supabase) |
| Data storage (v1) | AsyncStorage + local mock data |
| Accessibility | AA contrast on all text, minimum 44pt tap targets |
| Platforms | iOS 15+, Android 12+ (Expo managed workflow) |

---

## 6. Out of Scope for v1

- Bank API / Plaid integration
- Receipt scanning / OCR
- Tax reports
- Multi-currency conversion
- Shared/joint accounts
- Web companion
- AI spending advice
