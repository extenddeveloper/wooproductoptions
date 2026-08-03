# Implementation status

Status values: `not_started`, `in_progress`, `blocked`, `implemented`,
`tested`, and `released`.

| Area | Status | Evidence / release note |
|---|---|---|
| Bootstrap, requirements, capabilities | implemented | Activation/runtime paths and capability map present; host integration test pending |
| Versioned tables and migrations | implemented | DB version 2 schema; clean MySQL/dbDelta test pending |
| Immutable option-set revisions | implemented | Draft/publish/hash/conflict/rollback-by-copy services present |
| React/TypeScript admin shell | tested | Strict TypeScript, ESLint, Stylelint, and production bundle passed |
| Field registry and builder | tested | 34 registered types; keyboard move controls and accessible selection controls lint clean |
| Assignments | implemented | Deterministic resolver and compatible-set merge present; Woo product fixtures pending |
| Rules, formulas, money, pricing | tested | PHP 8.3 domain smoke coverage passed |
| Repeatable sections | tested | Server row caps, nested normalization/validation, and aggregate pricing smoke passed |
| Storefront rendering and quoting | implemented | Server renderer/runtime/REST quote present; live Woo classic smoke pending |
| Cart/order lifecycle | implemented | Authoritative cart price and immutable order snapshot paths present; live Woo smoke pending |
| Store API / Product Options block | implemented | Extension data and dynamic block present; checkout-block matrix pending |
| Private uploads | implemented | Intent/MIME/dimension/ownership/scanner/download/cleanup paths present; HTTP upload E2E pending |
| Saved/shareable configurations | implemented | Hashed expiring token and load revalidation paths present; HTTP E2E pending |
| Style palettes and contrast | tested | All shipped template palettes pass compiler contrast gates |
| Analytics | implemented | Bounded aggregate dimensions and raw-value exclusion present; database growth test pending |
| Templates | tested | 10 of 10 compile through the production compiler |
| Full visual preview studio | not_started | Not exposed until reliable |
| Certified third-party integrations | not_started | No claims without matrix evidence |
| A/B experiments | not_started | Feature flag off |
| Release ZIP | tested | Installable archive built from runtime files only; integrity, path, PHP parse, secret, source-map, and development-file checks passed |

This document is updated as checks complete. “Implemented” is not treated as
“tested” or “released.”
