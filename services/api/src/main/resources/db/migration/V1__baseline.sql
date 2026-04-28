--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg110+2)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg110+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS tiger;


--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS tiger_data;


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: fn_audit_events_immutable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_audit_events_immutable() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'audit_events are immutable: % operation not permitted', TG_OP;
END;
$$;


--
-- Name: tasks_set_location_point(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tasks_set_location_point() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF new.location_lat IS NOT NULL AND new.location_lng IS NOT NULL THEN
        new.location_point := st_setsrid(st_makepoint(new.location_lng, new.location_lat), 4326);
    ELSE
        new.location_point := NULL;
    END IF;
    RETURN new;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id uuid NOT NULL,
    booking_id uuid NOT NULL,
    raised_by uuid NOT NULL,
    reason text NOT NULL,
    status text NOT NULL,
    resolution_notes text,
    created_at timestamp with time zone NOT NULL,
    resolved_at timestamp with time zone,
    wrongful_party_user_id uuid,
    resolution_action text,
    evidence_reminder_sent_at timestamp with time zone,
    evidence_due_at timestamp with time zone,
    CONSTRAINT disputes_resolution_action_check CHECK (((resolution_action IS NULL) OR (resolution_action = ANY (ARRAY['RESOLVE_CUSTOMER'::text, 'RESOLVE_TASKER'::text, 'ESCALATE'::text, 'REFUND'::text, 'RELEASE'::text])))),
    CONSTRAINT disputes_status_check CHECK ((status = ANY (ARRAY['EVIDENCE_NEEDED'::text, 'OPEN'::text, 'RESOLVED_TASKER'::text, 'RESOLVED_CUSTOMER'::text, 'ESCALATED'::text, 'CLOSED_INSUFFICIENT_EVIDENCE'::text])))
);


--
-- Name: admin_dispute_queue_projection; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.admin_dispute_queue_projection AS
 SELECT id,
    booking_id,
    raised_by,
    reason,
    status,
    resolution_action,
    wrongful_party_user_id,
    resolution_notes,
    created_at,
    resolved_at
   FROM public.disputes d
  WHERE (status = 'OPEN'::text);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    rating_avg double precision DEFAULT 0 NOT NULL,
    completed_tasks integer DEFAULT 0 NOT NULL,
    instant_match_revoked_until timestamp with time zone,
    last_active_at timestamp with time zone,
    bio text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    phone text,
    phone_blind_idx text,
    role text NOT NULL,
    status text NOT NULL,
    suspension_end_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    facebook_id text,
    primary_auth text DEFAULT 'FACEBOOK'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['CUSTOMER'::text, 'TASKER'::text, 'ADMIN'::text]))),
    CONSTRAINT users_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'ACTIVE'::text, 'VERIFIED'::text, 'SUSPENDED'::text, 'BANNED'::text, 'DELETED'::text])))
);


--
-- Name: verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    id_card_front_key text NOT NULL,
    id_card_back_key text NOT NULL,
    status text NOT NULL,
    submitted_at timestamp with time zone NOT NULL,
    admin_notes text,
    reviewed_at timestamp with time zone,
    consent_policy_version text,
    consent_accepted_at timestamp with time zone,
    dan_reference text,
    CONSTRAINT verifications_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])))
);


--
-- Name: admin_verification_queue_projection; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.admin_verification_queue_projection AS
 SELECT v.id,
    v.user_id,
    u.phone AS encrypted_user_phone,
    p.full_name AS user_name,
    v.id_card_front_key,
    v.id_card_back_key,
    v.status,
    v.admin_notes,
    v.submitted_at,
    v.reviewed_at
   FROM ((public.verifications v
     JOIN public.users u ON ((u.id = v.user_id)))
     LEFT JOIN public.profiles p ON ((p.user_id = v.user_id)))
  WHERE (v.status = 'PENDING'::text);


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id uuid NOT NULL,
    name text NOT NULL,
    user_id uuid,
    properties jsonb,
    "timestamp" timestamp with time zone NOT NULL
);


--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    metadata_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: booking_completion_signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_completion_signals (
    booking_id uuid NOT NULL,
    tasker_id uuid NOT NULL,
    marked_done_at timestamp with time zone NOT NULL,
    proof_photo_key text,
    proof_note text
);


--
-- Name: booking_intents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_intents (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    tasker_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    source text NOT NULL,
    status text NOT NULL,
    original_booking_id uuid,
    offer_id uuid,
    expires_at timestamp with time zone,
    confirmed_booking_id uuid,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    selected_application_id uuid,
    CONSTRAINT booking_intents_source_check CHECK ((source = ANY (ARRAY['APPLICATION_SELECTION'::text, 'REBOOK'::text, 'INSTANT_MATCH'::text]))),
    CONSTRAINT booking_intents_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'CONFIRMED'::text, 'DECLINED'::text, 'EXPIRED'::text, 'CANCELLED'::text])))
);


