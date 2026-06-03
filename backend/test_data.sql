-- =============================================================================
-- Stitchy AI — pgAdmin Test Data
-- Run each block one at a time in pgAdmin (select block → F5), or run the
-- entire file via:  psql -U thugil -d thugil -f test_data.sql
--
-- UUIDs are hardcoded so later blocks can reference them.
-- All UUID literals are cast with ::uuid to avoid the [42804] record error.
-- All enum literals are cast with their type for safety.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- BLOCK 1 — User accounts  (8 users: 4 customers, 1 tailor, 1 delivery, 1 admin, 1 extra customer)
-- ---------------------------------------------------------------------------
INSERT INTO user_accounts (id, phone, full_name, email) VALUES
    ('a1000000-0000-0000-0000-000000000001'::uuid, '+919876543201', 'Priya Sharma',    'priya@test.local'),
    ('a1000000-0000-0000-0000-000000000002'::uuid, '+919876543202', 'Meena Rajan',     'meena@test.local'),
    ('a1000000-0000-0000-0000-000000000003'::uuid, '+919876543203', 'Divya Nair',      'divya@test.local'),
    ('a1000000-0000-0000-0000-000000000004'::uuid, '+919876543204', 'Sunitha Pillai',  'sunitha@test.local'),
    ('a1000000-0000-0000-0000-000000000005'::uuid, '+919876543205', 'Ravi Kumar',      NULL),
    ('a1000000-0000-0000-0000-000000000006'::uuid, '+919876543206', 'Suresh Muthu',    NULL),
    ('a1000000-0000-0000-0000-000000000007'::uuid, '+919876543207', 'Admin User',      'admin@test.local'),
    ('a1000000-0000-0000-0000-000000000008'::uuid, '+919876543208', 'Lakshmi Devi',    'lakshmi@test.local')
ON CONFLICT (phone) DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 2 — Customer profiles  (users 1, 2, 3, 4, 8)
-- ---------------------------------------------------------------------------
INSERT INTO customer_profiles (id, user_id, addresses, preferences) VALUES
    (
        'b1000000-0000-0000-0000-000000000001'::uuid,
        'a1000000-0000-0000-0000-000000000001'::uuid,
        '[{"label":"Home","street":"12 Anna Nagar East","city":"Chennai","state":"Tamil Nadu","pincode":"600040","lat":13.0843,"lng":80.2101}]',
        '{"notify_sms":true,"notify_push":true}'
    ),
    (
        'b1000000-0000-0000-0000-000000000002'::uuid,
        'a1000000-0000-0000-0000-000000000002'::uuid,
        '[{"label":"Home","street":"45 T Nagar","city":"Chennai","state":"Tamil Nadu","pincode":"600017","lat":13.0418,"lng":80.2341}]',
        '{}'
    ),
    (
        'b1000000-0000-0000-0000-000000000003'::uuid,
        'a1000000-0000-0000-0000-000000000003'::uuid,
        '[{"label":"Office","street":"7 Velachery Main Road","city":"Chennai","state":"Tamil Nadu","pincode":"600042","lat":12.9815,"lng":80.2180}]',
        '{}'
    ),
    (
        'b1000000-0000-0000-0000-000000000004'::uuid,
        'a1000000-0000-0000-0000-000000000004'::uuid,
        '[{"label":"Home","street":"22 Adyar","city":"Chennai","state":"Tamil Nadu","pincode":"600020","lat":13.0012,"lng":80.2565}]',
        '{}'
    ),
    (
        'b1000000-0000-0000-0000-000000000008'::uuid,
        'a1000000-0000-0000-0000-000000000008'::uuid,
        '[{"label":"Home","street":"3 Mylapore","city":"Chennai","state":"Tamil Nadu","pincode":"600004","lat":13.0336,"lng":80.2683}]',
        '{}'
    )
