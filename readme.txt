=== WooOptionsFic - Product Options for WooCommerce ===
Contributors: wooptionsfic
Tags: woocommerce, product options, conditional logic, formula pricing, product addons
Requires at least: 6.9
Requires PHP: 8.1
Requires Plugins: woocommerce
Stable tag: 0.9.0-beta.29
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Build accessible, styled, server-validated WooCommerce product configurators without editing theme code.

== Description ==

WooOptionsFic is a test-ready beta for creating reusable product option sets. Its Precision Workshop administration interface combines a field palette, sortable canvas, inspector, style controls, revision history, assignments, templates, diagnostics, and privacy-conscious analytics.

Core commerce decisions are recalculated on the server. Browser-submitted prices are never trusted. Published definitions are immutable, and cart and order items keep a readable snapshot of the exact configuration used.

Highlights:

* 34 registered field and content types.
* Fixed, percentage, per-character, per-unit, tiered, setup-fee, choice, customer-defined, and safe formula pricing.
* Nested conditional rules and deterministic product/category/tag/type/global assignments.
* True repeatable sections with stable row identifiers and server-enforced limits.
* Private upload intents, MIME detection, quarantine/scanner adapter, opaque references, and authorized downloads.
* Saved and expiring shareable configurations with server-side revalidation.
* Ten editable starter templates.
* Accessible server-rendered storefront baseline and a lightweight TypeScript runtime.
* Classic WooCommerce cart/order lifecycle plus Store API extension data and a dynamic Product Options block.

This beta intentionally makes no certification claim for third-party checkout, currency, subscription, multilingual, or product-bundle extensions. Test on a staging copy before production use.

== Installation ==

1. In WordPress, open Plugins > Add New > Upload Plugin.
2. Select the WooOptionsFic ZIP and activate it.
3. Keep WooCommerce 9.0 or newer active.
4. Open WooOptionsFic > Templates to import a starter, or create a blank option set.
5. Configure fields, pricing, rules, style, and assignments; resolve preflight errors; then publish.
6. Test the assigned product as a guest and as a signed-in customer before using it on a live store.

== Frequently Asked Questions ==

= Does JavaScript decide the final price? =

No. JavaScript requests previews for fast feedback, but add-to-cart and checkout use the PHP normalizer, rule engine, formula evaluator, linked-product validator, and price engine.

= Are uploaded files public? =

No. Customer uploads use opaque identifiers and are stored in a protected private directory rather than the Media Library. Access requires ownership or the dedicated upload-management capability.

= What happens to published definitions after an edit? =

Published revisions are immutable. Further edits create or update a draft, and publishing creates the next live revision. Existing order snapshots do not depend on the current live definition.

= Does uninstall remove merchant data? =

Not by default. Data is removed only after enabling “Delete data on uninstall” in settings or defining the documented WOOPTIONSFIC_REMOVE_DATA constant as true.

== Screenshots ==

1. Precision Workshop dashboard and onboarding.
2. Three-pane option-set builder with palette, canvas, and inspector.
3. Style Studio palettes, typography, layouts, and configuration controls.
4. Accessible storefront configurator with a server-confirmed price summary.

== Changelog ==

= 0.9.0-beta.5 =

* Fixed add-to-cart failures caused by hidden required controls that the browser could not focus.
* Hidden or conditionally disabled option controls are now disabled before submission.
* Quote requests now recover from stale, expired, or cached public tokens and return a fresh token for add-to-cart.

= 0.9.0-beta.4 =

* Removed the field wrapper focus-within border and shadow styles.

= 0.9.0-beta.3 =

* Removed the outer configurator background, border, radius, shadow, and padding.
* Removed field wrapper background, border, and padding in LTR and RTL storefront styles.

= 0.9.0-beta.2 =

* Fixed storefront quote failures caused by stale cached tokens and WooCommerce session initialization differences.
* Added automatic secure token refresh for configured-price checks.
* Refined the builder field palette with larger labels, clearer grouping, improved search styling, and more comfortable drag targets.

= 0.9.0-beta.1 =

* Initial test-ready beta.
* Added immutable option sets, assignments, compiler, 34 field types, rules, safe formulas, fixed-scale money, repeaters, private uploads, save/share, analytics, templates, REST APIs, storefront rendering, cart/order integration, Store API data, dynamic block, diagnostics, and Precision Workshop administration UI.

== Upgrade Notice ==

= 0.9.0-beta.5 =

Clear page, object, CDN, and browser caches so the updated quote runtime and add-to-cart validation load immediately.

= 0.9.0-beta.2 =

Refresh cached product pages after updating so the storefront loads the new quote runtime.

= 0.9.0-beta.1 =

Initial beta. Back up the database and test on staging before production use.
