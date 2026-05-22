# Cocoa Budget — Design System

## 1. Brand Identity

**Name:** Cocoa Budget  
**Tagline:** Track wisely  
**Personality:** Warm, premium, trustworthy, calm  
**Aesthetic:** iOS-native feel with a rich chocolate-and-gold palette — clean surfaces, soft shadows, generous whitespace

---

## 2. Color Palette

### Brand Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `brand.primary` | `#3D2B1F` | `#C8956A` | Primary actions, key numbers |
| `brand.accent` | `#C8956A` | `#E8B98A` | Highlights, icons, FAB |
| `brand.gold` | `#D4AF37` | `#E8CC6A` | Investment account, premium badge |

### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `semantic.income` | `#2E9E6B` | `#4DC88A` | Income amounts |
| `semantic.expense` | `#D94F3D` | `#F07060` | Expense amounts |
| `semantic.warning` | `#E88C2A` | `#F5A84A` | Budget warnings, upcoming bills |
| `semantic.info` | `#4A7FD4` | `#7AAEF0` | Informational states |

### Surface Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `surface.background` | `#F7F4F1` | `#1A1410` | App background |
| `surface.card` | `#FFFFFF` | `#2A2018` | Card backgrounds |
| `surface.elevated` | `#FFFFFF` | `#342A1E` | Modals, sheets |
| `surface.input` | `#F0EDE9` | `#201810` | Input field fills |
| `surface.divider` | `#E8E4DF` | `#3A3028` | Separators |

### Text Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `text.primary` | `#1A1008` | `#F0EAE0` | Headlines, body |
| `text.secondary` | `#7A6858` | `#A8957A` | Subtitles, labels |
| `text.tertiary` | `#B0A090` | `#6A5A48` | Placeholders, hints |
| `text.inverse` | `#FFFFFF` | `#1A1008` | Text on dark backgrounds |

### Account Type Colors (used on cards + category dots)

| Account Type | Color | Token |
|-------------|-------|-------|
| Checking | `#4A90D9` | `account.checking` |
| Savings | `#2E9E6B` | `account.savings` |
| Credit Card | `#D94F3D` | `account.credit` |
| Cash | `#D4AF37` | `account.cash` |
| PayPal / Digital | `#253B80` | `account.digital` |
| Loan | `#8B5CF6` | `account.loan` |
| Investment | `#C8956A` | `account.investment` |

---

## 3. Typography

**Font Family:** SF Pro (system default iOS) / Roboto (Android system default)  
Use `fontFamily: 'System'` — no custom fonts to keep bundle small in v1

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `type.displayLarge` | 40sp | 700 | 48 | Net worth hero number |
| `type.displayMedium` | 32sp | 700 | 40 | Account balance |
| `type.headline1` | 24sp | 700 | 32 | Screen titles |
| `type.headline2` | 20sp | 600 | 28 | Section headers |
| `type.headline3` | 17sp | 600 | 24 | Card titles |
| `type.body1` | 16sp | 400 | 24 | Body text, list items |
| `type.body2` | 14sp | 400 | 20 | Secondary body, labels |
| `type.caption` | 12sp | 400 | 16 | Timestamps, hints |
| `type.overline` | 11sp | 600 | 16 | Section overlines (uppercase + tracked) |
| `type.amount` | 22sp | 700 | 28 | Transaction amounts |
| `type.amountSmall` | 16sp | 600 | 22 | Small amounts in lists |

### Amount Formatting Rules
- Always include currency symbol prefix: `$1,234.56`
- Income: prefix with `+`, color `semantic.income`
- Expense: prefix with `−` (minus, not hyphen), color `semantic.expense`
- Zero: neutral color, no prefix
- Large numbers: `$1.2K`, `$34.5K` in compact display contexts

---

## 4. Spacing System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `space.xs` | 4px | Icon padding, micro gaps |
| `space.sm` | 8px | Inner element gaps |
| `space.md` | 12px | Component internal padding |
| `space.lg` | 16px | Standard horizontal page margin |
| `space.xl` | 20px | Card internal padding |
| `space.2xl` | 24px | Between sections |
| `space.3xl` | 32px | Large section separation |
| `space.4xl` | 48px | Screen-level breathing room |

**Page margins:** 16px left/right on all screens  
**Card internal padding:** 20px horizontal, 16px vertical  
**List item height (minimum):** 64px

---

## 5. Elevation & Shadows

