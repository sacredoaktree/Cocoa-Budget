# Cocoa Budget — Screen Map & Navigation

## Navigation Architecture

```
App Entry
│
├── Lock Screen (PIN / Biometric)          — shown on cold start or after timeout
│
└── Main App (Tab Navigator)
    │
    ├── [TAB 1] Home
    │   ├── Home Dashboard
    │   ├── Notification Centre (slide-in panel)
    │   └── Account Detail
    │       └── Account Transaction List
    │
    ├── [TAB 2] Transactions
    │   ├── Transaction List (all accounts)
    │   ├── Search & Filter Sheet
    │   └── Transaction Detail
    │
    ├── [TAB 3] + (FAB — no tab label)
    │   ├── Add Transaction (modal sheet)
    │   │   └── Category Picker (modal)
    │   │   └── Account Picker (modal)
    │   └── Add Transfer (modal sheet)
    │
    ├── [TAB 4] Analytics
    │   ├── Analytics Overview
    │   ├── Category Drill-down
    │   └── Account Drill-down
    │
    └── [TAB 5] More
        ├── More Menu
        ├── Accounts
        │   ├── Account List
        │   ├── Add Account (modal sheet)
        │   └── Edit Account (modal sheet)
        ├── Budgets
        │   ├── Budget Overview
        │   ├── Edit Category Budget (modal)
        ├── Subscriptions
        │   ├── Subscription List
        │   ├── Add Subscription (modal sheet)
        │   └── Subscription Detail
        ├── Categories
        │   ├── Category List
        │   └── Add / Edit Category (modal)
        └── Settings
            ├── Settings Root
            ├── App Lock Setup
            │   ├── PIN Setup
            │   └── Biometric Toggle
            ├── Preferences (currency, date format, theme)
            └── About
```

---

## Screen Inventory

### Lock Screen
| Element | Notes |
|---------|-------|
| App logo + name | Centered, subtle animation on load |
| Biometric prompt | Auto-triggers on appear |
| PIN fallback | 6-dot indicator + numpad |
| "Use PIN instead" link | Toggle between methods |

---

### Home Dashboard
| Element | Notes |
|---------|-------|
| Header bar | Avatar / greeting, notification bell |
| Net Worth card | Large hero number, trend vs last month |
| Period selector chips | Week / Month / Last Month / Custom |
| Account cards carousel | Horizontal scroll, card per account |
| Income vs Expense row | Two stat boxes with icons |
| Recent Transactions section | Last 5 with category icon, title, amount |
| Upcoming Renewals row | Horizontal pill scroll, next 7 days |
| FAB (Add Transaction) | Bottom right, animated expand |

---

### Account Detail
| Element | Notes |
|---------|-------|
| Account header (name, type icon, color) | Full-bleed colored card |
| Balance (current + available if credit) | Large type |
| Quick stats: income / expense this month | Two chips |
| Transaction list for this account | Grouped by date |
| Edit button | Opens Edit Account sheet |

---

### Transaction List
| Element | Notes |
|---------|-------|
| Search bar | Sticky at top |
| Filter button | Opens filter sheet (date, category, account, type) |
| Grouped list | Sections by date (Today, Yesterday, then date labels) |
| Transaction row | Category icon + color, title, account chip, amount |
| Swipe left | Delete action |
| Swipe right | Edit action |

---

### Add / Edit Transaction (Modal Sheet)
| Element | Notes |
|---------|-------|
| Type toggle | Expense / Income / Transfer |
| Amount input | Large numeric keyboard, currency prefix |
| Payee / Note field | Text input |
| Category selector | Icon grid picker |
| Account selector | Dropdown list with balances |
| Date picker | Defaults to today |
| Repeat toggle | One-time vs recurring |
| Save button | Prominent, bottom |

---

### Analytics
| Element | Notes |
|---------|-------|
| Period selector | Month picker or range |
| Summary row | Total in / out / net |
| Donut chart | Category spending breakdown |
| Category ranked list | Below donut, tap to drill down |
| Bar chart | Income vs expense last 6 months |
| Trend line | Daily spend current month |

---

### Budgets
| Element | Notes |
|---------|-------|
| Monthly total bar | Total spent vs total budget |
| Category budget cards | Icon, name, progress bar, amount |
| Over-budget highlight | Red accent on exceeded cards |
| Edit budget button | Opens inline amount editor per category |

---

### Subscriptions
| Element | Notes |
|---------|-------|
| Summary header | Monthly total / Yearly total |
| Upcoming renewals timeline | Next 30 days, sorted by date |
| All subscriptions list | Grouped: Active / Paused / Cancelled |
| Subscription row | Logo, name, amount, cycle, next date |
| Swipe left | Pause / Cancel actions |
| Add button | Top right |

---

### Subscription Detail
| Element | Notes |
|---------|-------|
| Logo + name hero | Color-matched card |
| Amount + cycle | Large display |
| Next billing date | With days-until chip |
| Linked account | Tappable chip |
| Payment history | List of past charges |
| Edit / Cancel / Pause actions | Bottom action row |

---

### Settings
| Element | Notes |
|---------|-------|
| Profile section | Avatar, display name |
| Security section | App lock toggle, biometric, PIN |
| Preferences section | Currency, date format, theme |
| Data section | Export CSV, clear data |
| About section | Version, privacy policy, terms |

---

## Transition Patterns

| Transition | Animation |
|-----------|-----------|
| Tab switch | No animation (instant) |
| Modal sheets | Slide up from bottom (spring) |
| Navigation push | Slide left (iOS native) |
| FAB expand | Scale + fade |
| Account card tap | Shared element hero expand |
| Lock screen dismiss | Fade out |
