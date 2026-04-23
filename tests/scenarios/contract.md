# contract Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-CONTRACT-400

**Risk:** High
**PRD:** NFR-API-02
**Title:** Validation errors return the standard error envelope

Given a client submits an invalid request to an API endpoint
When validation fails
Then the response status is 400 or 422
And the response includes code, message, and trace_id fields

## SCN-CONTRACT-401

**Risk:** High
**PRD:** NFR-API-02
**Title:** Unauthenticated requests return 401 with standard error envelope

Given an endpoint requires authentication
When the request does not include a bearer token
Then the response status is 401
And the response includes code, message, and trace_id fields

## SCN-CONTRACT-403

**Risk:** High
**PRD:** NFR-API-02
**Title:** Forbidden access returns 403 with standard error envelope

Given an authenticated user calls an endpoint outside their role authorization
When authorization fails
Then the response status is 403
And the response includes code, message, and trace_id fields

## SCN-CONTRACT-404

**Risk:** High
**PRD:** NFR-API-02
**Title:** Unknown resources return 404 with standard error envelope

Given a client requests a resource ID that does not exist
When the endpoint resolves the request
Then the response status is 404
And the response includes code, message, and trace_id fields
