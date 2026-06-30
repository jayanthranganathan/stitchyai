-- =============================================================================
-- Backfill: create a customer_profiles row for every user_account that lacks one.
--
-- Accounts created before the fix (OTP / Firebase / email signup) got a
-- user_accounts row but NO customer_profiles row, which made profile/address
-- saves, /subscriptions/me, and credits all 404. Run once on Neon.
--
-- Idempotent: the WHERE NOT EXISTS guard skips users who already have a profile.
-- Requires pgcrypto for gen_random_uuid() (already enabled by the base schema).
-- =============================================================================

INSERT INTO customer_profiles (id, user_id, addresses, preferences, plan_tier, credit_balance, created_at, updated_at)
SELECT gen_random_uuid(), ua.id, '[]'::json, '{}'::json, 'standard', 0, now(), now()
FROM user_accounts ua
WHERE NOT EXISTS (
    SELECT 1 FROM customer_profiles cp WHERE cp.user_id = ua.id
);

-- Verify: should return 0 after running.
-- SELECT count(*) FROM user_accounts ua
-- WHERE NOT EXISTS (SELECT 1 FROM customer_profiles cp WHERE cp.user_id = ua.id);
