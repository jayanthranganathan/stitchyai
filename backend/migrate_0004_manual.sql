-- =============================================================================
-- Manual equivalent of Alembic migration 0004_subscriptions_credits
-- Subscriptions (plan tiers) + credits.
--
-- Safe to run directly on the production DB (e.g. Neon SQL editor / DBeaver).
-- Idempotent: guards on enums + IF NOT EXISTS, so re-running is harmless.
-- Run the whole script in one go (it's wrapped in a transaction).
-- =============================================================================

BEGIN;

-- 1. Enum types (CREATE TYPE has no IF NOT EXISTS — guard via DO block) -------
DO $$ BEGIN
    CREATE TYPE plantier AS ENUM ('standard', 'gold', 'platinum');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE creditkind AS ENUM (
        'earn_order', 'redeem_order', 'redeem_upgrade', 'promo', 'refund'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. customer_profiles: subscription + credit balance ------------------------
ALTER TABLE customer_profiles
    ADD COLUMN IF NOT EXISTS plan_tier       plantier       NOT NULL DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS credit_balance  NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ix_customer_profiles_plan_tier
    ON customer_profiles (plan_tier);

-- 3. orders: credits redeemed on this order ----------------------------------
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS credits_redeemed NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- 4. credit_transactions ledger ----------------------------------------------
CREATE TABLE IF NOT EXISTS credit_transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   UUID NOT NULL REFERENCES customer_profiles (id) ON DELETE CASCADE,
    amount        NUMERIC(12, 2) NOT NULL,           -- signed: + earned, - spent
    kind          creditkind     NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_id  UUID,                              -- e.g. the related order id
    note          VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_credit_transactions_customer_id
    ON credit_transactions (customer_id);
CREATE INDEX IF NOT EXISTS ix_credit_transactions_created_at
    ON credit_transactions (created_at);

-- 5. Keep Alembic in sync so `alembic upgrade head` won't re-run 0004 --------
--    (only if the project tracks migrations with an alembic_version table)
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'alembic_version'
    ) THEN
        UPDATE alembic_version SET version_num = '0004_subscriptions_credits';
    END IF;
END $$;

COMMIT;

-- =============================================================================
-- Sanity check (run after COMMIT):
--   SELECT plan_tier, credit_balance FROM customer_profiles LIMIT 1;
--   SELECT to_regclass('public.credit_transactions');   -- should be non-null
-- =============================================================================
