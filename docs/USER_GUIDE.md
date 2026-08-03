# Merchant quick guide

## Create and publish

1. Open **WooOptionsFic > Option Sets** and choose **New option set**, or import one under **Templates**.
2. Add fields from the left palette. Click a field card to edit its label, defaults, validation, choices, rules, pricing, and advanced settings in the inspector.
3. Use visible move buttons or drag handles to reorder. Undo/redo remains bounded to the current builder session.
4. Open **Style** to choose a semantic palette, local/theme-provided typography, layout, price-breakdown behavior, and saved-configuration behavior.
5. Choose **Assign**. Start with a product assignment while learning; global/category/tag/type rules can then be layered with priorities and exclusions.
6. Review **Preflight diagnostics**. Publish is disabled until blocking compiler errors are resolved.
7. Choose **Publish**. The published revision is immutable; further changes remain a draft until the next publish.

## Price behavior

Field prices can be fixed, percentage-based, per character, per unit, tiered, one-time setup, or formula driven. Choice prices are added only when that stable choice UUID is selected. Customer-defined and formula unit-price modes replace the product base once; other selected contributions may then be added. The server clamps negative totals unless the administrator explicitly enables them.

## Assignments

The resolver checks explicit exclusions first, then explicit variation/product matches, category/tag/type matches, and global matches. Priority and stable UUIDs make ties deterministic. Compatible included sets merge into one effective configuration.

## Customer uploads

File fields create short-lived intents. The completed file must match the configured extension, detected MIME, size, image dimensions, product, variation, field, revision, customer/session, and optional repeater row. Uploaded files remain private. Authorized download links appear in order administration and the customer's order view.

## Revisions and recovery

Open **History** in the builder to inspect revision states. Restore creates a new draft copy; it never edits the older published record. Cart/order snapshots preserve the selection summary, revision identity/hash, and price breakdown.

## Before going live

Use a staging store, run Diagnostics, order each configured product, test stock and tax behavior, exercise uploads and share links, and verify keyboard/mobile behavior with the active theme. The beta limitations are listed in `KNOWN_LIMITATIONS.md`.