--
-- Name: booking_reliability_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_reliability_incidents (
    id uuid NOT NULL,
    booking_id uuid NOT NULL,
    user_id uuid NOT NULL,
    incident_type text NOT NULL,
    details text,
    recorded_at timestamp with time zone NOT NULL
);


--
-- Name: booking_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewee_id uuid NOT NULL,
    quality_rating integer,
    punctuality_rating integer,
    communication_rating integer,
    clarity_rating integer,
    respectfulness_rating integer,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    would_book_again boolean,
    CONSTRAINT booking_reviews_clarity_rating_check CHECK (((clarity_rating >= 1) AND (clarity_rating <= 5))),
    CONSTRAINT booking_reviews_communication_rating_check CHECK (((communication_rating >= 1) AND (communication_rating <= 5))),
    CONSTRAINT booking_reviews_punctuality_rating_check CHECK (((punctuality_rating >= 1) AND (punctuality_rating <= 5))),
    CONSTRAINT booking_reviews_quality_rating_check CHECK (((quality_rating >= 1) AND (quality_rating <= 5))),
    CONSTRAINT booking_reviews_respectfulness_rating_check CHECK (((respectfulness_rating >= 1) AND (respectfulness_rating <= 5)))
);


--
-- Name: booking_schedule_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_schedule_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    actor_user_id uuid NOT NULL,
    event_type text NOT NULL,
    proposed_scheduled_at timestamp with time zone,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT booking_schedule_events_event_type_check CHECK ((event_type = ANY (ARRAY['REQUESTED'::text, 'ACCEPTED'::text, 'DECLINED'::text, 'EXPIRED'::text])))
);


--
-- Name: booking_timeline_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_timeline_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    event_type text NOT NULL,
    actor_user_id uuid,
    metadata_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    tasker_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    price integer NOT NULL,
    status text NOT NULL,
    cancellation_fee integer,
    liability_disclaimer_accepted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    confirmed_scheduled_at timestamp with time zone,
    settlement_mode text DEFAULT 'DIRECT'::text NOT NULL,
    late_cancel_incident boolean DEFAULT false NOT NULL,
    liability_disclaimer_accepted_at timestamp with time zone,
    completion_reminder_count integer DEFAULT 0 NOT NULL,
    completion_reminder_last_at timestamp with time zone,
    CONSTRAINT bookings_settlement_mode_check CHECK ((settlement_mode = ANY (ARRAY['DIRECT'::text, 'LEAD_UNLOCK'::text, 'ESCROW'::text]))),
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['ASSIGNED'::text, 'PAID'::text, 'COMPLETED'::text, 'CANCELLED'::text, 'NO_SHOW'::text, 'DISPUTED'::text])))
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    name text NOT NULL,
    name_mn text,
    icon_url text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer NOT NULL,
    intake_enabled boolean DEFAULT true NOT NULL,
    intake_schema_version integer,
    intake_schema_json jsonb,
    assisted_distribution_enabled boolean DEFAULT false NOT NULL
);


--
-- Name: category_schema_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_schema_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    version integer NOT NULL,
    schema_json jsonb NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    activated_at timestamp with time zone,
    CONSTRAINT category_schema_versions_status_check CHECK ((status = ANY (ARRAY['DRAFT'::text, 'CANARY'::text, 'ACTIVE'::text, 'ROLLED_BACK'::text])))
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    tasker_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: credited_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credited_bookings (
    booking_id uuid NOT NULL
);


--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_tokens (
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT chk_device_tokens_platform CHECK ((platform = ANY (ARRAY['IOS'::text, 'ANDROID'::text, 'WEB'::text])))
);


--
-- Name: dispute_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispute_evidence (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dispute_id uuid NOT NULL,
    type text NOT NULL,
    storage_key text,
    text_payload text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dispute_evidence_type_check CHECK ((type = ANY (ARRAY['CHAT_EXCERPT'::text, 'PHOTO'::text, 'WRITTEN_TIMELINE'::text])))
);


--
-- Name: districts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.districts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    name_mn text NOT NULL,
    slug text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    centroid_lat double precision,
    centroid_lng double precision
);


--
-- Name: domain_outbox_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.domain_outbox_events (
    id uuid NOT NULL,
    event_type text NOT NULL,
    aggregate_type text NOT NULL,
    aggregate_id uuid,
    payload jsonb NOT NULL,
    status text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    available_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    processed_at timestamp with time zone,
    last_error text,
    correlation_id text,
    causation_id text,
    command_id text,
    workflow_id text,
    actor_id text,
    trace_id text,
    locale text,
    platform text,
    CONSTRAINT domain_outbox_events_attempts_check CHECK ((attempts >= 0)),
    CONSTRAINT domain_outbox_events_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'PROCESSING'::text, 'PROCESSED'::text, 'FAILED'::text])))
);


--
-- Name: event_idempotency; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_idempotency (
    event_id text NOT NULL,
    event_type text NOT NULL,
    handler text NOT NULL,
    event_status text DEFAULT 'IN_PROGRESS'::text NOT NULL,
    processed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_idempotency_event_status_check CHECK ((event_status = ANY (ARRAY['IN_PROGRESS'::text, 'COMPLETED'::text])))
);