ON CONFLICT (user_id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 3 — Tailor profile  (user 5 — Ravi Kumar)
-- ---------------------------------------------------------------------------
INSERT INTO tailor_profiles (id, user_id, bio, approval_state, rating, city) VALUES
    (
        'c1000000-0000-0000-0000-000000000001'::uuid,
        'a1000000-0000-0000-0000-000000000005'::uuid,
        '10 years experience stitching blouses and kurtis in Chennai.',
        'approved'::approvalstate,
        4.70,
        'Chennai'
    )
ON CONFLICT (user_id) DO NOTHING;

-- Link tailor to expertise slugs  (no id column — composite PK)
INSERT INTO tailor_expertise_link (tailor_id, expertise_id)
SELECT
    'c1000000-0000-0000-0000-000000000001'::uuid,
    te.id
FROM tailor_expertise te
WHERE te.slug IN ('blouse', 'kurti', 'shirt')
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 4 — Delivery partner profile  (user 6 — Suresh Muthu)
-- ---------------------------------------------------------------------------
INSERT INTO delivery_profiles (id, user_id, vehicle_type, approval_state, is_online, last_lat, last_lng, city) VALUES
    (
        'd1000000-0000-0000-0000-000000000001'::uuid,
        'a1000000-0000-0000-0000-000000000006'::uuid,
        'bike'::vehicletype,
        'approved'::approvalstate,
        TRUE,
        13.0827,
        80.2707,
        'Chennai'
    )
ON CONFLICT (user_id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 5 — Admin profile  (user 7)
-- ---------------------------------------------------------------------------
INSERT INTO admin_profiles (id, user_id, role, permissions) VALUES
    (
        'e1000000-0000-0000-0000-000000000001'::uuid,
        'a1000000-0000-0000-0000-000000000007'::uuid,
        'super_admin'::adminrole,
        '["*"]'
    )
ON CONFLICT (user_id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 6 — Orders for Priya Sharma  (customer b1…001)
-- One order per status so every screen/tab has data.
-- ---------------------------------------------------------------------------

-- 6a. DELIVERED order (14 days ago)
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f1000000-0000-0000-0000-000000000001'::uuid,
        'b1000000-0000-0000-0000-000000000001'::uuid,
        'delivered'::orderstatus,
        NOW() - INTERVAL '14 days',
        (NOW() - INTERVAL '2 days')::date,
        '{"street":"12 Anna Nagar East","city":"Chennai","pincode":"600040"}',
        350.00,
        'INR',
        100
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f1000000-0000-0000-0000-000000000001'::uuid, 'placed'::orderstatus,        5,   'Order placed',       'customer'),
    ('f1000000-0000-0000-0000-000000000001'::uuid, 'assigned'::orderstatus,      15,  'Tailor assigned',    'admin'),
    ('f1000000-0000-0000-0000-000000000001'::uuid, 'in_progress'::orderstatus,   55,  'Stitching started',  'tailor'),
    ('f1000000-0000-0000-0000-000000000001'::uuid, 'ready'::orderstatus,         90,  'Ready for pickup',   'tailor'),
    ('f1000000-0000-0000-0000-000000000001'::uuid, 'out_for_delivery'::orderstatus, 95, 'Out for delivery', 'admin'),
    ('f1000000-0000-0000-0000-000000000001'::uuid, 'delivered'::orderstatus,    100,  'Delivered',          'delivery')
ON CONFLICT DO NOTHING;

-- 6b. IN_PROGRESS order (3 days ago)
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f1000000-0000-0000-0000-000000000002'::uuid,
        'b1000000-0000-0000-0000-000000000001'::uuid,
        'in_progress'::orderstatus,
        NOW() - INTERVAL '3 days',
        (NOW() + INTERVAL '4 days')::date,
        '{"street":"12 Anna Nagar East","city":"Chennai","pincode":"600040"}',
        520.00,
        'INR',
        55
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f1000000-0000-0000-0000-000000000002'::uuid, 'placed'::orderstatus,      5,  'Order placed',      'customer'),
    ('f1000000-0000-0000-0000-000000000002'::uuid, 'assigned'::orderstatus,   15,  'Tailor assigned',   'admin'),
    ('f1000000-0000-0000-0000-000000000002'::uuid, 'in_progress'::orderstatus, 55, 'Stitching started', 'tailor')
ON CONFLICT DO NOTHING;

-- 6c. ASSIGNED order (1 day ago)
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f1000000-0000-0000-0000-000000000003'::uuid,
        'b1000000-0000-0000-0000-000000000001'::uuid,
        'assigned'::orderstatus,
        NOW() - INTERVAL '1 day',
        (NOW() + INTERVAL '6 days')::date,
        '{"street":"12 Anna Nagar East","city":"Chennai","pincode":"600040"}',
        600.00,
        'INR',
        15
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f1000000-0000-0000-0000-000000000003'::uuid, 'placed'::orderstatus,   5,  'Order placed',    'customer'),
    ('f1000000-0000-0000-0000-000000000003'::uuid, 'assigned'::orderstatus, 15, 'Tailor assigned', 'admin')
ON CONFLICT DO NOTHING;

-- 6d. PLACED order (today)
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f1000000-0000-0000-0000-000000000004'::uuid,
        'b1000000-0000-0000-0000-000000000001'::uuid,
        'placed'::orderstatus,
        NOW(),
        (NOW() + INTERVAL '7 days')::date,
        '{"street":"12 Anna Nagar East","city":"Chennai","pincode":"600040"}',
        580.00,
        'INR',
        5
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f1000000-0000-0000-0000-000000000004'::uuid, 'placed'::orderstatus, 5, 'Order placed', 'customer')
ON CONFLICT DO NOTHING;

-- 6e. CANCELLED order
INSERT INTO orders (id, customer_id, status, placed_at, delivery_address, total_amount, currency, progress_percent, notes) VALUES
    (
        'f1000000-0000-0000-0000-000000000005'::uuid,
        'b1000000-0000-0000-0000-000000000001'::uuid,
        'cancelled'::orderstatus,
        NOW() - INTERVAL '5 days',
        '{"street":"12 Anna Nagar East","city":"Chennai","pincode":"600040"}',
        460.00,
        'INR',
        0,
        'Customer requested cancellation'
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f1000000-0000-0000-0000-000000000005'::uuid, 'placed'::orderstatus,    5, 'Order placed',  'customer'),
    ('f1000000-0000-0000-0000-000000000005'::uuid, 'cancelled'::orderstatus, 0, 'Cancelled',     'customer')
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 7 — Order items  (link each order above to a design)
-- Uses category/design slugs via subquery so we don't need to hardcode design UUIDs.
-- ---------------------------------------------------------------------------

-- Order 1 (delivered) — Classic Round Neck blouse
INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f1000000-0000-0000-0000-000000000001'::uuid,
    d.category_id,
    d.id,
    '{"bust":34,"waist":28,"hip":36,"sleeve_length":7,"blouse_length":16}',
    1,
    d.base_price,
    d.base_price
FROM designs d
WHERE d.name = 'Classic Round Neck'
ON CONFLICT DO NOTHING;

-- Order 2 (in_progress) — Straight Cut kurti
INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f1000000-0000-0000-0000-000000000002'::uuid,
    d.category_id,
    d.id,
    '{"bust":34,"waist":28,"hip":36,"length":44}',
    1,
    d.base_price,
    d.base_price
FROM designs d
WHERE d.name = 'Straight Cut'
ON CONFLICT DO NOTHING;

-- Order 3 (assigned) — Formal Oxford shirt
INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f1000000-0000-0000-0000-000000000003'::uuid,
    d.category_id,
    d.id,
    '{"chest":38,"waist":32,"sleeve_length":25,"shirt_length":29}',
    1,
    d.base_price,
    d.base_price
FROM designs d
WHERE d.name = 'Formal Oxford'
ON CONFLICT DO NOTHING;

-- Order 4 (placed) — Palazzo pants
INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f1000000-0000-0000-0000-000000000004'::uuid,
    d.category_id,
    d.id,
    '{"waist":28,"hip":36,"length":40}',
    1,
    d.base_price,
    d.base_price
FROM designs d
WHERE d.name = 'Palazzo'
ON CONFLICT DO NOTHING;

-- Order 5 (cancelled) — Halter Back blouse
INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f1000000-0000-0000-0000-000000000005'::uuid,
    d.category_id,
    d.id,
    '{"bust":34,"waist":28,"blouse_length":15}',
    1,
    d.base_price,
    d.base_price
FROM designs d
WHERE d.name = 'Halter Back'
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 8 — Tailor + delivery assignments for active orders
-- ---------------------------------------------------------------------------

-- Tailor assignment for in_progress order
INSERT INTO order_assignments (order_id, tailor_id, state, progress_percent, agreed_delivery_date) VALUES
    (
        'f1000000-0000-0000-0000-000000000002'::uuid,
        'c1000000-0000-0000-0000-000000000001'::uuid,
        'accepted'::assignmentstate,
        55,
        (NOW() + INTERVAL '4 days')::date
    )
ON CONFLICT DO NOTHING;

-- Tailor assignment for assigned order
INSERT INTO order_assignments (order_id, tailor_id, state, progress_percent, agreed_delivery_date) VALUES
    (
        'f1000000-0000-0000-0000-000000000003'::uuid,
        'c1000000-0000-0000-0000-000000000001'::uuid,
        'accepted'::assignmentstate,
        15,
        (NOW() + INTERVAL '6 days')::date
    )
ON CONFLICT DO NOTHING;

-- Delivery assignment for in_progress order (tailor → customer)
INSERT INTO delivery_assignments (order_id, delivery_partner_id, kind, pickup_location, drop_location, state) VALUES
    (
        'f1000000-0000-0000-0000-000000000002'::uuid,
        'd1000000-0000-0000-0000-000000000001'::uuid,
        'tailor_to_customer'::deliverykind,
        '{"address":"Ravi Kumar Tailors, T Nagar, Chennai","lat":13.0418,"lng":80.2341,"contact_name":"Ravi Kumar","contact_phone":"+919876543205"}',
        '{"address":"12 Anna Nagar East, Chennai","lat":13.0843,"lng":80.2101,"contact_name":"Priya Sharma","contact_phone":"+919876543201"}',
        'accepted'::deliveryassignmentstate
    )
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 9 — Orders for Meena Rajan  (customer b1…002)
-- ---------------------------------------------------------------------------

-- READY order
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f2000000-0000-0000-0000-000000000001'::uuid,
        'b1000000-0000-0000-0000-000000000002'::uuid,
        'ready'::orderstatus,
        NOW() - INTERVAL '7 days',
        NOW()::date,
        '{"street":"45 T Nagar","city":"Chennai","pincode":"600017"}',
        480.00,
        'INR',
        90
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f2000000-0000-0000-0000-000000000001'::uuid, 'placed'::orderstatus,       5,  'Order placed',      'customer'),
    ('f2000000-0000-0000-0000-000000000001'::uuid, 'assigned'::orderstatus,    15,  'Tailor assigned',   'admin'),
    ('f2000000-0000-0000-0000-000000000001'::uuid, 'in_progress'::orderstatus, 55,  'Stitching started', 'tailor'),
    ('f2000000-0000-0000-0000-000000000001'::uuid, 'ready'::orderstatus,       90,  'Ready for pickup',  'tailor')
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f2000000-0000-0000-0000-000000000001'::uuid,
    d.category_id, d.id,
    '{"bust":32,"waist":26,"length":44}',
    1, d.base_price, d.base_price
FROM designs d WHERE d.name = 'Straight Cut'
ON CONFLICT DO NOTHING;

-- OUT_FOR_DELIVERY order
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f2000000-0000-0000-0000-000000000002'::uuid,
        'b1000000-0000-0000-0000-000000000002'::uuid,
        'out_for_delivery'::orderstatus,
        NOW() - INTERVAL '10 days',
        NOW()::date,
        '{"street":"45 T Nagar","city":"Chennai","pincode":"600017"}',
        420.00,
        'INR',
        95
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f2000000-0000-0000-0000-000000000002'::uuid, 'placed'::orderstatus,            5,  'Order placed',      'customer'),
    ('f2000000-0000-0000-0000-000000000002'::uuid, 'assigned'::orderstatus,         15,  'Tailor assigned',   'admin'),
    ('f2000000-0000-0000-0000-000000000002'::uuid, 'in_progress'::orderstatus,      55,  'Stitching started', 'tailor'),
    ('f2000000-0000-0000-0000-000000000002'::uuid, 'ready'::orderstatus,            90,  'Ready for pickup',  'tailor'),
    ('f2000000-0000-0000-0000-000000000002'::uuid, 'out_for_delivery'::orderstatus, 95,  'Out for delivery',  'admin')
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f2000000-0000-0000-0000-000000000002'::uuid,
    d.category_id, d.id,
    '{"bust":32,"waist":26,"blouse_length":15}',
    1, d.base_price, d.base_price
FROM designs d WHERE d.name = 'Deep V-Neck'
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 10 — Orders for Divya Nair  (customer b1…003)
-- ---------------------------------------------------------------------------

-- PLACED order
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f3000000-0000-0000-0000-000000000001'::uuid,
        'b1000000-0000-0000-0000-000000000003'::uuid,
        'placed'::orderstatus,
        NOW() - INTERVAL '1 day',
        (NOW() + INTERVAL '8 days')::date,
        '{"street":"7 Velachery Main Road","city":"Chennai","pincode":"600042"}',
        550.00,
        'INR',
        5
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f3000000-0000-0000-0000-000000000001'::uuid, 'placed'::orderstatus, 5, 'Order placed', 'customer')
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f3000000-0000-0000-0000-000000000001'::uuid,
    d.category_id, d.id,
    '{"bust":36,"waist":30,"length":46}',
    1, d.base_price, d.base_price
FROM designs d WHERE d.name = 'High-Low Hem'
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 11 — Orders for Sunitha Pillai  (customer b1…004)
-- ---------------------------------------------------------------------------

-- DELIVERED order
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f4000000-0000-0000-0000-000000000001'::uuid,
        'b1000000-0000-0000-0000-000000000004'::uuid,
        'delivered'::orderstatus,
        NOW() - INTERVAL '20 days',
        (NOW() - INTERVAL '7 days')::date,
        '{"street":"22 Adyar","city":"Chennai","pincode":"600020"}',
        500.00,
        'INR',
        100
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f4000000-0000-0000-0000-000000000001'::uuid, 'placed'::orderstatus,            5,   'Order placed',      'customer'),
    ('f4000000-0000-0000-0000-000000000001'::uuid, 'assigned'::orderstatus,         15,   'Tailor assigned',   'admin'),
    ('f4000000-0000-0000-0000-000000000001'::uuid, 'in_progress'::orderstatus,      55,   'Stitching started', 'tailor'),
    ('f4000000-0000-0000-0000-000000000001'::uuid, 'ready'::orderstatus,            90,   'Ready for pickup',  'tailor'),
    ('f4000000-0000-0000-0000-000000000001'::uuid, 'out_for_delivery'::orderstatus, 95,   'Out for delivery',  'admin'),
    ('f4000000-0000-0000-0000-000000000001'::uuid, 'delivered'::orderstatus,        100,  'Delivered',         'delivery')
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f4000000-0000-0000-0000-000000000001'::uuid,
    d.category_id, d.id,
    '{"bust":34,"waist":28,"blouse_length":15}',
    1, d.base_price, d.base_price
FROM designs d WHERE d.name = 'Silk Blouse'
ON CONFLICT DO NOTHING;

-- IN_PROGRESS order for Sunitha
INSERT INTO orders (id, customer_id, status, placed_at, expected_delivery_date, delivery_address, total_amount, currency, progress_percent) VALUES
    (
        'f4000000-0000-0000-0000-000000000002'::uuid,
        'b1000000-0000-0000-0000-000000000004'::uuid,
        'in_progress'::orderstatus,
        NOW() - INTERVAL '4 days',
        (NOW() + INTERVAL '3 days')::date,
        '{"street":"22 Adyar","city":"Chennai","pincode":"600020"}',
        700.00,
        'INR',
        55
    )
ON CONFLICT DO NOTHING;

INSERT INTO order_status_history (order_id, status, progress_percent, note, actor_role) VALUES
    ('f4000000-0000-0000-0000-000000000002'::uuid, 'placed'::orderstatus,      5,  'Order placed',      'customer'),
    ('f4000000-0000-0000-0000-000000000002'::uuid, 'assigned'::orderstatus,   15,  'Tailor assigned',   'admin'),
    ('f4000000-0000-0000-0000-000000000002'::uuid, 'in_progress'::orderstatus, 55, 'Stitching started', 'tailor')
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, category_id, design_id, measurements, quantity, unit_price, subtotal)
SELECT
    'f4000000-0000-0000-0000-000000000002'::uuid,
    d.category_id, d.id,
    '{"waist":28,"hip":36,"length":42,"inseam":30}',
    1, d.base_price, d.base_price
FROM designs d WHERE d.name = 'Straight Fit Trousers'
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 12 — Payment records (one per placed/active/delivered order)
-- ---------------------------------------------------------------------------
INSERT INTO payments (order_id, provider, provider_order_id, provider_payment_id, amount, currency, status, signature_verified) VALUES
    (
        'f1000000-0000-0000-0000-000000000001'::uuid,
        'razorpay', 'order_test_001', 'pay_test_001',
        350.00, 'INR', 'captured'::paymentstatus, TRUE
    ),
    (
        'f1000000-0000-0000-0000-000000000002'::uuid,
        'razorpay', 'order_test_002', 'pay_test_002',
        520.00, 'INR', 'captured'::paymentstatus, TRUE
    ),
    (
        'f1000000-0000-0000-0000-000000000003'::uuid,
        'razorpay', 'order_test_003', 'pay_test_003',
        600.00, 'INR', 'captured'::paymentstatus, TRUE
    ),
    (
        'f1000000-0000-0000-0000-000000000004'::uuid,
        'razorpay', 'order_test_004', NULL,
        580.00, 'INR', 'created'::paymentstatus, FALSE
    ),
    (
        'f2000000-0000-0000-0000-000000000001'::uuid,
        'razorpay', 'order_test_005', 'pay_test_005',
        480.00, 'INR', 'captured'::paymentstatus, TRUE
    ),
    (
        'f2000000-0000-0000-0000-000000000002'::uuid,
        'razorpay', 'order_test_006', 'pay_test_006',
        420.00, 'INR', 'captured'::paymentstatus, TRUE
    ),
    (
        'f4000000-0000-0000-0000-000000000001'::uuid,
        'razorpay', 'order_test_007', 'pay_test_007',
        500.00, 'INR', 'captured'::paymentstatus, TRUE
    ),
    (
        'f4000000-0000-0000-0000-000000000002'::uuid,
        'razorpay', 'order_test_008', 'pay_test_008',
        700.00, 'INR', 'captured'::paymentstatus, TRUE
    )
ON CONFLICT (order_id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- BLOCK 13 — Quick sanity check
-- ---------------------------------------------------------------------------
SELECT
    ua.full_name,
    o.status,
    o.total_amount,
    o.progress_percent
FROM orders o
JOIN customer_profiles cp ON cp.id = o.customer_id
JOIN user_accounts ua ON ua.id = cp.user_id
ORDER BY ua.full_name, o.created_at;
