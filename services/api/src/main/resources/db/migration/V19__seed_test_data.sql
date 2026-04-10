-- V19__seed_test_data.sql
-- Deterministic local/test seed that makes the platform feel populated.
--
-- Local quick-login phones backed by this seed:
--   CUSTOMER -> +97692000001
--   TASKER   -> +97693000001
--   ADMIN    -> +97694000001
--
-- `users.phone` remains null in git-tracked SQL. Only the blind index is seeded here;
-- the first real backend dev login backfills the encrypted phone value.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TEMP TABLE seed_users (
    id UUID PRIMARY KEY,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    primary_auth TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    rating_avg DOUBLE PRECISION NOT NULL,
    completed_tasks INT NOT NULL,
    balance_mnt BIGINT NOT NULL,
    held_balance_mnt BIGINT NOT NULL,
    device_platform TEXT NOT NULL,
    district_slugs TEXT[] NOT NULL,
    created_offset INTERVAL NOT NULL,
    updated_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_users (
    id,
    phone,
    role,
    status,
    primary_auth,
    full_name,
    avatar_url,
    rating_avg,
    completed_tasks,
    balance_mnt,
    held_balance_mnt,
    device_platform,
    district_slugs,
    created_offset,
    updated_offset
) VALUES
    ('30000000-0000-0000-0000-000000000001', '+97694000001', 'ADMIN', 'ACTIVE', 'PHONE_OTP',
        'Tasky Local Admin', 'https://img.tasky.mn/seed/admin-local.jpg', 0.0, 0, 0, 0, 'WEB',
        ARRAY[]::TEXT[], interval '-120 days', interval '-3 hours'),
    ('10000000-0000-0000-0000-000000000001', '+97692000001', 'CUSTOMER', 'VERIFIED', 'PHONE_OTP',
        'Ariunaa Bat', 'https://img.tasky.mn/seed/customer-ariunaa.jpg', 4.9, 8, 420000, 35000, 'IOS',
        ARRAY[]::TEXT[], interval '-90 days', interval '-2 hours'),
    ('10000000-0000-0000-0000-000000000002', '+97692000002', 'CUSTOMER', 'ACTIVE', 'PHONE_OTP',
        'Temuulen Dorj', 'https://img.tasky.mn/seed/customer-temuulen.jpg', 4.7, 5, 260000, 18000, 'ANDROID',
        ARRAY[]::TEXT[], interval '-75 days', interval '-4 hours'),
    ('10000000-0000-0000-0000-000000000003', '+97692000003', 'CUSTOMER', 'VERIFIED', 'PHONE_OTP',
        'Nomin Erdene', 'https://img.tasky.mn/seed/customer-nomin.jpg', 4.8, 7, 310000, 22000, 'IOS',
        ARRAY[]::TEXT[], interval '-68 days', interval '-5 hours'),
    ('10000000-0000-0000-0000-000000000004', '+97692000004', 'CUSTOMER', 'ACTIVE', 'PHONE_OTP',
        'Bilguun Sukh', 'https://img.tasky.mn/seed/customer-bilguun.jpg', 4.6, 4, 180000, 12000, 'ANDROID',
        ARRAY[]::TEXT[], interval '-54 days', interval '-7 hours'),
    ('10000000-0000-0000-0000-000000000005', '+97692000005', 'CUSTOMER', 'VERIFIED', 'PHONE_OTP',
        'Saraa Munkh', 'https://img.tasky.mn/seed/customer-saraa.jpg', 4.9, 11, 540000, 28000, 'IOS',
        ARRAY[]::TEXT[], interval '-102 days', interval '-90 minutes'),
    ('20000000-0000-0000-0000-000000000001', '+97693000001', 'TASKER', 'VERIFIED', 'PHONE_OTP',
        'Munkh-Erdene Plumbing', 'https://img.tasky.mn/seed/tasker-munkherdene.jpg', 4.9, 64, 310000, 45000, 'ANDROID',
        ARRAY['sukhbaatar', 'bayangol', 'khan-uul'], interval '-140 days', interval '-3 hours'),
    ('20000000-0000-0000-0000-000000000002', '+97693000002', 'TASKER', 'VERIFIED', 'PHONE_OTP',
        'Otgonjargal Electric', 'https://img.tasky.mn/seed/tasker-otgonjargal.jpg', 4.6, 41, 240000, 20000, 'ANDROID',
        ARRAY['chingeltei', 'bayanzurkh', 'sukhbaatar'], interval '-132 days', interval '-6 hours'),
    ('20000000-0000-0000-0000-000000000003', '+97693000003', 'TASKER', 'VERIFIED', 'PHONE_OTP',
        'Selenge Cleaning Crew', 'https://img.tasky.mn/seed/tasker-selenge.jpg', 4.8, 57, 360000, 25000, 'IOS',
        ARRAY['bayangol', 'khan-uul', 'songinokhairkhan'], interval '-126 days', interval '-2 hours'),
    ('20000000-0000-0000-0000-000000000004', '+97693000004', 'TASKER', 'VERIFIED', 'PHONE_OTP',
        'Bat Assembly', 'https://img.tasky.mn/seed/tasker-bat.jpg', 4.9, 48, 290000, 18000, 'ANDROID',
        ARRAY['bayangol', 'khan-uul', 'bayanzurkh'], interval '-118 days', interval '-4 hours'),
    ('20000000-0000-0000-0000-000000000005', '+97693000005', 'TASKER', 'ACTIVE', 'PHONE_OTP',
        'Anu Delivery', 'https://img.tasky.mn/seed/tasker-anu.jpg', 4.2, 22, 140000, 8000, 'ANDROID',
        ARRAY['sukhbaatar', 'bayanzurkh', 'chingeltei'], interval '-96 days', interval '-5 hours'),
    ('20000000-0000-0000-0000-000000000006', '+97693000006', 'TASKER', 'ACTIVE', 'PHONE_OTP',
        'Erkhes HVAC', 'https://img.tasky.mn/seed/tasker-erkhes.jpg', 4.7, 36, 270000, 30000, 'IOS',
        ARRAY['khan-uul', 'bayangol', 'songinokhairkhan'], interval '-88 days', interval '-100 minutes'),
    ('20000000-0000-0000-0000-000000000007', '+97693000007', 'TASKER', 'VERIFIED', 'PHONE_OTP',
        'Ganzorig Handyman', 'https://img.tasky.mn/seed/tasker-ganzorig.jpg', 4.6, 29, 190000, 14000, 'ANDROID',
        ARRAY['bayanzurkh', 'songinokhairkhan', 'chingeltei'], interval '-84 days', interval '-8 hours');

INSERT INTO users (id, phone, phone_blind_idx, role, status, primary_auth, created_at, updated_at)
SELECT
    su.id,
    NULL,
    encode(hmac(convert_to(su.phone, 'UTF8'), decode('${tasky_blind_index_key}', 'base64'), 'sha256'), 'base64'),
    su.role,
    su.status,
    su.primary_auth,
    now() + su.created_offset,
    now() + su.updated_offset
FROM seed_users su
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (user_id, full_name, avatar_url, rating_avg, completed_tasks)
SELECT su.id, su.full_name, su.avatar_url, su.rating_avg, su.completed_tasks
FROM seed_users su
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO wallets (user_id, balance_mnt, held_balance_mnt, updated_at)
SELECT su.id, su.balance_mnt, su.held_balance_mnt, now() + su.updated_offset
FROM seed_users su
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO device_tokens (user_id, token, platform, created_at)
SELECT
    su.id,
    'seed-device-' || replace(su.phone, '+', ''),
    su.device_platform,
    now() + su.updated_offset
FROM seed_users su
ON CONFLICT DO NOTHING;

INSERT INTO tasker_service_districts (user_id, district_id, created_at)
SELECT
    su.id,
    d.id,
    now() - interval '45 days'
FROM seed_users su
JOIN LATERAL unnest(su.district_slugs) AS seed_slug(slug) ON su.role = 'TASKER'
JOIN districts d ON d.slug = seed_slug.slug
ON CONFLICT DO NOTHING;

CREATE TEMP TABLE seed_verifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    id_card_front_key TEXT NOT NULL,
    id_card_back_key TEXT NOT NULL,
    status TEXT NOT NULL,
    submitted_offset INTERVAL NOT NULL,
    admin_notes TEXT,
    reviewed_offset INTERVAL,
    consent_policy_version TEXT,
    consent_offset INTERVAL NOT NULL,
    dan_reference TEXT
) ON COMMIT DROP;

