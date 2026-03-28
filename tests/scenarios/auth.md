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
