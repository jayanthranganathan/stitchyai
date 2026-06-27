-- =============================================================================
-- Stitchy AI (Thugil Designers) — PostgreSQL Schema
-- Generated from SQLAlchemy models  |  2026-05-12
-- Run against an empty database:  psql -U thugil -d thugil -f schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid() fallback


-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

CREATE TYPE approvalstate AS ENUM (
    'registered',
    'documents_uploaded',
    'under_review',
    'approved',
    'rejected',
    'suspended'
);

CREATE TYPE assignmentstate AS ENUM (
    'proposed',
    'accepted',
    'completed',
    'cancelled'
);

CREATE TYPE deliveryassignmentstate AS ENUM (
    'proposed',
    'accepted',
    'picked_up',
    'delivered',
    'cancelled'
);

CREATE TYPE deliverykind AS ENUM (
    'customer_to_tailor',
    'tailor_to_customer',
    'office_to_customer',
    'customer_to_office'
);

CREATE TYPE vehicletype AS ENUM (
    'bike',
    'scooter',
    'bicycle',
    'car'
);

CREATE TYPE orderstatus AS ENUM (
    'draft',
    'placed',
    'assigned',
    'in_progress',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'undeliverable'
);

CREATE TYPE paymentstatus AS ENUM (
    'created',
    'authorized',
    'captured',
    'failed',
    'refunded'
);

CREATE TYPE deviceplatform AS ENUM (
    'ios',
    'android',
    'web'
);

CREATE TYPE adminrole AS ENUM (
    'super_admin',
    'ops',
    'support'
);

CREATE TYPE plantier AS ENUM (
    'standard',
    'gold',
    'platinum'
);

CREATE TYPE creditkind AS ENUM (
    'earn_order',
    'redeem_order',
    'redeem_upgrade',
    'promo',
    'refund'
);


-- =============================================================================
-- TABLE 1 — user_accounts
-- Core identity record created on first OTP verification.
-- One row per phone number; email is optional.
-- =============================================================================
CREATE TABLE user_accounts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phone       VARCHAR(20)          UNIQUE,
    email       VARCHAR(255)         UNIQUE,
    full_name   VARCHAR(255),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_user_accounts_phone ON user_accounts (phone);
CREATE INDEX ix_user_accounts_email ON user_accounts (email);


-- =============================================================================
-- TABLE 2 — customer_profiles
-- Created automatically when a user registers as Customer.
-- addresses stores a JSON array of saved delivery addresses.
-- =============================================================================
CREATE TABLE customer_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES user_accounts (id) ON DELETE CASCADE,
    addresses       JSONB NOT NULL DEFAULT '[]',
    preferences     JSONB NOT NULL DEFAULT '{}',
    plan_tier       plantier NOT NULL DEFAULT 'standard',
    plan_expires_at TIMESTAMPTZ,
    credit_balance  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_customer_profiles_user_id   ON customer_profiles (user_id);
CREATE INDEX ix_customer_profiles_plan_tier ON customer_profiles (plan_tier);


