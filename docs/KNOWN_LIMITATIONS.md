# Known limitations and staging checklist

This is a test-ready beta, not a compatibility-certified production release.

## Current boundaries

- The classic product, cart, checkout, order, email metadata, My Account order, and CRUD snapshot paths are implemented. A complete matrix across every current/previous WooCommerce line, every theme, HPOS mode, and Cart/Checkout block combination has not been executed in this build environment.
- Store API extension data is registered, but every third-party product-form implementation must be tested because extensions can use different add-item request shapes.
- Product-linked choices use real WooCommerce child cart lines. Atomic recovery from a stock race that happens between parent validation and child insertion needs host-level integration testing.
- The upload scanner is an adapter with a conservative baseline implementation. High-risk stores should connect a malware scanning service through the provided filter before enabling broad file types.
- Built-in fonts never make remote requests. A named font is visible only when the active theme/site already loads it.
- Preview definitions are stored and validated, but the advanced layered proof-image/360° renderer described in the product vision is not advertised or enabled.
- Accordion, tab, and wizard definitions compile for forward compatibility; staging verification is required before using those imported layouts. Stacked, inline, and responsive-grid layouts are the recommended beta presets.
- Repeater nesting is intentionally limited to one level.
- A/B experiments and unverified third-party integration claims remain disabled.

## Required staging checks

1. Activate with the exact WordPress, PHP, WooCommerce, theme, checkout, tax, currency, cache, and payment configuration used by the store.
2. Run **WooOptionsFic > Diagnostics** and WordPress Site Health.
3. Test each assigned simple and variable product as a guest and registered customer.
4. Test invalid/expired tokens, maximum inputs, negative adjustments, stock changes, coupons, taxes, quantity updates, removals, cart restoration, checkout, order emails, refunds, and reorder behavior.
5. Test upload rejection, account/admin download authorization, cleanup, and retention.
6. Test keyboard navigation, screen-reader labels, 200% zoom, mobile reflow, reduced motion, and every selected palette against the actual theme.
7. Back up the database before beta upgrades.
