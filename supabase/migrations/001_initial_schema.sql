-- ============================================================
-- Cocoa Budget — Initial Supabase Schema
-- ============================================================
-- Run this in the Supabase SQL editor to set up the database.
-- All tables use UUID primary keys and include user_id FK
-- pointing to auth.users for Row Level Security (RLS).
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────
-- Mirrors auth.users with extra app-level settings.
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL DEFAULT '',
  currency        TEXT NOT NULL DEFAULT 'USD',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  date_format     TEXT NOT NULL DEFAULT 'MMM d, yyyy',
  theme           TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  lock_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  lock_method     TEXT NOT NULL DEFAULT 'biometric' CHECK (lock_method IN ('pin', 'biometric')),
  pin_hash        TEXT NOT NULL DEFAULT '',
  lock_timeout    INTEGER NOT NULL DEFAULT 0,
  privacy_mode    BOOLEAN NOT NULL DEFAULT FALSE,
  has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
  total_transaction_count  INTEGER NOT NULL DEFAULT 0,
  total_days_used          INTEGER NOT NULL DEFAULT 0,
  streak_days              INTEGER NOT NULL DEFAULT 0,
  -- subscription tier
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── accounts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('checking','savings','credit','cash','digital','loan','investment','stock','crypto')),
  color           TEXT NOT NULL DEFAULT '#6B4F3A',
  icon            TEXT NOT NULL DEFAULT 'wallet-outline',
  currency        TEXT NOT NULL DEFAULT 'USD',
  balance         BIGINT NOT NULL DEFAULT 0,  -- cents
  note            TEXT NOT NULL DEFAULT '',
  credit_limit    BIGINT,
  interest_rate   NUMERIC(6,4),
  monthly_payment BIGINT,
  cost_basis      BIGINT,
  count_in_asset  BOOLEAN NOT NULL DEFAULT TRUE,
  hide_balance    BOOLEAN NOT NULL DEFAULT FALSE,
  chart_color     TEXT NOT NULL DEFAULT '#6B4F3A',
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  icon            TEXT NOT NULL DEFAULT 'ellipse-outline',
  color           TEXT NOT NULL DEFAULT '#888888',
  bg_color        TEXT NOT NULL DEFAULT '#F0F0F0',
  is_system       BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  display_order   INTEGER NOT NULL DEFAULT 0
);

-- ─── transactions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                    TEXT NOT NULL CHECK (type IN ('expense','income','transfer','adjustment')),
  amount                  BIGINT NOT NULL,  -- always positive, cents
  account_id              UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id             UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  transfer_to_account_id  UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  transfer_pair_id        UUID,
  subscription_id         UUID,
  payee                   TEXT NOT NULL DEFAULT '',
  note                    TEXT NOT NULL DEFAULT '',
  date                    DATE NOT NULL,
  time                    TIME NOT NULL DEFAULT '00:00',
  is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  icon              TEXT NOT NULL DEFAULT 'repeat-outline',
  color             TEXT NOT NULL DEFAULT '#6B4F3A',
  amount            BIGINT NOT NULL,  -- cents
  billing_cycle     TEXT NOT NULL CHECK (billing_cycle IN ('weekly','monthly','quarterly','yearly')),
  next_billing_date DATE NOT NULL,
  account_id        UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  note              TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── budgets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_ids    TEXT[] NOT NULL DEFAULT '{}',  -- array of category UUIDs
  month           TEXT NOT NULL,  -- YYYY-MM
  limit_amount    BIGINT NOT NULL,  -- cents
  rollover        BOOLEAN NOT NULL DEFAULT FALSE,
  period          TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily','weekly','monthly','custom')),
  start_date      DATE,
  end_date        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── savings_goals ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  icon            TEXT NOT NULL DEFAULT 'star-outline',
  color           TEXT NOT NULL DEFAULT '#6B4F3A',
  target_amount   BIGINT NOT NULL,  -- cents
  current_amount  BIGINT NOT NULL DEFAULT 0,  -- cents
  deadline        DATE NOT NULL,
  account_id      UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── net_worth_snapshots ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            TEXT NOT NULL,  -- YYYY-MM
  amount          BIGINT NOT NULL,  -- cents
  assets          BIGINT NOT NULL,
  liabilities     BIGINT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ─── split_entries ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.split_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person          TEXT NOT NULL,
  amount          BIGINT NOT NULL,  -- cents; positive = they owe you
  description     TEXT NOT NULL DEFAULT '',
  date            DATE NOT NULL,
  is_settled      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_entries       ENABLE ROW LEVEL SECURITY;

-- profiles: user can only read/write their own row
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- accounts
CREATE POLICY "accounts_own" ON public.accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- categories
CREATE POLICY "categories_own" ON public.categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- transactions
CREATE POLICY "transactions_own" ON public.transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- subscriptions
CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- budgets
CREATE POLICY "budgets_own" ON public.budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- savings_goals
CREATE POLICY "savings_goals_own" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- net_worth_snapshots
CREATE POLICY "net_worth_snapshots_own" ON public.net_worth_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- split_entries
CREATE POLICY "split_entries_own" ON public.split_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile on new user sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Trigger: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER accounts_updated_at            BEFORE UPDATE ON public.accounts            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER transactions_updated_at        BEFORE UPDATE ON public.transactions        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subscriptions_updated_at       BEFORE UPDATE ON public.subscriptions       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER budgets_updated_at             BEFORE UPDATE ON public.budgets             FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER savings_goals_updated_at       BEFORE UPDATE ON public.savings_goals       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at            BEFORE UPDATE ON public.profiles            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user       ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user   ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user        ON public.budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_goals_user          ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user     ON public.categories(user_id);