-- =============================================================================
-- TABLE 3 — admin_profiles
-- Created manually by a super-admin; never via self-registration.
-- permissions is a JSON array of fine-grained permission strings.
-- =============================================================================
CREATE TABLE admin_profiles (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID      NOT NULL UNIQUE REFERENCES user_accounts (id) ON DELETE CASCADE,
    role        adminrole NOT NULL DEFAULT 'ops',
    permissions JSONB     NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_admin_profiles_user_id ON admin_profiles (user_id);


-- =============================================================================
-- TABLE 4 — tailor_expertise
-- Lookup / seed table of garment types a tailor can specialise in.
-- Seeded from categories. slug matches category.slug.
-- =============================================================================
CREATE TABLE tailor_expertise (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       VARCHAR(64) NOT NULL UNIQUE,
    name       VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tailor_expertise_slug ON tailor_expertise (slug);


-- =============================================================================
-- TABLE 5 — tailor_profiles
-- One row per tailor. approval_state drives admin review flow.
-- documents JSON: { aadhaar_url, pan_url, ... }
-- =============================================================================
CREATE TABLE tailor_profiles (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID          NOT NULL UNIQUE REFERENCES user_accounts (id) ON DELETE CASCADE,
    bio            VARCHAR(2000),
    documents      JSONB         NOT NULL DEFAULT '{}',
    approval_state approvalstate NOT NULL DEFAULT 'registered',
    rating         NUMERIC(3, 2),
    city           VARCHAR(128),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tailor_profiles_user_id        ON tailor_profiles (user_id);
CREATE INDEX ix_tailor_profiles_approval_state ON tailor_profiles (approval_state);
CREATE INDEX ix_tailor_profiles_city           ON tailor_profiles (city);


-- =============================================================================
-- TABLE 6 — tailor_expertise_link  (many-to-many junction)
-- Links tailor_profiles to their tailor_expertise tags.
-- =============================================================================
CREATE TABLE tailor_expertise_link (
    tailor_id    UUID NOT NULL REFERENCES tailor_profiles (id) ON DELETE CASCADE,
    expertise_id UUID NOT NULL REFERENCES tailor_expertise (id) ON DELETE CASCADE,
    PRIMARY KEY (tailor_id, expertise_id)
);


-- =============================================================================
-- TABLE 7 — delivery_profiles
-- One row per delivery partner.
-- last_lat / last_lng updated on every location ping.
-- =============================================================================
CREATE TABLE delivery_profiles (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID          NOT NULL UNIQUE REFERENCES user_accounts (id) ON DELETE CASCADE,
    vehicle_type   vehicletype   NOT NULL DEFAULT 'bike',
    license_url    VARCHAR(500),
    documents      JSONB         NOT NULL DEFAULT '{}',
    approval_state approvalstate NOT NULL DEFAULT 'registered',
    is_online      BOOLEAN       NOT NULL DEFAULT FALSE,
    last_lat       FLOAT,
    last_lng       FLOAT,
    last_seen_at   TIMESTAMPTZ,
    city           VARCHAR(128),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_delivery_profiles_user_id        ON delivery_profiles (user_id);
CREATE INDEX ix_delivery_profiles_approval_state ON delivery_profiles (approval_state);
CREATE INDEX ix_delivery_profiles_is_online      ON delivery_profiles (is_online);
CREATE INDEX ix_delivery_profiles_city           ON delivery_profiles (city);


-- =============================================================================
-- TABLE 8 — categories
-- Garment categories (Blouse, Kurti, Shirt, …). Seeded at startup.
-- =============================================================================
CREATE TABLE categories (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       VARCHAR(64) NOT NULL UNIQUE,
    name       VARCHAR(128) NOT NULL,
    icon_url   VARCHAR(500),
    sort_order INT         NOT NULL DEFAULT 0,
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_categories_slug ON categories (slug);


-- =============================================================================
-- TABLE 9 — designs
-- Library of named designs per category shown to customers.
-- images / tags are JSON arrays.
-- =============================================================================
CREATE TABLE designs (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID         NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    images      JSONB        NOT NULL DEFAULT '[]',
    base_price  NUMERIC(12, 2) NOT NULL,
    tags        JSONB        NOT NULL DEFAULT '[]',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_designs_category_id ON designs (category_id);


-- =============================================================================
-- TABLE 10 — design_proposals
-- Customer-submitted custom designs (photo + description).
-- Linked to one OrderItem once an order is placed.
-- =============================================================================
CREATE TABLE design_proposals (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id      UUID         NOT NULL REFERENCES customer_profiles (id) ON DELETE CASCADE,
    category_id      UUID         NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    description      VARCHAR(2000) NOT NULL,
    reference_images JSONB        NOT NULL DEFAULT '[]',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_design_proposals_customer_id ON design_proposals (customer_id);


-- =============================================================================
-- TABLE 11 — orders
-- One row per customer order. Items are in order_items.
-- delivery_address JSON: { street, city, state, pincode, lat, lng }
-- deleted_at enables soft-delete.
-- =============================================================================
CREATE TABLE orders (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id            UUID        NOT NULL REFERENCES customer_profiles (id) ON DELETE RESTRICT,
    status                 orderstatus NOT NULL DEFAULT 'draft',
    expected_delivery_date DATE,
    placed_at              TIMESTAMPTZ,
    delivery_address       JSONB       NOT NULL DEFAULT '{}',
    total_amount           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    credits_redeemed       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency               VARCHAR(3)  NOT NULL DEFAULT 'INR',
    progress_percent       INT         NOT NULL DEFAULT 0,
    notes                  VARCHAR(2000),
    deleted_at             TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_orders_customer_id            ON orders (customer_id);
CREATE INDEX ix_orders_status                 ON orders (status);
CREATE INDEX ix_orders_expected_delivery_date ON orders (expected_delivery_date);


-- =============================================================================
-- TABLE 12 — order_items
-- One row per garment in an order.
-- Either design_id (library design) or proposal_id (custom) is set.
-- measurements JSON: { bust, waist, hip, sleeve_length, … }
-- =============================================================================
CREATE TABLE order_items (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID          NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    category_id  UUID          NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    design_id    UUID          REFERENCES designs (id),
    proposal_id  UUID          REFERENCES design_proposals (id),
    measurements JSONB         NOT NULL DEFAULT '{}',
    quantity     INT           NOT NULL DEFAULT 1,
    unit_price   NUMERIC(12, 2) NOT NULL,
    subtotal     NUMERIC(12, 2) NOT NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_order_items_order_id ON order_items (order_id);


-- =============================================================================
-- TABLE 13 — order_status_history
-- Append-only audit log written on every order status transition.
-- actor_id + actor_role identify who triggered the change.
-- =============================================================================
CREATE TABLE order_status_history (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    status           orderstatus NOT NULL,
    progress_percent INT         NOT NULL DEFAULT 0,
    note             VARCHAR(500),
    actor_id         UUID,
    actor_role       VARCHAR(32),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_order_status_history_order_id ON order_status_history (order_id);


-- =============================================================================
-- TABLE 14 — tailor_interests
-- A tailor expresses interest in an available order before being assigned.
-- =============================================================================
CREATE TABLE tailor_interests (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    tailor_id  UUID        NOT NULL REFERENCES tailor_profiles (id) ON DELETE CASCADE,
    note       VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tailor_interests_order_id  ON tailor_interests (order_id);
CREATE INDEX ix_tailor_interests_tailor_id ON tailor_interests (tailor_id);


-- =============================================================================
-- TABLE 15 — order_assignments
-- Admin assigns a tailor to an order. progress_percent is updated by the tailor.
-- =============================================================================
CREATE TABLE order_assignments (
    id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id             UUID            NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    tailor_id            UUID            NOT NULL REFERENCES tailor_profiles (id) ON DELETE CASCADE,
    assigned_by_admin_id UUID            REFERENCES admin_profiles (id),
    agreed_delivery_date DATE,
    state                assignmentstate NOT NULL DEFAULT 'proposed',
    progress_percent     INT             NOT NULL DEFAULT 0,
    completed_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_order_assignments_order_id  ON order_assignments (order_id);
CREATE INDEX ix_order_assignments_tailor_id ON order_assignments (tailor_id);
CREATE INDEX ix_order_assignments_state     ON order_assignments (state);


-- =============================================================================
-- TABLE 16 — delivery_assignments
-- Admin assigns a delivery partner to move a garment between locations.
-- pickup_location / drop_location JSON: { address, lat, lng, contact_name, contact_phone }
-- =============================================================================
CREATE TABLE delivery_assignments (
    id                  UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID                   NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    delivery_partner_id UUID                   NOT NULL REFERENCES delivery_profiles (id) ON DELETE CASCADE,
    kind                deliverykind           NOT NULL,
    pickup_location     JSONB                  NOT NULL,
    drop_location       JSONB                  NOT NULL,
    state               deliveryassignmentstate NOT NULL DEFAULT 'proposed',
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_delivery_assignments_order_id            ON delivery_assignments (order_id);
CREATE INDEX ix_delivery_assignments_delivery_partner_id ON delivery_assignments (delivery_partner_id);
CREATE INDEX ix_delivery_assignments_state               ON delivery_assignments (state);


-- =============================================================================
-- TABLE 17 — location_pings
-- Real-time GPS pings sent by the delivery partner app during active delivery.
-- High write volume — consider partitioning by recorded_at in production.
-- =============================================================================
CREATE TABLE location_pings (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_partner_id UUID        NOT NULL REFERENCES delivery_profiles (id) ON DELETE CASCADE,
    assignment_id       UUID        REFERENCES delivery_assignments (id) ON DELETE SET NULL,
    lat                 FLOAT       NOT NULL,
    lng                 FLOAT       NOT NULL,
    accuracy_m          FLOAT,
    recorded_at         TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_location_pings_delivery_partner_id ON location_pings (delivery_partner_id);
CREATE INDEX ix_location_pings_assignment_id       ON location_pings (assignment_id);
CREATE INDEX ix_location_pings_recorded_at         ON location_pings (recorded_at);


-- =============================================================================
-- TABLE 18 — payments
-- One row per Razorpay payment attempt (one per order).
-- raw_payload stores the full Razorpay webhook / response JSON.
-- =============================================================================
CREATE TABLE payments (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID          NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
    provider            VARCHAR(32)   NOT NULL DEFAULT 'razorpay',
    provider_order_id   VARCHAR(128)  NOT NULL,
    provider_payment_id VARCHAR(128),
    amount              NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3)    NOT NULL DEFAULT 'INR',
    status              paymentstatus NOT NULL DEFAULT 'created',
    signature_verified  BOOLEAN       NOT NULL DEFAULT FALSE,
    raw_payload         JSONB         NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_payments_order_id            ON payments (order_id);
CREATE INDEX ix_payments_provider_order_id   ON payments (provider_order_id);
CREATE INDEX ix_payments_provider_payment_id ON payments (provider_payment_id);
CREATE INDEX ix_payments_status              ON payments (status);


-- =============================================================================
-- TABLE 19 — fcm_tokens
-- One row per device. token is unique across all users.
-- Updated when the app refreshes its FCM registration token.
-- =============================================================================
CREATE TABLE fcm_tokens (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id  UUID           NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,
    device_id        VARCHAR(128)   NOT NULL,
    token            VARCHAR(500)   NOT NULL UNIQUE,
    platform         deviceplatform NOT NULL,
    last_seen_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_fcm_tokens_user_account_id ON fcm_tokens (user_account_id);


-- =============================================================================
-- TABLE 20 — notifications
-- In-app inbox. read_at is NULL until the user opens the notification.
-- payload JSON carries deep-link data (order_id, assignment_id, …).
-- =============================================================================
CREATE TABLE notifications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID        NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,
    kind            VARCHAR(64) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            VARCHAR(2000) NOT NULL,
    payload         JSONB       NOT NULL DEFAULT '{}',
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_notifications_user_account_id ON notifications (user_account_id);
CREATE INDEX ix_notifications_kind            ON notifications (kind);


-- =============================================================================
-- TABLE 21 — credit_transactions
-- Append-only ledger of credit earn/spend. Running balance is denormalised
-- onto customer_profiles.credit_balance; this table is the audit trail.
-- =============================================================================
CREATE TABLE credit_transactions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   UUID        NOT NULL REFERENCES customer_profiles (id) ON DELETE CASCADE,
    amount        NUMERIC(12, 2) NOT NULL,   -- signed: + earned, - spent
    kind          creditkind  NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_id  UUID,                       -- e.g. the related order id
    note          VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_credit_transactions_customer_id ON credit_transactions (customer_id);
CREATE INDEX ix_credit_transactions_created_at  ON credit_transactions (created_at);


-- =============================================================================
-- SEED DATA — Categories & Expertise tags
-- =============================================================================
INSERT INTO categories (id, slug, name, sort_order) VALUES
    (gen_random_uuid(), 'blouse',       'Blouse',       1),
    (gen_random_uuid(), 'kurti',        'Kurti',        2),
    (gen_random_uuid(), 'shirt',        'Shirt',        3),
    (gen_random_uuid(), 'pants',        'Pants',        4),
    (gen_random_uuid(), 'saree-blouse', 'Saree Blouse', 5),
    (gen_random_uuid(), 'custom',       'Custom',       6);

INSERT INTO tailor_expertise (id, slug, name) VALUES
    (gen_random_uuid(), 'blouse',       'Blouse'),
    (gen_random_uuid(), 'kurti',        'Kurti'),
    (gen_random_uuid(), 'shirt',        'Shirt'),
    (gen_random_uuid(), 'pants',        'Pants'),
    (gen_random_uuid(), 'saree-blouse', 'Saree Blouse'),
    (gen_random_uuid(), 'custom',       'Custom / Bridal');
