# Cocoa Budget — Feature Roadmap (v1.5 additions)

## Confirmed features to build (no external subscriptions or APIs required)

All features below work fully offline with local data. No third-party API keys needed.

---

## 1. Net Worth Timeline

**What:** A line chart on the Accounts screen showing how net worth has grown month-by-month.

**How it works:**
- Store a `NetWorthSnapshot { id, date, amount }` record at the end of each month (or whenever user opens the app in a new month)
- Render last 12 snapshots as a line chart
- Show percentage change vs. previous month

**Data addition:**
```typescript
interface NetWorthSnapshot {
  id: string;
  date: string;       // YYYY-MM
  amount: number;     // cents
  assets: number;
  liabilities: number;
}
```

**Complexity:** Low. Purely local computation.

---

## 2. Debt Payoff Planner

**What:** For any Loan account, show a payoff calculator with snowball and avalanche strategies.

**How it works:**
- User inputs current balance, interest rate, monthly payment
- App computes: months to payoff, total interest paid, payoff date
- Shows a simple amortization table (month-by-month)
- No external API — pure math

**Accessible from:** Account Detail screen for `type === 'loan'`

**Complexity:** Low-Medium. Standard financial math.

---

## 3. Subscription Audit

**What:** A dedicated "Subscription Audit" view showing cost analysis and waste detection.

**Features:**
- Annual cost total across all active subscriptions
- "You're spending X/year on subscriptions" headline
- List sorted by cost (highest first)
- "Unused" tag on subscriptions not logged as a transaction in the last 60 days
- Quick-cancel flow: changes status to 'cancelled' in store

**Accessible from:** Subscriptions section in Settings (or its own tab later)

**Complexity:** Low. All data is already in the subscription store.

---

## 4. Savings Goals

**What:** Create savings goals with a target amount, deadline, and linked account.

**Data model:**
```typescript
interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;       // cents
  currentAmount: number;      // derived from linked account balance or manual
  deadline: string;           // YYYY-MM-DD
  accountId?: string;         // optional link to a savings account
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Features:**
- Goal card with circular progress ring
- "Monthly required" computed: `(target - current) / monthsLeft`
- Confetti animation on completion
- No external dependency

**Complexity:** Low-Medium.

---

## 5. Bill Splitting (Lend/Borrow Tracker)

**What:** Simple "who owes who" ledger — track money lent or borrowed from people.

**Data model:**
```typescript
interface SplitEntry {
  id: string;
  person: string;             // name or contact
  amount: number;             // cents (positive = they owe you, negative = you owe them)
  description: string;
  date: string;
  isSettled: boolean;
  createdAt: string;
}
```

**Features:**
- List of people with net balance (green = owe you, red = you owe)
- Per-person history of entries
- "Mark Settled" button
- No app integration needed — completely manual

**Complexity:** Low.

---

## 6. One-Tap Recurring Log

**What:** From the Subscriptions list, a single tap logs the subscription as a transaction without opening the full form.

**How it works:**
- Long-press or swipe-right on a subscription row reveals "Log Now" action
- Creates a transaction: `amount = sub.amount`, `accountId = sub.accountId`, `categoryId = sub.categoryId`, `date = today`, `payee = sub.name`
- Updates account balance immediately
- Shows a toast/snackbar confirmation

**Complexity:** Very low. Reuses existing store actions.

---

## 7. Privacy Mode (Balance Blur)

**What:** One tap blurs all currency amounts across the whole app. Useful in public.

**How it works:**
- Global boolean `privacyMode` in `useSettingsStore`
- `AmountText` component checks this flag: if true, renders `"••••"` instead of the amount
- Toggle button in the Home header and Account screen header
- Persisted to AsyncStorage

**Complexity:** Very low. Single boolean + component guard.

---

## 8. Weekly Digest (In-app only, no push)

**What:** A summary card that appears on the Home screen every Monday showing last week's stats.

**Features:**
- "Last week: you spent X across Y categories"
- Top spending category
- Comparison vs. the week before (↑ more / ↓ less)
- Dismissable card (stored in settings as `lastDigestDismissedWeek`)

**No push notifications needed** — purely computed on app open.

**Complexity:** Low.

---

## 9. Multi-Language Support

**Library:** `i18next` + `react-i18next` (no external subscription)

**Supported languages (v1.5):**
| Code | Language |
|------|----------|
| `en` | English (default) |
| `fil` | Filipino / Tagalog |
| `es` | Spanish |
| `ja` | Japanese |
| `zh` | Chinese Simplified |
| `fr` | French |
| `de` | German |
| `ar` | Arabic |

**Implementation:**
- All UI strings moved to `src/i18n/locales/{lang}.json`
- `useTranslation()` hook replaces all hardcoded strings
- Language auto-detected from device locale, overridable in Settings
- RTL support for Arabic via `I18nManager.forceRTL`

**Complexity:** Medium. Tedious but straightforward.

---

## 10. Multi-Currency Support

**No external exchange rate API required** — manual rates only in v1.5.

**How it works:**
- Each account has its own `currency` (already in data model)
- User sets a **base currency** in Settings (e.g. PHP)
- Manual exchange rates stored locally: `ExchangeRate { from, to, rate, updatedAt }`
- Net Worth, Home totals, and Budget all convert to base currency using stored rates
- User updates rates manually from Settings > Base Currency

**Data addition:**
```typescript
interface ExchangeRate {
  id: string;
  fromCurrency: string;   // e.g. "USD"
  toCurrency: string;     // e.g. "PHP"
  rate: number;           // e.g. 56.5
  updatedAt: string;
}
```

**Supported currencies (v1.5):**
PHP, USD, EUR, GBP, JPY, SGD, AUD, CAD, HKD, CNY, KRW, THB, MYR, IDR, VND, INR, AED, SAR, CHF, NZD

**Complexity:** Medium. Math is simple; the work is wiring it everywhere amounts display.

---

## What we are NOT adding (to keep it simple)

| Feature | Reason excluded |
|---------|----------------|
| Bank API / Plaid | Requires paid subscription + legal complexity |
| Crypto wallet connect | Requires API keys per blockchain |
| Push notifications | Requires device permissions + backend |
| Receipt OCR | Requires ML/AI API |
| Cloud sync | Supabase — planned for v2 |
| Tax reports | Out of scope |
| AI spending advice | Requires LLM API cost |

---

## Build order for v1.5 features

1. **Privacy Mode** — 1 day, touches only `AmountText` + settings
2. **Multi-Currency** — 3 days, foundational for all amount display
3. **Multi-Language** — 4 days, affects every screen string
4. **One-Tap Recurring Log** — 1 day, small UI addition
5. **Savings Goals** — 3 days, new screen + data model
6. **Net Worth Timeline** — 2 days, new chart + snapshot store
7. **Bill Splitting** — 2 days, new screen + data model
8. **Debt Payoff Planner** — 2 days, math + UI on Account Detail
9. **Subscription Audit** — 2 days, new view in Subscriptions
10. **Weekly Digest** — 1 day, computed card on Home

**Total v1.5 estimate: ~21 working days**
