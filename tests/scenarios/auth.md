# auth Scenarios
<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-AUTH-001
**Risk:** Critical
**PRD:** REQ-AUTH-01
**Title:** Dev auth enabled in production profile throws on startup

Given devAuthEnabled is true
And the active Spring profile is not dev, test, or local
When the application context starts (validateOtpConfiguration runs)
Then an IllegalStateException is thrown with message containing "must be false in production"
And the application does not start

## SCN-AUTH-002
**Risk:** Critical
**PRD:** REQ-AUTH-01
**Title:** Phase 0-1 OTP request endpoint is disabled with 403 FEATURE_DISABLED

Given the product is running in Phase 0-1 with OTP authentication disabled
When a client requests an OTP code
Then the response status is 403
And the error code is FEATURE_DISABLED

## SCN-AUTH-003
**Risk:** Critical
**PRD:** REQ-AUTH-01
**Title:** Phase 0-1 OTP verify endpoint is disabled with 403 FEATURE_DISABLED

Given the product is running in Phase 0-1 with OTP authentication disabled
When a client submits a phone number and OTP code for verification
Then the response status is 403
And the error code is FEATURE_DISABLED

## SCN-AUTH-004
**Risk:** Critical
**PRD:** REQ-AUTH-01
**Title:** Valid Facebook OAuth token creates a CUSTOMER session

Given a Facebook access token that resolves to a valid Facebook identity
And no Tasky account exists for that facebook_id
When the client logs in with Facebook OAuth
Then the response status is 200
And a Tasky user is created with role CUSTOMER
And the authenticated session includes access and refresh tokens

## SCN-AUTH-005
**Risk:** Critical
**PRD:** REQ-AUTH-02
**Title:** Same facebook_id authenticates the existing user without creating a duplicate account

Given a Tasky account already exists for a facebook_id
When the client logs in again with a valid Facebook token for that same facebook_id
Then the response status is 200
And the returned user id matches the existing account
And no second account is created for that facebook_id

## SCN-AUTH-006
**Risk:** Critical
**PRD:** REQ-AUTH-03
**Title:** Successful authentication issues a signed JWT with sub, role, exp, and iat claims

Given a user successfully authenticates
When the access token is decoded and validated with the server signing key
Then the JWT contains a sub claim for the authenticated user id
And the JWT contains a role claim for the authenticated user role
And the JWT contains exp and iat claims

## SCN-AUTH-007
**Risk:** Critical
**PRD:** REQ-AUTH-03
**Title:** Invalid-signature or expired access token is rejected with 401

Given a protected endpoint requires a bearer access token
When the request uses an access token with an invalid signature or an expired exp claim
Then the response status is 401
And the request is not authenticated

## SCN-AUTH-008
**Risk:** Critical
**PRD:** REQ-ADMIN-03
**Title:** BANNED or active SUSPENDED account is denied authentication even with otherwise valid credentials

Given a user account has effective status BANNED or active SUSPENDED
When that user attempts to authenticate or refresh a session with otherwise valid credentials
Then the response status is 403
And the account is not granted an authenticated session

## SCN-AUTH-009
**Risk:** Critical
**PRD:** REQ-AUTH-05
**Title:** OTP request rate limit per phone returns 429 within the configured window

Given OTP authentication is enabled
And the same phone number has already reached the configured OTP request limit within the active window
When another OTP request is submitted for that phone number
Then the response status is 429
And the error code identifies the OTP request as rate limited

## SCN-AUTH-010
**Risk:** Critical
**PRD:** REQ-AUTH-05
**Title:** OTP request rate limit per request source returns 429 within the configured window

Given OTP authentication is enabled
And the same request source has already reached the configured OTP request limit within the active window
When another OTP request is submitted from that request source
Then the response status is 429
And the error code identifies the OTP request as rate limited

## SCN-AUTH-011
**Risk:** Critical
**PRD:** REQ-AUTH-05
**Title:** Valid OTP verification returns an authenticated session

Given OTP authentication is enabled
And a non-expired OTP challenge exists for the supplied phone number
When the client verifies with the correct OTP code
Then the response status is 200
And the response includes access and refresh tokens
And the response includes the authenticated user

## SCN-AUTH-012
**Risk:** Critical
**PRD:** REQ-AUTH-09
**Title:** Facebook OAuth outage fails closed with 503 AUTH_PROVIDER_UNAVAILABLE

Given Facebook OAuth is unavailable for new authentication attempts
When a client attempts Facebook login or signup
Then the response status is 503
And the error code is AUTH_PROVIDER_UNAVAILABLE

## SCN-AUTH-013
**Risk:** Critical
**PRD:** REQ-AUTH-10
**Title:** Existing valid session remains usable during Facebook OAuth outage

Given a user already holds a valid unexpired Tasky session
And Facebook OAuth is currently unavailable for new login or signup
When the user calls an authenticated product endpoint with the existing session
Then the response is authorized
And the existing session remains usable until its normal expiry

## SCN-AUTH-014
**Risk:** Critical
**PRD:** REQ-AUTH-09
**Title:** Facebook circuit breaker opens after repeated provider failures and status reports unavailable

Given repeated Facebook provider failures have crossed the configured circuit-breaker threshold within the active window
When the auth provider status endpoint is requested
Then the circuit state is reported as open or unavailable
And new Facebook login attempts are treated as degraded auth

## SCN-AUTH-015
**Risk:** Critical
**PRD:** REQ-AUTH-09
**Title:** Open Facebook circuit fails closed on additional login attempts until recovery

Given the Facebook auth circuit breaker is already open
When another Facebook login attempt is submitted before recovery closes the circuit
Then the login attempt is rejected
And the error code is AUTH_PROVIDER_UNAVAILABLE