INSERT INTO seed_verifications (
    id,
    user_id,
    id_card_front_key,
    id_card_back_key,
    status,
    submitted_offset,
    admin_notes,
    reviewed_offset,
    consent_policy_version,
    consent_offset,
    dan_reference
) VALUES
    ('46000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        'seed/verifications/t1/front.jpg', 'seed/verifications/t1/back.jpg', 'APPROVED',
        interval '-80 days', NULL, interval '-78 days', 'kyc-2026-03', interval '-80 days', 'DAN-T1-2026'),
    ('46000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
        'seed/verifications/t2/front.jpg', 'seed/verifications/t2/back.jpg', 'APPROVED',
        interval '-60 days', NULL, interval '-59 days', 'kyc-2026-03', interval '-60 days', 'DAN-T2-2026'),
    ('46000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003',
        'seed/verifications/t3/front.jpg', 'seed/verifications/t3/back.jpg', 'APPROVED',
        interval '-40 days', NULL, interval '-39 days', 'kyc-2026-03', interval '-40 days', 'DAN-T3-2026'),
    ('46000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004',
        'seed/verifications/t4/front.jpg', 'seed/verifications/t4/back.jpg', 'APPROVED',
        interval '-25 days', NULL, interval '-24 days', 'kyc-2026-03', interval '-25 days', 'DAN-T4-2026'),
    ('46000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005',
        'seed/verifications/t5/front.jpg', 'seed/verifications/t5/back.jpg', 'REJECTED',
        interval '-9 days', 'Please resubmit with clearer ID images.', interval '-8 days',
        'kyc-2026-03', interval '-9 days', NULL),
    ('46000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006',
        'seed/verifications/t6/front.jpg', 'seed/verifications/t6/back.jpg', 'PENDING',
        interval '-16 hours', NULL, NULL, 'kyc-2026-03', interval '-16 hours', NULL),
    ('46000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007',
        'seed/verifications/t7/front.jpg', 'seed/verifications/t7/back.jpg', 'APPROVED',
        interval '-45 days', NULL, interval '-44 days', 'kyc-2026-03', interval '-45 days', 'DAN-T7-2026');

INSERT INTO verifications (
    id,
    user_id,
    id_card_front_key,
    id_card_back_key,
    status,
    submitted_at,
    admin_notes,
    reviewed_at,
    consent_policy_version,
    consent_accepted_at,
    dan_reference
)
SELECT
    sv.id,
    sv.user_id,
    sv.id_card_front_key,
    sv.id_card_back_key,
    sv.status,
    now() + sv.submitted_offset,
    sv.admin_notes,
    CASE WHEN sv.reviewed_offset IS NULL THEN NULL ELSE now() + sv.reviewed_offset END,
    sv.consent_policy_version,
    now() + sv.consent_offset,
    sv.dan_reference
FROM seed_verifications sv
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_tasks (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    category_name TEXT NOT NULL,
    description TEXT NOT NULL,
    budget INT NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    location_text TEXT NOT NULL,
    status TEXT NOT NULL,
    scheduled_offset INTERVAL NOT NULL,
    created_offset INTERVAL NOT NULL,
    updated_offset INTERVAL NOT NULL,
    intake_answers_json JSONB,
    intake_schema_version INT,
    scope_summary_source TEXT
) ON COMMIT DROP;