--
-- Name: feature_toggles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_toggles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feature_name text NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    activated_at timestamp with time zone,
    deactivated_at timestamp with time zone,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idempotency_keys (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    operation text NOT NULL,
    idempotency_key text NOT NULL,
    status text NOT NULL,
    resource_type text,
    resource_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT idempotency_keys_status_check CHECK ((status = ANY (ARRAY['IN_PROGRESS'::text, 'COMPLETED'::text])))
);


--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ledger_entries (
    id uuid NOT NULL,
    user_id uuid,
    amount integer NOT NULL,
    type text NOT NULL,
    reference_id uuid,
    description text,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT ledger_entries_check CHECK ((((type = 'FEE'::text) AND (user_id IS NULL)) OR ((type <> 'FEE'::text) AND (user_id IS NOT NULL)))),
    CONSTRAINT ledger_entries_type_check CHECK ((type = ANY (ARRAY['DEPOSIT'::text, 'FEE'::text, 'HOLD'::text, 'RELEASE'::text, 'CONFISCATE'::text, 'PAYOUT'::text, 'REFUND'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    phone_number_flagged boolean DEFAULT false NOT NULL,
    content_hash text
);


--
-- Name: moderation_policy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_policy (
    id smallint DEFAULT 1 NOT NULL,
    strike_window_days integer NOT NULL,
    strike_threshold integer NOT NULL,
    first_suspension_days integer NOT NULL,
    repeat_suspension_days integer NOT NULL,
    repeat_offense_window_days integer NOT NULL,
    auto_unsuspend_enabled boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT moderation_policy_check CHECK ((repeat_suspension_days >= first_suspension_days)),
    CONSTRAINT moderation_policy_check1 CHECK ((repeat_offense_window_days >= strike_window_days)),
    CONSTRAINT moderation_policy_first_suspension_days_check CHECK (((first_suspension_days >= 1) AND (first_suspension_days <= 365))),
    CONSTRAINT moderation_policy_id_check CHECK ((id = 1)),
    CONSTRAINT moderation_policy_repeat_offense_window_days_check CHECK (((repeat_offense_window_days >= 1) AND (repeat_offense_window_days <= 730))),
    CONSTRAINT moderation_policy_repeat_suspension_days_check CHECK (((repeat_suspension_days >= 1) AND (repeat_suspension_days <= 365))),
    CONSTRAINT moderation_policy_strike_threshold_check CHECK (((strike_threshold >= 1) AND (strike_threshold <= 10))),
    CONSTRAINT moderation_policy_strike_window_days_check CHECK (((strike_window_days >= 1) AND (strike_window_days <= 365)))
);


--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_log (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    channel text NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    event_key text,
    provider_message_id text,
    error_code text
);


--
-- Name: otp_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_challenges (
    phone_blind_idx text NOT NULL,
    code text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL
);


--
-- Name: payment_intents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_intents (
    payment_id uuid NOT NULL,
    booking_id uuid,
    processed boolean DEFAULT false NOT NULL
);


--
-- Name: payout_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout_requests (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    processed_at timestamp with time zone,
    CONSTRAINT payout_requests_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'PROCESSED'::text, 'REJECTED'::text])))
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    category_id uuid NOT NULL,
    description text NOT NULL,
    budget integer,
    location_lat double precision,
    location_lng double precision,
    location_text text,
    location_point public.geometry(Point,4326),
    status text NOT NULL,
    scheduled_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    intake_answers_json jsonb,
    intake_schema_version integer,
    scope_summary_source text,
    pricing_mode text DEFAULT 'BUDGET'::text NOT NULL,
    CONSTRAINT tasks_pricing_mode_check CHECK ((pricing_mode = ANY (ARRAY['BUDGET'::text, 'QUOTE'::text]))),
    CONSTRAINT tasks_scope_summary_source_check CHECK (((scope_summary_source IS NULL) OR (scope_summary_source = ANY (ARRAY['TEMPLATE'::text, 'USER_EDITED'::text, 'LLM'::text])))),
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'ASSIGNED'::text, 'COMPLETED'::text, 'CANCELLED'::text, 'NO_SHOW'::text])))
);


--
-- Name: public_task_feed_projection; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_task_feed_projection AS
 SELECT t.id,
    c.id AS category_id,
    c.name AS category_name,
    c.name_mn AS category_name_mn,
    c.icon_url AS category_icon_url,
    t.description,
    t.budget,
    t.pricing_mode,
    COALESCE((d.name || ', Ulaanbaatar'::text), 'Ulaanbaatar'::text) AS approximate_location,
    COALESCE(d.centroid_lat, (47.9184)::double precision) AS approximate_lat,
    COALESCE(d.centroid_lng, (106.9177)::double precision) AS approximate_lng,
    t.status,
    t.scheduled_at,
    t.created_at,
    t.location_point AS task_location_point
   FROM ((public.tasks t
     JOIN public.categories c ON ((c.id = t.category_id)))
     LEFT JOIN LATERAL ( SELECT district.name,
            district.centroid_lat,
            district.centroid_lng
           FROM public.districts district
          WHERE ((district.is_active = true) AND (district.centroid_lat IS NOT NULL) AND (district.centroid_lng IS NOT NULL))
          ORDER BY (t.location_point OPERATOR(public.<->) public.st_setsrid(public.st_makepoint(district.centroid_lng, district.centroid_lat), 4326))
         LIMIT 1) d ON (true))
  WHERE (t.status = 'OPEN'::text);


