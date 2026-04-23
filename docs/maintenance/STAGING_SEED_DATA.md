# Staging Seed Data

## Scope

This document describes how to interpret the current private sandbox seed data.
It is a browsing and contract-check fixture set, not a release-grade product dataset.

## Active-use rule

When checking docs against the active Phase 1 baseline:

- treat launch categories, launch booking flow, verification, reviews, disputes, and admin moderation as authoritative
- do not treat leftover future-phase seed rows as part of the product baseline
- do not use seed breadth as justification for keeping deferred code or docs active

## What the seeds are good for

The current seed set is useful for:

- non-empty admin/read surfaces
- pagination checks
- API shape validation
- verifying that launch-phase screens are not empty in sandbox

## What the seeds are not

The current seeds are not:

- a release-grade staging rehearsal dataset
- proof that a future-phase feature is part of launch scope
- a replacement for smoke identities created through the sandbox auth path

## Login reality

Seeded rows are primarily fixtures.
Customer and tasker smoke testing in the private sandbox still depends on dev-auth-created identities.
Admin testing still requires controlled promotion of a sandbox user to `ADMIN`.

## Operational use

Use the sandbox in two layers:

1. use seed rows for browsing, admin lists, and contract validation
2. use sandbox-created identities for end-to-end task, booking, review, and dispute smoke

Keep those layers separate.
