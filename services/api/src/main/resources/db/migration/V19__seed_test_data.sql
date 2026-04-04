-- V19__seed_test_data.sql
-- Adds deterministic sample rows for the main schema modules so local/dev databases have 10 rows per target table.

DO $$
DECLARE
    dataset_size INT := 10;
    user_count INT := 10;
    customer_count INT := 5;
    now_ts TIMESTAMPTZ := now();
    phone_prefix TEXT := '+97699';
    cat_ids UUID[];
    cat_count INT;
    customer_ids UUID[] := '{}';
    tasker_ids UUID[] := '{}';
    all_user_ids UUID[];
    task_ids UUID[] := '{}';
    task_customers UUID[] := '{}';
    booking_ids UUID[] := '{}';
    conversation_ids UUID[] := '{}';
    booking_statuses TEXT[] := ARRAY['ASSIGNED', 'PAID', 'COMPLETED', 'CANCELLED'];
    task_statuses TEXT[] := ARRAY['OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    dispute_statuses TEXT[] := ARRAY['OPEN', 'ESCALATED', 'RESOLVED_TASKER', 'RESOLVED_CUSTOMER'];
    application_statuses TEXT[] := ARRAY['APPLIED', 'SELECTED', 'ACCEPTED', 'DECLINED', 'EXPIRED'];
    payout_statuses TEXT[] := ARRAY['PENDING', 'PROCESSED', 'REJECTED'];
    notif_statuses TEXT[] := ARRAY['SENT', 'FAILED'];
    notif_channels TEXT[] := ARRAY['EMAIL', 'SMS', 'PUSH'];
    notif_types TEXT[] := ARRAY['SAMPLE_TASK', 'SAMPLE_ALERT'];
    i INT;
    user_id UUID;
    task_id UUID;
    booking_id UUID;
    conversation_id UUID;
    candidate_customer UUID;
    candidate_tasker UUID;
    dispute_status TEXT;
    dispute_resolution_action TEXT;
    dispute_wrongful_party UUID;
BEGIN
    SELECT array_agg(id ORDER BY sort_order) INTO cat_ids FROM categories;
    cat_count := array_length(cat_ids, 1);
    IF cat_count IS NULL OR cat_count = 0 THEN
        RAISE EXCEPTION 'Categories must be seeded before running V19__seed_test_data.sql';
    END IF;

    IF (SELECT COUNT(*) FROM tasks WHERE description LIKE 'Sample task %') > 0 THEN
        RAISE NOTICE 'Sample schema data already present; skipping V19__seed_test_data.sql';
        RETURN;
    END IF;

    FOR i IN 1..user_count LOOP
        user_id := uuid_generate_v4();
        INSERT INTO users (id, phone, phone_blind_idx, role, status, created_at)
        VALUES (
            user_id,
            NULL,
            NULL,
            CASE WHEN i <= customer_count THEN 'CUSTOMER' ELSE 'TASKER' END,
            'ACTIVE',
            now_ts - (user_count - i) * interval '15 minutes'
        );
        IF i <= customer_count THEN
            customer_ids := array_append(customer_ids, user_id);
        ELSE
            tasker_ids := array_append(tasker_ids, user_id);
        END IF;
        INSERT INTO profiles (user_id, full_name, rating_avg, completed_tasks)
        VALUES (
            user_id,
            format('%s %s', CASE WHEN i <= customer_count THEN 'Customer' ELSE 'Tasker' END, i),
            4.2 + (i % 3)::NUMERIC * 0.1,
            i * 2
        );
    END LOOP;

    all_user_ids := customer_ids || tasker_ids;

    FOR i IN 1..array_length(all_user_ids, 1) LOOP
        INSERT INTO wallets (user_id, balance_mnt, held_balance_mnt, updated_at)
        VALUES (all_user_ids[i], 100_000 + i * 5_000, 5_000, now_ts);
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        task_id := uuid_generate_v4();
        candidate_customer := customer_ids[((i - 1) % array_length(customer_ids, 1)) + 1];
        task_ids := array_append(task_ids, task_id);
        task_customers := array_append(task_customers, candidate_customer);
        INSERT INTO tasks (
            id, customer_id, category_id, description, budget, location_lat, location_lng, location_text,
            status, scheduled_at, created_at, updated_at
        ) VALUES (
            task_id,
            candidate_customer,
            cat_ids[((i - 1) % cat_count) + 1],
            format('Sample task %s', i),
            40_000 + i * 2_000,
            47.8 + i * 0.01,
            106.9 + i * 0.01,
            format('Sample location %s', i),
            task_statuses[((i - 1) % array_length(task_statuses, 1)) + 1],
            now_ts + i * interval '1 day',
            now_ts - i * interval '10 minutes',
            now_ts - i * interval '5 minutes'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        INSERT INTO task_photos (id, task_id, storage_key, sort_order)
        VALUES (uuid_generate_v4(), task_ids[i], format('sample/task/%s/photo.jpg', task_ids[i]), i);
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        candidate_tasker := tasker_ids[((i - 1) % array_length(tasker_ids, 1)) + 1];
        INSERT INTO task_applications (id, task_id, tasker_id, message, status, created_at)
        VALUES (
            uuid_generate_v4(),
            task_ids[i],
            candidate_tasker,
            format('Hi, I can handle sample task %s', i),
            application_statuses[((i - 1) % array_length(application_statuses, 1)) + 1],
            now_ts - i * interval '30 minutes'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        booking_id := uuid_generate_v4();
        candidate_tasker := tasker_ids[((i - 1) % array_length(tasker_ids, 1)) + 1];
        booking_ids := array_append(booking_ids, booking_id);
        INSERT INTO bookings (
            id, task_id, tasker_id, customer_id, price, status, liability_disclaimer_accepted,
            created_at, updated_at
        ) VALUES (
            booking_id,
            task_ids[i],
            candidate_tasker,
            task_customers[i],
            60_000 + i * 1_500,
            booking_statuses[((i - 1) % array_length(booking_statuses, 1)) + 1],
            TRUE,
            now_ts - i * interval '1 hour',
            now_ts - (i - 1) * interval '20 minutes'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        conversation_id := uuid_generate_v4();
        conversation_ids := array_append(conversation_ids, conversation_id);
        INSERT INTO conversations (id, task_id, customer_id, tasker_id, created_at)
        VALUES (
            conversation_id,
            task_ids[i],
            task_customers[i],
            tasker_ids[((i - 1) % array_length(tasker_ids, 1)) + 1],
            now_ts - i * interval '2 hours'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        INSERT INTO messages (id, conversation_id, sender_id, content, sent_at)
        VALUES (
            uuid_generate_v4(),
            conversation_ids[i],
            CASE WHEN i % 2 = 0 THEN tasker_ids[((i - 1) % array_length(tasker_ids, 1)) + 1] ELSE task_customers[i] END,
            format('Sample message %s', i),
            now_ts - i * interval '15 minutes'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        dispute_status := dispute_statuses[((i - 1) % array_length(dispute_statuses, 1)) + 1];
        dispute_resolution_action := CASE
            WHEN dispute_status IN ('RESOLVED_TASKER', 'RESOLVED_CUSTOMER') THEN 'REFUND'
            WHEN dispute_status = 'ESCALATED' THEN 'ESCALATE'
            ELSE NULL
        END;
        dispute_wrongful_party := CASE
            WHEN dispute_status = 'RESOLVED_TASKER' THEN tasker_ids[((i - 1) % array_length(tasker_ids, 1)) + 1]
            WHEN dispute_status = 'RESOLVED_CUSTOMER' THEN task_customers[i]
            ELSE NULL
        END;
        INSERT INTO disputes (id, booking_id, raised_by, reason, status, resolution_action, wrongful_party_user_id, created_at)
        VALUES (
            uuid_generate_v4(),
            booking_ids[i],
            task_customers[i],
            format('Sample dispute reason %s', i),
            dispute_status,
            dispute_resolution_action,
            dispute_wrongful_party,
            now_ts - i * interval '12 hours'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        INSERT INTO booking_reviews (
            id, booking_id, reviewer_id, reviewee_id, quality_rating,
            punctuality_rating, communication_rating, clarity_rating,
            respectfulness_rating, comment, created_at
        )
        VALUES (
            uuid_generate_v4(),
            booking_ids[i],
            CASE WHEN i % 2 = 0 THEN tasker_ids[((i - 1) % array_length(tasker_ids, 1)) + 1] ELSE task_customers[i] END,
            CASE WHEN i % 2 = 0 THEN task_customers[i] ELSE tasker_ids[((i - 1) % array_length(tasker_ids, 1)) + 1] END,
            ((i % 5) + 1),
            (((i + 1) % 5) + 1),
            (((i + 2) % 5) + 1),
            (((i + 3) % 5) + 1),
            (((i + 4) % 5) + 1),
            format('Sample booking review %s', i),
            now_ts - i * interval '7 hours'
        );
    END LOOP;

    FOR i IN 1..array_length(all_user_ids, 1) LOOP
        INSERT INTO ledger_entries (id, user_id, amount, type, description, created_at)
        VALUES (
            uuid_generate_v4(),
            all_user_ids[i],
            10_000 * i,
            'DEPOSIT',
            format('Sample ledger entry %s', i),
            now_ts - i * interval '25 minutes'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        INSERT INTO payout_requests (id, user_id, amount, status, created_at, processed_at)
        VALUES (
            uuid_generate_v4(),
            tasker_ids[((i - 1) % array_length(tasker_ids, 1)) + 1],
            50_000 + i * 1_000,
            payout_statuses[((i - 1) % array_length(payout_statuses, 1)) + 1],
            now_ts - i * interval '3 hours',
            CASE WHEN ((i - 1) % array_length(payout_statuses, 1)) + 1 = 2 THEN now_ts - i * interval '1 hour' ELSE NULL END
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        INSERT INTO notification_log (id, user_id, type, channel, status, created_at)
        VALUES (
            uuid_generate_v4(),
            all_user_ids[((i - 1) % array_length(all_user_ids, 1)) + 1],
            notif_types[((i - 1) % array_length(notif_types, 1)) + 1],
            notif_channels[((i - 1) % array_length(notif_channels, 1)) + 1],
            notif_statuses[((i - 1) % array_length(notif_statuses, 1)) + 1],
            now_ts - i * interval '40 minutes'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        INSERT INTO analytics_events (id, name, user_id, properties, timestamp)
        VALUES (
            uuid_generate_v4(),
            'sample_event',
            all_user_ids[((i - 1) % array_length(all_user_ids, 1)) + 1],
            jsonb_build_object('sample', format('value %s', i)),
            now_ts - i * interval '5 minutes'
        );
    END LOOP;

    FOR i IN 1..dataset_size LOOP
        INSERT INTO payment_intents (payment_id, booking_id, processed)
        VALUES (
            uuid_generate_v4(),
            booking_ids[i],
            i % 2 = 0
        );
    END LOOP;

    FOR i IN 1..array_length(all_user_ids, 1) LOOP
        INSERT INTO device_tokens (user_id, token, platform, created_at)
        VALUES (
            all_user_ids[i],
            format('token-%s', i),
            CASE
                WHEN i % 3 = 0 THEN 'IOS'
                WHEN i % 3 = 1 THEN 'ANDROID'
                ELSE 'WEB'
            END,
            now_ts - i * interval '10 minutes'
        );
    END LOOP;
END
$$;