--
-- Name: rate_limit_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limit_counters (
    rate_key character varying(255) NOT NULL,
    window_start timestamp with time zone NOT NULL,
    attempt_count integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT rate_limit_counters_attempt_count_check CHECK ((attempt_count >= 0))
);


--
-- Name: refresh_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_sessions (
    token_id text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: review_enforcement_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_enforcement_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    user_id uuid NOT NULL,
    reason_code text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    investigation_active boolean DEFAULT false NOT NULL,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    CONSTRAINT review_enforcement_cases_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'REMINDED_24H'::text, 'REMINDED_72H'::text, 'COMPLETED'::text, 'EXPIRED'::text])))
);


--
-- Name: shedlock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shedlock (
    name character varying(64) NOT NULL,
    lock_until timestamp without time zone NOT NULL,
    locked_at timestamp without time zone NOT NULL,
    locked_by character varying(255) NOT NULL
);


--
-- Name: suspension_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suspension_events (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    strike_count integer NOT NULL,
    suspension_days integer NOT NULL,
    suspended_at timestamp with time zone NOT NULL,
    unsuspended_at timestamp with time zone,
    CONSTRAINT suspension_events_check CHECK (((unsuspended_at IS NULL) OR (unsuspended_at >= suspended_at))),
    CONSTRAINT suspension_events_strike_count_check CHECK ((strike_count > 0)),
    CONSTRAINT suspension_events_suspension_days_check CHECK ((suspension_days > 0))
);


--
-- Name: task_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_applications (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    tasker_id uuid NOT NULL,
    message text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    relevance_score double precision,
    recommended boolean,
    selected_at timestamp with time zone,
    respond_by_at timestamp with time zone,
    quote_price integer,
    CONSTRAINT task_applications_status_check CHECK ((status = ANY (ARRAY['APPLIED'::text, 'SELECTED'::text, 'ACCEPTED'::text, 'DECLINED'::text, 'EXPIRED'::text, 'WITHDRAWN'::text])))
);


--
-- Name: task_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    category_id uuid NOT NULL,
    intake_answers_json jsonb,
    intake_schema_version integer NOT NULL,
    summary_draft text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    location_lat double precision,
    location_lng double precision,
    location_text text
);


--
-- Name: task_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_photos (
    id uuid NOT NULL,
    task_id uuid NOT NULL,
    storage_key text NOT NULL,
    sort_order integer NOT NULL
);


--
-- Name: task_rescue_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_rescue_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    triggered_at timestamp with time zone NOT NULL,
    trigger_window text NOT NULL,
    actions_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    intervention_type text,
    intervention_stage text,
    CONSTRAINT task_rescue_events_intervention_stage_check CHECK (((intervention_stage IS NULL) OR (intervention_stage = ANY (ARRAY['pre_match'::text, 'post_match'::text, 'post_booking'::text, 'completion_rescue'::text])))),
    CONSTRAINT task_rescue_events_intervention_type_check CHECK (((intervention_type IS NULL) OR (intervention_type = ANY (ARRAY['manual_rescue'::text, 'external_distribution'::text, 'ops_override'::text])))),
    CONSTRAINT task_rescue_events_trigger_window_check CHECK ((trigger_window = ANY (ARRAY['DAYTIME'::text, 'OFF_HOURS'::text])))
);


--
-- Name: tasker_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasker_badges (
    tasker_id uuid NOT NULL,
    badge_type text NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT tasker_badges_badge_type_check CHECK ((badge_type = 'PRO'::text))
);


