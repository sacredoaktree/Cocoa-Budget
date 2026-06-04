# Cocoa Budget — Recommended Development Order

## Principles

- **Vertical slices:** Build one screen end-to-end (UI + data) before moving to the next
- **Design system first:** The token/component layer unblocks everything else
- **Mock data throughout v1:** No backend work until all screens are feature-complete
- **Ship each phase independently:** Each phase produces something demo-able

---

## Phase 0 — Project Bootstrap (Day 1)
*Goal: Clean Expo project running on device with routing skeleton*

1. `npx create-expo-app cocoa-budget --template blank-typescript`
2. Install core dependencies:
   - `expo-router` (file-based navigation)
   - `@expo/vector-icons`
   - `react-native-reanimated`
   - `react-native-gesture-handler`
   - `@gorhom/bottom-sheet`
   - `victory-native` (charts)
   - `@react-native-async-storage/async-storage`
   - `expo-local-authentication` (biometrics)
   - `expo-haptics`
   - `react-native-safe-area-context`
   - `date-fns` (date formatting)
   - `zustand` (state management)
3. Set up folder structure:
   ```
   src/
     theme/          ← design tokens
     components/     ← shared UI components
     screens/        ← screen components
     store/          ← zustand stores
     data/           ← mock data + repositories
     utils/          ← helpers (currency formatting, date utils)
     hooks/          ← custom hooks
   app/              ← expo-router file routes
   ```
4. Configure `app.json`: name, icon placeholder, splash screen
5. Set up TypeScript strict mode, ESLint, Prettier

**Exit criteria:** App runs on simulator, shows placeholder tab bar with 5 tabs

---

## Phase 1 — Design System & Theme (Days 2–3)
*Goal: Every color, spacing, and component token is in code*

1. `src/theme/colors.ts` — all color tokens for light + dark
2. `src/theme/typography.ts` — all type scale definitions
3. `src/theme/spacing.ts` — spacing tokens
4. `src/theme/radius.ts` — border radius tokens
5. `src/theme/shadows.ts` — elevation definitions
6. `src/theme/index.ts` — unified theme export + `ThemeProvider`
7. `useTheme()` hook consuming context
8. Base components:
   - `<Card>` — surface container with shadow
   - `<Text>` — typed variant prop maps to type scale
   - `<Button>` — primary / secondary / ghost variants
   - `<Chip>` — selectable pill
   - `<Badge>` — category icon circle
   - `<Divider>`
   - `<AmountText>` — formats currency with sign coloring
9. Theme toggle wired to system `useColorScheme`
10. Storybook-style test screen listing all components (dev only, remove before ship)

**Exit criteria:** All design tokens in code; base components render correctly in light + dark

---

## Phase 2 — Data Layer (Days 4–5)
*Goal: All data types, mock seed, and repository layer in place*

1. TypeScript interfaces for all 6 entities (from data model doc)
2. Mock data file: `src/data/mockSeed.ts` — 7 accounts, 8 subscriptions, 30 transactions, 12 budgets
3. Repository modules (one per entity):
   - `accountRepository.ts` — getAll, getById, create, update, archive
   - `transactionRepository.ts` — getAll, getByAccount, getByDateRange, create, update, softDelete
   - `categoryRepository.ts` — getAll, getByType, create, update
   - `subscriptionRepository.ts` — getAll, getActive, getUpcoming(days), create, update
   - `budgetRepository.ts` — getByMonth, upsert, getWithSpent(month)
   - `settingsRepository.ts` — get, update
4. Seed runner: checks `SEED_VERSION`, writes mock data on first launch
5. Zustand stores:
   - `useAccountStore` — accounts array, selected account, CRUD actions
   - `useTransactionStore` — transactions, filters, CRUD actions
   - `useSubscriptionStore` — subscriptions, CRUD actions
   - `useBudgetStore` — budgets + computed spent values
   - `useSettingsStore` — settings singleton
6. Computed selectors:
   - `netWorth()` — sum all account balances
   - `monthlyIncome(month)` / `monthlyExpense(month)`
   - `spendByCategory(month)` → `{ categoryId, amount }[]`
   - `upcomingRenewals(days)` → sorted subscriptions

**Exit criteria:** All stores populated from mock data; computed values log correctly in console

---