INSERT INTO seed_tasks (
    id,
    customer_id,
    category_name,
    description,
    budget,
    location_lat,
    location_lng,
    location_text,
    status,
    scheduled_offset,
    created_offset,
    updated_offset,
    intake_answers_json,
    intake_schema_version,
    scope_summary_source
) VALUES
    ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Cleaning',
        'Window cleaning for a two-bedroom apartment', 65000, 47.91840, 106.91770,
        'Sukhbaatar district, 1-r khoroo', 'OPEN', interval '18 hours', interval '-1 hour', interval '-20 minutes',
        '{"windows": 7, "has_balcony": true}'::jsonb, 1, 'USER_EDITED'),
    ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Furniture Assembly',
        'Assemble a three-door wardrobe and study desk', 120000, 47.88490, 106.90510,
        'Khan-Uul district, 11-r khoroo', 'OPEN', interval '30 hours', interval '-2 hours', interval '-45 minutes',
        '{"items": ["wardrobe", "desk"]}'::jsonb, 1, 'TEMPLATE'),
    ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Plumbing',
        'Fix a leaking kitchen sink and replace the trap', 85000, 47.91710, 106.89230,
        'Bayangol district, 4-r khoroo', 'OPEN', interval '10 hours', interval '-3 hours', interval '-30 minutes',
        '{"leak_source": "under_sink"}'::jsonb, 1, 'USER_EDITED'),
    ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Delivery & Errands',
        'Pick up documents from downtown and deliver to an office park', 45000, 47.92220, 106.96890,
        'Bayanzurkh district, 26-r khoroo', 'OPEN', interval '4 hours', interval '-4 hours', interval '-1 hour',
        '{"stops": 2}'::jsonb, 1, 'TEMPLATE'),
    ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Painting',
        'Paint a nursery in warm white before Sunday', 180000, 47.93080, 106.90910,
        'Chingeltei district, 5-r khoroo', 'OPEN', interval '48 hours', interval '-5 hours', interval '-90 minutes',
        '{"walls": 4, "paint_provided": false}'::jsonb, 1, 'USER_EDITED'),
    ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Electrical',
        'Replace three hallway light fixtures and one dimmer switch', 95000, 47.87750, 106.87420,
        'Khan-Uul district, 3-r khoroo', 'OPEN', interval '26 hours', interval '-6 hours', interval '-2 hours',
        '{"fixtures": 3, "switches": 1}'::jsonb, 1, 'USER_EDITED'),
    ('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'Moving & Hauling',
        'Move a sofa, rug, and twelve boxes to a new apartment', 160000, 47.91560, 106.88720,
        'Bayangol district, 17-r khoroo', 'ASSIGNED', interval '8 hours', interval '-26 hours', interval '-3 hours',
        '{"floors": 7, "elevator": true}'::jsonb, 1, 'TEMPLATE'),
    ('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'Heating & HVAC',
        'Service an apartment boiler before the weekend', 140000, 47.87300, 106.89440,
        'Khan-Uul district, 15-r khoroo', 'ASSIGNED', interval '6 hours', interval '-28 hours', interval '-2 hours',
        '{"boiler_type": "gas"}'::jsonb, 1, 'TEMPLATE'),
    ('40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Cleaning',
        'Deep clean after a small renovation', 210000, 47.91990, 106.91750,
        'Sukhbaatar district, 6-r khoroo', 'COMPLETED', interval '-2 days', interval '-6 days', interval '-2 days',
        '{"rooms": 4, "post_renovation": true}'::jsonb, 1, 'USER_EDITED'),
    ('40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', 'Furniture Assembly',
        'Build a workstation desk and ergonomic chair', 90000, 47.91810, 106.88750,
        'Bayangol district, 2-r khoroo', 'COMPLETED', interval '-5 days', interval '-8 days', interval '-5 days',
        '{"items": ["desk", "chair"]}'::jsonb, 1, 'TEMPLATE'),
    ('40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'Electrical',
        'Emergency outlet replacement in an older apartment', 70000, 47.93140, 106.90680,
        'Chingeltei district, 3-r khoroo', 'NO_SHOW', interval '-1 day', interval '-2 days', interval '-1 day',
        '{"outlets": 2}'::jsonb, 1, 'USER_EDITED'),
    ('40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'Delivery & Errands',
        'Grocery and pharmacy run for an elderly parent', 38000, 47.91960, 106.91740,
        'Sukhbaatar district, 8-r khoroo', 'CANCELLED', interval '-12 hours', interval '-36 hours', interval '-10 hours',
        '{"stops": 3}'::jsonb, 1, 'TEMPLATE'),
    ('40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', 'Carpentry & Doors',
        'Install a bedroom door handle and fix a sticking latch', 52000, 47.87950, 106.88790,
        'Khan-Uul district, 19-r khoroo', 'COMPLETED', interval '-8 days', interval '-11 days', interval '-8 days',
        '{"issue": "sticking latch"}'::jsonb, 1, 'USER_EDITED'),
    ('40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000005', 'Flooring & Tiling',
        'Regrout bathroom floor tiles before guests arrive', 130000, 47.92200, 106.81300,
        'Songinokhairkhan district, 18-r khoroo', 'OPEN', interval '54 hours', interval '-5 hours', interval '-4 hours',
        '{"square_meters": 6}'::jsonb, 1, 'USER_EDITED'),
    ('40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'Appliance Repair',
        'Repair a washing machine that stops mid-cycle', 110000, 47.91800, 106.88650,
        'Bayangol district, 6-r khoroo', 'OPEN', interval '22 hours', interval '-7 hours', interval '-2 hours',
        '{"appliance": "washing_machine"}'::jsonb, 1, 'USER_EDITED');