--
-- Name: tasker_reliability_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasker_reliability_scores (
    tasker_id uuid NOT NULL,
    score double precision DEFAULT 0 NOT NULL,
    completion_rate double precision,
    punctuality_rate double precision,
    cancellation_rate double precision,
    review_avg double precision,
    window_days integer DEFAULT 90 NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tasker_service_districts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasker_service_districts (
    user_id uuid NOT NULL,
    district_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tasker_strikes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasker_strikes (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    reason text,
    created_at timestamp with time zone NOT NULL,
    booking_id uuid
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    user_id uuid NOT NULL,
    balance_mnt bigint DEFAULT 0 NOT NULL,
    held_balance_mnt bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT wallet_balance_non_negative CHECK ((balance_mnt >= 0)),
    CONSTRAINT wallet_held_balance_non_negative CHECK ((held_balance_mnt >= 0))
);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: booking_completion_signals booking_completion_signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_completion_signals
    ADD CONSTRAINT booking_completion_signals_pkey PRIMARY KEY (booking_id);


--
-- Name: booking_intents booking_intents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_intents
    ADD CONSTRAINT booking_intents_pkey PRIMARY KEY (id);


--
-- Name: booking_reliability_incidents booking_reliability_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_reliability_incidents
    ADD CONSTRAINT booking_reliability_incidents_pkey PRIMARY KEY (id);


--
-- Name: booking_reviews booking_reviews_booking_id_reviewer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_reviews
    ADD CONSTRAINT booking_reviews_booking_id_reviewer_id_key UNIQUE (booking_id, reviewer_id);


--
-- Name: booking_reviews booking_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_reviews
    ADD CONSTRAINT booking_reviews_pkey PRIMARY KEY (id);


--
-- Name: booking_schedule_events booking_schedule_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_schedule_events
    ADD CONSTRAINT booking_schedule_events_pkey PRIMARY KEY (id);


--
-- Name: booking_timeline_events booking_timeline_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_timeline_events
    ADD CONSTRAINT booking_timeline_events_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: category_schema_versions category_schema_versions_category_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_schema_versions
    ADD CONSTRAINT category_schema_versions_category_id_version_key UNIQUE (category_id, version);


--
-- Name: category_schema_versions category_schema_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_schema_versions
    ADD CONSTRAINT category_schema_versions_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_task_customer_tasker_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_task_customer_tasker_unique UNIQUE (task_id, customer_id, tasker_id);


--
-- Name: credited_bookings credited_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credited_bookings
    ADD CONSTRAINT credited_bookings_pkey PRIMARY KEY (booking_id);


--
-- Name: device_tokens device_tokens_user_id_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_token_key UNIQUE (user_id, token);


--
-- Name: dispute_evidence dispute_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: districts districts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_pkey PRIMARY KEY (id);


--
-- Name: districts districts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_slug_key UNIQUE (slug);


--
-- Name: domain_outbox_events domain_outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_outbox_events
    ADD CONSTRAINT domain_outbox_events_pkey PRIMARY KEY (id);


--
-- Name: event_idempotency event_idempotency_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_idempotency
    ADD CONSTRAINT event_idempotency_pkey PRIMARY KEY (event_id);


--
-- Name: feature_toggles feature_toggles_feature_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_toggles
    ADD CONSTRAINT feature_toggles_feature_name_key UNIQUE (feature_name);


--
-- Name: feature_toggles feature_toggles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_toggles
    ADD CONSTRAINT feature_toggles_pkey PRIMARY KEY (id);


--
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (id);


--
-- Name: idempotency_keys idempotency_keys_user_id_operation_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_user_id_operation_idempotency_key_key UNIQUE (user_id, operation, idempotency_key);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: moderation_policy moderation_policy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_policy
    ADD CONSTRAINT moderation_policy_pkey PRIMARY KEY (id);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--
-- Name: otp_challenges otp_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_challenges
    ADD CONSTRAINT otp_challenges_pkey PRIMARY KEY (phone_blind_idx);


--
-- Name: payment_intents payment_intents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_intents
    ADD CONSTRAINT payment_intents_pkey PRIMARY KEY (payment_id);


--
-- Name: payout_requests payout_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: rate_limit_counters rate_limit_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_counters
    ADD CONSTRAINT rate_limit_counters_pkey PRIMARY KEY (rate_key);


--
-- Name: refresh_sessions refresh_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions
    ADD CONSTRAINT refresh_sessions_pkey PRIMARY KEY (token_id);


--
-- Name: review_enforcement_cases review_enforcement_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_enforcement_cases
    ADD CONSTRAINT review_enforcement_cases_pkey PRIMARY KEY (id);


--
-- Name: shedlock shedlock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shedlock
    ADD CONSTRAINT shedlock_pkey PRIMARY KEY (name);


--
-- Name: suspension_events suspension_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspension_events
    ADD CONSTRAINT suspension_events_pkey PRIMARY KEY (id);


--
-- Name: task_applications task_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_applications
    ADD CONSTRAINT task_applications_pkey PRIMARY KEY (id);


--
-- Name: task_applications task_applications_task_id_tasker_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_applications
    ADD CONSTRAINT task_applications_task_id_tasker_id_key UNIQUE (task_id, tasker_id);


--
-- Name: task_drafts task_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_drafts
    ADD CONSTRAINT task_drafts_pkey PRIMARY KEY (id);


--
-- Name: task_photos task_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_photos
    ADD CONSTRAINT task_photos_pkey PRIMARY KEY (id);


--
-- Name: task_rescue_events task_rescue_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_rescue_events
    ADD CONSTRAINT task_rescue_events_pkey PRIMARY KEY (id);


--
-- Name: tasker_badges tasker_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_badges
    ADD CONSTRAINT tasker_badges_pkey PRIMARY KEY (tasker_id, badge_type);


--
-- Name: tasker_reliability_scores tasker_reliability_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_reliability_scores
    ADD CONSTRAINT tasker_reliability_scores_pkey PRIMARY KEY (tasker_id);


--
-- Name: tasker_service_districts tasker_service_districts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_service_districts
    ADD CONSTRAINT tasker_service_districts_pkey PRIMARY KEY (user_id, district_id);


--
-- Name: tasker_strikes tasker_strikes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_strikes
    ADD CONSTRAINT tasker_strikes_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_blind_idx_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_blind_idx_key UNIQUE (phone_blind_idx);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (user_id);


--
-- Name: idx_analytics_events_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events USING btree ("timestamp" DESC);


--
-- Name: idx_analytics_events_user_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_user_timestamp ON public.analytics_events USING btree (user_id, "timestamp" DESC);


--
-- Name: idx_audit_events_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_events_actor ON public.audit_events USING btree (actor_user_id, created_at DESC);


--
-- Name: idx_audit_events_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_events_resource ON public.audit_events USING btree (resource_type, resource_id);


--
-- Name: idx_booking_completion_signals_tasker_marked_done_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_completion_signals_tasker_marked_done_at ON public.booking_completion_signals USING btree (tasker_id, marked_done_at DESC);


--
-- Name: idx_booking_intents_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_intents_customer_id ON public.booking_intents USING btree (customer_id);


--
-- Name: idx_booking_intents_selected_application_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_intents_selected_application_id ON public.booking_intents USING btree (selected_application_id);


--
-- Name: idx_booking_intents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_intents_status ON public.booking_intents USING btree (status);


--
-- Name: idx_booking_intents_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_intents_task_id ON public.booking_intents USING btree (task_id);


--
-- Name: idx_booking_reliability_incidents_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_reliability_incidents_booking ON public.booking_reliability_incidents USING btree (booking_id);


--
-- Name: idx_booking_schedule_events_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_schedule_events_booking ON public.booking_schedule_events USING btree (booking_id, created_at DESC);


--
-- Name: idx_booking_timeline_events_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_timeline_events_booking ON public.booking_timeline_events USING btree (booking_id, created_at DESC);


--
-- Name: idx_bookings_customer_status_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_customer_status_updated_at ON public.bookings USING btree (customer_id, status, updated_at DESC);


--
-- Name: idx_bookings_tasker_status_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_tasker_status_updated_at ON public.bookings USING btree (tasker_id, status, updated_at DESC);


--
-- Name: idx_category_schema_versions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_category_schema_versions_active ON public.category_schema_versions USING btree (category_id, status) WHERE (status = 'ACTIVE'::text);


--
-- Name: idx_dispute_evidence_dispute; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispute_evidence_dispute ON public.dispute_evidence USING btree (dispute_id);


--
-- Name: idx_disputes_evidence_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_evidence_due ON public.disputes USING btree (evidence_due_at) WHERE (status = 'EVIDENCE_NEEDED'::text);


--
-- Name: idx_disputes_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_status_id ON public.disputes USING btree (status, id);


--
-- Name: idx_domain_outbox_events_aggregate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_domain_outbox_events_aggregate ON public.domain_outbox_events USING btree (aggregate_type, aggregate_id);


--
-- Name: idx_domain_outbox_events_status_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_domain_outbox_events_status_available ON public.domain_outbox_events USING btree (status, available_at, created_at);


--
-- Name: idx_domain_outbox_events_workflow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_domain_outbox_events_workflow ON public.domain_outbox_events USING btree (workflow_id) WHERE (workflow_id IS NOT NULL);


--
-- Name: idx_event_idempotency_processed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_idempotency_processed_at ON public.event_idempotency USING btree (processed_at DESC);


--
-- Name: idx_event_idempotency_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_idempotency_status ON public.event_idempotency USING btree (event_status);


--
-- Name: idx_idempotency_keys_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_idempotency_keys_created_at ON public.idempotency_keys USING btree (created_at DESC);


--
-- Name: idx_ledger_entries_user_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ledger_entries_user_created_at ON public.ledger_entries USING btree (user_id, created_at DESC);


--
-- Name: idx_messages_conversation_sent_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_sent_at_id ON public.messages USING btree (conversation_id, sent_at DESC, id DESC);


--
-- Name: idx_messages_flagged_sent_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_flagged_sent_at_id ON public.messages USING btree (phone_number_flagged, sent_at DESC, id DESC) WHERE (phone_number_flagged = true);


--
-- Name: idx_rate_limit_counters_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_counters_expires_at ON public.rate_limit_counters USING btree (expires_at);


--
-- Name: idx_review_enforcement_cases_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_enforcement_cases_user_status ON public.review_enforcement_cases USING btree (user_id, status) WHERE (status <> 'COMPLETED'::text);


--
-- Name: idx_suspension_events_user_suspended_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suspension_events_user_suspended_at ON public.suspension_events USING btree (user_id, suspended_at DESC);


--
-- Name: idx_task_applications_selected_respond_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_applications_selected_respond_by ON public.task_applications USING btree (respond_by_at) WHERE (status = 'SELECTED'::text);


--
-- Name: idx_task_applications_task_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_applications_task_status_created_at ON public.task_applications USING btree (task_id, status, created_at DESC);


--
-- Name: idx_task_drafts_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_drafts_customer ON public.task_drafts USING btree (customer_id, created_at DESC);


--
-- Name: idx_task_rescue_events_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_rescue_events_task ON public.task_rescue_events USING btree (task_id);


--
-- Name: idx_tasker_badges_tasker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasker_badges_tasker ON public.tasker_badges USING btree (tasker_id) WHERE (revoked_at IS NULL);


--
-- Name: idx_tasks_customer_status_created_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_customer_status_created_at_id ON public.tasks USING btree (customer_id, status, created_at DESC, id);


--
-- Name: idx_tasks_location_point; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_location_point ON public.tasks USING gist (location_point);


--
-- Name: idx_tasks_status_created_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status_created_at_id ON public.tasks USING btree (status, created_at DESC, id);


--
-- Name: idx_tsd_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tsd_user ON public.tasker_service_districts USING btree (user_id);


--
-- Name: idx_verifications_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verifications_status_id ON public.verifications USING btree (status, id);


--
-- Name: uq_booking_reliability_incident_per_booking_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_booking_reliability_incident_per_booking_user_type ON public.booking_reliability_incidents USING btree (booking_id, user_id, incident_type);


--
-- Name: uq_review_enforcement_booking_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_review_enforcement_booking_user ON public.review_enforcement_cases USING btree (booking_id, user_id);


--
-- Name: ux_booking_intents_pending_application_selection_task; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_booking_intents_pending_application_selection_task ON public.booking_intents USING btree (task_id) WHERE ((source = 'APPLICATION_SELECTION'::text) AND (status = 'PENDING'::text));


--
-- Name: ux_users_facebook_id_not_null; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_users_facebook_id_not_null ON public.users USING btree (facebook_id) WHERE (facebook_id IS NOT NULL);


--
-- Name: idx_bookings_customer_updated_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_customer_updated_at_id ON public.bookings USING btree (customer_id, updated_at DESC, id DESC);


--
-- Name: idx_bookings_tasker_updated_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_tasker_updated_at_id ON public.bookings USING btree (tasker_id, updated_at DESC, id DESC);


--
-- Name: idx_bookings_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_task_id ON public.bookings USING btree (task_id);


--
-- Name: idx_task_applications_task_created_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_applications_task_created_at_id ON public.task_applications USING btree (task_id, created_at DESC, id DESC);


--
-- Name: idx_booking_reviews_reviewee_created_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booking_reviews_reviewee_created_at_id ON public.booking_reviews USING btree (reviewee_id, created_at DESC, id DESC);


--
-- Name: idx_disputes_booking_open_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_booking_open_status ON public.disputes USING btree (booking_id, status) WHERE (status = ANY (ARRAY['OPEN'::text, 'EVIDENCE_NEEDED'::text]));


--
-- Name: idx_disputes_status_created_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_status_created_at_id ON public.disputes USING btree (status, created_at, id) WHERE (status = ANY (ARRAY['OPEN'::text, 'EVIDENCE_NEEDED'::text]));


--
-- Name: idx_task_photos_task_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_photos_task_sort_order ON public.task_photos USING btree (task_id, sort_order);


--
-- Name: idx_conversations_customer_created_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_customer_created_at_id ON public.conversations USING btree (customer_id, created_at DESC, id DESC);


--
-- Name: idx_conversations_tasker_created_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_tasker_created_at_id ON public.conversations USING btree (tasker_id, created_at DESC, id DESC);


--
-- Name: idx_analytics_events_timestamp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_timestamp_id ON public.analytics_events USING btree ("timestamp" DESC, id DESC);


--
-- Name: ux_notification_log_event_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_notification_log_event_key ON public.notification_log USING btree (event_key) WHERE (event_key IS NOT NULL);


--
-- Name: idx_notification_log_created_at_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_log_created_at_id ON public.notification_log USING btree (created_at DESC, id DESC);


--
-- Name: audit_events trg_audit_events_no_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_events_no_delete BEFORE DELETE ON public.audit_events FOR EACH ROW EXECUTE FUNCTION public.fn_audit_events_immutable();


--
-- Name: audit_events trg_audit_events_no_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_events_no_update BEFORE UPDATE ON public.audit_events FOR EACH ROW EXECUTE FUNCTION public.fn_audit_events_immutable();


--
-- Name: tasks trg_tasks_location_point; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tasks_location_point BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.tasks_set_location_point();


--
-- Name: booking_completion_signals booking_completion_signals_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_completion_signals
    ADD CONSTRAINT booking_completion_signals_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_completion_signals booking_completion_signals_tasker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_completion_signals
    ADD CONSTRAINT booking_completion_signals_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id);


--
-- Name: booking_intents booking_intents_confirmed_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_intents
    ADD CONSTRAINT booking_intents_confirmed_booking_id_fkey FOREIGN KEY (confirmed_booking_id) REFERENCES public.bookings(id);


--
-- Name: booking_intents booking_intents_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_intents
    ADD CONSTRAINT booking_intents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: booking_intents booking_intents_original_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_intents
    ADD CONSTRAINT booking_intents_original_booking_id_fkey FOREIGN KEY (original_booking_id) REFERENCES public.bookings(id);


--
-- Name: booking_intents booking_intents_selected_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_intents
    ADD CONSTRAINT booking_intents_selected_application_id_fkey FOREIGN KEY (selected_application_id) REFERENCES public.task_applications(id);


--
-- Name: booking_intents booking_intents_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_intents
    ADD CONSTRAINT booking_intents_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: booking_intents booking_intents_tasker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_intents
    ADD CONSTRAINT booking_intents_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id);