| Level | Shadow | Usage |
|-------|--------|-------|
| `elevation.none` | none | Background elements |
| `elevation.card` | `0 2px 8px rgba(0,0,0,0.08)` | Standard cards |
| `elevation.raised` | `0 4px 16px rgba(0,0,0,0.12)` | Active / focused cards |
| `elevation.modal` | `0 8px 32px rgba(0,0,0,0.20)` | Bottom sheets, modals |
| `elevation.fab` | `0 6px 20px rgba(200,149,106,0.40)` | FAB button (accent-tinted) |

Dark mode: replace rgba black with rgba white at ~0.5× opacity

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius.xs` | 4px | Chips, small badges |
| `radius.sm` | 8px | Input fields, small cards |
| `radius.md` | 12px | Standard cards |
| `radius.lg` | 16px | Large cards, account cards |
| `radius.xl` | 20px | Bottom sheets top corners |
| `radius.full` | 999px | Pills, FAB, avatars |

---

## 7. Iconography

**Library:** `@expo/vector-icons` → `Ionicons` for all UI icons  
**Size system:**

| Context | Size |
|---------|------|
| Tab bar | 24px |
| List item leading | 20px |
| Button leading | 18px |
| Category badge | 16px |
| Micro indicator | 14px |

**Category icon mapping:**

| Category | Ionicons name |
|----------|--------------|
| Housing | `home-outline` |
| Food & Dining | `restaurant-outline` |
| Transport | `car-outline` |
| Shopping | `bag-outline` |
| Entertainment | `film-outline` |
| Health | `heart-outline` |
| Education | `school-outline` |
| Travel | `airplane-outline` |
| Subscriptions | `repeat-outline` |
| Personal Care | `cut-outline` |
| Gifts | `gift-outline` |
| Fees & Charges | `card-outline` |
| Salary | `briefcase-outline` |
| Freelance | `laptop-outline` |
| Investment Returns | `trending-up-outline` |
| Refund | `refresh-outline` |
| Other | `ellipsis-horizontal-outline` |

---

## 8. Component Library

### AccountCard
- Width: 200px (carousel item)
- Height: 120px
- Full-bleed gradient background using account type color
- White text
- Shows: account name, type label, balance (large), last 4 digits if credit

### TransactionRow
- Height: 64px min
- Leading: 40px icon circle (category color + icon)
- Title + subtitle (account chip)
- Trailing: amount (colored) + timestamp
- Swipe gestures: left (delete, red), right (edit, blue)

### CategoryBadge
- 40px circle
- Account/category color fill, white icon
- Used in lists and pickers

### ProgressBar
- Height: 6px
- Track: `surface.divider`
- Fill: animated, colored by status (green / orange / red)
- Rounded caps

### BottomSheet / Modal
- Slides up from bottom
- Top radius: `radius.xl`
- Drag handle: 36×4px pill, `surface.divider`
- Background: `surface.elevated`

### FAB (Floating Action Button)
- 56px circle
- Color: `brand.accent`
- Shadow: `elevation.fab`
- Icon: `add` (white)
- Tap: expands to show "Expense / Income / Transfer" sub-actions

### StatBox
- Small card (48% width, side by side)
- Icon + label + large amount
- Subtle gradient or flat card

### ChipSelector
- Horizontal scrollable row
- Each chip: height 32px, `radius.full`
- Active: `brand.primary` fill, white text
- Inactive: `surface.input`, `text.secondary`

---

## 9. Motion & Animation

| Interaction | Animation |
|-------------|-----------|
| FAB expand | `spring({ damping: 15, stiffness: 150 })` |
| Modal appear | `spring({ damping: 20, stiffness: 200 })` slide from bottom |
| Tab switch | Instant (no animation) |
| Transaction add | List item slides in from right |
| Chart render | Data animates in on mount (1s ease-out) |
| Progress bar fill | Animates on screen enter (600ms ease-out) |
| Balance number | Count-up animation on first load |
| Swipe reveal | Follows finger, springs back or commits |
| Card press | Scale to 0.97, duration 100ms |

**Principle:** All spring animations. No linear tweens except charts. Respect `prefers-reduced-motion`.

---

## 10. Dark Mode Strategy

- All colors defined in both light and dark tokens
- Use `useColorScheme()` from React Native
- Wrap app in `ThemeProvider` passing the active theme
- Never hardcode color values — always reference tokens
- Test every screen in both modes before shipping

---

## 11. Accessibility

- Minimum contrast ratio 4.5:1 for body text, 3:1 for large text
- All interactive elements: minimum 44×44pt touch target
- Screen reader labels on all icon-only buttons
- Amount sign communicated semantically (not just color)
- Focus order follows visual reading order
- Haptic feedback on destructive actions and success states