INSERT INTO tasks (
    id,
    customer_id,
    category_id,
    description,
    budget,
    location_lat,
    location_lng,
    location_text,
    status,
    scheduled_at,
    intake_answers_json,
    intake_schema_version,
    scope_summary_source,
    created_at,
    updated_at
)
SELECT
    st.id,
    st.customer_id,
    c.id,
    st.description,
    st.budget,
    st.location_lat,
    st.location_lng,
    st.location_text,
    st.status,
    now() + st.scheduled_offset,
    st.intake_answers_json,
    st.intake_schema_version,
    st.scope_summary_source,
    now() + st.created_offset,
    now() + st.updated_offset
FROM seed_tasks st
JOIN categories c ON c.name = st.category_name
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_task_photos (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    storage_key TEXT NOT NULL,
    sort_order INT NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_task_photos (id, task_id, storage_key, sort_order) VALUES
    ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'seed/tasks/t1/window-1.jpg', 1),
    ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'seed/tasks/t2/wardrobe-1.jpg', 1),
    ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000005', 'seed/tasks/t5/nursery-1.jpg', 1),
    ('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000007', 'seed/tasks/t7/move-1.jpg', 1),
    ('41000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000009', 'seed/tasks/t9/deepclean-1.jpg', 1),
    ('41000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000014', 'seed/tasks/t14/tile-1.jpg', 1);

INSERT INTO task_photos (id, task_id, storage_key, sort_order)
SELECT stp.id, stp.task_id, stp.storage_key, stp.sort_order
FROM seed_task_photos stp
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_task_applications (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    tasker_id UUID NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL,
    relevance_score DOUBLE PRECISION,
    recommended BOOLEAN,
    created_offset INTERVAL NOT NULL,
    selected_offset INTERVAL,
    respond_by_offset INTERVAL
) ON COMMIT DROP;

INSERT INTO seed_task_applications (
    id,
    task_id,
    tasker_id,
    message,
    status,
    relevance_score,
    recommended,
    created_offset,
    selected_offset,
    respond_by_offset
) VALUES
    ('42000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003',
        'I can take the window cleaning tomorrow morning and bring my own supplies.', 'APPLIED', 0.96, true,
        interval '-50 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        'Available after 10 AM and comfortable with high windows.', 'APPLIED', 0.91, true,
        interval '-45 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004',
        'Can send a helper as well if you need interior mirrors cleaned.', 'APPLIED', 0.82, false,
        interval '-40 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004',
        'Assembly is my main category. I can finish both items in one visit.', 'SELECTED', 0.97, true,
        interval '-90 minutes', interval '-60 minutes', interval '6 hours'),
    ('42000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007',
        'I have tools ready if the furniture arrived boxed today.', 'APPLIED', 0.85, false,
        interval '-80 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
        'I can bring replacement parts and a new trap if needed.', 'SELECTED', 0.95, true,
        interval '-2 hours', interval '-90 minutes', interval '3 hours'),
    ('42000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002',
        'Can check the sink after my current job wraps up.', 'APPLIED', 0.88, true,
        interval '-150 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005',
        'I know the office park and can complete both stops in one loop.', 'APPLIED', 0.93, true,
        interval '-150 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000007',
        'Can pick this up if needed later this afternoon.', 'APPLIED', 0.74, false,
        interval '-120 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003',
        'I can prep, patch, and paint in a single day.', 'APPLIED', 0.94, true,
        interval '-4 hours', NULL, NULL),
    ('42000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006',
        'Available with drop cloths and a compact spray rig.', 'APPLIED', 0.86, false,
        interval '-210 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002',
        'I can replace the dimmer and test the circuit load.', 'APPLIED', 0.92, true,
        interval '-5 hours', NULL, NULL),
    ('42000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000007',
        'Available after lunch if the hardware is already on site.', 'APPLIED', 0.81, false,
        interval '-250 minutes', NULL, NULL),
    ('42000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001',
        'Confirmed for the move and bringing one extra set of straps.', 'ACCEPTED', 0.89, true,
        interval '-24 hours', interval '-23 hours', NULL),
    ('42000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006',
        'Boiler service confirmed. I will inspect the valve and pressure tank.', 'ACCEPTED', 0.94, true,
        interval '-24 hours', interval '-23 hours', NULL),
    ('42000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000003',
        'Confirmed for post-renovation cleaning with two cleaners.', 'ACCEPTED', 0.98, true,
        interval '-5 days', interval '-5 days', NULL),
    ('42000000-0000-0000-0000-000000000017', '40000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000004',
        'Confirmed for assembly. Please keep the bolts and manuals together.', 'ACCEPTED', 0.97, true,
        interval '-7 days', interval '-7 days', NULL),
    ('42000000-0000-0000-0000-000000000018', '40000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002',
        'Emergency call accepted. I can come first thing in the morning.', 'ACCEPTED', 0.90, true,
        interval '-36 hours', interval '-35 hours', NULL),
    ('42000000-0000-0000-0000-000000000019', '40000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000005',
        'I can handle the grocery and pharmacy stops today.', 'ACCEPTED', 0.87, true,
        interval '-30 hours', interval '-29 hours', NULL),
    ('42000000-0000-0000-0000-000000000020', '40000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000007',
        'Door handle job confirmed. I can also align the latch plate.', 'ACCEPTED', 0.91, true,
        interval '-10 days', interval '-10 days', NULL),
    ('42000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000002',
        'I can diagnose the washer and quote the part if needed.', 'APPLIED', 0.89, true,
        interval '-6 hours', NULL, NULL),
    ('42000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000006',
        'Available tonight with common drain-pump replacements.', 'APPLIED', 0.84, false,
        interval '-5 hours', NULL, NULL);

INSERT INTO task_applications (
    id,
    task_id,
    tasker_id,
    message,
    status,
    relevance_score,
    recommended,
    selected_at,
    respond_by_at,
    created_at
)
SELECT
    sta.id,
    sta.task_id,
    sta.tasker_id,
    sta.message,
    sta.status,
    sta.relevance_score,
    sta.recommended,
    CASE WHEN sta.selected_offset IS NULL THEN NULL ELSE now() + sta.selected_offset END,
    CASE WHEN sta.respond_by_offset IS NULL THEN NULL ELSE now() + sta.respond_by_offset END,
    now() + sta.created_offset
