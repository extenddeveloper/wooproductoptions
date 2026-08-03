# Architecture

WooOptionsFic is a modular monolith with a small composition root.

## Layers

- **Domain:** definitions, normalization, rules, formulas, money, pricing,
  style validation, and snapshots. Domain classes do not read HTTP globals or
  database tables.
- **Application:** option-set, assignment, quote, upload, saved configuration,
  template, and analytics use cases.
- **Infrastructure:** `$wpdb` repositories, migrations, private storage,
  WordPress facilities, and WooCommerce adapters.
- **Presentation:** REST controllers, wp-admin shell, server-rendered
  storefront, and the WordPress-native React application.

## Data flow

1. A merchant saves an authored JSON definition as a new draft revision.
2. Publishing validates and compiles that draft into an immutable published
   revision with a canonical SHA-256 hash.
3. Assignment resolution merges applicable published definitions in a stable
   order.
4. The storefront renders a PHP baseline and may request a server quote.
5. Add-to-cart repeats normalization, rules, validation, upload/stock checks,
   and pricing on the server.
6. The resulting snapshot and breakdown are attached to the cart line and then
   persisted through WooCommerce order-item CRUD.

## Extension seams

The public seams are field registration, compiled-configuration filtering,
quote-result filtering, upload scanning, and snapshot formatting. Transport
controllers stay thin and do not expose repositories directly.

## Failure model

Expected customer validation uses stable error codes and structured results.
Exceptions represent infrastructure or invariant failures. Missing
WooCommerce disables commerce modules and produces an actionable admin notice.
