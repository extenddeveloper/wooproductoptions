# WooOptionsFic product requirements

WooOptionsFic is a server-authoritative WooCommerce product-options and
configuration plugin. The source of truth is the supplied master prompt,
version 1.2 dated 29 July 2026.

## Release objective

The first distributable is an installable public beta that supports:

- immutable option-set revisions with explicit publishing and rollback-by-copy;
- deterministic global, taxonomy, product, and variation assignments;
- accessible scalar, choice, content, upload, calculated, and repeater fields;
- nested conditions, safe formula pricing, integer-minor-unit money, and quote
  explanations;
- classic product/cart/checkout, order snapshots, Store API extension data,
  and a dynamic Product Options block;
- private uploads, saved/shareable configurations, privacy-safe aggregate
  analytics, original templates, and merchant diagnostics;
- a WordPress-native React/TypeScript builder using the Precision Workshop
  visual system, keyboard movement controls, and accessible storefront output.

## Product invariants

1. Browser totals and field states are previews. PHP recalculates commerce
   truth.
2. Published revisions and order snapshots are immutable.
3. Money uses integer minor units and explicit rounding.
4. UUIDs, never labels or array positions, connect fields, choices, rules, and
   formula references.
5. Hidden/disabled stale values do not validate or affect price.
6. Customer file bytes are not public Media Library attachments.
7. Sensitive free text never enters analytics or share URLs.
8. Compatibility labels require evidence.

## Requirement coverage

Detailed status is maintained in `docs/IMPLEMENTATION_STATUS.md`. Features that
are not production-ready remain absent from the production UI rather than
appearing as teaser or fake controls.
