-- User consent tracking for TOS and Privacy Policy acceptance.
-- Required for legal compliance (P0-17).
CREATE TABLE public.user_consents (
    id          uuid        DEFAULT gen_random_uuid() NOT NULL,
    user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    policy_kind text        NOT NULL CHECK (policy_kind IN ('TOS', 'PRIVACY')),
    version     varchar(32) NOT NULL,
    accepted_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT uq_user_consent_policy UNIQUE (user_id, policy_kind, version)
);

CREATE INDEX idx_user_consents_user_id ON public.user_consents (user_id);

-- Auth event audit log columns for login/logout/token refresh/facebook auth (P1-06).
-- These events are emitted by the auth module and stored in audit_events.
-- No schema change needed — audit_events.action already supports arbitrary action strings.
-- Expected new actions: LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, TOKEN_REFRESH,
-- FACEBOOK_AUTH_ATTEMPT, TOS_CONSENT_ACCEPTED, APPLE_AUTH_SUCCESS, APPLE_AUTH_FAILURE.