--
-- Name: booking_reliability_incidents booking_reliability_incidents_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_reliability_incidents
    ADD CONSTRAINT booking_reliability_incidents_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: booking_reliability_incidents booking_reliability_incidents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_reliability_incidents
    ADD CONSTRAINT booking_reliability_incidents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: booking_reviews booking_reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_reviews
    ADD CONSTRAINT booking_reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: booking_reviews booking_reviews_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_reviews
    ADD CONSTRAINT booking_reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.users(id);


--
-- Name: booking_reviews booking_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_reviews
    ADD CONSTRAINT booking_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: booking_schedule_events booking_schedule_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_schedule_events
    ADD CONSTRAINT booking_schedule_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id);


--
-- Name: booking_schedule_events booking_schedule_events_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_schedule_events
    ADD CONSTRAINT booking_schedule_events_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: booking_timeline_events booking_timeline_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_timeline_events
    ADD CONSTRAINT booking_timeline_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id);


--
-- Name: booking_timeline_events booking_timeline_events_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_timeline_events
    ADD CONSTRAINT booking_timeline_events_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: bookings bookings_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: bookings bookings_tasker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id);


--
-- Name: category_schema_versions category_schema_versions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_schema_versions
    ADD CONSTRAINT category_schema_versions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: conversations conversations_participant1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant1_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: conversations conversations_participant2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant2_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id);


