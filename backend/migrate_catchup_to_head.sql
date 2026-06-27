-- =============================================================================
-- Catch-up migration: brings a database up to Alembic head (0004).
-- Covers migrations 0002 (AI tables), 0003 (confirmed status + interest date),
-- and 0004 (subscriptions + credits).
--
-- Fully IDEMPOTENT — every statement guards itself, so it is safe to run on a
-- DB that already has some/all of these objects. No wrapping transaction, so
-- ALTER TYPE ... ADD VALUE works on all Postgres versions.
--
-- Run on Neon SQL editor / DBeaver / psql. Requires pgcrypto for
-- gen_random_uuid() (PG13+ has it built in; the base schema already enables it).
-- =============================================================================

-- ── 0002: AI generation tables ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,
    category                    VARCHAR(64)  NOT NULL,
    fabric_s3_key               VARCHAR(512) NOT NULL,
    fabric_s3_bucket            VARCHAR(128) NOT NULL,
    fabric_analysis             JSONB,
    enhanced_prompt             TEXT,
    status                      VARCHAR(32)  NOT NULL DEFAULT 'queued',
    stage                       VARCHAR(32)  NOT NULL DEFAULT 'uploading',
    progress_percent            INTEGER      NOT NULL DEFAULT 0,
    queue_position              INTEGER,
    error_message               VARCHAR(1000),
    retry_count                 INTEGER      NOT NULL DEFAULT 0,
    celery_task_id              VARCHAR(128),
    queued_at                   TIMESTAMPTZ,
    started_at                  TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,
    inference_duration_seconds  DOUBLE PRECISION,
    moderation_status           VARCHAR(32)  NOT NULL DEFAULT 'pending',
    moderated_by                UUID,
    moderation_note             VARCHAR(500),
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_generated_designs (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id             UUID NOT NULL REFERENCES ai_generation_jobs (id) ON DELETE CASCADE,
    "index"            INTEGER      NOT NULL,
    image_s3_key       VARCHAR(512) NOT NULL,
    thumbnail_s3_key   VARCHAR(512) NOT NULL,
    s3_bucket          VARCHAR(128) NOT NULL,
    cdn_image_url      VARCHAR(2048),
    cdn_thumbnail_url  VARCHAR(2048),
    prompt_used        TEXT,
    seed               INTEGER,
    inference_steps    INTEGER,
    guidance_scale     DOUBLE PRECISION,
    is_saved           BOOLEAN      NOT NULL DEFAULT FALSE,
    saved_at           TIMESTAMPTZ,
    moderation_status  VARCHAR(32)  NOT NULL DEFAULT 'pending',
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ai_generation_jobs_user_id        ON ai_generation_jobs (user_id);
CREATE INDEX IF NOT EXISTS ix_ai_generation_jobs_status         ON ai_generation_jobs (status);
CREATE INDEX IF NOT EXISTS ix_ai_jobs_user_created              ON ai_generation_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_ai_jobs_status_queued_at          ON ai_generation_jobs (status, queued_at);
CREATE INDEX IF NOT EXISTS ix_ai_generated_designs_job_id       ON ai_generated_designs (job_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_ai_designs_job_index       ON ai_generated_designs (job_id, "index");
CREATE INDEX IF NOT EXISTS ix_ai_designs_saved                  ON ai_generated_designs (is_saved);

-- ── 0003: 'confirmed' order status + tailor_interests.expected_delivery_date ──
ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'confirmed' BEFORE 'assigned';

ALTER TABLE tailor_interests
    ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;

-- ── 0004: subscriptions + credits ────────────────────────────────────────────
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

ALTER TABLE customer_profiles
    ADD COLUMN IF NOT EXISTS plan_tier       plantier       NOT NULL DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS credit_balance  NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ix_customer_profiles_plan_tier ON customer_profiles (plan_tier);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS credits_redeemed NUMERIC(12, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS credit_transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   UUID NOT NULL REFERENCES customer_profiles (id) ON DELETE CASCADE,
    amount        NUMERIC(12, 2) NOT NULL,
    kind          creditkind     NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_id  UUID,
    note          VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_credit_transactions_customer_id ON credit_transactions (customer_id);
CREATE INDEX IF NOT EXISTS ix_credit_transactions_created_at  ON credit_transactions (created_at);

-- ── 0005: email-only accounts — phone is now optional ────────────────────────
ALTER TABLE user_accounts ALTER COLUMN phone DROP NOT NULL;

-- ── Mark Alembic as up-to-date (so `alembic upgrade head` is a no-op) ─────────
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alembic_version') THEN
        UPDATE alembic_version SET version_num = '0005_phone_nullable';
    ELSE
        CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY);
        INSERT INTO alembic_version (version_num) VALUES ('0005_phone_nullable');
    END IF;
END $$;

-- =============================================================================
-- Verify after running:
--   SELECT to_regclass('public.ai_generation_jobs');     -- non-null
--   SELECT to_regclass('public.credit_transactions');    -- non-null
--   SELECT plan_tier FROM customer_profiles LIMIT 1;
--   SELECT unnest(enum_range(NULL::orderstatus));         -- should list 'confirmed'
-- =============================================================================