## Phase 3 — Lock Screen (Day 6)
*Goal: Security gate that feels polished*

1. Lock screen layout (logo, PIN dots, numpad)
2. PIN entry logic with 6-dot indicator animation (Reanimated)
3. `expo-local-authentication` biometric prompt
4. Auto-prompt biometric on screen appear
5. "Use PIN instead" / "Use Face ID instead" toggle
6. Wrong PIN shake animation + haptic
7. Connect to `useSettingsStore` (lock enabled, method, PIN hash)
8. Route guard: if lock enabled and app inactive > timeout → show lock screen

**Exit criteria:** Lock screen blocks app, biometric + PIN both work

---

## Phase 4 — Home Dashboard (Days 7–9)
*Goal: The hero screen — most used, must be impressive*

1. Tab bar shell with 5 tabs (icons, no labels except More)
2. Home screen layout scaffold
3. Header: greeting text + notification bell icon
4. Net Worth hero card — large number, trend badge vs last month
5. Period selector chip row (Week / Month / Last Month)
6. Account cards carousel:
   - `<AccountCard>` component with gradient, balance, type
   - Horizontal FlatList, snap to card
7. Income vs Expense stat boxes
8. Recent Transactions section (last 5, using `<TransactionRow>`)
9. Upcoming Subscriptions horizontal scroll row
10. FAB button (non-functional expand for now, just visual)
11. Pull-to-refresh (re-reads stores)

**Exit criteria:** Home screen shows live mock data, scrolls smoothly, looks premium

---

## Phase 5 — Accounts (Days 10–11)
*Goal: Full account management*

1. Account list screen (under More tab)
2. `<AccountCard>` full variant (list item, not carousel)
3. Add Account bottom sheet:
   - Type selector (icon grid)
   - Name, currency, opening balance inputs
   - Color picker (account palette)
   - Conditional fields (limit for credit, rate for loan)
4. Edit Account sheet (same form, pre-filled)
5. Archive account (swipe left action)
6. Account Detail screen:
   - Hero card (full-width, color-matched)
   - Balance + available credit display
   - Month income/expense stats
   - Transaction list filtered to account (reuses TransactionList component)
7. Balance correction: tap balance → edit field → save (creates adjustment transaction)
8. Navigation: Home carousel card → Account Detail

**Exit criteria:** Can create, view, edit, and archive accounts; balance updates reflect in Home

---

## Phase 6 — Transactions (Days 12–14)
*Goal: The most-used daily workflow*

1. Transaction List screen (Transactions tab):
   - Grouped by date (Today / Yesterday / date)
   - `<TransactionRow>` component
   - Swipe left: delete (confirm) / Swipe right: edit
2. Add Transaction bottom sheet (FAB expands here):
   - Expense / Income / Transfer toggle
   - Amount input with large numeric pad
   - Payee field
   - Category picker (icon grid, filterable)
   - Account picker (list with balances)
   - Date picker
   - Note field
   - Save → updates store → updates account balance
3. Transfer flow:
   - Source account → destination account → amount
   - Creates two linked transactions
4. Edit Transaction (reuses Add form, pre-filled)
5. Transaction Detail screen (tap a row)
6. Search bar + Filter sheet:
   - Date range
   - Category multi-select
   - Account multi-select
   - Type (income / expense / transfer)
   - Amount range

**Exit criteria:** Full transaction CRUD works; FAB flow takes < 3 taps to log an expense

---

## Phase 7 — Budgets (Days 15–16)
*Goal: Awareness tool that drives behavior change*

1. Budget overview screen (under More):
   - Total budget bar (all categories combined)
   - Category budget list with progress bars
   - Over-budget cards highlighted in red
2. Edit budget per category:
   - Tap card → inline amount editor sheet
   - Rollover toggle
3. Month selector (navigate to previous months, read-only)
4. Budget status badge on category list items
5. Home screen: add "Budget Status" peek (most over-budget category)

**Exit criteria:** Budgets show with accurate progress from mock transaction data

---

## Phase 8 — Subscriptions (Days 17–18)
*Goal: Subscription graveyard eliminator*

1. Subscription list screen:
   - Summary header (monthly + yearly total)
   - Upcoming renewals timeline (next 30 days)
   - Active / Paused / Cancelled sections
   - `<SubscriptionRow>` component