--
-- Name: conversations conversations_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: credited_bookings credited_bookings_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credited_bookings
    ADD CONSTRAINT credited_bookings_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: device_tokens device_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: dispute_evidence dispute_evidence_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispute_evidence
    ADD CONSTRAINT dispute_evidence_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id);


--
-- Name: disputes disputes_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: disputes disputes_raiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_raiser_id_fkey FOREIGN KEY (raised_by) REFERENCES public.users(id);


--
-- Name: disputes disputes_wrongful_party_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_wrongful_party_user_id_fkey FOREIGN KEY (wrongful_party_user_id) REFERENCES public.users(id);


--
-- Name: ledger_entries ledger_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: notification_log notification_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payment_intents payment_intents_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_intents
    ADD CONSTRAINT payment_intents_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: payout_requests payout_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: refresh_sessions refresh_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions
    ADD CONSTRAINT refresh_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: review_enforcement_cases review_enforcement_cases_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_enforcement_cases
    ADD CONSTRAINT review_enforcement_cases_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: review_enforcement_cases review_enforcement_cases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_enforcement_cases
    ADD CONSTRAINT review_enforcement_cases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: suspension_events suspension_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suspension_events
    ADD CONSTRAINT suspension_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_applications task_applications_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_applications
    ADD CONSTRAINT task_applications_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_applications task_applications_tasker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_applications
    ADD CONSTRAINT task_applications_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id);