FROM seed_task_applications sta
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_bookings (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    tasker_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    price INT NOT NULL,
    status TEXT NOT NULL,
    settlement_mode TEXT NOT NULL,
    confirmed_scheduled_offset INTERVAL NOT NULL,
    late_cancel_incident BOOLEAN NOT NULL,
    liability_disclaimer_accepted BOOLEAN NOT NULL,
    liability_disclaimer_offset INTERVAL NOT NULL,
    created_offset INTERVAL NOT NULL,
    updated_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_bookings (
    id,
    task_id,
    tasker_id,
    customer_id,
    price,
    status,
    settlement_mode,
    confirmed_scheduled_offset,
    late_cancel_incident,
    liability_disclaimer_accepted,
    liability_disclaimer_offset,
    created_offset,
    updated_offset
) VALUES
    ('43000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002', 175000, 'ASSIGNED', 'DIRECT', interval '8 hours', false, true,
        interval '-20 hours', interval '-24 hours', interval '-3 hours'),
    ('43000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000003', 155000, 'PAID', 'DIRECT', interval '6 hours', false, true,
        interval '-20 hours', interval '-25 hours', interval '-2 hours'),
    ('43000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001', 225000, 'COMPLETED', 'DIRECT', interval '-2 days', false, true,
        interval '-6 days', interval '-5 days', interval '-2 days'),
    ('43000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000005', 98000, 'COMPLETED', 'DIRECT', interval '-5 days', false, true,
        interval '-8 days', interval '-7 days', interval '-5 days'),
    ('43000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000004', 76000, 'NO_SHOW', 'DIRECT', interval '-1 day', false, true,
        interval '-2 days', interval '-2 days', interval '-1 day'),
    ('43000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000002', 42000, 'CANCELLED', 'DIRECT', interval '-14 hours', true, true,
        interval '-30 hours', interval '-30 hours', interval '-10 hours'),
    ('43000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000007',
        '10000000-0000-0000-0000-000000000003', 58000, 'COMPLETED', 'DIRECT', interval '-8 days', false, true,
        interval '-10 days', interval '-10 days', interval '-8 days');

INSERT INTO bookings (
    id,
    task_id,
    tasker_id,
    customer_id,
    price,
    status,
    liability_disclaimer_accepted,
    liability_disclaimer_accepted_at,
    confirmed_scheduled_at,
    settlement_mode,
    late_cancel_incident,
    created_at,
    updated_at
)
SELECT
    sb.id,
    sb.task_id,
    sb.tasker_id,
    sb.customer_id,
    sb.price,
    sb.status,
    sb.liability_disclaimer_accepted,
    now() + sb.liability_disclaimer_offset,
    now() + sb.confirmed_scheduled_offset,
    sb.settlement_mode,
    sb.late_cancel_incident,
    now() + sb.created_offset,
    now() + sb.updated_offset
FROM seed_bookings sb
ON CONFLICT (id) DO NOTHING;

INSERT INTO credited_bookings (booking_id)
SELECT sb.id
FROM seed_bookings sb
WHERE sb.status = 'COMPLETED'
ON CONFLICT (booking_id) DO NOTHING;

CREATE TEMP TABLE seed_conversations (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    tasker_id UUID NOT NULL,
    created_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_conversations (id, task_id, customer_id, tasker_id, created_offset) VALUES
    ('44000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007',
        '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', interval '-22 hours'),
    ('44000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000008',
        '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', interval '-24 hours'),
    ('44000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000009',
        '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', interval '-5 days'),
    ('44000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000010',
        '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', interval '-6 days'),
    ('44000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000011',
        '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', interval '-2 days'),
    ('44000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000012',
        '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', interval '-30 hours'),
    ('44000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', interval '-50 minutes');

INSERT INTO conversations (id, task_id, customer_id, tasker_id, created_at)
SELECT sc.id, sc.task_id, sc.customer_id, sc.tasker_id, now() + sc.created_offset
FROM seed_conversations sc
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    sent_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_messages (id, conversation_id, sender_id, content, sent_offset) VALUES
    ('45000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002', 'Can you help after 6 PM?', interval '-21 hours'),
    ('45000000-0000-0000-0000-000000000002', '44000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', 'Yes, I can arrive around 18:30 with a helper.', interval '-20 hours'),
    ('45000000-0000-0000-0000-000000000003', '44000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003', 'Boiler pressure drops every morning.', interval '-23 hours'),
    ('45000000-0000-0000-0000-000000000004', '44000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000006', 'I will bring a replacement valve just in case.', interval '-22 hours'),
    ('45000000-0000-0000-0000-000000000005', '44000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001', 'Please focus on the construction dust near the balcony.', interval '-119 hours'),
    ('45000000-0000-0000-0000-000000000006', '44000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000003', 'Understood, we will bring an industrial vacuum.', interval '-118 hours'),
    ('45000000-0000-0000-0000-000000000007', '44000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000005', 'Parking is available in the basement.', interval '-143 hours'),
    ('45000000-0000-0000-0000-000000000008', '44000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000004', 'Perfect, send the unit number and I will call on arrival.', interval '-142 hours'),
    ('45000000-0000-0000-0000-000000000009', '44000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000004', 'Please call when you are nearby.', interval '-45 hours'),
    ('45000000-0000-0000-0000-000000000010', '44000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000002', 'On my way, should be there in 15 minutes.', interval '-44 hours'),
    ('45000000-0000-0000-0000-000000000011', '44000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000002', 'My mother prefers the pharmacy stop first.', interval '-29 hours'),
    ('45000000-0000-0000-0000-000000000012', '44000000-0000-0000-0000-000000000006',
        '20000000-0000-0000-0000-000000000005', 'Understood, I will send the receipt after checkout.', interval '-28 hours'),
    ('45000000-0000-0000-0000-000000000013', '44000000-0000-0000-0000-000000000007',
        '10000000-0000-0000-0000-000000000001', 'The windows are on the windy side, bring a long squeegee.', interval '-45 minutes'),
    ('45000000-0000-0000-0000-000000000014', '44000000-0000-0000-0000-000000000007',
        '20000000-0000-0000-0000-000000000003', 'No problem, I have one in the van.', interval '-40 minutes');

INSERT INTO messages (id, conversation_id, sender_id, content, sent_at)
SELECT sm.id, sm.conversation_id, sm.sender_id, sm.content, now() + sm.sent_offset
FROM seed_messages sm
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_disputes (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    raised_by UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL,
    resolution_action TEXT,
    wrongful_party_user_id UUID,
    resolution_notes TEXT,
    created_offset INTERVAL NOT NULL,
    resolved_offset INTERVAL
) ON COMMIT DROP;

INSERT INTO seed_disputes (
    id,
    booking_id,
    raised_by,
    reason,
    status,
    resolution_action,
    wrongful_party_user_id,
    resolution_notes,
    created_offset,
    resolved_offset
) VALUES
    ('47000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000004',
        'Tasker missed the confirmed arrival window and stopped responding.',
        'ESCALATED', 'ESCALATE', NULL, 'Waiting for support review.', interval '-22 hours', NULL),
    ('47000000-0000-0000-0000-000000000002', '43000000-0000-0000-0000-000000000006',
        '10000000-0000-0000-0000-000000000002',
        'Runner marked arrival but never completed the pharmacy stop.',
        'RESOLVED_CUSTOMER', 'REFUND', '20000000-0000-0000-0000-000000000005',
        'Customer refunded in full.', interval '-20 hours', interval '-8 hours'),
    ('47000000-0000-0000-0000-000000000003', '43000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001',
        'Dust remained inside the wardrobe after cleaning.',
        'RESOLVED_TASKER', 'RELEASE', '10000000-0000-0000-0000-000000000001',
        'Evidence showed the completed scope was met.', interval '-36 hours', interval '-24 hours');

INSERT INTO disputes (
    id,
    booking_id,
    raised_by,
    reason,
    status,
    resolution_action,
    wrongful_party_user_id,
    resolution_notes,
    created_at,
    resolved_at
)
SELECT
    sd.id,
    sd.booking_id,
    sd.raised_by,
    sd.reason,
    sd.status,
    sd.resolution_action,
    sd.wrongful_party_user_id,
    sd.resolution_notes,
    now() + sd.created_offset,
    CASE WHEN sd.resolved_offset IS NULL THEN NULL ELSE now() + sd.resolved_offset END
FROM seed_disputes sd
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_dispute_evidence (
    id UUID PRIMARY KEY,
    dispute_id UUID NOT NULL,
    type TEXT NOT NULL,
    storage_key TEXT,
    text_payload TEXT,
    created_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_dispute_evidence (id, dispute_id, type, storage_key, text_payload, created_offset) VALUES
    ('50000000-0000-0000-0000-000000000001', '47000000-0000-0000-0000-000000000001',
        'WRITTEN_TIMELINE', NULL,
        'Tasker accepted at 10:00, promised arrival by 12:00, and never arrived by 14:30.', interval '-21 hours'),
    ('50000000-0000-0000-0000-000000000002', '47000000-0000-0000-0000-000000000001',
        'CHAT_EXCERPT', NULL,
        'See conversation message: ''On my way, should be there in 15 minutes.''', interval '-20 hours'),
    ('50000000-0000-0000-0000-000000000003', '47000000-0000-0000-0000-000000000002',
        'PHOTO', 'seed/disputes/d2/receipt.jpg', NULL, interval '-18 hours'),
    ('50000000-0000-0000-0000-000000000004', '47000000-0000-0000-0000-000000000003',
        'WRITTEN_TIMELINE', NULL,
        'Customer reported dust inside the wardrobe; tasker uploaded completion photos.', interval '-35 hours');

INSERT INTO dispute_evidence (id, dispute_id, type, storage_key, text_payload, created_at)
SELECT sde.id, sde.dispute_id, sde.type, sde.storage_key, sde.text_payload, now() + sde.created_offset
FROM seed_dispute_evidence sde
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_booking_reviews (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    reviewee_id UUID NOT NULL,
    quality_rating INT NOT NULL,
    punctuality_rating INT NOT NULL,
    communication_rating INT NOT NULL,
    clarity_rating INT NOT NULL,
    respectfulness_rating INT NOT NULL,
    comment TEXT,
    created_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_booking_reviews (
    id,
    booking_id,
    reviewer_id,
    reviewee_id,
    quality_rating,
    punctuality_rating,
    communication_rating,
    clarity_rating,
    respectfulness_rating,
    comment,
    created_offset
) VALUES
    ('48000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003',
        4, 5, 5, 4, 5, 'Team arrived on time and handled renovation dust well.', interval '-46 hours'),
    ('48000000-0000-0000-0000-000000000002', '43000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
        5, 5, 5, 5, 5, 'Instructions were clear and access was easy.', interval '-45 hours'),
    ('48000000-0000-0000-0000-000000000003', '43000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004',
        5, 5, 4, 5, 5, 'Fast assembly and very tidy.', interval '-4 days'),
    ('48000000-0000-0000-0000-000000000004', '43000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005',
        5, 5, 5, 5, 5, 'Everything was ready on arrival.', interval '-95 hours'),
    ('48000000-0000-0000-0000-000000000005', '43000000-0000-0000-0000-000000000007',
        '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000007',
        4, 4, 5, 5, 5, 'Quick fix and clean finish.', interval '-7 days');

INSERT INTO booking_reviews (
    id,
    booking_id,
    reviewer_id,
    reviewee_id,
    quality_rating,
    punctuality_rating,
    communication_rating,
    clarity_rating,
    respectfulness_rating,
    comment,
    created_at
)
SELECT
    sbr.id,
    sbr.booking_id,
    sbr.reviewer_id,
    sbr.reviewee_id,
    sbr.quality_rating,
    sbr.punctuality_rating,
    sbr.communication_rating,
    sbr.clarity_rating,
    sbr.respectfulness_rating,
    sbr.comment,
    now() + sbr.created_offset
FROM seed_booking_reviews sbr
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasker_badges (tasker_id, badge_type, assigned_at, revoked_at) VALUES
    ('20000000-0000-0000-0000-000000000001', 'PRO', now() - interval '70 days', NULL),
    ('20000000-0000-0000-0000-000000000003', 'PRO', now() - interval '35 days', NULL),
    ('20000000-0000-0000-0000-000000000004', 'PRO', now() - interval '20 days', NULL)
ON CONFLICT (tasker_id, badge_type) DO NOTHING;

INSERT INTO tasker_reliability_scores (
    tasker_id,
    score,
    completion_rate,
    punctuality_rate,
    cancellation_rate,
    review_avg,
    window_days,
    computed_at
) VALUES
    ('20000000-0000-0000-0000-000000000001', 97.4, 0.98, 0.96, 0.01, 4.9, 90, now() - interval '2 hours'),
    ('20000000-0000-0000-0000-000000000002', 84.1, 0.89, 0.81, 0.05, 4.6, 90, now() - interval '6 hours'),
    ('20000000-0000-0000-0000-000000000003', 95.2, 0.97, 0.94, 0.02, 4.8, 90, now() - interval '3 hours'),
    ('20000000-0000-0000-0000-000000000004', 96.0, 0.98, 0.95, 0.01, 4.9, 90, now() - interval '4 hours'),
    ('20000000-0000-0000-0000-000000000005', 78.6, 0.82, 0.79, 0.09, 4.2, 90, now() - interval '5 hours'),
    ('20000000-0000-0000-0000-000000000006', 92.3, 0.94, 0.90, 0.03, 4.7, 90, now() - interval '100 minutes'),
    ('20000000-0000-0000-0000-000000000007', 89.4, 0.91, 0.88, 0.04, 4.6, 90, now() - interval '8 hours')
ON CONFLICT (tasker_id) DO NOTHING;

INSERT INTO review_enforcement_cases (
    id,
    booking_id,
    user_id,
    reason_code,
    status,
    investigation_active,
    triggered_at,
    resolved_at
) VALUES
    ('51000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000007',
        '20000000-0000-0000-0000-000000000007', 'MISSING_REVIEW', 'PENDING', false,
        now() - interval '7 days', NULL),
    ('51000000-0000-0000-0000-000000000002', '43000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001', 'MISSING_REVIEW', 'COMPLETED', false,
        now() - interval '46 hours', now() - interval '45 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO task_rescue_events (id, task_id, triggered_at, trigger_window, actions_json, created_at) VALUES
    ('4f000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000014',
        now() - interval '2 hours', 'DAYTIME',
        '{"boosted": true, "channels": ["district_push", "manual_review"], "note": "No applications after 3 hours."}'::jsonb,
        now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_ledger_entries (
    id UUID PRIMARY KEY,
    user_id UUID,
    amount INT NOT NULL,
    type TEXT NOT NULL,
    reference_id UUID,
    description TEXT NOT NULL,
    created_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_ledger_entries (id, user_id, amount, type, reference_id, description, created_offset) VALUES
    ('49000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 500000, 'DEPOSIT', NULL,
        'Top up for household tasks', interval '-20 days'),
    ('49000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 250000, 'DEPOSIT', NULL,
        'Wallet top up', interval '-15 days'),
    ('49000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 300000, 'DEPOSIT', NULL,
        'Wallet top up', interval '-12 days'),
    ('49000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 42000, 'REFUND',
        '43000000-0000-0000-0000-000000000006', 'Refund for cancelled delivery errand', interval '-8 hours'),
    ('49000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 175000, 'HOLD',
        '43000000-0000-0000-0000-000000000001', 'Funds held for assigned moving booking', interval '-20 hours'),
    ('49000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 155000, 'HOLD',
        '43000000-0000-0000-0000-000000000002', 'Funds held for paid boiler service', interval '-18 hours'),
    ('49000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', 225000, 'RELEASE',
        '43000000-0000-0000-0000-000000000003', 'Payout released after completion', interval '-2 days'),
    ('49000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', 98000, 'RELEASE',
        '43000000-0000-0000-0000-000000000004', 'Payout released after furniture assembly', interval '-5 days'),
    ('49000000-0000-0000-0000-000000000009', NULL, 12000, 'FEE',
        '43000000-0000-0000-0000-000000000004', 'Platform fee for completed assembly booking', interval '-5 days'),
    ('49000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000005', 15000, 'CONFISCATE',
        '43000000-0000-0000-0000-000000000006', 'Penalty for cancelled errand dispute', interval '-8 hours'),
    ('49000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000007', 58000, 'RELEASE',
        '43000000-0000-0000-0000-000000000007', 'Payout released after door repair', interval '-8 days'),
    ('49000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000003', 120000, 'PAYOUT', NULL,
        'Manual payout to bank account', interval '-2 days');

INSERT INTO ledger_entries (id, user_id, amount, type, reference_id, description, created_at)
SELECT sle.id, sle.user_id, sle.amount, sle.type, sle.reference_id, sle.description, now() + sle.created_offset
FROM seed_ledger_entries sle
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_payout_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    amount INT NOT NULL,
    status TEXT NOT NULL,
    created_offset INTERVAL NOT NULL,
    processed_offset INTERVAL
) ON COMMIT DROP;

INSERT INTO seed_payout_requests (id, user_id, amount, status, created_offset, processed_offset) VALUES
    ('4a000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 120000, 'PROCESSED',
        interval '-3 days', interval '-2 days'),
    ('4a000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 95000, 'PENDING',
        interval '-6 hours', NULL),
    ('4a000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', 150000, 'REJECTED',
        interval '-10 days', interval '-9 days');

INSERT INTO payout_requests (id, user_id, amount, status, created_at, processed_at)
SELECT
    spr.id,
    spr.user_id,
    spr.amount,
    spr.status,
    now() + spr.created_offset,
    CASE WHEN spr.processed_offset IS NULL THEN NULL ELSE now() + spr.processed_offset END
FROM seed_payout_requests spr
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    event_key TEXT,
    provider_message_id TEXT,
    error_code TEXT,
    created_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_notifications (
    id,
    user_id,
    type,
    channel,
    status,
    event_key,
    provider_message_id,
    error_code,
    created_offset
) VALUES
    ('4b000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        'APPLICATION_RECEIVED', 'PUSH', 'SENT', 'app-4201', 'push-001', NULL, interval '-45 minutes'),
    ('4b000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003',
        'MESSAGE_RECEIVED', 'PUSH', 'SENT', 'msg-45014', 'push-002', NULL, interval '-40 minutes'),
    ('4b000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
        'BOOKING_ASSIGNED', 'SMS', 'SENT', 'booking-4301', 'sms-001', NULL, interval '-3 hours'),
    ('4b000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000006',
        'BOOKING_PAID', 'PUSH', 'SENT', 'booking-4302', 'push-003', NULL, interval '-2 hours'),
    ('4b000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004',
        'NO_SHOW_REPORTED', 'PUSH', 'SENT', 'booking-4305', 'push-004', NULL, interval '-20 hours'),
    ('4b000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002',
        'REFUND_PROCESSED', 'PUSH', 'SENT', 'dispute-4702', 'push-005', NULL, interval '-8 hours'),
    ('4b000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000006',
        'VERIFICATION_PENDING', 'EMAIL', 'SENT', 'verification-4606', 'email-001', NULL, interval '-16 hours'),
    ('4b000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001',
        'PAYOUT_PENDING', 'PUSH', 'FAILED', 'payout-4a02', NULL, 'RATE_LIMIT', interval '-5 hours');

INSERT INTO notification_log (
    id,
    user_id,
    type,
    channel,
    status,
    event_key,
    provider_message_id,
    error_code,
    created_at
)
SELECT
    sn.id,
    sn.user_id,
    sn.type,
    sn.channel,
    sn.status,
    sn.event_key,
    sn.provider_message_id,
    sn.error_code,
    now() + sn.created_offset
FROM seed_notifications sn
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE seed_analytics (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID,
    properties JSONB,
    time_offset INTERVAL NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_analytics (id, name, user_id, properties, time_offset) VALUES
    ('4c000000-0000-0000-0000-000000000001', 'task_posted', '10000000-0000-0000-0000-000000000001',
        '{"task_id": "40000000-0000-0000-0000-000000000001"}'::jsonb, interval '-1 hour'),
    ('4c000000-0000-0000-0000-000000000002', 'task_viewed', '20000000-0000-0000-0000-000000000001',
        '{"task_id": "40000000-0000-0000-0000-000000000001"}'::jsonb, interval '-55 minutes'),
    ('4c000000-0000-0000-0000-000000000003', 'application_submitted', '20000000-0000-0000-0000-000000000003',
        '{"task_id": "40000000-0000-0000-0000-000000000001"}'::jsonb, interval '-50 minutes'),
    ('4c000000-0000-0000-0000-000000000004', 'task_posted', '10000000-0000-0000-0000-000000000005',
        '{"task_id": "40000000-0000-0000-0000-000000000005"}'::jsonb, interval '-5 hours'),
    ('4c000000-0000-0000-0000-000000000005', 'booking_assigned', '10000000-0000-0000-0000-000000000002',
        '{"booking_id": "43000000-0000-0000-0000-000000000001"}'::jsonb, interval '-3 hours'),
    ('4c000000-0000-0000-0000-000000000006', 'booking_paid', '10000000-0000-0000-0000-000000000003',
        '{"booking_id": "43000000-0000-0000-0000-000000000002"}'::jsonb, interval '-2 hours'),
    ('4c000000-0000-0000-0000-000000000007', 'booking_completed', '20000000-0000-0000-0000-000000000003',
        '{"booking_id": "43000000-0000-0000-0000-000000000003"}'::jsonb, interval '-2 days'),
    ('4c000000-0000-0000-0000-000000000008', 'dispute_opened', '10000000-0000-0000-0000-000000000004',
        '{"dispute_id": "47000000-0000-0000-0000-000000000001"}'::jsonb, interval '-22 hours'),
    ('4c000000-0000-0000-0000-000000000009', 'verification_submitted', '20000000-0000-0000-0000-000000000006',
        '{"verification_id": "46000000-0000-0000-0000-000000000006"}'::jsonb, interval '-16 hours'),
    ('4c000000-0000-0000-0000-000000000010', 'task_rescue_triggered', NULL,
        '{"task_id": "40000000-0000-0000-0000-000000000014"}'::jsonb, interval '-2 hours'),
    ('4c000000-0000-0000-0000-000000000011', 'payout_requested', '20000000-0000-0000-0000-000000000001',
        '{"payout_id": "4a000000-0000-0000-0000-000000000002"}'::jsonb, interval '-6 hours'),
    ('4c000000-0000-0000-0000-000000000012', 'review_submitted', '10000000-0000-0000-0000-000000000003',
        '{"booking_id": "43000000-0000-0000-0000-000000000007"}'::jsonb, interval '-7 days');

INSERT INTO analytics_events (id, name, user_id, properties, timestamp)
SELECT sa.id, sa.name, sa.user_id, sa.properties, now() + sa.time_offset
FROM seed_analytics sa
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_intents (payment_id, booking_id, processed) VALUES
    ('52000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', false),
    ('52000000-0000-0000-0000-000000000002', '43000000-0000-0000-0000-000000000002', true),
    ('52000000-0000-0000-0000-000000000003', '43000000-0000-0000-0000-000000000003', true),
    ('52000000-0000-0000-0000-000000000004', '43000000-0000-0000-0000-000000000004', true)
ON CONFLICT (payment_id) DO NOTHING;