2. Add Subscription sheet:
   - Name, amount, billing cycle
   - Next billing date picker
   - Account + category pickers
   - Status toggle
3. Subscription Detail screen
4. Edit Subscription sheet
5. Swipe actions: Pause / Cancel (status change)
6. Home screen upcoming renewals row — now fully wired

**Exit criteria:** All 8 mock subscriptions displayed correctly; can add/edit/pause/cancel

---

## Phase 9 — Analytics (Days 19–21)
*Goal: The "wow" screen — makes data beautiful*

1. Analytics screen layout
2. Period / month selector
3. Summary stat row (in / out / net for period)
4. Donut chart (Victory Native):
   - Category spending breakdown
   - Center: total spend
   - Animated on mount
5. Category ranked list below donut (tap → drill-down)
6. Category drill-down screen:
   - Period bar chart (daily spend in month)
   - Transaction list for that category
7. Bar chart: Income vs Expense (6 months)
8. Trend line: daily cumulative spend (current month)
9. Per-account breakdown tab

**Exit criteria:** All charts animate correctly; data reflects mock transactions

---

## Phase 10 — Settings (Day 22)
*Goal: Complete the app shell*

1. Settings screen layout
2. Theme picker (Light / Dark / System) — live preview
3. Currency selector
4. Date format selector
5. App lock setup flow:
   - Enable/disable toggle
   - PIN setup (enter + confirm)
   - Biometric toggle
   - Timeout picker
6. Data section: "Clear All Data" with confirmation
7. About section: version string, placeholder links

**Exit criteria:** Theme switches live; lock settings persist across restarts

---

## Phase 11 — Polish & QA (Days 23–25)
*Goal: Ship-quality finish*

1. Audit every screen in light + dark mode
2. Verify all animations feel right (tune spring values)
3. Haptic feedback audit: success, error, destructive actions
4. Empty states: every list has a beautiful empty state illustration/message
5. Loading states: skeleton screens where data is async
6. Error boundaries on each tab
7. Accessibility pass: VoiceOver labels on all interactive elements
8. Performance: check for unnecessary re-renders (React DevTools)
9. iOS safe area audit: notch, home indicator, dynamic island
10. Splash screen and app icon final design
11. Final mock data review: numbers should tell a coherent story

---

## Dependency Graph (simplified)

```
Phase 0 (Bootstrap)
    └── Phase 1 (Design System)
            └── Phase 2 (Data Layer)
                    ├── Phase 3 (Lock Screen)    [independent]
                    ├── Phase 4 (Home)
                    │       └── Phase 5 (Accounts)
                    │               └── Phase 6 (Transactions)  ← most important
                    │                       ├── Phase 7 (Budgets)
                    │                       └── Phase 8 (Subscriptions)
                    └── Phase 9 (Analytics)  [needs Phase 6 done]
                            └── Phase 10 (Settings)
                                    └── Phase 11 (Polish)
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Navigation | Expo Router (file-based) | Best-in-class Expo DX; easy deep links later |
| State | Zustand | Minimal boilerplate; no provider nesting |
| Charts | Victory Native | Expo-compatible; good animation support |
| Bottom sheets | @gorhom/bottom-sheet | Smooth gesture integration |
| Animation | react-native-reanimated v3 | Required by gesture handler; best perf |
| Date handling | date-fns | Tree-shakeable; no moment.js bloat |
| Storage | AsyncStorage | Simple key-value; swap to Supabase later |
| Biometrics | expo-local-authentication | Managed workflow compatible |
| Icons | @expo/vector-icons Ionicons | Bundled with Expo; no config needed |

---

## Estimated Timeline

| Phase | Work Days |
|-------|-----------|
| 0 Bootstrap | 1 |
| 1 Design System | 2 |
| 2 Data Layer | 2 |
| 3 Lock Screen | 1 |
| 4 Home | 3 |
| 5 Accounts | 2 |
| 6 Transactions | 3 |
| 7 Budgets | 2 |
| 8 Subscriptions | 2 |
| 9 Analytics | 3 |
| 10 Settings | 1 |
| 11 Polish | 3 |
| **Total** | **~25 days** |

This assumes 1 developer working full-time. Part-time or with design iteration, budget 6–8 weeks.
