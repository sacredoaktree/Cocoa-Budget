# Cocoa Budget — Deployment Guide

This document walks through every step required to publish Cocoa Budget as a live subscription app on the App Store and Google Play.

---

## 1. Prerequisites

| Tool | Install command | Notes |
|---|---|---|
| Node.js 18+ | [nodejs.org](https://nodejs.org) | Already required by Expo |
| pnpm | `npm install -g pnpm` | Package manager used in this project |
| EAS CLI | `npm install -g eas-cli` | Expo Application Services |
| Expo account | [expo.dev](https://expo.dev) | Free account required |
| Apple Developer account | [developer.apple.com](https://developer.apple.com) | $99/year, required for iOS |
| Google Play Developer account | [play.google.com/console](https://play.google.com/console) | $25 one-time, required for Android |

---

## 2. Supabase Setup (Already Done)

Your Supabase project is live at `https://czxrnmwntwokhcjbqvgs.supabase.co`.

The following are already configured:
- All 9 database tables with Row Level Security (RLS)
- Auto-profile creation trigger on new user sign-up
- Email/password authentication

### Enable Email Confirmation (Recommended)

1. Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/czxrnmwntwokhcjbqvgs/auth/providers)
2. Under **Email**, ensure **Confirm email** is enabled
3. Customize the email template under **Email Templates**

### Configure Redirect URLs

In Supabase → Auth → URL Configuration, add:
```
cocoabudget://auth/callback
cocoabudget://auth/reset-password
```

---

## 3. RevenueCat Setup (Subscriptions)

RevenueCat handles all in-app purchase logic across iOS and Android.

### Step 1 — Create a RevenueCat account
Go to [app.revenuecat.com](https://app.revenuecat.com) and create a free account.

### Step 2 — Create a new project
Name it "Cocoa Budget" and add both iOS and Android apps.

### Step 3 — Configure products in the stores

**Apple App Store Connect:**
1. Go to App Store Connect → Your App → Subscriptions
2. Create a Subscription Group (e.g., "Cocoa Budget Pro")
3. Add a product: `com.cocoa.budget.pro.monthly` at your chosen price
4. Add a product: `com.cocoa.budget.pro.yearly` at your chosen price

**Google Play Console:**
1. Go to Play Console → Your App → Monetization → Subscriptions
2. Create subscription products with the same IDs

### Step 4 — Add products to RevenueCat
In RevenueCat dashboard, add the product IDs from both stores and create an **Entitlement** called `pro`.

### Step 5 — Install RevenueCat SDK
```bash
pnpm add react-native-purchases
npx expo install react-native-purchases
```

### Step 6 — Initialize RevenueCat in the app
Add to `app/_layout.tsx` (inside `RootLayout`):
```typescript
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// In useEffect or app init:
if (Platform.OS === 'ios') {
  Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY! });
} else {
  Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY! });
}
```

---

## 4. EAS Build Setup

### Step 1 — Log in to EAS
```bash
eas login
```

### Step 2 — Initialize EAS for this project
```bash
cd /path/to/cocoa-budget
eas init
```
This will create an EAS project ID and update `app.json`.

### Step 3 — Build for internal testing (no store accounts needed yet)
```bash
# Android APK for testing
eas build --platform android --profile preview

# iOS simulator build
eas build --platform ios --profile development
```

### Step 4 — Production builds
```bash
# Both platforms at once
eas build --platform all --profile production
```

EAS will prompt you to create/use Apple certificates and Android keystores automatically.

---

## 5. App Store Submission

### Apple App Store

1. Create your app in [App Store Connect](https://appstoreconnect.apple.com)
2. Fill in: App name, description, keywords, screenshots (6.7" iPhone required)
3. Set your subscription pricing and free trial period
4. Submit build via EAS:
   ```bash
   eas submit --platform ios --profile production
   ```
5. Submit for App Review (typically 1–3 business days)

### Google Play Store

1. Create your app in [Google Play Console](https://play.google.com/console)
2. Complete the store listing (description, screenshots, content rating)
3. Set up your subscription products
4. Submit build via EAS:
   ```bash
   eas submit --platform android --profile production
   ```
5. Submit for review (typically 1–3 business days for new apps)

---

## 6. EAS Secrets (Production Security)

Move sensitive keys out of source code before going live:

```bash
eas secret:create --scope project --name SUPABASE_URL --value "https://czxrnmwntwokhcjbqvgs.supabase.co"
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "your_anon_key"
eas secret:create --scope project --name REVENUECAT_IOS_KEY --value "appl_xxx"
eas secret:create --scope project --name REVENUECAT_ANDROID_KEY --value "goog_xxx"
```

Then reference them in `app.config.ts` instead of hardcoding in source files.

---

## 7. Post-Launch Checklist

- [ ] Privacy Policy published (required by both stores)
- [ ] Terms of Service published
- [ ] Support email configured
- [ ] App icon (1024×1024 PNG, no alpha) uploaded
- [ ] Screenshots for all required device sizes uploaded
- [ ] Age rating completed
- [ ] Subscription cancellation instructions in app description (Apple requirement)
- [ ] Supabase project upgraded from Free to Pro tier (for production traffic)

---

## 8. Pricing Recommendations

Based on comparable personal finance apps:

| Tier | Price | Notes |
|---|---|---|
| Free | $0 | Core tracking (limited accounts/transactions) |
| Pro Monthly | $2.99–$4.99/mo | Full access, cloud sync, all features |
| Pro Yearly | $19.99–$29.99/yr | ~40% discount vs monthly |
| Lifetime | $49.99 (optional) | One-time purchase, no subscription |

A **7-day free trial** is strongly recommended to increase conversion rates.
