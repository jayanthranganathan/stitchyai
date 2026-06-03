# Data model

Source of truth: SQLAlchemy models in `backend/app/models/`. This document explains the entities
and their relationships in human terms.

## Entities

### Identity

- **user_account** — One row per phone number. Owns one or more *role profiles*. Fields:
  `id`, `phone`, `email` (nullable), `full_name`, `created_at`, `is_active`.
- **customer_profile** — Extends `user_account` with shipping addresses and preferences.
- **tailor_profile** — Extends `user_account` with expertise (M2M to `tailor_expertise`),
  documents (Aadhaar, PAN URLs), approval state, rating.
- **delivery_profile** — Extends `user_account` with vehicle type, license URL, approval state,
  current online/offline flag, last known location.
- **admin_profile** — Extends `user_account` with a sub-role (`super_admin`, `ops`, `support`),
  list of permissions.

### Catalog

- **category** — Blouses, Kurtis, Shirts, Pants, Custom. `id`, `slug`, `name`, `icon_url`,
  `is_active`, `sort_order`.
- **design** — Library design under a category. `id`, `category_id`, `name`, `description`,
  `images[]`, `base_price`, `is_active`, `tags[]`.
- **design_proposal** — Customer-submitted custom design tied to an order. `id`, `customer_id`,
  `category_id`, `description`, `reference_images[]`, `created_at`.

### Orders

- **order** — Top-level order. `id`, `customer_id`, `status`, `placed_at`, `expected_delivery_date`,
  `delivery_address`, `total_amount`, `currency`, `notes`.
- **order_item** — One garment per row. `id`, `order_id`, `design_id` (nullable), `proposal_id`
  (nullable), `category_id`, `measurements_json`, `quantity`, `unit_price`, `subtotal`.
- **order_status_history** — Audit trail of state transitions. `id`, `order_id`, `status`,
  `progress_percent`, `note`, `actor_id`, `actor_role`, `created_at`.
- **order_assignment** — Links order ↔ tailor. `id`, `order_id`, `tailor_id`, `assigned_by`,
  `assigned_at`, `agreed_delivery_date`, `state` (proposed, accepted, completed, cancelled).
- **tailor_interest** — Tailor's expression of interest in an unassigned order. `id`, `order_id`,
  `tailor_id`, `note`, `created_at`.

### Payments

- **payment** — `id`, `order_id`, `provider` (razorpay), `provider_order_id`,
  `provider_payment_id`, `amount`, `currency`, `status`, `signature_verified`, `raw_payload`.

### Delivery

- **delivery_assignment** — `id`, `order_id`, `delivery_partner_id`, `pickup_location`,
  `drop_location`, `kind` (customer_to_tailor / tailor_to_customer / office_to_customer / customer_to_office),
  `state` (proposed, accepted, picked_up, delivered, cancelled), `started_at`, `completed_at`.
- **location_ping** — `id`, `delivery_partner_id`, `assignment_id` (nullable), `lat`, `lng`,
  `accuracy_m`, `recorded_at`. Indexed on `assignment_id, recorded_at`.

### Notifications

- **fcm_token** — `id`, `user_account_id`, `device_id`, `token`, `platform`, `last_seen_at`.
- **notification** — `id`, `user_account_id`, `kind`, `title`, `body`, `payload`, `read_at`,
  `created_at`.

## Relationships at a glance

```
user_account 1───* customer_profile
user_account 1───* tailor_profile
user_account 1───* delivery_profile
user_account 1───* admin_profile

customer_profile 1───* order
order 1───* order_item
order 1───* order_status_history
order 1───* order_assignment
order 1───* delivery_assignment
order 1───1 payment

category 1───* design
design 1───* order_item

tailor_profile 1───* tailor_interest
tailor_profile 1───* order_assignment

delivery_profile 1───* delivery_assignment
delivery_profile 1───* location_ping
```

## Indexing & performance notes

- `order(customer_id, status)` — list by customer + status filter
- `order(expected_delivery_date)` — daily ops dashboards
- `order_assignment(tailor_id, state)` — tailor's queue
- `delivery_assignment(delivery_partner_id, state)` — partner's queue
- `location_ping(assignment_id, recorded_at desc)` — last-known location
- Materialized views for `reports`: `mv_orders_daily`, `mv_orders_by_city`, refreshed nightly.

## Soft delete and audit

All tables include `created_at` and `updated_at`. Tables that participate in compliance audits
(`order`, `payment`, `order_assignment`, `delivery_assignment`) include `deleted_at` for soft
deletion. The `order_status_history` table is the immutable ledger — never updated, only inserted.