--
-- Name: task_drafts task_drafts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_drafts
    ADD CONSTRAINT task_drafts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: task_drafts task_drafts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_drafts
    ADD CONSTRAINT task_drafts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: task_photos task_photos_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_photos
    ADD CONSTRAINT task_photos_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_rescue_events task_rescue_events_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_rescue_events
    ADD CONSTRAINT task_rescue_events_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: tasker_badges tasker_badges_tasker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_badges
    ADD CONSTRAINT tasker_badges_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id);


--
-- Name: tasker_reliability_scores tasker_reliability_scores_tasker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_reliability_scores
    ADD CONSTRAINT tasker_reliability_scores_tasker_id_fkey FOREIGN KEY (tasker_id) REFERENCES public.users(id);


--
-- Name: tasker_service_districts tasker_service_districts_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_service_districts
    ADD CONSTRAINT tasker_service_districts_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE CASCADE;


--
-- Name: tasker_service_districts tasker_service_districts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_service_districts
    ADD CONSTRAINT tasker_service_districts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasker_strikes tasker_strikes_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_strikes
    ADD CONSTRAINT tasker_strikes_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: tasker_strikes tasker_strikes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasker_strikes
    ADD CONSTRAINT tasker_strikes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: tasks tasks_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: verifications verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--
