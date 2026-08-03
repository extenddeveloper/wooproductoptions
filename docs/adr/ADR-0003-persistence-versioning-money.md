# ADR-0003: Persistence, revisions, and money

Status: Accepted  
Date: 2026-07-30

## Decision

Use prefixed custom tables installed through versioned `dbDelta` migrations.
Option-set identity is mutable; every authored save is a new revision.
Publishing creates an immutable published revision with canonical JSON and a
SHA-256 content hash. Rollback copies an earlier revision into a new draft.

Commerce money is represented by integer minor units at the store currency
scale. Formula intermediates use bounded fixed-scale decimal integers. Rounding
is half-up at conversion and contribution boundaries.
